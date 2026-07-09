# Arquitectura Empresarial — RobenGate Sentinel

**Autor:** Principal Cybersecurity Architect  
**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Estado:** Producción

---

## 1. Arquitectura Lógica

### Descripción General

RobenGate Sentinel sigue una arquitectura de microservicios ligeros monorepo con separación clara de responsabilidades entre el plano de datos, el plano de control y el plano de presentación.

```mermaid
flowchart TB
    classDef pres  fill:#0F2A1A,stroke:#4CAF50,stroke-width:2px,color:#E2E8F0
    classDef api   fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef proc  fill:#2A1A3E,stroke:#7B68EE,stroke-width:2px,color:#E2E8F0
    classDef data  fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0
    classDef ingest fill:#2E1A08,stroke:#FF9800,stroke-width:2px,color:#FFE0B2

    subgraph PRES["\ud83d\udda5\ufe0f Plano de Presentacion"]
        UI["React SPA\nVite + React Router"]:::pres
        LAND["Landing Page\nMarketing"]:::pres
    end

    subgraph APIT["\u2699\ufe0f Plano de API"]
        GW["API Gateway\nExpress + Helmet + CORS"]:::api
        AUTH["Auth Service\nJWT + WebAuthn + MFA"]:::api
        RBACC["RBAC Middleware\nminRole + readOnly"]:::api
    end

    subgraph PROC["\ud83e\udd16 Plano de Procesamiento"]
        DET["Detection Engine\nSigma + MITRE"]:::proc
        CORR["Correlation Engine\nAuto-Incidents"]:::proc
        AI["AI Engine\nBehavioral Analytics"]:::proc
        RISK["Risk Engine\nAdaptive Score"]:::proc
        SOAR["SOAR Engine\nPlaybooks"]:::proc
    end

    subgraph DATA["\ud83d\uddc4\ufe0f Plano de Datos"]
        PG[("PostgreSQL\nUsers - Incidents")]:::data
        MG[("MongoDB\nAudit - Threat Intel")]:::data
        RD[("Redis\nSessions - Bans")]:::data
    end

    subgraph ING["\ud83d\udce5 Plano de Ingesta"]
        HP["Honeypot\nSSH + HTTP"]:::ingest
        IGS["Ingestion API\nExternal Sources"]:::ingest
        SSE["SSE Broker\nReal-time Events"]:::ingest
    end

    LAND --> UI --> GW --> AUTH --> RBACC
    RBACC --> DET & CORR
    DET --> CORR --> SOAR
    AI --> CORR
    RISK --> AUTH
    HP & IGS --> DET
    DET --> SSE --> UI
    GW --> PG & MG & RD
```

---

## 2. Arquitectura Física

### Deployment Stack

```mermaid
flowchart TB
    classDef edge  fill:#0A1929,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef app   fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF
    classDef data  fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0
    classDef mon   fill:#2A1A3E,stroke:#7B68EE,stroke-width:2px,color:#E2E8F0
    classDef honey fill:#2E1A08,stroke:#FF9800,stroke-width:2px,color:#FFE0B2

    INT(("\ud83c\udf10 Internet")):::edge

    subgraph KUBE["Kubernetes Cluster"]
        subgraph NS["Namespace: robengate"]
            FE["Frontend Pod\nNginx + React SPA"]:::app
            BE["Backend Pod\nNode.js Express"]:::app
            HP["Honeypot Pod\nSSH :2222 + HTTP :8080"]:::honey
        end
        subgraph MON["Namespace: monitoring"]
            PROM["Prometheus\nMetrics"]:::mon
            GRAF["Grafana\nDashboards"]:::mon
        end
    end

    subgraph EDGE["Internet / DMZ"]
        LB["Load Balancer\nNginx / Cloud LB"]:::edge
        CDN["CDN\nStatic Assets"]:::edge
    end

    subgraph PERSIST["Persistence Layer"]
        PG[("PostgreSQL\nPrimary + Replica")]:::data
        MG[("MongoDB\nReplica Set")]:::data
        RD[("Redis Sentinel\nHA Cache")]:::data
    end

    INT --> LB
    CDN --> FE
    LB --> FE & BE
    BE --> PG & MG & RD
    HP --> BE
    PROM --> BE
    GRAF --> PROM
```

### Requerimientos de Infraestructura

| Tier | CPU | RAM | Almacenamiento | Descripción |
|---|---|---|---|---|
| Development | 2 cores | 4 GB | 20 GB | Docker Compose local |
| Small (< 100 usuarios) | 4 cores | 8 GB | 100 GB | Single node Kubernetes |
| Medium (100-500 usuarios) | 8 cores | 16 GB | 500 GB | HA Kubernetes (3 nodos) |
| Large (500+ usuarios) | 16+ cores | 32+ GB | 2+ TB | Multi-region Kubernetes |

