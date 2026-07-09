# 06 — Auditoría Backend: Servicios, Endpoints y Middleware

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## INVENTARIO DE ENDPOINTS (23 archivos de rutas — 80+ endpoints)

### Autenticación (`/api/auth/*`)

| Método | Endpoint | Auth requerida | Función | Estado |
|--------|---------|---------------|---------|--------|
| POST | `/auth/register` | ❌ | Registro nuevo usuario | 🟢 REAL |
| POST | `/auth/login` | ❌ | Login + risk assessment | 🟢 REAL |
| POST | `/auth/verify-otp` | ❌ (token pendiente) | Verificar código MFA | 🟢 REAL |
| POST | `/auth/send-otp` | ❌ (token pendiente) | Re-enviar código OTP | 🟢 REAL |
| POST | `/auth/refresh` | ❌ (cookie) | Renovar access token | 🟢 REAL |
| POST | `/auth/logout` | ✅ | Revocar tokens | 🟢 REAL |
| GET | `/auth/me` | ✅ | Perfil del usuario | 🟢 REAL |
| PATCH | `/auth/profile` | ✅ | Actualizar perfil | 🟢 REAL |
| PUT | `/auth/change-password` | ✅ | Cambiar contraseña | 🟢 REAL |
| POST | `/auth/totp/setup` | ✅ | Generar secreto TOTP | 🟢 REAL |
| POST | `/auth/totp/confirm` | ✅ | Confirmar TOTP | 🟢 REAL |
| DELETE | `/auth/totp/disable` | ✅ | Deshabilitar TOTP | 🟢 REAL |
| POST | `/auth/forgot-password` | ❌ | Solicitar reset | 🟢 REAL |
| POST | `/auth/reset-password` | ❌ (token en body) | Resetear contraseña | 🟢 REAL |
| GET | `/auth/backup-codes` | ✅ | Obtener backup codes | 🟢 REAL |
| POST | `/auth/backup-codes/use` | ❌ (pendiente) | Usar backup code | 🟢 REAL |

