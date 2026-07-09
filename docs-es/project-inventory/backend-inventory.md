# Inventario del Proyecto — Backend

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026

---

## Estructura de Directorios

```
backend/
├── app.js                    ← Aplicación Express principal
├── nodemon.json              ← Configuración de desarrollo
├── package.json
├── .env                      ← Variables de entorno (no en git)
├── .env.example              ← Plantilla de variables
├── scripts/
│   └── manage-admins.js      ← Script CLI para gestión de admins
└── src/
    ├── config/               ← Configuraciones de servicios
    ├── controllers/          ← Controladores de rutas
    ├── lib/                  ← Librerías y utilidades de bajo nivel
    ├── middleware/           ← Middleware Express
    ├── models/               ← Modelos Mongoose (MongoDB)
    ├── routes/               ← Definición de rutas Express
    ├── services/             ← Lógica de negocio
    └── utils/                ← Utilidades generales
```

---

## 1. Módulo de Configuración (`src/config/`)

| Archivo | Propósito |
|---|---|
| `database.js` | Conexión PostgreSQL (pg Pool), health check |
| `jwt.js` | Configuración JWT: secrets, expiración access/refresh |
| `mongodb.js` | Conexión MongoDB con Mongoose |
| `security.js` | Parámetros de seguridad: CORS origins, body limit, bcrypt rounds |

---

## 2. Rutas (`src/routes/`) — 23 archivos

| Archivo | Prefijo | Descripción | Auth Mínima |
|---|---|---|---|
| `auth.js` | `/api/auth` | Login, registro, logout, refresh, MFA | Pública / Bearer |
| `webauthn.js` | `/api/auth/webauthn` | WebAuthn/FIDO2 registro y autenticación | Pública |
| `users.js` | `/api/users` | CRUD usuarios, perfil, contraseña | `analyst` |
| `devices.js` | `/api/devices` | Gestión de dispositivos de usuario | `viewer` |
| `sessions.js` | `/api/sessions` | Sesiones activas, revocar | `viewer` |
| `logs.js` | `/api/logs` | Logs de seguridad, filtros | `viewer` |
| `alerts.js` | `/api/alerts` | Alertas de seguridad | `viewer` |
| `incidents.js` | `/api/incidents` | Gestión de incidentes | `responder` |
| `vulnerabilities.js` | `/api/vulnerabilities` | Inventario de vulnerabilidades | `analyst` |
| `stats.js` | `/api/stats` | Estadísticas del dashboard | `viewer` |
| `threats.js` | `/api/threats` | Threat intelligence, IOCs | `analyst` |
| `audit.js` | `/api/audit` | Logs de auditoría | `analyst` |
| `honeypot.js` | `/api/honeypot` | Eventos del honeypot | `analyst` |
| `organizations.js` | `/api/organizations` | Multi-tenancy, organizaciones | `admin` |
| `playbooks.js` | `/api/playbooks` | Playbooks SOAR | `analyst` |
| `search.js` | `/api/search` | Búsqueda Elasticsearch | `analyst` |
| `agents.js` | `/api/agents` | Agentes EDR | `analyst` |
| `ingestion.js` | `/api/ingest` | Ingesta de eventos externos | `internalAuth` |
| `attackmap.js` | `/api/attack-map` | Datos para mapa de ataques | `viewer` |
| `ai.js` | `/api/ai` | Análisis de IA y correlación | `analyst` |
| `metrics.js` | `/api/metrics` | Métricas Prometheus | Pública (interna) |
| `health.js` | `/health`, `/ready` | Health checks | Pública |
| `internal.js` | `/internal` | Endpoints internos (honeypot) | `internalAuth` |

---

## 3. Controladores (`src/controllers/`) — 18 archivos

| Controlador | Rutas Asociadas | Responsabilidad |
|---|---|---|
| `authController.js` | `/api/auth` | Login, registro, MFA, logout, refresh token |
| `webAuthnController.js` | `/api/auth/webauthn` | Registro y autenticación biométrica |
| `userController.js` | `/api/users` | CRUD de usuarios, perfil, contraseña |
| `deviceController.js` | `/api/devices` | Gestión de dispositivos confiables |
| `sessionController.js` | `/api/sessions` | Sesiones activas, revocar sesión |
| `logController.js` | `/api/logs` | Consulta y filtrado de logs de seguridad |
| `alertController.js` | `/api/alerts` | Alertas de seguridad, estado, asignación |
| `incidentController.js` | `/api/incidents` | Creación, escalado y cierre de incidentes |
| `vulnerabilityController.js` | `/api/vulnerabilities` | Inventario CVE, severidad, estado |
| `statsController.js` | `/api/stats` | Métricas del dashboard SOC |
| `threatController.js` | `/api/threats` | IOCs, indicadores de amenaza, feeds |
| `auditController.js` | `/api/audit` | Registros de auditoría, exportación |
| `honeypotController.js` | `/api/honeypot` | Eventos del honeypot, estadísticas |
| `ingestionController.js` | `/api/ingest` | Procesamiento de eventos externos |
| `attackMapController.js` | `/api/attack-map` | Geolocalización de ataques |
| `aiAnalysisController.js` | `/api/ai` | Análisis de IA, correlación, scoring |
| `metricsController.js` | `/api/metrics` | Exposición de métricas Prometheus |
| `internalController.js` | `/internal` | Endpoints para honeypot y servicios internos |