---

## 3. Arquitectura de Aplicación

### Estructura del Backend

```
backend/
├── app.js                    # Entry point, middleware stack
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection pool
│   │   ├── security.js       # Security configuration constants
│   │   └── redis.js          # Redis client configuration
│   ├── middleware/
│   │   ├── authenticate.js   # JWT verification + user hydration
│   │   ├── authorize.js      # RBAC: authorize() + minRole() + readOnly()
│   │   ├── rateLimiter.js    # Rate limiting (api, auth, ingestion tiers)
│   │   ├── sanitize.js       # Input sanitization (XSS prevention)
│   │   ├── autoban.js        # Redis-backed IP ban check
│   │   ├── attackDetection.js # Real-time attack pattern detection
│   │   ├── tenant.js         # Multi-tenancy organization scoping
│   │   ├── validate.js       # Request validation schemas
│   │   ├── internalAuth.js   # Internal service-to-service auth
│   │   └── errorHandler.js   # Centralized error handling
│   ├── routes/               # 22 route files (91+ endpoints)
│   ├── controllers/          # Business logic layer
│   ├── services/             # Core processing engines
│   │   ├── detectionEngine.js     # Sigma rules + MITRE ATT&CK
│   │   ├── correlationEngine.js   # Incident auto-creation
│   │   ├── aiCorrelationEngine.js # Behavioral analytics
│   │   ├── riskEngine.js          # Adaptive risk scoring
│   │   ├── soarEngine.js          # Playbook automation
│   │   ├── auditService.js        # Immutable audit trail
│   │   ├── authService.js         # Auth orchestration
│   │   ├── geoService.js          # IP geolocation
│   │   ├── elasticsearchService.js # Search integration
│   │   └── honeypotService.js     # Honeypot event processing
│   ├── models/               # MongoDB models
│   └── lib/
│       ├── sse.js            # Server-Sent Events broker
│       ├── logger.js         # Structured logging (Winston)
│       ├── mongodb.js        # MongoDB connection
│       └── redis.js          # Redis client
```

### Estructura del Frontend

```
frontend/src/
├── app/
│   ├── App.jsx               # Root component
│   └── routes.jsx            # React Router v6 configuration
├── features/
│   ├── auth/                 # Login, MFA, WebAuthn, Register
│   ├── dashboard/            # Main SOC dashboard + metrics
│   ├── alerts/               # Alert management + triage
│   ├── incidents/            # Incident lifecycle management
│   ├── attackmap/            # Real-time geospatial attack visualization
│   ├── ai/                   # AI analysis + behavioral analytics
│   ├── security/             # Security logs + threat hunting
│   ├── users/                # User + device + session management
│   ├── vulnerabilities/      # Vulnerability management
│   ├── landing/              # Marketing landing page
│   └── marketing/            # SaaS marketing materials
├── shared/
│   ├── config/permissions.js # Centralized RBAC permissions map
│   ├── hooks/usePermission.js # usePermission() React hook
│   ├── components/PermissionGate.jsx # Conditional rendering by role
│   └── components/PageLayout.jsx    # Layout with role-aware sidebar
└── styles/                   # Global CSS + design system
```

---

## 4. Arquitectura de Flujo de Datos

### Flujo Crítico: Evento de Seguridad → Respuesta Automatizada

```mermaid
sequenceDiagram
    participant Attacker as Atacante
    participant Honeypot as Honeypot SSH/HTTP
    participant Backend as Backend API
    participant DetEngine as Detection Engine
    participant CorrEngine as Correlation Engine
    participant RiskEngine as Risk Engine
    participant SOAREngine as SOAR Engine
    participant DB as PostgreSQL/MongoDB
    participant SSE as SSE Broker
    participant SOC as Analista SOC

    Attacker->>Honeypot: Intento de acceso SSH
    Honeypot->>Backend: POST /api/honeypot/events
    Backend->>DetEngine: processEvent(honeypotEvent)
    DetEngine->>DetEngine: Evalúa reglas Sigma
    DetEngine->>DB: INSERT security_log
    DetEngine->>CorrEngine: correlate(event)
    CorrEngine->>DB: Cuenta eventos por IP (últimos 5min)
    CorrEngine->>DB: INSERT incident (auto-detected)
    CorrEngine->>SOAREngine: evaluatePlaybooks(incident)
    SOAREngine->>DB: Busca playbooks habilitados
    SOAREngine->>DB: INSERT banned_ip
    SOAREngine->>DB: Actualiza incident (playbook ejecutado)
    SOAREngine->>SSE: emit('incident', data)
    SOAREngine->>SSE: emit('alert', data)
    SSE->>SOC: Notificación tiempo real (WebSocket-like SSE)
    SOC->>Backend: GET /api/incidents/:id
    Backend->>DB: SELECT incident + events
    Backend->>SOC: Incident details + timeline
```

