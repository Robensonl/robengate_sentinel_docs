# Inventario del Proyecto — API Completa

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026  
**Base URL:** `https://api.robengate-sentinel.com` (producción)  
**Base URL Dev:** `http://localhost:5000`

---

## Convenciones de la API

### Autenticación
Todos los endpoints protegidos requieren:
```
Authorization: Bearer <access_token>
```

### Formato de Respuesta

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Descripción opcional"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

### Roles
- `viewer` → Nivel 1 (lectura SOC)
- `responder` → Nivel 2 (gestión de incidentes)
- `analyst` → Nivel 3 (análisis completo)
- `admin` → Nivel 4 (administración total)

---

## GRUPO 1: Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrar nuevo usuario | Pública |
| `POST` | `/api/auth/login` | Iniciar sesión | Pública |
| `POST` | `/api/auth/logout` | Cerrar sesión, invalida tokens | `viewer` |
| `POST` | `/api/auth/refresh` | Renovar access token | Pública (refresh token) |
| `POST` | `/api/auth/mfa/send` | Enviar código MFA por email/SMS | Pública (pending) |
| `POST` | `/api/auth/mfa/verify` | Verificar código MFA | Pública (pending) |
| `POST` | `/api/auth/totp/setup` | Configurar TOTP (Google Authenticator) | `viewer` |
| `POST` | `/api/auth/totp/verify` | Verificar código TOTP | Pública |
| `POST` | `/api/auth/totp/disable` | Desactivar TOTP | `viewer` |
| `POST` | `/api/auth/forgot-password` | Solicitar reset de contraseña | Pública |
| `POST` | `/api/auth/reset-password` | Aplicar nueva contraseña | Pública (reset token) |
| `GET` | `/api/auth/me` | Obtener perfil del usuario autenticado | `viewer` |

### POST `/api/auth/login` — Ejemplo

**Request:**
```json
{
  "email": "usuario@empresa.com",
  "password": "contraseña-segura"
}
```

**Response (MFA habilitado):**
```json
{
  "success": true,
  "requiresMfa": true,
  "pendingToken": "eyJ...",
  "mfaChannel": "email"
}
```

**Response (login directo):**
```json
{
  "success": true,
  "accessToken": "eyJ...",
  "user": {
    "id": 1,
    "email": "usuario@empresa.com",
    "name": "Nombre Usuario",
    "role": "analyst"
  }
}
```

---

## GRUPO 2: WebAuthn (`/api/auth/webauthn`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/auth/webauthn/register/options` | Opciones para registro biométrico | `viewer` |
| `POST` | `/api/auth/webauthn/register/verify` | Verificar y guardar credencial | `viewer` |
| `GET` | `/api/auth/webauthn/login/options` | Opciones para autenticación biométrica | Pública |
| `POST` | `/api/auth/webauthn/login/verify` | Verificar autenticación biométrica | Pública |

---

## GRUPO 3: Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/users` | Listar todos los usuarios | `analyst` |
| `GET` | `/api/users/:id` | Obtener usuario por ID | `analyst` |
| `POST` | `/api/users` | Crear usuario (admin) | `admin` |
| `PUT` | `/api/users/:id` | Actualizar usuario | `admin` |
| `DELETE` | `/api/users/:id` | Desactivar usuario | `admin` |
| `PATCH` | `/api/users/:id/role` | Cambiar rol | `admin` |
| `PUT` | `/api/users/profile` | Actualizar perfil propio | `viewer` |
| `PUT` | `/api/users/password` | Cambiar contraseña | `viewer` |

---

## GRUPO 4: Dispositivos (`/api/devices`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/devices` | Listar dispositivos del usuario | `viewer` |
| `GET` | `/api/devices/all` | Listar todos los dispositivos | `analyst` |
| `PUT` | `/api/devices/:id/trust` | Marcar dispositivo como confiable | `viewer` |
| `DELETE` | `/api/devices/:id` | Revocar dispositivo | `viewer` |

---

## GRUPO 5: Sesiones (`/api/sessions`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/sessions` | Sesiones activas del usuario | `viewer` |
| `DELETE` | `/api/sessions/:id` | Revocar sesión específica | `viewer` |
| `DELETE` | `/api/sessions` | Revocar todas las sesiones | `viewer` |

---

