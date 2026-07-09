# 04 — Auditoría PostgreSQL: Tablas, Relaciones e Índices

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## ESTADO DEL SCHEMA

### Archivo base: `db-sql/schema.sql`

El archivo `schema.sql` define **5 tablas base**. Las tablas adicionales requeridas por los servicios del backend están definidas en migraciones individuales en `db-sql/migrations/`.

**Problema identificado:** No existe un script unificado que aplique todas las migraciones en orden. Un desarrollador que ejecute solo `schema.sql` tendrá una base de datos incompleta que hará fallar ~12 servicios del backend.

---

## INVENTARIO COMPLETO DE TABLAS

### Tablas en `schema.sql` (Base)

---

#### Tabla: `users`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | SERIAL | PRIMARY KEY | ID autoincremental |
| `name` | VARCHAR(255) | NOT NULL | Nombre del usuario |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email (identificador único) |
| `password_hash` | TEXT | NOT NULL | Hash bcrypt (work factor 12) |
| `role` | VARCHAR(32) | DEFAULT 'viewer' | admin / analyst / responder / viewer |
| `mfa_enabled` | BOOLEAN | DEFAULT false | MFA activado |
| `active` | BOOLEAN | DEFAULT true | Cuenta activa |
| `last_login_at` | TIMESTAMP | — | Último login exitoso |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de registro |

**Índices:** `users_email_key` (unique)  
**Relaciones salientes:** Referenciada por devices, security_logs, mfa_codes, banned_ips, incidents, etc.  
**Estado:** ✅ Completa

---

#### Tabla: `devices`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | SERIAL | PRIMARY KEY | — |
| `user_id` | INT | FK → users(id) ON DELETE CASCADE | Propietario del dispositivo |
| `fingerprint_hash` | TEXT | NOT NULL | Hash del browser fingerprint |
| `name` | VARCHAR(255) | — | Nombre descriptivo del dispositivo |
| `trusted` | BOOLEAN | DEFAULT false | Dispositivo de confianza |
| `last_seen_at` | TIMESTAMP | — | Último acceso desde este dispositivo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Primer registro |

**Índices:** `(user_id, fingerprint_hash)` UNIQUE, `idx_devices_user`  
**Relaciones:** devices.user_id → users.id  
**Estado:** ✅ Completa

---

#### Tabla: `security_logs`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | ID grande para alto volumen |
| `user_id` | INT | FK → users(id) ON DELETE SET NULL | Usuario implicado (puede ser NULL) |
| `event_type` | VARCHAR(120) | NOT NULL | Tipo de evento (LOGIN_FAILURE, etc.) |
| `severity` | VARCHAR(32) | NOT NULL | critical/high/medium/low/info |
| `ip_address` | INET | — | IP de origen (tipo nativo PostgreSQL) |
| `country_code` | VARCHAR(10) | — | Código ISO de país |
| `metadata` | JSONB | — | Datos adicionales flexibles |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp del evento |

**Índices:**
- `idx_security_logs_created` → `created_at DESC`
- `idx_security_logs_severity` → `severity`
- `idx_security_logs_user` → `user_id`
- `idx_security_logs_ip` → `ip_address`

**Nota:** Esta tabla es el corazón del sistema. Todos los servicios de detección, correlación, métricas e IA leen de aquí.  
**Estado:** ✅ Completa

---

#### Tabla: `mfa_codes`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | — |
| `user_id` | INT | FK → users(id) ON DELETE CASCADE | Propietario del código |
| `code` | VARCHAR(10) | NOT NULL | Código OTP (6 dígitos) |
| `expires_at` | TIMESTAMP | NOT NULL | Expiración del código |
| `used` | BOOLEAN | DEFAULT false | Si ya fue usado |
| `created_at` | TIMESTAMP | DEFAULT NOW() | — |

**Índices:** `idx_mfa_user`  
**Estado:** ✅ Completa

---