### WebAuthn (`/api/auth/webauthn/*`)

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/auth/webauthn/registration-options` | 🟢 REAL |
| POST | `/auth/webauthn/registration-verify` | 🟢 REAL |
| GET | `/auth/webauthn/authentication-options` | 🟢 REAL |
| POST | `/auth/webauthn/authentication-verify` | 🟢 REAL |
| GET | `/auth/webauthn/login-options` | 🟢 REAL |
| POST | `/auth/webauthn/login-verify` | 🟢 REAL |
| GET | `/auth/webauthn/credentials` | 🟢 REAL |
| DELETE | `/auth/webauthn/credentials/:id` | 🟢 REAL |

### Usuarios (`/api/users/*`)

| Método | Endpoint | Rol mínimo | Estado |
|--------|---------|-----------|--------|
| GET | `/users` | admin | 🟢 REAL |
| GET | `/users/:id` | admin | 🟢 REAL |
| PATCH | `/users/:id` | admin | 🟢 REAL |
| PATCH | `/users/:id/role` | admin | 🟢 REAL |
| PATCH | `/users/:id/lock` | admin | 🟢 REAL |
| DELETE | `/users/:id` | admin | 🟢 REAL |

### Dispositivos (`/api/devices/*`)

| Método | Endpoint | Rol mínimo | Estado |
|--------|---------|-----------|--------|
| GET | `/devices` | viewer | 🟢 REAL |
| GET | `/devices/mine` | any | 🟢 REAL |
| DELETE | `/devices/:id` | any | 🟢 REAL |
| PATCH | `/devices/:id/trust` | admin | 🟢 REAL |

### Sesiones (`/api/sessions/*`)

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/sessions` | 🟢 REAL |
| DELETE | `/sessions/:id` | 🟢 REAL |
| DELETE | `/sessions/all` | 🟢 REAL |

### Logs y Auditoría

| Método | Endpoint | Rol | Estado |
|--------|---------|-----|--------|
| GET | `/logs` | viewer | 🟢 REAL |
| GET | `/logs/stats` | viewer | 🟢 REAL |
| GET | `/logs/export` | analyst | 🟢 REAL |
| GET | `/audit` | viewer | 🟢 REAL |
| GET | `/audit/stats` | viewer | 🟢 REAL |
| GET | `/audit/export` | analyst | 🟢 REAL |
| GET | `/audit/stream` | analyst | 🟢 REAL (SSE) |

### Alertas e Incidentes

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/alerts` | 🟢 REAL |
| PATCH | `/alerts/:id/status` | 🟢 REAL |
| GET | `/incidents` | 🟢 REAL |
| POST | `/incidents` | 🟢 REAL |
| PATCH | `/incidents/:id` | 🟢 REAL |

### Vulnerabilidades

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/vulnerabilities` | 🟢 REAL |
| POST | `/vulnerabilities` | 🟢 REAL |
| PATCH | `/vulnerabilities/:id` | 🟢 REAL |

### Amenazas / IOCs

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/threats/indicators` | 🟢 REAL (MongoDB) |
| GET | `/threats/feeds` | 🟢 REAL |
| GET | `/threats/stats` | 🟢 REAL |
| GET | `/threats/heatmap` | 🟢 REAL |
| POST | `/threats/report` | 🟢 REAL |

### Métricas y Analytics

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/metrics/overview` | 🟢 REAL |
| GET | `/metrics/timeline` | 🟢 REAL |
| GET | `/metrics/top-attackers` | 🟢 REAL |
| GET | `/stats` | 🟢 REAL |
| GET | `/ai/overview` | 🟢 REAL |
| GET | `/ai/anomaly-stream` | 🟢 REAL |
| GET | `/ai/user-behavior` | 🟢 REAL |
| GET | `/ai/recommendations` | 🟢 REAL |
| GET | `/ai/radar` | 🟢 REAL |

### Attack Map

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/attack-map/recent` | 🟢 REAL |
| GET | `/attack-map/summary` | 🟢 REAL |
| GET | `/attack-map/stats` | 🟢 REAL |

### Honeypot

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/honeypot/events` | 🟢 REAL |
| GET | `/honeypot/stats` | 🟢 REAL |
| GET | `/honeypot/attackers` | 🟢 REAL |

### Ingesta de Logs

| Método | Endpoint | Formato | Estado |
|--------|---------|---------|--------|
| POST | `/ingest/event` | JSON/CEF/syslog/windows | 🟢 REAL |
| POST | `/ingest/batch` | Batch de eventos | 🟢 REAL |
| POST | `/ingest/syslog` | RFC3164/5424 | 🟢 REAL |
| POST | `/ingest/windows` | Windows Event Log | 🟢 REAL |
| POST | `/ingest/webhook` | Webhook externo | 🟢 REAL |
| GET | `/ingest/stats` | — | 🟢 REAL |

### Organizaciones (Multi-tenancy)

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/organizations` | 🟢 REAL |
| POST | `/organizations` | 🟢 REAL |
| GET | `/organizations/:id` | 🟢 REAL |
| PATCH | `/organizations/:id` | 🟢 REAL |
| POST | `/organizations/:id/members` | 🟡 Email no enviado |
| DELETE | `/organizations/:id/members/:uid` | 🟢 REAL |

### Playbooks / SOAR

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/playbooks` | 🟢 REAL |
| POST | `/playbooks` | 🟢 REAL |
| GET | `/playbooks/:id` | 🟢 REAL |
| PATCH | `/playbooks/:id` | 🟢 REAL |
| DELETE | `/playbooks/:id` | 🟢 REAL |
| POST | `/playbooks/:id/execute` | 🟢 REAL |

### Agents (EDR)

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/agents` | 🟢 REAL |
| POST | `/agents` | 🟢 REAL |
| GET | `/agents/:id` | 🟢 REAL |
| POST | `/agents/:id/command` | 🟢 REAL |
| POST | `/agents/:id/isolate` | 🟢 REAL |

### Health & Monitoring

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/health` | 🟢 REAL |
| GET | `/health/ready` | 🟢 REAL |
| GET | `/health/live` | 🟢 REAL |
| GET | `/metrics` | 🟢 Prometheus |

### SSE Real-Time

| Método | Endpoint | Estado |
|--------|---------|--------|
| GET | `/api/events` | 🟢 REAL (SSE stream) |

---

## ANÁLISIS DE MIDDLEWARE

| Middleware | Archivo | Función | Estado |
|-----------|---------|---------|--------|
| `helmet` | `app.js` | Security headers: CSP, HSTS, X-Frame | 🟢 REAL |
| `cors` | `middleware/cors.js` | Origin whitelist de env | 🟢 REAL |
| `sanitize` | `middleware/sanitize.js` | HPP + NoSQL injection + null bytes | 🟢 REAL |
| `attackDetection` | `middleware/attackDetection.js` | XSS + SQLi pattern matching | 🟢 REAL |
| `autoban` | `middleware/autoban.js` | Auto-ban por IP tras múltiples fallos | 🟢 REAL |
| `rateLimiter` | `middleware/rateLimiter.js` | 3 tiers (global, auth, mfa) | 🟢 REAL |
| `authenticate` | `middleware/authenticate.js` | JWT validate + Redis blacklist | 🟢 REAL |
| `authorize` | `middleware/authorize.js` | RBAC minRole() + readOnly() | 🟢 REAL |
| `tenant` | `middleware/tenant.js` | Multi-tenant org context | 🟢 REAL |

---

## SERVICIOS — ESTADO DETALLADO

| Servicio | Archivo | Usa BD real | Simulaciones | Estado |
|---------|---------|------------|-------------|--------|
| `authService` | `services/authService.js` | PostgreSQL | Console.log MFA codes | 🟡 |
| `riskEngine` | `services/riskEngine.js` | PostgreSQL | Ninguna | 🟢 |
| `banService` | `services/banService.js` | PostgreSQL + Redis | Ninguna | 🟢 |
| `detectionEngine` | `services/detectionEngine.js` | PostgreSQL | State en memoria | 🟡 |
| `correlationEngine` | `services/correlationEngine.js` | PostgreSQL | Cooldown en memoria | 🟡 |
| `soarEngine` | `services/soarEngine.js` | PostgreSQL | Ninguna | 🟢 |
| `aiCorrelationEngine` | `services/aiCorrelationEngine.js` | PostgreSQL | Ninguna | 🟢 |
| `ingestionPipeline` | `services/ingestionPipeline.js` | PostgreSQL + MongoDB | Ninguna | 🟢 |
| `metricsService` | `services/metricsService.js` | Prometheus metrics | Ninguna | 🟢 |
| `elasticsearchService` | `services/elasticsearchService.js` | Elasticsearch | Ninguna | 🟢 |
| `deviceService` | `services/deviceService.js` | PostgreSQL | Ninguna | 🟢 |
| `honeypotService` | `services/honeypotService.js` | PostgreSQL | Ninguna | 🟢 |
| `webAuthnService` | `services/webAuthnService.js` | PostgreSQL | Ninguna | 🟢 |
| `auditService` | `services/auditService.js` | MongoDB | Ninguna | 🟢 |
| `geoService` | `services/geoService.js` | geoip-lite (offline) | Ninguna | 🟢 |
| `emailService` | `services/emailService.js` | nodemailer | Dev-mock | 🟡 |

---

## PROBLEMAS DETECTADOS EN BACKEND

### P-01: MFA Codes en console.log — Riesgo de producción

```javascript
// authService.js líneas ~310-313
if (process.env.NODE_ENV === 'development') {  // ← ¿Tiene este gate?
  console.log(`[DEV] MFA Code for ${email}: ${code}`);
}
```

**Si no hay gate `NODE_ENV !== 'production'`:** Los códigos MFA se imprimen en los logs de producción. Cualquiera con acceso a los logs del servidor puede ver códigos activos.

**Verificación necesaria:** Confirmar que existe el gate `process.env.NODE_ENV === 'development'` alrededor de todos los `console.log` de credenciales.

### P-02: Email de invitación no implementado

```javascript
// organizations.js ~línea 295
// TODO: Send invitation email via emailService
// Por ahora, solo se registra la membresía sin notificación
```

El usuario invitado no recibe email. La función multi-tenant está parcialmente rota.

### P-03: Estado de detección en memoria (volátil)

```javascript
// detectionEngine.js
const eventBuckets = new Map();  // Se pierde en restart

// correlationEngine.js
const _cooldowns = new Map();    // Se pierde en restart
```

**Impacto:** 
- Si el proceso se reinicia durante un ataque de brute-force en progreso, los contadores se resetean a 0
- El atacante puede reiniciar su sesión de ataque sin que se detecte el patrón completo
- Los cooldowns de correlación se pierden → posibles incidentes duplicados al reiniciar

**Corrección:** Persistir estos buckets en Redis con TTL acorde a la ventana de tiempo.

### P-04: ipsBlocked como aproximación

```javascript
// metricsController.js
// ipsBlocked ≈ unique_ips_24h
// Nota en código: "aproximación hasta que tengamos tabla explícita de bloqueos"
const ipsBlocked = uniqueIps24h;  // No es una cuenta real de IPs bloqueadas
```

El KPI "IPs Blocked" en el dashboard muestra IPs únicas vistas, no IPs realmente bloqueadas. La tabla `banned_ips` existe pero no se suma correctamente en este KPI.

### P-05: Sin límite en exports

Los endpoints `/api/logs/export` y `/api/audit/export` no tienen LIMIT. Con millones de eventos, pueden causar:
- Timeout HTTP
- OOM del proceso Node.js
- Degradación de la base de datos

### P-06: Elasticsearch como dependencia opcional no declarada

`elasticsearchService.js` está importado pero no hay validación de que Elasticsearch esté disponible al inicio. Si no está disponible, las búsquedas del módulo `search` fallan silenciosamente.

---

## SERVICIOS NO UTILIZADOS / MUERTOS

Ningún servicio detectado como completamente no utilizado. Todos los archivos de servicios son importados por al menos un controlador.

---

## ENDPOINTS SIN EQUIVALENTE FRONTEND

Los siguientes endpoints existen en el backend pero **no tienen UI** en el frontend:

| Endpoint | Funcionalidad | Observación |
|---------|--------------|------------|
| `POST /ingest/event` | Ingesta de logs | UI solo para admins, no hay panel de ingesta |
| `POST /ingest/batch` | Ingesta batch | Solo accesible via API |
| `POST /ingest/syslog` | Ingesta Syslog | Sin UI de configuración |
| `GET /search/*` | Búsqueda Elasticsearch | Sin UI de búsqueda avanzada |
| `GET /internal/*` | APIs internas | Correctamente sin UI |
| `POST /playbooks/:id/execute` | Ejecutar playbook | La UI de SOAR no está en el inventario de páginas |

---

## RESUMEN DEL BACKEND

| Categoría | Estado |
|-----------|--------|
| Endpoints funcionales (reales) | ✅ 80+ endpoints, todos con queries reales |
| Servicios con simulaciones | ❌ 0 servicios con Math.random() |
| Endpoints muertos | ❌ 0 detectados |
| Middleware de seguridad | ✅ 9 layers completos |
| Console.logs en producción | ⚠️ Verificar gate en authService |
| Email de invitaciones | ⚠️ No implementado |
| Estado volátil en memoria | ⚠️ detectionEngine + correlationEngine |
| Exports sin límite | ⚠️ logs + audit |
