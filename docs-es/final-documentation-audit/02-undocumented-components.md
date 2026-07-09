# 02 — Componentes Sin Documentar

**Auditoría:** RobenGate Sentinel — Junio 2026  
**Prioridad:** Crítica  

---

## Componentes Backend Sin Documentar

### Servicios

#### `geoService.js`
- **Función:** Geolocalización de IPs usando MaxMind GeoLite2
- **Usado por:** attackMapController, ingestion/enricher, honeypotService
- **Estado:** REAL — producción
- **Pendiente:** Documentar configuración MaxMind DB, fallback behavior

#### `elasticsearchService.js`
- **Función:** Full-text search sobre logs, analytics aggregations, IOC lookup
- **Endpoints afectados:** `/api/search/*`
- **Estado:** REAL — opcional (graceful fallback si ES no disponible)
- **Pendiente:** Documenta queries, índices, mappings, configuración

#### `endpointAgentService.js`
- **Función:** Registro de agentes EDR, gestión de aislamiento, command dispatch
- **Endpoints afectados:** `/api/agents/*`
- **Estado:** PARCIAL — registro funcional, comandos EDR básicos
- **Pendiente:** Documentar protocolo de registro, comandos disponibles, limitaciones

#### `deviceService.js`
- **Función:** Fingerprinting de dispositivos, gestión de dispositivos de confianza
- **Estado:** REAL — producción
- **Pendiente:** Documentar algoritmo de fingerprinting, proceso de trust

#### `loggingService.js`
- **Función:** Logger centralizado Winston con structured logging
- **Estado:** REAL — producción
- **Pendiente:** Documentar niveles de log, formato, destinos

#### `backupCodeService.js`
- **Función:** Generación y validación de códigos de backup MFA (bcrypt)
- **Estado:** REAL — producción
- **Pendiente:** Documentar proceso de generación, almacenamiento

### Middleware Sin Documentar

#### `errorHandler.js`
- **Función:** Handler global de errores Express; normaliza respuestas de error
- **Pendiente:** Documentar formato de error, códigos HTTP mapeados

#### `internalAuth.js`
- **Función:** Valida `X-Internal-Secret` para comunicaciones honeypot→backend
- **Pendiente:** Documentar cabecera requerida, configuración de secreto

#### `validate.js`
- **Función:** Validación de input via esquemas Zod
- **Schemas definidos:** register, login, verifyOtp, changePassword, y más
- **Pendiente:** Documentar todos los schemas de validación

### Endpoints Sin Documentar Completamente

#### Ingesta (`/api/ingest`)
| Endpoint | Método | Estado |
|---|---|---|
| `POST /api/ingest/syslog` | POST | ❌ Sin documentar |
| `POST /api/ingest/windows` | POST | ❌ Sin documentar |
| `POST /api/ingest/webhook` | POST | ❌ Sin documentar |
| `GET /api/ingest/stats` | GET | ❌ Sin documentar |

#### Internal (`/internal`)
| Endpoint | Método | Estado |
|---|---|---|
| `GET /internal/honeypot/hits` | GET | ❌ Sin documentar |
| `POST /internal/ban` | POST | ❌ Sin documentar |
| `DELETE /internal/ban/:ip` | DELETE | ❌ Sin documentar |
| `GET /internal/banned-ips` | GET | ❌ Sin documentar |

#### Auth TOTP
| Endpoint | Método | Estado |
|---|---|---|
| `POST /api/auth/totp/setup` | POST | ❌ Sin documentar |
| `POST /api/auth/totp/confirm` | POST | ❌ Sin documentar |
| `GET /api/auth/backup-codes/count` | GET | ❌ Sin documentar |

#### AI (`/api/ai`)
| Endpoint | Método | Estado |
|---|---|---|
| `GET /api/ai/anomaly-stream` | GET | ❌ Sin documentar |
| `GET /api/ai/radar` | GET | ❌ Sin documentar |

---

## Tablas de Base de Datos Sin Documentar

### PostgreSQL