### Flujo de Autenticación con Risk Engine

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as React SPA
    participant Auth as Auth Middleware
    participant RiskEngine as Risk Engine
    participant MFA as MFA Service
    participant JWT as JWT Service
    participant DB as PostgreSQL

    User->>Frontend: POST /api/auth/login
    Frontend->>Auth: Credenciales + device fingerprint
    Auth->>DB: SELECT user WHERE email = ?
    Auth->>Auth: bcrypt.compare(password, hash)
    Auth->>RiskEngine: computeRiskScore(user, ip, device)
    RiskEngine->>DB: ¿Dispositivo conocido?
    RiskEngine->>DB: ¿IP en banned_ips?
    RiskEngine->>DB: ¿Fallos previos en 24h?
    RiskEngine->>RiskEngine: Calcula score 0-100
    
    alt Score > 80 (CRITICAL)
        Auth->>Frontend: 403 Blocked (IP baneada o Score crítico)
    else Score 61-80 (HIGH)
        Auth->>MFA: Requiere WebAuthn/FIDO2
        MFA->>Frontend: challengeOptions
        Frontend->>User: Solicita hardware key / biometric
        User->>Frontend: authenticatorResponse
        Frontend->>Auth: Verifica respuesta WebAuthn
    else Score 31-60 (MEDIUM)
        Auth->>MFA: Envía Email OTP
        User->>Frontend: Introduce código OTP
        Frontend->>Auth: Verifica OTP
    else Score 0-30 (LOW)
        Auth->>Auth: Autenticación directa (sin MFA adicional)
    end
    
    Auth->>JWT: generateToken(user, organizationId)
    JWT->>Frontend: { accessToken, refreshToken }
    Frontend->>Frontend: Almacena en httpOnly cookie
```

---

## 5. Arquitectura de Seguridad

### Capas de Defensa

```mermaid
flowchart LR
    classDef net   fill:#0A1929,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef http  fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#E2E8F0
    classDef auth  fill:#2A1A3E,stroke:#7B68EE,stroke-width:2px,color:#E2E8F0
    classDef authz fill:#0F2A1A,stroke:#4CAF50,stroke-width:2px,color:#E2E8F0
    classDef datas fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0

    subgraph C1["Capa 1 Red"]
        FW["Firewall / WAF"]:::net
        RL["Rate Limiter\nNginx + Redis"]:::net
    end
    subgraph C2["Capa 2 HTTP"]
        HM["Helmet.js\nSecurity Headers"]:::http
        CORS2["CORS Whitelist"]:::http
        CSP["CSP Policy"]:::http
        HSTS["HSTS 1 year"]:::http
    end
    subgraph C3["Capa 3 Autenticacion"]
        JWT2["JWT RS256\nhttpOnly Cookies"]:::auth
        MFA2["MFA Adaptativo\nTOTP / WebAuthn / OTP"]:::auth
        RISK2["Risk Engine\nAdaptive Score"]:::auth
        BAN["IP Ban System\nPostgreSQL + Redis"]:::auth
    end
    subgraph C4["Capa 4 Autorizacion"]
        RBAC2["RBAC minRole\n4 roles jerarquicos"]:::authz
        TENANT["Multi-tenant\nOrg scoping"]:::authz
        RO["readOnly guard\nBloquea writes"]:::authz
    end
    subgraph C5["Capa 5 Datos"]
        SAN["Input Sanitize\nXSS prevention"]:::datas
        VAL["Schema Validate"]:::datas
        PARAM["Parameterized SQL"]:::datas
        IMM["Immutable Audit\nMongoDB no-delete"]:::datas
    end

    INET(["\ud83c\udf10 Internet"]):::net
    INET --> FW --> RL --> HM --> JWT2 --> RBAC2 --> SAN