---

## 4. Servicios (`src/services/`) — 22 servicios

| Servicio | Descripción | Estado |
|---|---|---|
| `authService.js` | Autenticación, tokens JWT, refresh, invalidación | ✅ Real |
| `webAuthnService.js` | WebAuthn/FIDO2 con `@simplewebauthn/server` | ✅ Real |
| `backupCodeService.js` | Códigos de recuperación cifrados para MFA | ✅ Real |
| `riskEngine.js` | Scoring de riesgo con 10+ señales comportamentales | ✅ Real |
| `detectionEngine.js` | Motor de detección de amenazas en tiempo real | ✅ Real |
| `correlationEngine.js` | Correlación de eventos de seguridad | ✅ Real |
| `aiCorrelationEngine.js` | Correlación basada en heurísticas de IA | ✅ Real (heurístico) |
| `soarEngine.js` | Automatización de respuesta (SOAR), ejecución de playbooks | ✅ Real |
| `auditService.js` | Escritura de eventos de auditoría en MongoDB | ✅ Real |
| `loggingService.js` | Logging estructurado de seguridad | ✅ Real |
| `banService.js` | Gestión de IPs baneadas en PostgreSQL + Redis | ✅ Real |
| `deviceService.js` | Fingerprinting y trust de dispositivos | ✅ Real |
| `honeypotService.js` | Procesamiento de eventos del honeypot | ✅ Real |
| `geoService.js` | Geolocalización de IPs (MaxMind/GeoLite2) | ✅ Real |
| `elasticsearchService.js` | Indexación y búsqueda full-text | ✅ Real |
| `endpointAgentService.js` | Gestión de agentes EDR | ⚠️ Parcial |
| `metricsService.js` | Métricas Prometheus con `prom-client` | ✅ Real |
| `ingestion/pipeline.js` | Pipeline de ingesta de eventos | ✅ Real |
| `ingestion/normalizer.js` | Normalización de eventos a schema estándar | ✅ Real |
| `ingestion/enricher.js` | Enriquecimiento de eventos con context | ✅ Real |
| `ingestion/parser.js` | Parser de diferentes formatos de log | ✅ Real |
| `ingestion/eventSchema.js` | Schema de validación de eventos | ✅ Real |

---

## 5. Middleware (`src/middleware/`) — 10 archivos

| Middleware | Descripción | Orden de Aplicación |
|---|---|---|
| `sanitize.js` | Sanitización HPP + NoSQL injection + null-byte | 1 (global) |
| `autoban.js` | Verificación de IPs baneadas en Redis | 2 (global) |
| `rateLimiter.js` | Rate limiting por IP con Redis | 3 (`/api`) |
| `attackDetection.js` | Detección de patrones de ataque en requests | 4 (`/api`) |
| `tenant.js` | Resolución de contexto multi-tenant | 5 (`/api`) |
| `authenticate.js` | Validación de JWT Bearer token | Por ruta |
| `authorize.js` | Verificación de rol mínimo (`minRole`) | Por ruta |
| `internalAuth.js` | Autenticación de servicios internos (`X-Internal-Secret`) | `/internal` |
| `validate.js` | Validación de esquemas con Joi/Zod | Por ruta |
| `errorHandler.js` | Manejador global de errores (oculta detalles en prod) | Último |

### Detalle: `authorize.js` — Middleware RBAC

```javascript
// Jerarquía de roles
ROLES = { admin: 4, analyst: 3, responder: 2, viewer: 1 }

// Uso
router.get('/', authenticate, authorize.minRole('viewer'), handler)

// readOnly() — bloquea escritura para viewers
router.post('/', authenticate, authorize.readOnly(), handler)
```

---

## 6. Modelos (`src/models/`) — 6 modelos Mongoose

| Modelo | Colección MongoDB | Campos Principales |
|---|---|---|
| `User.js` | `users` | email, passwordHash, role, mfaEnabled, webauthnCredentials |
| `Device.js` | `devices` | userId, fingerprintHash, name, trusted, lastSeen |
| `SecurityLog.js` | `security_logs` | eventType, severity, ipAddress, userId, metadata |
| `ThreatIndicator.js` | `threat_indicators` | type, value, severity, source, ttl |
| `BannedIp.js` | `banned_ips` | ipAddress, reason, expiresAt, bannedBy |
| `MfaCode.js` | `mfa_codes` | userId, code, expiresAt, used, channel |