#### Tabla: `banned_ips`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | SERIAL | PRIMARY KEY | — |
| `ip_address` | INET | NOT NULL, UNIQUE | IP baneada |
| `reason` | TEXT | — | Motivo del ban |
| `banned_by` | INT | FK → users(id) ON DELETE SET NULL | Admin que ejecutó el ban |
| `expires_at` | TIMESTAMP | — | NULL = permanente |
| `banned_at` | TIMESTAMP | DEFAULT NOW() | Fecha del ban |

**Índices:** `idx_banned_ip`  
**Estado:** ✅ Completa

---

### Tablas requeridas por el backend (en Migraciones)

Las siguientes tablas son utilizadas por controladores y servicios pero **no están en `schema.sql`**. Deben existir en archivos de migración en `db-sql/migrations/`.

| Tabla | Servicio que la usa | Estado |
|-------|---------------------|--------|
| `sessions` | sessionController.js | 🟡 En migración |
| `incidents` | incidentController.js, correlationEngine.js | 🟡 En migración |
| `incident_events` | incidentController.js (timeline) | 🟡 En migración |
| `alert_statuses` | alertController.js | 🟡 En migración |
| `vulnerabilities` | vulnerabilityController.js | 🟡 En migración |
| `endpoint_agents` | agentsController.js | 🟡 En migración |
| `endpoint_events` | agentsController.js | 🟡 En migración |
| `honeypot_events` | honeypotController.js | 🟡 En migración |
| `playbooks` | playbooksController.js, soarEngine.js | 🟡 En migración |
| `playbook_runs` | soarEngine.js (historial) | 🟡 En migración |
| `detection_rules` | detectionEngine.js | 🟡 En migración |
| `organizations` | organizationsController.js | 🟡 En migración |
| `organization_members` | organizationsController.js, tenantMiddleware | 🟡 En migración |

---

## ANÁLISIS DE RELACIONES (FOREIGN KEYS)

```
users (1) ──────────── (N) devices
users (1) ──────────── (N) security_logs (SET NULL on delete)
users (1) ──────────── (N) mfa_codes (CASCADE)
users (1) ──────────── (N) banned_ips (SET NULL on delete)

[Via Migraciones]
users (1) ──────────── (N) sessions
users (1) ──────────── (N) incidents (created_by)
incidents (1) ────────── (N) incident_events
organizations (1) ──── (N) organization_members
organizations (1) ──── (N) users (tenant isolation)
playbooks (1) ────────── (N) playbook_runs
```

---

## ANÁLISIS DE ÍNDICES Y RENDIMIENTO

### Índices existentes en `schema.sql`

| Índice | Tabla | Columnas | Tipo | Uso esperado |
|--------|-------|---------|------|-------------|
| `users_email_key` | users | email | UNIQUE | Login, registro |
| `idx_devices_user` | devices | user_id | B-tree | Listar dispositivos de usuario |
| `(user_id, fingerprint_hash)` | devices | — | UNIQUE | Evitar dispositivos duplicados |
| `idx_security_logs_created` | security_logs | created_at DESC | B-tree | Queries temporales (todas las queries) |
| `idx_security_logs_severity` | security_logs | severity | B-tree | Filtros por severidad |
| `idx_security_logs_user` | security_logs | user_id | B-tree | Logs por usuario |
| `idx_security_logs_ip` | security_logs | ip_address | B-tree | Queries por IP (correlación, baneos) |
| `idx_mfa_user` | mfa_codes | user_id | B-tree | Búsqueda de códigos activos |
| `idx_banned_ip` | banned_ips | ip_address | B-tree | Check de IP baneada (crítico en middleware) |

### Índices ausentes (recomendados)

| Tabla | Columna | Justificación |
|-------|---------|--------------|
| `security_logs` | `event_type` | `correlationEngine` hace LIKE queries por tipo de evento |
| `security_logs` | `(ip_address, created_at)` | Queries de correlación más eficientes |
| `security_logs` | `(severity, created_at)` | Dashboard KPIs usan este filtro frecuentemente |
| `incidents` | `status` | Dashboard muestra incidentes activos (frecuente) |
| `endpoint_agents` | `status` | Listado de agentes activos |

