# API — Security Logs

**Base URL:** `/api/logs`  
**Auth mínima:** `viewer`  

---

## Descripción General

Los security logs son el corazón del SIEM de RobenGate Sentinel. Cada evento de seguridad se registra en ambas bases de datos:

- **PostgreSQL** `security_logs` — consultas rápidas, filtros por severidad/IP/fecha
- **MongoDB** `SecurityLog` — audit trail inmutable con MITRE ATT&CK mapping y TTL 365 días

> **Inmutabilidad:** Los logs nunca se modifican ni eliminan. El estado de alerta se gestiona en la tabla separada `alert_statuses`.

---

## Endpoints

### GET /api/logs

**Descripción:** Lista los logs de seguridad con filtros avanzados.  
**Auth:** `viewer+`

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Por página (default: 50, max: 200) |
| `severity` | string | `critical\|high\|medium\|low\|info` |
| `event_type` | string | Tipo de evento específico |
| `ip` | string | Filtrar por IP |
| `country` | string | Filtrar por código de país (ISO 2) |
| `from` | ISO8601 | Desde fecha |
| `to` | ISO8601 | Hasta fecha |
| `user_id` | number | Filtrar por usuario |

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1024567,
        "event_type": "LOGIN_FAILED",
        "severity": "warning",
        "ip_address": "185.220.101.44",
        "country_code": "RU",
        "user_id": null,
        "metadata": {
          "email_attempted": "admin@empresa.com",
          "user_agent": "python-requests/2.31.0",
          "attempt_number": 47
        },
        "created_at": "2026-06-01T14:00:00Z"
      },
      {
        "id": 1024566,
        "event_type": "LOGIN_SUCCESS",
        "severity": "info",
        "ip_address": "91.189.122.10",
        "country_code": "ES",
        "user_id": 42,
        "metadata": {
          "email": "ana@empresa.com",
          "mfa_used": true,
          "session_id": "abc123"
        },
        "created_at": "2026-06-01T13:58:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 847293,
      "pages": 16946
    }
  }
}
```

---

### GET /api/logs/stats

**Descripción:** Estadísticas agregadas de los logs de seguridad.  
**Auth:** `viewer+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "total_24h": 15847,
    "by_severity": {
      "critical": 23,
      "high": 156,
      "medium": 892,
      "low": 4521,
      "info": 10255
    },
    "by_event_type": {
      "LOGIN_FAILED": 4521,
      "LOGIN_SUCCESS": 3892,
      "SQL_INJECTION_ATTEMPT": 47,
      "BRUTE_FORCE_DETECTED": 12
    },
    "top_source_ips": [
      {"ip": "185.220.101.44", "count": 890, "country": "RU"},
      {"ip": "45.148.10.22", "count": 234, "country": "NL"}
    ],
    "top_countries": [
      {"country": "RU", "count": 2341},
      {"country": "CN", "count": 1892}
    ],
    "events_timeline": [
      {"hour": "2026-06-01T14:00:00Z", "count": 892},
      {"hour": "2026-06-01T13:00:00Z", "count": 1245}
    ]
  }
}
```

---

## Tipos de Eventos

### Autenticación

| event_type | severity | Descripción |
|---|---|---|
| `LOGIN_SUCCESS` | info | Login exitoso |
| `LOGIN_FAILED` | warning | Fallo de login |
| `LOGIN_MFA_SUCCESS` | info | MFA completado |
| `LOGIN_MFA_FAILED` | warning | Código MFA inválido |
| `LOGOUT` | info | Cierre de sesión |
| `TOKEN_REFRESHED` | info | Token renovado |
| `PASSWORD_CHANGED` | info | Contraseña cambiada |
| `PASSWORD_RESET` | warning | Contraseña restablecida |
| `ACCOUNT_LOCKED` | high | Cuenta bloqueada |
| `WEBAUTHN_AUTH` | info | Autenticación WebAuthn |
| `BRUTE_FORCE_DETECTED` | high | Ataque de fuerza bruta |
| `CREDENTIAL_STUFFING` | high | Credential stuffing |

### Ataques Web

| event_type | severity | Descripción |
|---|---|---|
| `SQL_INJECTION_ATTEMPT` | critical | Payload SQLi detectado |
| `XSS_ATTEMPT` | high | Payload XSS detectado |
| `PATH_TRAVERSAL_ATTEMPT` | high | Intento de directory traversal |
| `NULL_BYTE_INJECTION` | high | Null byte injection |
| `HPP_ATTEMPT` | medium | HTTP Parameter Pollution |

### Sistema

| event_type | severity | Descripción |
|---|---|---|
| `IP_BANNED` | high | IP baneada automáticamente |
| `IP_UNBANNED` | info | IP desbaneada |
| `RATE_LIMIT_EXCEEDED` | medium | Rate limit superado |
| `SUSPICIOUS_LOGIN` | medium | Login sospechoso (nueva IP/país) |
| `SESSION_REVOKED` | info | Sesión revocada |

### Honeypot

| event_type | severity | Descripción |
|---|---|---|
| `HONEYPOT_SSH_AUTH` | medium | Intento SSH en honeypot |
| `HONEYPOT_HTTP_PROBE` | low | Sondeo HTTP en honeypot |

---

## MongoDB Security Log — Estructura Extendida

La versión MongoDB incluye campos adicionales para investigación forense:

```json
{
  "_id": "60d5f5b8c9e4a12345678901",
  "category": "AUTH",
  "action": "LOGIN_FAILED",
  "severity": "HIGH",
  "userId": "42",
  "userEmail": "victim@empresa.com",
  "ipAddress": "185.220.101.44",
  "countryCode": "RU",
  "userAgent": "python-requests/2.31.0",
  "requestId": "req-abc123",
  "sessionId": null,
  "endpoint": "/api/auth/login",
  "method": "POST",
  "statusCode": 401,
  "mitreTactic": "TA0006",
  "mitreTechnique": "T1110.001",
  "ioc": "185.220.101.44",
  "metadata": {
    "emailAttempted": "victim@empresa.com",
    "attemptNumber": 47,
    "windowMinutes": 5
  },
  "createdAt": "2026-06-01T14:00:00Z"
}
```

**Categorías MongoDB:**

| Categoría | Descripción |
|---|---|
| `AUTH` | Eventos de autenticación |
| `ACCESS` | Control de acceso, RBAC |
| `DATA` | Operaciones sobre datos |
| `SYSTEM` | Eventos del sistema |
| `THREAT` | Amenazas detectadas |
| `ADMIN` | Acciones administrativas |
| `HONEYPOT` | Eventos de honeypot |

---

## Política de Retención

| Almacén | Retención | Configurable |
|---|---|---|
| PostgreSQL `security_logs` | Sin TTL (manual) | Por organización |
| MongoDB `SecurityLog` | 365 días (TTL index) | Por organización vía `retention_days` |
| Redis (alertas activas) | 24h | Fijo |

> **Multi-tenancy:** El campo `retention_days` en la tabla `organizations` permite configurar la retención por tenant en la versión enterprise.
