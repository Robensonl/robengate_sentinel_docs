# PostgreSQL — Esquema Completo

**Versión:** PostgreSQL 16  
**Migraciones aplicadas:** 13  
**Última migración:** `013_add_playbooks_soar.sql`  

---

## Resumen de Tablas

| Tabla | Propósito | Registros Esperados |
|---|---|---|
| `users` | Cuentas de usuario | 5 - 500 |
| `devices` | Dispositivos de confianza | Varios por usuario |
| `sessions` | Sesiones activas | Cientos activas |
| `refresh_tokens` | Historial de JWT refresh | Miles |
| `webauthn_credentials` | Credenciales FIDO2/passkeys | Opcional por usuario |
| `security_logs` | Logs de seguridad | Millones |
| `mfa_codes` | Códigos OTP temporales | TTL corto |
| `banned_ips` | IPs baneadas | Variable |
| `incidents` | Incidentes SOC | Decenas-miles |
| `incident_events` | Timeline de incidentes | Varios por incidente |
| `vulnerabilities` | Inventario CVE | Cientos-miles |
| `alert_statuses` | Estado de alertas (overlay) | Uno por alerta gestionada |
| `organizations` | Organizaciones (multi-tenancy) | 1 - 100+ |
| `organization_api_keys` | API Keys M2M | Varios por org |
| `playbooks` | Playbooks SOAR | Decenas |
| `playbook_actions` | Acciones de playbooks | Varios por playbook |
| `playbook_executions` | Historial de ejecuciones | Miles |

---

## Tabla: `users`

```sql
CREATE TABLE users (
  id                SERIAL       PRIMARY KEY,
  name              VARCHAR(255),
  full_name         VARCHAR(255),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     TEXT         NOT NULL,              -- bcrypt(12)
  role              VARCHAR(32)  NOT NULL DEFAULT 'viewer',  -- admin|analyst|responder|viewer
  mfa_enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
  mfa_type          VARCHAR(16)  DEFAULT 'email',       -- email|totp|webauthn
  totp_secret       TEXT,                              -- encrypted TOTP secret
  totp_enabled      BOOLEAN      DEFAULT FALSE,
  active            BOOLEAN      NOT NULL DEFAULT TRUE,
  is_locked         BOOLEAN      NOT NULL DEFAULT FALSE,
  failed_login_count INTEGER     NOT NULL DEFAULT 0,
  company           VARCHAR(255),
  organization_id   INT          REFERENCES organizations(id) ON DELETE SET NULL,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ
);
```

### Índices

```sql
CREATE UNIQUE INDEX ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
```

### Notas de Seguridad

- `password_hash` — bcrypt con work factor 12
- `totp_secret` — debe cifrarse en reposo (AES-256)
- `failed_login_count` — reset a 0 en login exitoso; bloqueo a los 5-10 intentos
- `is_locked` — True bloquea el login aunque la contraseña sea correcta

---

## Tabla: `devices`

```sql
CREATE TABLE devices (
  id               SERIAL       PRIMARY KEY,
  user_id          INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT         NOT NULL,              -- SHA-256 del fingerprint
  name             VARCHAR(255),                       -- "Chrome on MacBook"
  trusted          BOOLEAN      NOT NULL DEFAULT FALSE,
  last_seen_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fingerprint_hash)
);
```

### Índices

```sql
CREATE INDEX idx_devices_user ON devices(user_id);
```

---

## Tabla: `sessions`

```sql
CREATE TABLE sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT        NOT NULL UNIQUE,  -- hashed session token
  device_type   VARCHAR(32),                  -- desktop|mobile|tablet
  user_agent    TEXT,
  ip_address    INET,
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked       BOOLEAN     NOT NULL DEFAULT FALSE,
  revoked_at    TIMESTAMPTZ
);
```

### Índices

```sql
CREATE INDEX idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);
CREATE INDEX idx_sessions_revoked     ON sessions(revoked) WHERE revoked = FALSE;
```

---