```

### Modelo de Seguridad: Defense in Depth

| Capa | Mecanismo | Protege Contra |
|---|---|---|
| Red | Rate limiting, IP banning | DoS, brute force, scanning |
| HTTP | Helmet.js headers, HSTS, CSP, no-cache | XSS, clickjacking, MITM, sniffing |
| Autenticación | JWT RS256, MFA obligatorio para roles altos, WebAuthn | Credential theft, session hijacking |
| Autorización | RBAC con jerarquía de roles + readOnly() | Escalada de privilegios, acceso no autorizado |
| Input | Sanitización + validación + parameterized queries | XSS, SQLi, injection |
| Datos | Audit trail inmutable en MongoDB | Tampering de evidencia forense |
| Detección | Detection Engine + Correlation Engine | Ataques en curso no detectados |
| Respuesta | SOAR + auto-ban | Tiempos de respuesta lentos |

---

## 6. Arquitectura de Base de Datos

### Modelo Relacional (PostgreSQL)

```mermaid
erDiagram
    USERS {
        serial id PK
        varchar email UK
        text password_hash
        varchar role
        boolean mfa_enabled
        boolean active
        timestamp last_login_at
    }
    ORGANIZATIONS {
        serial id PK
        varchar name
        varchar plan
        boolean active
    }
    DEVICES {
        serial id PK
        int user_id FK
        text fingerprint_hash
        boolean trusted
    }
    SECURITY_LOGS {
        int id PK
        int user_id FK
        varchar event_type
        varchar severity
        varchar ip_address
        varchar country_code
        jsonb metadata
    }
    INCIDENTS {
        serial id PK
        varchar title
        varchar severity
        varchar status
        varchar tags
        varchar tlp
    }
    INCIDENT_EVENTS {
        serial id PK
        int incident_id FK
        varchar actor
        text action
    }
    ALERTS {
        serial id PK
        varchar type
        varchar severity
        varchar status
        varchar source_ip
        jsonb metadata
    }
    PLAYBOOKS {
        serial id PK
        varchar name
        jsonb trigger_conditions
        jsonb actions
        boolean enabled
    }
    BANNED_IPS {
        serial id PK
        varchar ip_address UK
        text reason
        timestamp expires_at
    }

    USERS ||--o{ DEVICES : "owns"
    USERS ||--o{ SECURITY_LOGS : "generates"
    INCIDENTS ||--o{ INCIDENT_EVENTS : "has"
    ORGANIZATIONS ||--o{ USERS : "belongs to"
```

### Modelo de Documentos (MongoDB)

#### Colección: audit_logs
```json
{
  "_id": "ObjectId",
  "timestamp": "ISODate",
  "actor_id": 42,
  "actor_email": "admin@company.com",
  "actor_role": "admin",
  "action": "USER_CREATED",
  "resource": "users",
  "resource_id": "123",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "organization_id": 1,
  "metadata": { "target_email": "new@company.com" }
}
```

#### Colección: threat_indicators
```json
{
  "_id": "ObjectId",
  "type": "ip",
  "value": "185.220.101.45",
  "severity": "critical",
  "confidence": 95,
  "tags": ["tor-exit-node", "scanner", "brute-force"],
  "source": "honeypot",
  "first_seen": "ISODate",
  "last_seen": "ISODate",
  "organization_id": 1,
  "ttl_expires": "ISODate"
}
```

---

## 7. Arquitectura de Tiempo Real (SSE)

### Server-Sent Events vs. WebSockets

| Criterio | SSE (elegido) | WebSockets |
|---|---|---|
| Dirección del flujo | Server → Client (unidireccional) | Bidireccional |
| Reconexión automática | ✅ Nativa en el browser | ❌ Requiere implementación manual |
| Compatibilidad con proxies | ✅ HTTP estándar | ⚠️ Puede requerir configuración |
| Escalabilidad | ✅ Simple sin estado de conexión WS | ✅ Similar |
| Caso de uso de RobenGate | Server envía eventos al SOC | El SOC no necesita enviar streams |

### Flujo SSE

```mermaid
sequenceDiagram
    participant SOC as Dashboard SOC
    participant SSE as SSE Broker (Express)
    participant Det as Detection Engine
    participant Corr as Correlation Engine

    SOC->>SSE: GET /api/sse (EventSource)
    SSE->>SOC: text/event-stream connection
    
    Det->>SSE: sse.emit('alert', alertData)
    SSE->>SOC: data: {"type":"alert","severity":"high",...}
    
    Corr->>SSE: sse.emit('incident', incidentData)
    SSE->>SOC: data: {"type":"incident","id":42,...}
    
    Note over SOC: Dashboard actualiza en tiempo real
    Note over SOC: Sin polling, sin latencia añadida
```

---

## 8. Arquitectura Multi-Tenant

### Modelo de Aislamiento de Datos

```mermaid
flowchart TB
    classDef org   fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF
    classDef back  fill:#0A1929,stroke:#00B4D8,stroke-width:3px,color:#FFFFFF,font-weight:bold
    classDef note  fill:#2E1A08,stroke:#FF9800,stroke-width:1px,color:#FFE0B2,font-style:italic

    subgraph OA["Organizacion A - Startup SaaS"]
        UA1["Admin: carlos@startup.io"]:::org
        UA2["Analyst: ana@startup.io"]:::org
        DA[("Datos org_id=1")]:::org
    end

    subgraph OB["Organizacion B - E-commerce Corp"]
        UB1["Admin: diego@ecommerce.com"]:::org
        DB2[("Datos org_id=2")]:::org
    end

    subgraph BK["Backend"]
        TMW["Tenant Middleware\nextract org_id from JWT"]:::back
        QRY["All DB Queries\nWHERE organization_id = ?"]:::back
    end

    ISOL["Org A NO puede ver datos de Org B"]:::note

    UA1 & UB1 --> TMW --> QRY
    QRY --> DA & DB2
    QRY -.->|"aislamiento garantizado"| ISOL
```

### Implementación del Tenant Middleware

El middleware `tenant.js` extrae el `organization_id` del JWT y lo inyecta en `req.organizationId`. Todos los queries de base de datos aplican este filtro automáticamente, garantizando el aislamiento de datos entre tenants.

---

## 9. Arquitectura de Observabilidad

### Stack de Monitorización

| Componente | Herramienta | Datos Recopilados |
|---|---|---|
| Métricas de aplicación | Prometheus + /metrics endpoint | Requests/s, latencia, errores HTTP |
| Logs estructurados | Winston → stdout → Fluent Bit | Todos los eventos de aplicación |
| Dashboard de métricas | Grafana | Visualización de Prometheus |
| Health checks | /api/health endpoint | Estado de DB, Redis, Mongo, ES |
| Tracing (roadmap) | OpenTelemetry | Distributed traces |

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2026-06-08T10:00:00.000Z",
  "version": "2.0.0",
  "checks": {
    "postgresql": { "status": "ok", "latency_ms": 2 },
    "mongodb":    { "status": "ok", "latency_ms": 3 },
    "redis":      { "status": "ok", "latency_ms": 1 },
    "elasticsearch": { "status": "ok", "latency_ms": 8 }
  }
}
```

---

## 10. Decisiones de Arquitectura (Architecture Decision Records)

### ADR-001: PostgreSQL + MongoDB (Dual Database)

**Contexto:** Los logs de seguridad necesitan ser inmutables (evidencia forense) y al mismo tiempo consultables con joins relacionales.

**Decisión:** PostgreSQL para datos transaccionales relacionales, MongoDB para audit logs inmutables y threat indicators con schema flexible.

**Consecuencias positivas:** Inmutabilidad garantizada a nivel de aplicación en MongoDB. Joins eficientes en PostgreSQL. Flexibilidad de schema para metadata variable de eventos.

**Consecuencias negativas:** Mayor complejidad operacional. Dos sistemas de base de datos que mantener.

---

### ADR-002: SSE en lugar de WebSockets

**Contexto:** El dashboard SOC necesita actualizaciones en tiempo real de alertas, incidentes y métricas.

**Decisión:** Server-Sent Events (SSE) sobre WebSockets.

**Razón:** El flujo de datos es unidireccional (servidor → cliente). SSE tiene reconexión automática nativa, es HTTP estándar, y tiene menor complejidad de implementación.

---

### ADR-003: RBAC jerárquico con `minRole()` en lugar de permisos atómicos

**Contexto:** 4 roles con jerarquía clara (admin > analyst > responder > viewer). 91+ endpoints con diferentes niveles de acceso.

**Decisión:** Middleware `minRole(roleName)` que compara posiciones en array de jerarquía.

**Razón:** Simple, predecible, sin tablas de permisos complejas para una jerarquía lineal. El 95% de los endpoints se protege correctamente con este modelo. El 5% restante (permisos por recurso) se maneja con `organization_id` scoping.

---

### ADR-004: JWT en httpOnly cookies, no localStorage

**Contexto:** Almacenamiento seguro de tokens de autenticación en el frontend.

**Decisión:** JWT almacenado en cookies httpOnly + SameSite=Strict, no en localStorage.

**Razón:** localStorage es accesible por JavaScript y vulnerable a XSS. Las cookies httpOnly son inaccesibles para JavaScript. La combinación con CSP estricto hace el token inasequible para scripts maliciosos.

---

*Documento generado por: Principal Cybersecurity Architect*  
*RobenGate Sentinel v2.0.0 — Junio 2026*