## GRUPO 6: Logs de Seguridad (`/api/logs`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/logs` | Listar logs con filtros | `viewer` |
| `GET` | `/api/logs/:id` | Obtener log por ID | `viewer` |
| `GET` | `/api/logs/stats` | Estadísticas de logs | `analyst` |

**Query Params de filtrado:**
```
?severity=critical,warning
&eventType=LOGIN_FAILED
&userId=123
&ipAddress=1.2.3.4
&from=2026-01-01
&to=2026-12-31
&page=1&limit=50
```

---

## GRUPO 7: Alertas (`/api/alerts`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/alerts` | Listar alertas | `viewer` |
| `GET` | `/api/alerts/:id` | Obtener alerta por ID | `viewer` |
| `POST` | `/api/alerts` | Crear alerta manual | `analyst` |
| `PATCH` | `/api/alerts/:id/status` | Actualizar estado | `analyst` |
| `PATCH` | `/api/alerts/:id/assign` | Asignar a analista | `analyst` |
| `DELETE` | `/api/alerts/:id` | Eliminar alerta | `admin` |

---

## GRUPO 8: Incidentes (`/api/incidents`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/incidents` | Listar incidentes | `viewer` |
| `GET` | `/api/incidents/:id` | Obtener incidente | `viewer` |
| `POST` | `/api/incidents` | Crear incidente | `responder` |
| `PUT` | `/api/incidents/:id` | Actualizar incidente | `responder` |
| `PATCH` | `/api/incidents/:id/status` | Cambiar estado | `responder` |
| `PATCH` | `/api/incidents/:id/assign` | Asignar a responder | `analyst` |
| `POST` | `/api/incidents/:id/close` | Cerrar incidente | `responder` |
| `DELETE` | `/api/incidents/:id` | Eliminar incidente | `admin` |

---

## GRUPO 9: Vulnerabilidades (`/api/vulnerabilities`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/vulnerabilities` | Listar vulnerabilidades | `viewer` |
| `GET` | `/api/vulnerabilities/:id` | Obtener vulnerabilidad | `viewer` |
| `POST` | `/api/vulnerabilities` | Registrar vulnerabilidad | `analyst` |
| `PUT` | `/api/vulnerabilities/:id` | Actualizar | `analyst` |
| `PATCH` | `/api/vulnerabilities/:id/status` | Cambiar estado | `analyst` |
| `DELETE` | `/api/vulnerabilities/:id` | Eliminar | `admin` |

---

## GRUPO 10: Estadísticas (`/api/stats`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/stats/dashboard` | Métricas del dashboard SOC | `viewer` |
| `GET` | `/api/stats/threats` | Estadísticas de amenazas | `viewer` |
| `GET` | `/api/stats/users` | Estadísticas de usuarios | `analyst` |
| `GET` | `/api/stats/timeline` | Eventos por línea de tiempo | `viewer` |

---

## GRUPO 11: Threat Intelligence (`/api/threats`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/threats` | Listar indicadores de amenaza (IOCs) | `analyst` |
| `GET` | `/api/threats/:id` | Obtener IOC | `analyst` |
| `POST` | `/api/threats` | Añadir IOC manualmente | `analyst` |
| `PUT` | `/api/threats/:id` | Actualizar IOC | `analyst` |
| `DELETE` | `/api/threats/:id` | Eliminar IOC | `admin` |
| `POST` | `/api/threats/check` | Verificar si un valor es IOC conocido | `analyst` |

---

## GRUPO 12: Auditoría (`/api/audit`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/audit` | Registros de auditoría | `analyst` |
| `GET` | `/api/audit/:id` | Evento de auditoría específico | `analyst` |
| `GET` | `/api/audit/export` | Exportar audit log | `admin` |

---

## GRUPO 13: Honeypot (`/api/honeypot`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/honeypot/events` | Eventos del honeypot | `analyst` |
| `GET` | `/api/honeypot/stats` | Estadísticas del honeypot | `analyst` |
| `GET` | `/api/honeypot/attackers` | IPs atacantes | `analyst` |

---

## GRUPO 14: Organizaciones (`/api/organizations`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/organizations` | Listar organizaciones | `admin` |
| `GET` | `/api/organizations/:id` | Obtener organización | `admin` |
| `POST` | `/api/organizations` | Crear organización | `admin` |
| `PUT` | `/api/organizations/:id` | Actualizar | `admin` |
| `DELETE` | `/api/organizations/:id` | Desactivar | `admin` |

