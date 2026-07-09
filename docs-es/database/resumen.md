# Arquitectura de Base de Datos — RobenGate Sentinel

> **Clasificación:** INTERNO | **Patrón:** Persistencia Políglota (PostgreSQL + MongoDB + Redis)

---

## Resumen Ejecutivo

RobenGate Sentinel implementa una **arquitectura de persistencia políglota** que selecciona la base de datos óptima para cada tipo de dato. PostgreSQL gestiona los datos transaccionales relacionales (usuarios, sesiones, tokens), MongoDB almacena el log de eventos de alta frecuencia append-only, y Redis proporciona caché efímera de alto rendimiento (sesiones, blacklist de tokens, contadores de límite de tasa).

Esta arquitectura garantiza que cada base de datos se usa para lo que fue diseñada, maximizando tanto el rendimiento como la integridad de datos. La decisión de diseño resulta en menor latencia, mayor throughput y una arquitectura de datos más mantenible que un enfoque de base de datos única.

---

## 1. Visión General: Persistencia Políglota

```mermaid
flowchart TB
    classDef api    fill:#1A2A4A,stroke:#00B4D8,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef pg     fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0,font-weight:bold
    classDef mg     fill:#2E1A08,stroke:#FF9800,stroke-width:2px,color:#FFE0B2,font-weight:bold
    classDef rd     fill:#2D1B1B,stroke:#FF6B6B,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef item   fill:#0A1929,stroke:#334155,stroke-width:1px,color:#B0BEC5,font-size:12px

    API["⚙️ Express.js API
Todas las solicitudes pasan por aquí"]:::api

    subgraph PG["🗄️ PostgreSQL 15+ — Datos Transaccionales"]
        direction LR
        P1["users\nsessions\ntokens"]:::item
        P2["incidents\nalerts\ndevices"]:::item
        P3["rbac_roles\nbanned_ips\nvulnerabilities"]:::item
    end

    subgraph MG["🌳 MongoDB 7+ — Eventos & Documentos"]
        direction LR
        M1["security_logs\nhoneypot_events"]:::item
        M2["threat_intel\nioc_indicators"]:::item
        M3["audit_logs\nattack_map_events"]:::item
    end

    subgraph RD["⚡ Redis 7+ — Caché & Efímero"]
        direction LR
        R1["sessions_cache\njwt_blacklist"]:::item
        R2["otp_codes\nrate_limit"]:::item
        R3["ban_list\nrisk_cache"]:::item
    end

    API -- "🔄 ACID Transactions\nIntegridad referencial" --> PG
    API -- "📥 Append-Only\nEsquema flexible" --> MG
    API -- "⏱️ Sub-ms latencia\nTTL automático" --> RD
```

| Base de Datos | Casos de Uso | Característica Clave |
|---------------|-------------|---------------------|
| **PostgreSQL** | Usuarios, sesiones, tokens, MFA, incidentes, RBAC | Transacciones ACID, integridad referencial |
| **MongoDB** | Logs de seguridad, IOC, honeypot events | Append-only, flexibilidad de esquema |
| **Redis** | Sesiones de auth, JTI blacklist, rate limiting | Sub-ms latencia, TTL automático |

---

## 2. Esquema PostgreSQL

### 2.1 Tablas Core

#### Tabla `users`

```sql
CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,    -- bcrypt-12
  role              VARCHAR(20) DEFAULT 'viewer',
  
  -- Estado de la cuenta
  is_active         BOOLEAN DEFAULT TRUE,
  is_locked         BOOLEAN DEFAULT FALSE,
  failed_attempts   INTEGER DEFAULT 0,        -- Contador de fallos de auth
  last_failed_at    TIMESTAMPTZ,
  
  -- Campos de riesgo
  risk_score        INTEGER DEFAULT 0,
  
  -- MFA configurada
  mfa_enabled       BOOLEAN DEFAULT FALSE,
  mfa_method        VARCHAR(20),              -- 'totp' | 'email' | 'sms' | 'webauthn'
  phone             VARCHAR(20),              -- Para SMS MFA (E.164)
  
  -- Perfil TOTP
  totp_secret       VARCHAR(64),             -- Secreto TOTP cifrado
  totp_enabled      BOOLEAN DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla `devices`

```sql
CREATE TABLE devices (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  fingerprint       VARCHAR(255) UNIQUE NOT NULL,  -- Hash SHA-256 de señales del navegador
  device_name       VARCHAR(255),                  -- "Chrome en Windows"
  is_trusted        BOOLEAN DEFAULT FALSE,
  first_seen        TIMESTAMPTZ DEFAULT NOW(),
  last_seen         TIMESTAMPTZ DEFAULT NOW(),
  use_count         INTEGER DEFAULT 0
);
```

#### Tabla `sessions`

```sql
CREATE TABLE sessions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id       INTEGER REFERENCES devices(id),
  ip_address      INET,
  user_agent      TEXT,
  country_code    VARCHAR(2),
  is_active       BOOLEAN DEFAULT TRUE,
  last_activity   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);
