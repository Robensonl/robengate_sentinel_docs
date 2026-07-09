# API — Audit Logs

**Base URL:** `/api/audit`  
**Auth mínima:** `analyst`  
**Almacenamiento:** MongoDB `audit_events` (inmutable)  

---

## Descripción General

El sistema de auditoría registra todas las acciones relevantes realizadas por usuarios y el sistema. Los audit logs son **completamente inmutables** — nunca se modifican ni eliminan (excepto por TTL configurado).

> **Diferencia con Security Logs:** Los security logs registran **eventos de seguridad** (ataques, login attempts). Los audit logs registran **acciones de usuarios** (quién hizo qué, cuándo, desde dónde).

---

## Endpoints

### GET /api/audit

**Descripción:** Lista los eventos de auditoría.  
**Auth:** `analyst+`

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página |
| `limit` | number | Por página (default: 50) |
| `category` | string | `AUTH\|ACCESS\|DATA\|SYSTEM\|ADMIN\|HONEYPOT` |
| `severity` | string | `INFO\|LOW\|MEDIUM\|HIGH\|CRITICAL` |
| `userId` | string | Filtrar por ID de usuario |
| `from` | ISO8601 | Desde fecha |
| `to` | ISO8601 | Hasta fecha |

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "60d5f5b8c9e4a12345678901",
        "category": "ADMIN",
        "action": "USER_ROLE_CHANGED",
        "severity": "HIGH",
        "userId": "1",
        "userEmail": "admin@empresa.com",
        "ipAddress": "91.189.122.10",
        "countryCode": "ES",
        "endpoint": "/api/users/42/role",
        "method": "PATCH",
        "statusCode": 200,
        "metadata": {
          "targetUserId": 42,
          "oldRole": "viewer",
          "newRole": "analyst",
          "reason": "Promotion to security team"
        },
        "createdAt": "2026-06-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 24890
    }
  }
}
```

---

### GET /api/audit/stats

**Descripción:** Estadísticas de los eventos de auditoría.  
**Auth:** `analyst+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "total_events": 24890,
    "events_24h": 1247,
    "by_category": {
      "AUTH": 8923,
      "ACCESS": 7234,
      "DATA": 4521,
      "ADMIN": 892,
      "SYSTEM": 2341,
      "HONEYPOT": 979
    },
    "by_severity": {
      "CRITICAL": 23,
      "HIGH": 156,
      "MEDIUM": 892,
      "LOW": 4521,
      "INFO": 19298
    },
    "top_actors": [
      {"email": "admin@empresa.com", "actions": 892},
      {"email": "ana@empresa.com", "actions": 534}
    ]
  }
}
```

---

### GET /api/audit/export

**Descripción:** Exporta los eventos de auditoría en formato JSON o CSV.  
**Auth:** `analyst+`

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `format` | string | `json\|csv` (default: json) |
| `from` | ISO8601 | Desde fecha (requerido) |
| `to` | ISO8601 | Hasta fecha (requerido) |
| `category` | string | Filtrar por categoría |

#### Respuesta 200 (JSON)

```json
{
  "success": true,
  "data": {
    "events": [...],
    "exported_at": "2026-06-01T15:00:00Z",
    "total": 1247,
    "period": {
      "from": "2026-06-01T00:00:00Z",
      "to": "2026-06-01T23:59:59Z"
    }
  }
}
```

---

### POST /api/audit/access-denied

**Descripción:** Registra manualmente un evento de acceso denegado.  
**Auth:** Interno (llamado por middleware authorize)  

> ℹ️ Este endpoint es llamado automáticamente por el middleware cuando un usuario intenta acceder a un recurso para el que no tiene permisos. No se llama manualmente.

---

## Categorías de Audit

| Categoría | Descripción | Ejemplos |
|---|---|---|
| `AUTH` | Autenticación y sesiones | Login, logout, MFA, token refresh |
| `ACCESS` | Control de acceso | RBAC denials, permission checks |
| `DATA` | Operaciones sobre datos | Create/update/delete incidentes, IOCs |
| `SYSTEM` | Eventos del sistema | Service start/stop, config changes |
| `ADMIN` | Acciones administrativas | Cambio de roles, bloqueo de cuentas, ban de IPs |
| `HONEYPOT` | Eventos del honeypot | Capturas SSH/HTTP, auto-ban |

---

## Eventos de Alta Severidad (Siempre Auditados)

Los siguientes eventos siempre generan entrada de audit con severity HIGH o CRITICAL:

| Acción | Categoría | Severity |
|---|---|---|
| Cambio de rol de usuario | ADMIN | HIGH |
| Bloqueo de cuenta | ADMIN | HIGH |
| Eliminación de usuario | ADMIN | CRITICAL |
| Ban manual de IP | ADMIN | HIGH |
| Exportación masiva de datos | DATA | HIGH |
| Configuración de TOTP | AUTH | MEDIUM |
| Acceso denegado por RBAC | ACCESS | MEDIUM |
| Login MFA bypass con backup code | AUTH | HIGH |

---

## Inmutabilidad del Audit Trail

El sistema garantiza la inmutabilidad mediante:

1. **MongoDB schema** — El esquema `SecurityLog` no tiene métodos update/delete
2. **`auditService.js`** — Solo expone método `log()`, nunca `update()` o `delete()`  
3. **TTL automático** — Los logs expiran por TTL (configurable por organización), nunca se borran manualmente
4. **Permisos** — No existe endpoint para modificar o eliminar audit events

```javascript
// auditService.js — solo escritura
async log({ category, action, severity, userId, metadata }) {
  return SecurityLog.create({
    category,
    action,
    severity,
    userId,
    // ... otros campos
  });
}
// No existe auditService.update() ni auditService.delete()
```

---

## Compliance y Retención

| Estándar | Retención Mínima | Configuración |
|---|---|---|
| GDPR | 1 año | `retention_days: 365` en organizations |
| SOC 2 | 1 año | `retention_days: 365` |
| ISO 27001 | 3 años (recomendado) | `retention_days: 1095` |
| PCI DSS | 1 año | `retention_days: 365` |

La retención se configura por organización en:
```sql
UPDATE organizations SET retention_days = 1095 WHERE id = 1;
```
