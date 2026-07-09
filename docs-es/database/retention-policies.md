# Base de Datos — Políticas de Retención

---

## Resumen

| Almacén | Datos | TTL Default | Configurable |
|---|---|---|---|
| PostgreSQL `security_logs` | Logs de seguridad | Sin TTL | Por organización (manual) |
| MongoDB `security_logs` | Audit trail extendido | 365 días | Por organización |
| MongoDB `threat_indicators` | IOCs | Sin TTL | Manual |
| Redis `jwt:blacklist` | Tokens invalidados | Hasta expiración del JWT | No |
| Redis `mfa:<userId>` | Códigos OTP | 5 minutos | No |
| Redis `ban:<ip>` | IPs baneadas | 24h (por defecto) | Por ban |
| Redis `ratelimit:*` | Rate limiting | 1 minuto | No |

---

## PostgreSQL — Política de Retención

### `security_logs`

PostgreSQL no tiene TTL nativo. La gestión de retención se hace mediante:

**Purge manual (recomendado en producción):**
```sql
-- Eliminar logs más antiguos de 90 días
DELETE FROM security_logs
WHERE created_at < NOW() - INTERVAL '90 days'
AND organization_id = 1;
```

**Particionamiento por tiempo (para producción a escala):**
```sql
-- Crear tabla particionada por mes
CREATE TABLE security_logs_y2026m06
PARTITION OF security_logs
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- El purge elimina particiones completas (más eficiente)
DROP TABLE security_logs_y2026m05;
```

### Otras Tablas PostgreSQL

| Tabla | Retención | Acción |
|---|---|---|
| `sessions` | Activas hasta revocación | Purge de sesiones revocadas > 30 días |
| `refresh_tokens` | Hasta expiración | Purge de tokens expirados/revocados > 30 días |
| `mfa_codes` | TTL 5 min (gestión app) | Purge automático por job |
| `banned_ips` | Hasta `expires_at` | Job periódico |

**Job de limpieza (recomendado — ejecutar diariamente):**
```sql
-- Sessions inactivas y revocadas
DELETE FROM sessions
WHERE revoked = TRUE AND revoked_at < NOW() - INTERVAL '30 days';

-- Refresh tokens expirados
DELETE FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';

-- MFA codes usados o expirados
DELETE FROM mfa_codes
WHERE used = TRUE OR expires_at < NOW();

-- IPs baneadas con expiración pasada
DELETE FROM banned_ips
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```

---

## MongoDB — Política de Retención

### TTL Index en `security_logs`

```javascript
// SecurityLog.js — TTL automático
SecurityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000 }  // 365 días
);
```

MongoDB ejecuta el recolector TTL cada 60 segundos (por defecto). Los documentos expirados se eliminan automáticamente.

### Configurar Retención por Organización

La retención configurable por tenant requiere lógica personalizada (el TTL index es global):

**Opción 1 — Campo personalizado + TTL por documento:**
```javascript
// Añadir campo deleteAt a cada documento al crearlo
const retention = organization.retention_days || 365;
const deleteAt = new Date(Date.now() + retention * 86400000);

await SecurityLog.create({
  ...data,
  deleteAt  // TTL calculado per-document
});

// Índice TTL sobre deleteAt en lugar de createdAt
SecurityLogSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
```

**Opción 2 — Colecciones separadas por tenant (escala enterprise):**
```
security_logs_org_1
security_logs_org_2
```

### Modificar TTL Existente

```javascript
// En MongoDB shell — cambiar TTL del índice
db.security_logs.dropIndex("createdAt_1");
db.security_logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 86400 }  // 90 días
);
```

---

## Retención por Plan

| Plan | PostgreSQL Logs | MongoDB Logs | IOCs |
|---|---|---|---|
| `trial` | 30 días | 30 días | 30 días |
| `starter` | 90 días | 90 días | 1 año |
| `professional` | 365 días | 365 días | Sin límite |
| `enterprise` | Configurable | Configurable | Sin límite |

---

## Compliance y Regulaciones

| Estándar | Requisito de Retención | Acción |
|---|---|---|
| **GDPR** | Mínimo necesario + derecho al olvido | Purge de datos de usuarios eliminados |
| **SOC 2** | 1 año mínimo | `retention_days >= 365` |
| **ISO 27001** | 3 años recomendado | `retention_days >= 1095` |
| **PCI DSS** | 1 año logs de actividad | `retention_days >= 365` |
| **HIPAA** | 6 años logs de auditoría | `retention_days >= 2190` |
| **NIS2** | Según análisis de riesgo | Mínimo 1 año |

### GDPR — Derecho al Olvido

Cuando se elimina un usuario, los logs de seguridad se anonimizan (no eliminan):

```sql
-- Anonimizar logs del usuario eliminado (no DELETE)
UPDATE security_logs SET user_id = NULL WHERE user_id = 42;
-- Los logs de seguridad se preservan para investigación forense
-- pero desvinculados del usuario eliminado
```

---

## Backup y Archivado

Ver guía completa: [docs-es/operations/07-backup-guide.md](../operations/07-backup-guide.md)

### Frecuencia Recomendada

| Almacén | Backup | Retención Backup |
|---|---|---|
| PostgreSQL | Diario (full) + WAL continuo | 30 días |
| MongoDB | Diario (mongodump) | 30 días |
| Redis | No aplica (datos efímeros) | — |

### Archivado a Largo Plazo

Para compliance de larga duración, exportar logs antes del TTL:

```bash
# Exportar logs de MongoDB antes de expiración
mongoexport \
  --uri="mongodb://admin:password@localhost/robengate" \
  --collection=security_logs \
  --query='{"createdAt": {"$gte": {"$date": "2025-06-01T00:00:00Z"}}}' \
  --out=archive_2025_Q2.json

# Comprimir y mover a almacenamiento frío (S3, GCS, etc.)
gzip archive_2025_Q2.json
aws s3 cp archive_2025_Q2.json.gz s3://my-bucket/robengate-archives/
```