```

#### Tabla `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  jti         VARCHAR(255) UNIQUE NOT NULL,  -- JWT ID único
  token_hash  VARCHAR(255) NOT NULL,          -- SHA-256 hash del token
  device_id   INTEGER REFERENCES devices(id),
  ip_address  INET,
  user_agent  TEXT,
  is_revoked  BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla `mfa_codes`

```sql
CREATE TABLE mfa_codes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code_hash   VARCHAR(255) NOT NULL,  -- HMAC-SHA256 del código OTP (nunca el código en texto claro)
  type        VARCHAR(20),             -- 'email' | 'sms'
  expires_at  TIMESTAMPTZ NOT NULL,   -- TTL: 5 minutos
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla `webauthn_credentials`

```sql
CREATE TABLE webauthn_credentials (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  credential_id   BYTEA UNIQUE NOT NULL,  -- ID de credencial FIDO2 (bytes)
  public_key      BYTEA NOT NULL,          -- Clave pública del autenticador
  counter         BIGINT DEFAULT 0,        -- Contador anti-replay
  device_name     VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Tablas de Seguridad y Operaciones

```sql
-- IPs prohibidas (bloqueo de red)
CREATE TABLE banned_ips (
  id          SERIAL PRIMARY KEY,
  ip_address  INET UNIQUE NOT NULL,
  reason      TEXT,
  expires_at  TIMESTAMPTZ,  -- NULL = prohibición permanente
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Incidentes SOC
CREATE TABLE incidents (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(500),
  severity        VARCHAR(20),
  status          VARCHAR(30) DEFAULT 'nuevo',
  source_ip       INET,
  mitre_tactic    VARCHAR(100),
  mitre_technique VARCHAR(20),
  tlp             VARCHAR(10) DEFAULT 'AMBER',
  assigned_to     INTEGER REFERENCES users(id),
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- Línea de tiempo de incidentes (inmutable)
CREATE TABLE incident_events (
  id            SERIAL PRIMARY KEY,
  incident_id   INTEGER REFERENCES incidents(id),
  event_type    VARCHAR(50),
  description   TEXT,
  actor_email   VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de auditoría CLI admin
CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  admin_email VARCHAR(255),
  action      VARCHAR(100),
  target      VARCHAR(255),
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Esquema MongoDB

### 3.1 Colección `security_logs`

```javascript
{
  _id:          ObjectId,
  category:     'AUTH' | 'ACCESS' | 'THREAT' | 'HONEYPOT' | 'ADMIN' | 'DATA' | 'SYSTEM',
  action:       String,           // 'LOGIN_SUCCESS', 'XSS_BLOCKED', etc.
  severity:     'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  userId:       String,
  userEmail:    String,
  ipAddress:    String,
  countryCode:  String,           // ISO 3166-1 alpha-2
  userAgent:    String,
  endpoint:     String,
  method:       String,
  statusCode:   Number,
  mitreTactic:  String,
  mitreTechnique: String,
  ioc:          String,
  metadata:     Mixed,
  createdAt:    Date              // Índice TTL — expira tras 365 días
}
```

### 3.2 Colección `threat_indicators` (IOC)

```javascript
{
  _id:          ObjectId,
  type:         'IP' | 'DOMAIN' | 'URL' | 'HASH_MD5' | 'HASH_SHA1' | 'HASH_SHA256' | 
                'EMAIL' | 'USER_AGENT' | 'CVE' | 'MITRE_TECHNIQUE' | 'THREAT_ACTOR',
  value:        String,           // El valor del IOC
  
  // Contexto de amenaza
  threatType:   String,           // Tipo de amenaza que representa
  description:  String,
  severity:     String,
  confidence:   Number,           // 0-100
  
  // Vinculación MITRE ATT&CK
  mitreTactic:    String,
  mitreTechnique: String,
  
  // Estado del ciclo de vida
  status:       'active' | 'inactive' | 'false_positive',
  
  // Metadatos de rastreo
  lastSeen:     Date,
  seenCount:    Number,
  tags:         [String],
  expiresAt:    Date,             // Índice TTL
  createdAt:    Date
}
```

---

## 4. Estructura Redis

```
# Sesiones activas de usuario (TTL: duración de la sesión)
session:{userId}:{sessionId}  →  JSON { userId, role, email, ip, connectedAt }

# Lista negra JTI (tokens de acceso revocados)
jti:{jti}  →  "1"  (TTL: tiempo restante del token)

# Contadores de rate limiting
rl:{ip}:{endpoint}  →  contador  (TTL: ventana de rate limiting)

# Caché de geolocalización IP
geo:{ip}  →  JSON { countryCode, city, lat, lon }  (TTL: 24h)

# Intentos fallidos de login (para lockout de cuenta)
failed:{userId}  →  contador  (TTL: ventana de lockout)
```

---

## 5. Diagrama Entidad-Relación (Simplificado)

```
users
  ├── devices (uno-a-muchos)
  ├── sessions (uno-a-muchos)
  ├── refresh_tokens (uno-a-muchos)
  ├── mfa_codes (uno-a-muchos)
  ├── mfa_backup_codes (uno-a-muchos)
  └── webauthn_credentials (uno-a-muchos)

incidents
  ├── incident_events (uno-a-muchos, inmutable)
  └── users (asignado_a: muchos-a-uno)

(MongoDB - sin FK)
security_logs → userId (referencia blanda a users.id)
threat_indicators → sin referencias FK (colección independiente)
```

---

## Flujo Operacional

### 6. Flujo de Decisión de Base de Datos

```
Solicitud entrante
    │
    ├── Verificar si IP está prohibida? → Redis (caché) → PG fallback
    │
    ├── Auth de usuario (login) → PG (tabla users)
    │
    ├── Operaciones de token → Redis (JTI blacklist) + PG (refresh_tokens)
    │
    ├── Verificar MFA → PG (mfa_codes)
    │
    ├── Autorización RBAC → JWT in-memory (sin DB)
    │
    ├── Registrar evento de seguridad → MongoDB + PG (ambos)
    │
    └── Emitir SSE → sin DB (en memoria)
```

---

## Casos de Uso

### Caso 1: Login de Alta Frecuencia (1000 req/s)

1. IP check → Redis (`banned:{ip}`) → **<1ms**
2. Verificar usuario → PG (`SELECT * FROM users WHERE email = ?`) → **<5ms**
3. Verificar token JWT → en-memoria (sin DB) → **0ms**
4. Registrar resultado → MongoDB + PG → **async, sin bloquear respuesta**

### Caso 2: Revocación de Token Inmediata

Cuando un admin revoca el acceso de un usuario:
1. JTI del token activo → añadir a Redis JTI blacklist (TTL: tiempo restante del token)
2. Refresh token → marcar `is_revoked = true` en PG
3. Sin necesidad de invalidar todos los tokens históricos — solo los activos en Redis

### Caso 3: Consulta Forense de Logs

Analista investiga actividad de los últimos 7 días:
1. MongoDB query: `security_logs.find({ ipAddress: '185.220.101.42', createdAt: { $gte: hace7días } })`
2. Retorna timeline completo de actividad del atacante
3. Sin impacto en rendimiento de PG transaccional

---

## Beneficios para una Empresa

| Beneficio | Descripción |
|-----------|-------------|
| **Rendimiento Óptimo** | Cada DB usada para su caso de uso ideal |
| **Escalabilidad Independiente** | MongoDB y Redis pueden escalar separadamente |
| **Sin Punto Único de Fallo** | Logs de seguridad en MongoDB no impactan transacciones en PG |
| **Logs Inmutables** | MongoDB append-only garantiza integridad forense |
| **Caché de Alto Rendimiento** | Redis sub-ms para operaciones de auth críticas |

---

## Seguridad

- **Contraseñas**: bcrypt-12 (hash) — nunca en texto claro
- **OTP**: HMAC-SHA256 hash del código — nunca el valor real
- **Refresh tokens**: SHA-256 hash en PG — token real solo en cookie HttpOnly
- **JTI blacklist**: Redis con TTL para revocación instantánea de tokens
- **Conexiones cifradas**: TLS/SSL para todas las conexiones a BD en producción

---

## Configuración

```env
# PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/robengate_sentinel
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=10000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/robengate_sentinel_logs
MONGODB_LOG_LEVEL=error

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=sentinel:
```

---

## Roadmap

| Capacidad | Estado |
|-----------|--------|
| **Read replicas** PostgreSQL para consultas de reportes | Planificado |
| **Sharding** MongoDB para escala de logs > 100M/año | Planificado |
| **Redis Sentinel** para alta disponibilidad | Planificado |
| **Particionamiento de tablas** PG por fecha | Futuro |

---

*Ver también: [../architecture/arquitectura-sistema.md](../architecture/arquitectura-sistema.md) | [../infrastructure/resumen.md](../infrastructure/resumen.md) | [../security/resumen.md](../security/resumen.md)*