#### `alert_statuses`
```sql
-- Tabla de estado de alertas (overlay inmutable sobre security_logs)
CREATE TABLE alert_statuses (
  log_id     BIGINT      PRIMARY KEY,
  status     VARCHAR(30) NOT NULL DEFAULT 'new',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- status enum: new | acknowledged | investigating | resolved | false_positive
```
**Pendiente:** Documentar patrón de overlay, relación con security_logs

#### `incident_events`
```sql
-- Timeline de eventos de un incidente
CREATE TABLE incident_events (
  id          SERIAL  PRIMARY KEY,
  incident_id INT     NOT NULL REFERENCES incidents(id),
  actor       TEXT    NOT NULL,
  action      TEXT    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```
**Pendiente:** Documentar en incident management guide

#### `organization_api_keys`
```sql
-- API Keys M2M para integraciones de organizaciones
CREATE TABLE organization_api_keys (
  id              SERIAL       PRIMARY KEY,
  organization_id INT          NOT NULL,
  name            VARCHAR(100) NOT NULL,
  key_hash        TEXT         NOT NULL UNIQUE,
  key_prefix      VARCHAR(12)  NOT NULL,
  scopes          TEXT[]       NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_by      INT,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);
```
**Pendiente:** Documentar proceso de creación, scopes disponibles, rotación

#### Tablas de Playbooks SOAR (migration 013)
- `playbooks` — definición de playbooks
- `playbook_actions` — acciones dentro de playbooks
- `playbook_executions` — historial de ejecuciones
**Pendiente:** Documentar estructura, triggers, condiciones, acciones

#### Campos adicionales no documentados en `users`
- `failed_login_count` — contador de fallos de login
- `is_locked` — cuenta bloqueada por seguridad
- `mfa_type` — tipo de MFA activo (`email` | `totp`)
- `organization_id` — FK multi-tenancy
- `company` — empresa del usuario
- `full_name` — nombre completo
- `totp_secret` / `totp_enabled` — configuración TOTP

---

## Módulos Frontend Sin Documentar

### `landing/`
- **Páginas:** `LandingPage.jsx`, `LandingPage_temp.jsx`
- **Estado:** Implementado
- **Pendiente:** Documentar estructura, secciones, CTA

### `marketing/`
- **Propósito:** Arquitectura pública, diagramas DB, business card
- **Estado:** Implementado
- **Pendiente:** Documentar páginas y propósito

### Componentes Shared Sin Documentar
- `CommandPalette.jsx` — búsqueda global de comandos/páginas
- `NotificationCenter.jsx` — centro de notificaciones en tiempo real
- `SecurityBadge.jsx` — badge de nivel de seguridad
- `realTimeService.js` — cliente SSE + fallback a attackSimulator
- `attackSimulator.js` — generador de eventos de ataque simulados (DEMO)
- `tokenManager.js` — gestión de tokens en memoria (NO localStorage)
- `secureStorage.js` — almacenamiento seguro frontend
- `deviceFingerprint.js` — fingerprinting de navegador

---

## Guías Operacionales Faltantes

| Guía | Prioridad | Notas |
|---|---|---|
| **Guía de Administrador** | 🔴 Crítica | Gestión usuarios, roles, alertas, incidentes |
| **Guía de Analista SOC** | 🔴 Crítica | Workflows de investigación, threat hunting |
| **Guía de Demo** | 🔴 Crítica | Scripts de presentación 15min/ejecutiva/técnica |
| **Portfolio Profesional** | 🟡 Alta | Presentación proyecto para empleadores |
| **Guía Comercial** | 🟡 Alta | Propuesta de valor, industrias objetivo |
| **Plan de Localización** | 🟡 Alta | UI 100% español |
| **Auditoría de Código** | 🟡 Alta | Dead code, dependencias no usadas |

---

## Documentación de Seguridad Faltante

| Documento | Prioridad |
|---|---|
| Modelo de amenazas (Threat Model) completo | 🟡 Alta |
| Procedimientos de respuesta a incidentes | 🔴 Crítica |
| Política de contraseñas y MFA | 🟡 Alta |
| Guía de configuración segura para producción | 🟡 Alta |
| Plan de rotación de secretos | 🟡 Alta |