---

## RIESGOS DE RENDIMIENTO

### 1. `security_logs` sin particionamiento

**Riesgo:** A >50M filas, las queries de `metricsController.js` y `correlationEngine.js` sin particionamiento temporal pueden degradar significativamente.

**Consulta problemática de ejemplo:**
```sql
SELECT COUNT(*) FROM security_logs
WHERE event_type LIKE 'LOGIN_%'
  AND ip_address = '1.2.3.4'
  AND created_at > NOW() - INTERVAL '10 minutes'
```

Esta query usa `idx_security_logs_ip` pero luego filtra por `created_at` y `event_type` — puede ser lenta si hay millones de filas para esa IP.

**Recomendación:** Implementar particionamiento por rango de tiempo (pg_partman) para `security_logs` cuando el volumen supere ~10M filas.

### 2. Export sin límite

```javascript
// logController.js
// No tiene LIMIT en la query de export
const result = await query(
  `SELECT * FROM security_logs WHERE ${conditions}`,
  values
);
```

**Riesgo:** Un export sin filtros puede intentar serializar millones de filas, causando OOM o timeout.

### 3. Consultas `COUNT(*)` sin índice de cobertura

Las queries de `statsController.js` ejecutan 7 COUNT queries en paralelo. Son rápidas con pocos datos, pero escalan linealmente sin índices de cobertura parciales.

---

## TABLAS SIN USO (POTENCIAL)

| Tabla | Observación |
|-------|------------|
| `mfa_codes` | Solo se usa para email OTP. Si todos los usuarios usan TOTP (app), esta tabla está vacía. Sin embargo, el código de `authService` la usa activamente para email MFA. |

---

## REDUNDANCIAS DETECTADAS

### 1. Eventos de seguridad en dos almacenes

- `PostgreSQL.security_logs` → para búsqueda, correlación y análisis
- `MongoDB.security_logs` → para audit trail inmutable

Hay duplicación intencional (audit trail inmutable en MongoDB + analytics en PostgreSQL), pero esto debe estar documentado explícitamente y el equipo debe ser consciente de qué tabla usa cada servicio.

**Riesgo:** Un desarrollador podría escribir solo en MongoDB y un módulo esperaría datos en PostgreSQL (o viceversa).

---

## PROBLEMA CRÍTICO: SETUP INCOMPLETO

**Síntoma:** Un nuevo desarrollador que ejecute `psql -f schema.sql` tendrá 5 tablas. El backend requiere ~17 tablas.

**Corrección necesaria:** Crear un archivo `db-sql/init.sql` que:
1. Ejecute `schema.sql` (tablas base)
2. Ejecute todas las migraciones en orden
3. O bien, consolidar todo en un solo `schema.sql` actualizado

**Riesgo actual:** CI/CD que use solo `schema.sql` tendrá un backend parcialmente roto desde el inicio.

---

## RECOMENDACIONES

| Prioridad | Acción |
|-----------|--------|
| 🔴 CRÍTICA | Crear `db-sql/init.sql` que aplique schema.sql + todas las migraciones en orden |
| 🔴 CRÍTICA | Agregar LIMIT a queries de export para evitar OOM |
| 🟡 MEDIA | Agregar índice compuesto `(event_type, created_at)` en security_logs |
| 🟡 MEDIA | Agregar índice compuesto `(ip_address, created_at)` en security_logs |
| 🟡 MEDIA | Documentar explícitamente qué tabla usa cada servicio (PostgreSQL vs MongoDB) |
| 🟡 MEDIA | Planificar particionamiento de security_logs para producción |
| 🟢 BAJA | Agregar índice en `incidents.status` |
| 🟢 BAJA | Considerar pg_partman para security_logs a largo plazo |