> **Nota:** Los modelos Mongoose coexisten con las tablas PostgreSQL. Algunos datos (como usuarios y dispositivos) usan ambas bases de datos según el contexto.

---

## 7. Librerías Utilitarias (`src/lib/`)

| Archivo | Descripción |
|---|---|
| `logger.js` | Logger estructurado (Winston/Pino) |
| `mongodb.js` | Conexión Mongoose singleton |
| `redis.js` | Cliente Redis singleton (ioredis) |
| `SecurityLog.js` | Helper para escribir logs de seguridad |
| `sse.js` | Server-Sent Events — canal de eventos en tiempo real |

---

## 8. Utilidades (`src/utils/`)

| Archivo | Descripción |
|---|---|
| `helpers.js` | Funciones de utilidad general |
| `ipUtils.js` | Utilidades para manejo de IPs |
| `mailer.js` | Servicio de email (dev-mock, Nodemailer en producción) |
| `response.js` | Formato estandarizado de respuestas HTTP |

---

## 9. Scripts de Administración (`scripts/`)

| Script | Descripción | Uso |
|---|---|---|
| `manage-admins.js` | CLI para crear/listar/desactivar admins | `node scripts/manage-admins.js` |

---

## 10. Dependencias del Backend (`package.json`)

### Dependencias de Producción

| Paquete | Versión | Propósito |
|---|---|---|
| `express` | ^4.x | Framework web |
| `helmet` | ^7.x | Headers de seguridad |
| `cors` | ^2.x | Política CORS |
| `jsonwebtoken` | ^9.x | JWT |
| `bcrypt` | ^5.x | Hash de contraseñas (work factor 12) |
| `pg` | ^8.x | Cliente PostgreSQL |
| `mongoose` | ^8.x | ODM MongoDB |
| `ioredis` | ^5.x | Cliente Redis |
| `@simplewebauthn/server` | ^9.x | WebAuthn/FIDO2 |
| `prom-client` | ^15.x | Métricas Prometheus |
| `hpp` | ^0.2.x | HTTP Parameter Pollution |
| `express-rate-limit` | ^7.x | Rate limiting |
| `cookie-parser` | ^1.x | Cookies |
| `dotenv` | ^16.x | Variables de entorno |
| `winston` | ^3.x | Logging estructurado |
| `nodemailer` | ^6.x | Email (MFA) |

---

## 11. Variables de Entorno del Backend

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `NODE_ENV` | ✅ | Entorno de ejecución | `production` |
| `PORT` | No | Puerto del servidor | `5000` |
| `DB_HOST` | ✅ | Host de PostgreSQL | `localhost` |
| `DB_PORT` | No | Puerto PostgreSQL | `5432` |
| `DB_NAME` | ✅ | Nombre de base de datos | `robengate_sentinel` |
| `DB_USER` | ✅ | Usuario PostgreSQL | `postgres` |
| `DB_PASSWORD` | ✅ | Contraseña PostgreSQL | (secreto) |
| `MONGO_URI` | ✅ | URI de conexión MongoDB | `mongodb://...` |
| `REDIS_URL` | ✅ | URL de conexión Redis | `redis://:pass@localhost:6379` |
| `JWT_SECRET` | ✅ | Secreto para access tokens | (256+ bits aleatorios) |
| `JWT_REFRESH_SECRET` | ✅ | Secreto para refresh tokens | (256+ bits aleatorios) |
| `JWT_EXPIRES_IN` | No | Expiración access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Expiración refresh token | `7d` |
| `INTERNAL_API_SECRET` | ✅ | Secreto para servicios internos | (256+ bits) |
| `OTP_HMAC_KEY` | ✅ | Clave HMAC para TOTP | (256+ bits) |
| `CLIENT_URL` | ✅ | URL del frontend (CORS) | `https://app.ejemplo.com` |
| `BCRYPT_ROUNDS` | No | Work factor bcrypt | `12` |
| `EMAIL_HOST` | ⚠️ | Servidor SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | ⚠️ | Puerto SMTP | `587` |
| `EMAIL_USER` | ⚠️ | Usuario SMTP | `noreply@ejemplo.com` |
| `EMAIL_PASS` | ⚠️ | Contraseña SMTP | (secreto) |
| `ELASTICSEARCH_URL` | No | URL de Elasticsearch | `http://localhost:9200` |

---

## 12. Endpoints de Salud (Health)

| Endpoint | Método | Descripción | Auth |
|---|---|---|---|
| `GET /health` | GET | Liveness check | Pública |
| `GET /ready` | GET | Readiness check (BD conectada) | Pública |
| `GET /metrics` | GET | Métricas Prometheus | Interna |
| `GET /api/events` | GET (SSE) | Stream de eventos en tiempo real | JWT |