---

## GRUPO 15: Playbooks SOAR (`/api/playbooks`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/playbooks` | Listar playbooks | `analyst` |
| `GET` | `/api/playbooks/:id` | Obtener playbook | `analyst` |
| `POST` | `/api/playbooks` | Crear playbook | `analyst` |
| `PUT` | `/api/playbooks/:id` | Actualizar playbook | `analyst` |
| `DELETE` | `/api/playbooks/:id` | Eliminar playbook | `admin` |
| `POST` | `/api/playbooks/:id/execute` | Ejecutar playbook | `analyst` |

---

## GRUPO 16: Búsqueda Elasticsearch (`/api/search`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/search` | Búsqueda full-text de eventos | `analyst` |
| `POST` | `/api/search/advanced` | Búsqueda avanzada con DSL | `analyst` |

---

## GRUPO 17: Agentes EDR (`/api/agents`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/agents` | Listar agentes registrados | `analyst` |
| `GET` | `/api/agents/:id` | Estado de agente | `analyst` |
| `POST` | `/api/agents/register` | Registrar nuevo agente | `internalAuth` |
| `POST` | `/api/agents/:id/heartbeat` | Heartbeat del agente | `internalAuth` |
| `POST` | `/api/agents/:id/command` | Enviar comando remoto | `admin` |

---

## GRUPO 18: Ingesta de Eventos (`/api/ingest`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/ingest/event` | Ingestar evento individual | `internalAuth` |
| `POST` | `/api/ingest/batch` | Ingestar lote de eventos | `internalAuth` |

---

## GRUPO 19: Mapa de Ataques (`/api/attack-map`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/attack-map/live` | Ataques en tiempo real | `viewer` |
| `GET` | `/api/attack-map/history` | Historial de ataques | `viewer` |
| `GET` | `/api/attack-map/stats` | Estadísticas por país | `viewer` |

---

## GRUPO 20: IA y Correlación (`/api/ai`)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/ai/analysis` | Análisis de correlación actual | `analyst` |
| `GET` | `/api/ai/anomalies` | Anomalías detectadas | `analyst` |
| `POST` | `/api/ai/analyze` | Analizar evento específico | `analyst` |
| `GET` | `/api/ai/patterns` | Patrones detectados | `analyst` |

---

## GRUPO 21: Métricas y Salud (Observabilidad)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/metrics` | Métricas Prometheus | Interna |
| `GET` | `/health` | Liveness check | Pública |
| `GET` | `/ready` | Readiness check | Pública |

---

## GRUPO 22: Eventos en Tiempo Real (SSE)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/events` | Stream SSE de eventos | `viewer` |

**Tipos de eventos SSE:**
- `security:alert` — Nueva alerta de seguridad
- `security:incident` — Nuevo incidente
- `audit:high` — Evento de auditoría HIGH
- `audit:critical` — Evento de auditoría CRITICAL
- `honeypot:event` — Actividad en honeypot
- `system:ban` — IP baneada automáticamente

---

## GRUPO 23: Internal (Honeypot y Servicios)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/internal/honeypot/events` | Recibir eventos del honeypot | `X-Internal-Secret` |

**Header requerido:**
```
X-Internal-Secret: <INTERNAL_API_SECRET>
```

---

## Resumen de Endpoints

| Grupo | Cantidad de Endpoints |
|---|---|
| Autenticación | 12 |
| WebAuthn | 4 |
| Usuarios | 8 |
| Dispositivos | 4 |
| Sesiones | 3 |
| Logs | 3 |
| Alertas | 6 |
| Incidentes | 8 |
| Vulnerabilidades | 6 |
| Estadísticas | 4 |
| Threat Intelligence | 6 |
| Auditoría | 3 |
| Honeypot | 3 |
| Organizaciones | 5 |
| Playbooks | 6 |
| Búsqueda | 2 |
| Agentes EDR | 5 |
| Ingesta | 2 |
| Mapa de Ataques | 3 |
| IA/Correlación | 4 |
| Métricas/Salud | 3 |
| SSE | 1 |
| Internal | 1 |
| **TOTAL** | **~102 endpoints** |
