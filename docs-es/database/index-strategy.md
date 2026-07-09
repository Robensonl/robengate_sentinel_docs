# Base de Datos — Estrategia de Índices

---

## PostgreSQL — Índices

### `users`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `users_email_key` | `email` | UNIQUE | Login lookup |
| `idx_users_org` | `organization_id` | INDEX | Multi-tenancy filter |
| `idx_users_role` | `role` | INDEX | RBAC queries |

### `devices`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `devices_user_id_fingerprint_hash_key` | `(user_id, fingerprint_hash)` | UNIQUE | Prevent duplicates |
| `idx_devices_user` | `user_id` | INDEX | Load user devices |

### `sessions`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `sessions_session_token_key` | `session_token` | UNIQUE | Token validation |
| `idx_sessions_user_id` | `user_id` | INDEX | Load user sessions |
| `idx_sessions_last_active` | `last_active` | INDEX | Session timeout queries |
| `idx_sessions_revoked` | `revoked` | PARTIAL (WHERE revoked=false) | Active sessions only |

### `refresh_tokens`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `refresh_tokens_jti_key` | `jti` | UNIQUE | JWT JTI lookup |
| `idx_rt_jti` | `jti` | INDEX | Blacklist check |
| `idx_rt_user` | `user_id` | INDEX | User token history |
| `idx_rt_revoked` | `revoked` | PARTIAL (WHERE revoked=false) | Active tokens |

### `security_logs`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `idx_security_logs_created` | `created_at DESC` | INDEX | Latest events |
| `idx_security_logs_severity` | `severity` | INDEX | Severity filter |
| `idx_security_logs_user` | `user_id` | INDEX | User activity |
| `idx_security_logs_ip` | `ip_address` | INDEX | IP investigation |
| `idx_security_logs_org` | `organization_id` | INDEX | Multi-tenancy |

### `incidents`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `idx_incidents_status` | `status` | INDEX | Open incidents |
| `idx_incidents_severity` | `severity` | INDEX | Critical filter |
| `idx_incidents_created` | `created_at DESC` | INDEX | Recent incidents |
| `idx_incidents_org` | `organization_id` | INDEX | Multi-tenancy |

### `vulnerabilities`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `idx_vulns_severity` | `severity` | INDEX | Critical vulns |
| `idx_vulns_status` | `status` | INDEX | Open vulns |
| `idx_vulns_cve` | `cve_id` | INDEX | CVE lookup |
| `idx_vulns_org` | `organization_id` | INDEX | Multi-tenancy |

### `organizations`

| Índice | Campos | Tipo | Propósito |
|---|---|---|---|
| `idx_orgs_slug` | `slug` | INDEX | Subdomain routing |
| `idx_orgs_status` | `status` | INDEX | Active orgs |

---

## MongoDB — Índices

### `security_logs`

```javascript
// Compound indexes para queries de SIEM
{ severity: 1, createdAt: -1 }       // Alertas por severidad más recientes
{ category: 1, createdAt: -1 }       // Eventos por categoría
{ ipAddress: 1, createdAt: -1 }      // Investigación de IP
{ userId: 1, createdAt: -1 }         // Actividad de usuario
{ action: 1, createdAt: -1 }         // Tipo de evento

// TTL
{ createdAt: 1 }  expireAfterSeconds: 31536000  // Auto-purge 365 días
```

### `threat_indicators`

```javascript
// Unicidad
{ value: 1, type: 1 }  unique: true   // Prevenir IOC duplicados

// Queries frecuentes
{ severity: 1, lastSeen: -1 }         // IOCs activos más recientes
{ active: 1, severity: 1 }            // IOCs activos por severidad
```

---

## Redis — Estructura de Claves

### Patrones de Claves

```
jwt:blacklist:<jti>          String    TTL=token_expiry     JWTs invalidados
mfa:<userId>                 String    TTL=300              OTP email
ban:<ip>                     String    TTL=ban_duration     IPs baneadas
ratelimit:<ip>:<route>       Sorted Set TTL=60             Rate limiting
session:<sessionId>          Hash      TTL=604800          Datos de sesión (7d)
totp_challenge:<userId>      String    TTL=300             Challenge TOTP
```

---

## Análisis de Queries Críticas

### Query 1: Obtener alertas recientes (más frecuente)

```sql
-- PostgreSQL
SELECT sl.*, COALESCE(ast.status, 'new') as alert_status
FROM security_logs sl
LEFT JOIN alert_statuses ast ON sl.id = ast.log_id
WHERE sl.severity IN ('high', 'critical')
  AND sl.organization_id = $1
  AND sl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY sl.created_at DESC
LIMIT 25;

-- Índices usados: idx_security_logs_severity, idx_security_logs_org, idx_security_logs_created
-- Estimated cost: LOW (compound partial scan)
```

### Query 2: IOC lookup en tiempo real (por evento)

```javascript
// MongoDB - ejecutado en enricher.js para cada evento
ThreatIndicator.findOne({
  value: ipAddress,
  type: 'IP',
  active: true
});
// Índice usado: { value: 1, type: 1 } UNIQUE
// Estimated latency: < 2ms
```

### Query 3: Dashboard stats (moderada frecuencia)

```sql
-- Agregación de severidades en las últimas 24h
SELECT severity, COUNT(*) as count
FROM security_logs
WHERE organization_id = $1
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY severity;

-- Índices: idx_security_logs_org + idx_security_logs_created
-- Para producción a escala: considerar materialized view actualizada cada 5min
```

### Query 4: Sesiones activas de usuario

```sql
SELECT * FROM sessions
WHERE user_id = $1
  AND revoked = FALSE
ORDER BY last_active DESC;

-- Índices: idx_sessions_user_id + idx_sessions_revoked (partial)
-- Muy eficiente gracias al partial index
```

---

## Recomendaciones de Optimización

### Para Producción a Escala

1. **Particionamiento de `security_logs`** por mes (cuando supere 10M rows):
```sql
-- Convertir a tabla particionada
ALTER TABLE security_logs RENAME TO security_logs_old;
CREATE TABLE security_logs (LIKE security_logs_old INCLUDING ALL)
PARTITION BY RANGE (created_at);
```

2. **Materialized Views** para el dashboard (evitar aggregations en tiempo real):
```sql
CREATE MATERIALIZED VIEW dashboard_stats_hourly AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  severity,
  organization_id,
  COUNT(*) as count
FROM security_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY 1, 2, 3;

-- Refresh cada 5 minutos
CREATE UNIQUE INDEX ON dashboard_stats_hourly(hour, severity, organization_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_hourly;
```

3. **MongoDB Compound Index** para queries de threat hunting:
```javascript
// Añadir si se observan queries lentas
SecurityLogSchema.index({ ipAddress: 1, severity: 1, createdAt: -1 });
```

4. **Connection Pooling** correctamente configurado (ya implementado):
```javascript
const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 });
```