## Tabla: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          BIGSERIAL   PRIMARY KEY,
  jti         UUID        NOT NULL UNIQUE,  -- JWT ID para blacklist
  user_id     INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID        REFERENCES sessions(id) ON DELETE CASCADE,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,         -- issued_at + 7 días
  revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
  revoked_at  TIMESTAMPTZ
);
```

### Índices

```sql
CREATE INDEX idx_rt_jti     ON refresh_tokens(jti);
CREATE INDEX idx_rt_user    ON refresh_tokens(user_id);
CREATE INDEX idx_rt_revoked ON refresh_tokens(revoked) WHERE revoked = FALSE;
```

### Notas

- El `jti` también se almacena en Redis (`jwt:blacklist:<jti>`) para validación rápida
- Token rotation: cada uso del refresh token emite uno nuevo y revoca el anterior
- Reuse detection: uso de RT revocado → revocación de todos los tokens del user

---

## Tabla: `webauthn_credentials`

```sql
CREATE TABLE webauthn_credentials (
  id                 BIGSERIAL    PRIMARY KEY,
  user_id            INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id      TEXT         NOT NULL UNIQUE,   -- base64url
  public_key         TEXT         NOT NULL,          -- base64url DER
  sign_count         BIGINT       NOT NULL DEFAULT 0,
  aaguid             UUID,
  transport          TEXT[],                         -- usb|nfc|ble|internal
  attestation_type   VARCHAR(32),
  device_name        VARCHAR(128) NOT NULL DEFAULT 'Security Key',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_used_at       TIMESTAMPTZ,
  revoked            BOOLEAN      NOT NULL DEFAULT FALSE
);
```

### Índices

```sql
CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id) WHERE revoked = FALSE;
```

---

## Tabla: `security_logs`

```sql
CREATE TABLE security_logs (
  id              BIGSERIAL    PRIMARY KEY,
  user_id         INT          REFERENCES users(id) ON DELETE SET NULL,
  organization_id INT          REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      VARCHAR(120) NOT NULL,
  severity        VARCHAR(32)  NOT NULL,   -- critical|high|warning|medium|low|info
  ip_address      INET,
  country_code    VARCHAR(10),
  metadata        JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_security_logs_created  ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_user     ON security_logs(user_id);
CREATE INDEX idx_security_logs_ip       ON security_logs(ip_address);
CREATE INDEX idx_security_logs_org      ON security_logs(organization_id);
```

### Notas

- **Inmutable:** Nunca se hace UPDATE/DELETE sobre esta tabla
- El estado de alerta se gestiona en `alert_statuses` (overlay pattern)
- Duplicate storage con MongoDB SecurityLog (análisis forense avanzado en Mongo)

---

## Tabla: `mfa_codes`

```sql
CREATE TABLE mfa_codes (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(10) NOT NULL,          -- hashed en implementación
  expires_at TIMESTAMPTZ NOT NULL,          -- NOW() + 5 minutos
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_mfa_user ON mfa_codes(user_id);
```

> **Nota:** Los códigos MFA activos también se almacenan en Redis (`mfa:<userId>` TTL 5 min) para validación de baja latencia. PostgreSQL actúa como backup.

---

## Tabla: `banned_ips`

```sql
CREATE TABLE banned_ips (
  id              SERIAL       PRIMARY KEY,
  ip_address      INET         UNIQUE NOT NULL,
  reason          TEXT,
  banned_by       INT          REFERENCES users(id) ON DELETE SET NULL,
  organization_id INT          REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ,              -- NULL = ban permanente
  banned_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_banned_ip      ON banned_ips(ip_address);
CREATE INDEX idx_banned_ips_org ON banned_ips(organization_id);
```

### Notas

- IPs activas también en Redis (`ban:<ip>`) para checks de baja latencia en cada request
- `banned_by = NULL` indica auto-ban por el sistema
- `expires_at = NULL` indica ban permanente

---

## Tabla: `incidents`

```sql
CREATE TABLE incidents (
  id              SERIAL       PRIMARY KEY,
  organization_id INT          REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT         NOT NULL,
  summary         TEXT,
  severity        VARCHAR(20)  NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('info','low','medium','high','critical')),
  status          VARCHAR(30)  NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','in_progress','contained','resolved','post_review')),
  assignee        TEXT,
  tags            TEXT[]       NOT NULL DEFAULT '{}',
  tlp             VARCHAR(10)  NOT NULL DEFAULT 'AMBER',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_incidents_status   ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created  ON incidents(created_at DESC);
CREATE INDEX idx_incidents_org      ON incidents(organization_id);
```

---

## Tabla: `incident_events`

```sql
CREATE TABLE incident_events (
  id          SERIAL       PRIMARY KEY,
  incident_id INT          NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor       TEXT         NOT NULL,   -- email del usuario o "SIEM", "SOAR"
  action      TEXT         NOT NULL,   -- descripción de la acción
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_inc_events_incident ON incident_events(incident_id);
```

---

## Tabla: `vulnerabilities`

```sql
CREATE TABLE vulnerabilities (
  id                SERIAL       PRIMARY KEY,
  organization_id   INT          REFERENCES organizations(id) ON DELETE CASCADE,
  cve_id            TEXT,                    -- CVE-YYYY-NNNNN
  title             TEXT         NOT NULL,
  description       TEXT,
  severity          VARCHAR(20)  NOT NULL DEFAULT 'medium'
                      CHECK (severity IN ('info','low','medium','high','critical')),
  cvss              NUMERIC(3,1),            -- 0.0-10.0
  status            VARCHAR(30)  NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','patched','accepted')),
  component         TEXT,
  affected_versions TEXT,
  fixed_version     TEXT,
  published         DATE,
  tags              TEXT[]       NOT NULL DEFAULT '{}',
  refs              TEXT[]       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_vulns_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulns_status   ON vulnerabilities(status);
CREATE INDEX idx_vulns_cve      ON vulnerabilities(cve_id);
CREATE INDEX idx_vulns_org      ON vulnerabilities(organization_id);
```

---

## Tabla: `alert_statuses`

```sql
CREATE TABLE alert_statuses (
  log_id     BIGINT       PRIMARY KEY,      -- FK implícita a security_logs.id
  status     VARCHAR(30)  NOT NULL DEFAULT 'new'
               CHECK (status IN ('new','acknowledged','investigating','resolved','false_positive')),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Patrón Overlay

Esta tabla implementa el patrón **overlay** para mantener la inmutabilidad de `security_logs`:

```sql
-- Obtener alertas con estado actual
SELECT sl.*, COALESCE(ast.status, 'new') as alert_status
FROM security_logs sl
LEFT JOIN alert_statuses ast ON sl.id = ast.log_id
WHERE sl.severity IN ('high', 'critical')
ORDER BY sl.created_at DESC;
```

---

## Tabla: `organizations`

```sql
CREATE TABLE organizations (
  id              SERIAL        PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  plan            VARCHAR(20)   NOT NULL DEFAULT 'starter'
                    CHECK (plan IN ('starter','professional','enterprise','trial')),
  status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','cancelled','trial')),
  seats_limit     INT           NOT NULL DEFAULT 10,
  retention_days  INT           NOT NULL DEFAULT 90,
  mfa_required    BOOLEAN       NOT NULL DEFAULT FALSE,
  sso_enabled     BOOLEAN       NOT NULL DEFAULT FALSE,
  sso_metadata    JSONB,
  webhook_url     TEXT,
  webhook_secret  TEXT,                          -- hashed
  api_key_hash    TEXT,                          -- hashed API key M2M
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_orgs_slug   ON organizations(slug);
CREATE INDEX idx_orgs_status ON organizations(status);
```

### Planes Disponibles

| Plan | Seats | Retención | MFA Forzado | SSO |
|---|---|---|---|---|
| `starter` | 10 | 90 días | No | No |
| `professional` | 50 | 365 días | Opcional | No |
| `enterprise` | Ilimitado | Configurable | Opcional | ✅ |
| `trial` | 5 | 30 días | No | No |

---

## Tabla: `organization_api_keys`

```sql
CREATE TABLE organization_api_keys (
  id              SERIAL        PRIMARY KEY,
  organization_id INT           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL,
  key_hash        TEXT          NOT NULL UNIQUE,   -- SHA-256
  key_prefix      VARCHAR(12)   NOT NULL,          -- rg_sk_abc123...
  scopes          TEXT[]        NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_by      INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);
```

### Scopes Disponibles

| Scope | Descripción |
|---|---|
| `logs:read` | Leer logs de seguridad |
| `alerts:read` | Leer alertas |
| `incidents:read` | Leer incidentes |
| `ingest:write` | Ingestar eventos |
| `threats:write` | Reportar IOCs |

---

## Tablas SOAR: `playbooks`, `playbook_actions`, `playbook_executions`

```sql
-- Playbooks base (migration 013)
CREATE TABLE playbooks (
  id              SERIAL       PRIMARY KEY,
  organization_id INT          REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  trigger_type    VARCHAR(50)  NOT NULL,  -- event|threshold|schedule|manual
  trigger_config  JSONB        NOT NULL DEFAULT '{}',
  enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by      INT          REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE playbook_actions (
  id          SERIAL       PRIMARY KEY,
  playbook_id INT          NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  order_index INT          NOT NULL DEFAULT 0,
  action_type VARCHAR(100) NOT NULL,  -- ban_ip|create_incident|notify_email|isolate_agent
  config      JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE playbook_executions (
  id          BIGSERIAL    PRIMARY KEY,
  playbook_id INT          NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  trigger_data JSONB       NOT NULL DEFAULT '{}',
  status      VARCHAR(30)  NOT NULL DEFAULT 'running',  -- running|success|failed
  result      JSONB,
  started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## Extensiones PostgreSQL

```sql
-- Habilitada en 001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid(), crypt()
```

---

## Conexión

```javascript
// backend/db-sql/connection-pool.js
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'robengate',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max:      20,                // Pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```
