# 03 — Auditoría MongoDB: Colecciones, Modelos y Estado

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## INVENTARIO DE MODELOS MONGOOSE

### Modelo 1: `SecurityLog` (Audit Trail)

**Archivo:** `db-nosql/models/SecurityLog.js`  
**Colección:** `security_logs`  
**Propósito:** Audit trail inmutable de eventos de seguridad con soporte MITRE ATT&CK

#### Esquema Completo

| Campo | Tipo | Opciones | Descripción |
|-------|------|----------|-------------|
| `category` | String | required, indexed, enum | AUTH, ACCESS, DATA, SYSTEM, THREAT, ADMIN, HONEYPOT |
| `action` | String | required, indexed | Acción específica (ej: LOGIN_SUCCESS) |
| `severity` | String | required, indexed, enum | INFO, LOW, MEDIUM, HIGH, CRITICAL |
| `userId` | String | indexed | ID del usuario que generó el evento |
| `userEmail` | String | — | Email del usuario |
| `ipAddress` | String | indexed | IP de origen |
| `countryCode` | String | — | Código de país (GeoIP) |
| `userAgent` | String | — | User agent del cliente |
| `requestId` | String | — | ID único de request (trazabilidad) |
| `sessionId` | String | — | ID de sesión activa |
| `endpoint` | String | — | Endpoint HTTP accedido |
| `method` | String | — | Método HTTP (GET/POST/etc) |
| `statusCode` | Number | — | Código de respuesta HTTP |
| `mitreTactic` | String | — | MITRE ATT&CK Tactic (ej: TA0001) |
| `mitreTechnique` | String | — | MITRE ATT&CK Technique (ej: T1078) |
| `ioc` | String | — | Indicador de compromiso relacionado |
| `metadata` | Mixed | — | Datos adicionales en formato libre |
| `immutable` | Boolean | default: false | Si true, lock de 30 días |
| `timestamp` | Date | auto | Fecha de creación (solo createdAt) |

#### Índices

| Índice | Tipo | Propósito |
|--------|------|-----------|
| `(severity, timestamp)` | Compound | Búsqueda por criticidad con orden temporal |
| `(category, timestamp)` | Compound | Filtro por categoría |
| `(ipAddress, timestamp)` | Compound | Investigación por IP |
| `(userId, timestamp)` | Compound | Auditoría por usuario |
| `(action, timestamp)` | Compound | Búsqueda por tipo de acción |
| `timestamp` TTL | TTL Index | Expiración automática a 365 días |

#### Consumidores

- `backend/src/services/auditService.js` → escritura (todos los módulos escriben aquí)
- `backend/src/controllers/auditController.js` → lectura con filtros
- `backend/src/routes/audit.js` → 4 endpoints: list, stats, export, stream

---

### Modelo 2: `ThreatIndicator` (IOC / Threat Intelligence)

**Archivo:** `db-nosql/models/ThreatIndicator.js`  
**Colección:** `threat_indicators`  
**Propósito:** Base de datos de IOCs (Indicators of Compromise) con tracking de confianza

#### Esquema Completo

| Campo | Tipo | Opciones | Descripción |
|-------|------|----------|-------------|
| `type` | String | required, indexed, enum | IP, DOMAIN, HASH_MD5, HASH_SHA256, URL, EMAIL, CVE, USER_AGENT |
| `value` | String | required, indexed | El valor del indicador (IP, hash, dominio, etc.) |
| `confidence` | Number | 0-100, default:50 | Nivel de confianza del indicador |
| `severity` | String | enum, default:'MEDIUM' | LOW, MEDIUM, HIGH, CRITICAL |
| `source` | String | default:'internal' | honeypot, virustotal, manual, feed |
| `description` | String | — | Descripción del indicador |
| `tags` | [String] | — | Etiquetas de clasificación |
| `firstSeen` | Date | default:now | Primera vez observado |
| `lastSeen` | Date | default:now | Última vez observado |
| `hitCount` | Number | default:0 | Veces que se ha visto en logs |
| `active` | Boolean | indexed, default:true | Si el indicador está activo |
| `mitreTactic` | String | — | Táctica MITRE ATT&CK |
| `mitreTechnique` | String | — | Técnica MITRE ATT&CK |
| `country` | String | — | País de origen (solo IPs) |
| `asn` | String | — | ASN (solo IPs) |
| `addedBy` | String | — | Quién agregó el indicador |
| `reviewedBy` | String | — | Quién revisó el indicador |
| `reviewedAt` | Date | — | Fecha de revisión |

#### Índices

| Índice | Tipo | Propósito |
|--------|------|-----------|
| `(value, type)` | Unique Compound | Evita duplicados del mismo IOC |
| `(severity, lastSeen)` | Compound | Búsqueda por criticidad reciente |
| `(active, severity)` | Compound | Indicadores activos por severidad |

#### Consumidores

- `backend/src/controllers/threatController.js` → CRUD completo
- `backend/src/services/ingestionPipeline.js` → correlación durante ingesta
- `backend/src/services/elasticsearchService.js` → indexación para búsqueda
- `backend/src/routes/threats.js` → 5 endpoints: list, stats, feeds, heatmap, report

---

### MODELO DUPLICADO — PROBLEMA CRÍTICO

**Archivo conflictivo:** `db-nosql/security-log.model.js`  
**Colección:** `security_logs` ← **MISMA COLECCIÓN** que `db-nosql/models/SecurityLog.js`

#### Esquema Simplificado (conflictivo)

| Campo | Tipo | Diferencia |
|-------|------|-----------|
| `userId` | Number | El modelo completo usa String |
| `eventType` | String | El modelo completo usa `action` |
| `severity` | String | enum: critical/warning/info (vs INFO/LOW/MEDIUM/HIGH/CRITICAL) |
| `ipAddress` | String | Igual |
| `countryCode` | String | Igual |
| `userEmail` | String | Igual |
| `metadata` | Mixed | Igual |

**Diferencias críticas:**

| Aspecto | `models/SecurityLog.js` | `security-log.model.js` | Problema |
|---------|------------------------|------------------------|---------|
| TTL | 365 días | 90 días | Conflicto de índices TTL en MongoDB |
| Enum severity | INFO/LOW/MEDIUM/HIGH/CRITICAL | critical/warning/info | Datos incompatibles |
| Campo action | `action` | `eventType` | Distintos nombres, misma semántica |
| userId type | String | Number | Cast automático puede fallar |
| MITRE fields | Sí | No | Pérdida de datos |

**Riesgo:** Si ambos modelos se usan en el mismo proceso, MongoDB puede tener índices TTL en conflicto sobre la misma colección. El comportamiento es indefinido — MongoDB aplica el índice del primer modelo que registre el esquema.

**Recomendación:** Eliminar `db-nosql/security-log.model.js` y usar exclusivamente `db-nosql/models/SecurityLog.js`.

---

## COLECCIONES ESPERADAS VS EXISTENTES

| Colección MongoDB | Modelo existente | Usada activamente | Estado |
|-------------------|-----------------|-------------------|--------|
| `security_logs` | ✅ (2 modelos!) | ✅ auditService | 🔴 Duplicado |
| `threat_indicators` | ✅ ThreatIndicator | ✅ threatController | 🟢 OK |
| `endpoint_agent_telemetry` | ❓ Mencionado en memoria | ❓ No encontrado en exploración | 🟡 VERIFICAR |

**Colecciones ausentes pero esperadas:**

El backend memory indica `endpoint_agent_telemetry` como colección MongoDB. No se encontró un modelo Mongoose explícito para ella. Puede ser que se use MongoDB nativo (driver directo) o que sea una referencia incompleta.

---

## ANÁLISIS DE ÍNDICES

### Índices de `security_logs`

**Índices del modelo completo (`SecurityLog.js`):**
```javascript
SecurityLogSchema.index({ severity: 1, timestamp: -1 });
SecurityLogSchema.index({ category: 1, timestamp: -1 });
SecurityLogSchema.index({ ipAddress: 1, timestamp: -1 });
SecurityLogSchema.index({ userId: 1, timestamp: -1 });
SecurityLogSchema.index({ action: 1, timestamp: -1 });
SecurityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 }); // TTL
```

**Índices del modelo duplicado (`security-log.model.js`):**
```javascript
SecurityLogSchema.index({ severity: 1, createdAt: -1 });
SecurityLogSchema.index({ ipAddress: 1, createdAt: -1 });
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // TTL 90 días
```

**Problema:** Dos TTL indexes diferentes sobre la misma colección. MongoDB solo permite UN TTL index por colección por campo. Si ambos modelos intentan registrar sus TTL, el comportamiento es indefinido.

---

## DATOS REALES VS VACÍOS

### En un entorno fresco (sin datos)

| Colección | Estado esperado sin datos | Comportamiento de la UI |
|-----------|--------------------------|------------------------|
| `security_logs` | Vacía | Audit logs muestra DEMO_LOGS (fallback silencioso) |
| `threat_indicators` | Vacía | Threat Intelligence muestra INDICATORS[] (fallback silencioso) |

### Población de datos de ejemplo

No existe ningún script de seed para MongoDB en el proyecto. En un entorno de desarrollo limpio:
- Los módulos que dependen de MongoDB mostrarán datos de ejemplo hardcodeados del frontend
- No hay manera de saber visualmente si estás viendo datos reales o demo

---

## RELACIONES ENTRE COLECCIONES Y POSTGRESQL

| Relación | Descripción | Estado |
|----------|-------------|--------|
| `security_logs.userId` → `users.id` | Relación lógica (no enforced por MongoDB) | Sin FK, solo por convención |
| `threat_indicators.addedBy` → `users.id` | Relación lógica | Sin FK |
| `security_logs.sessionId` → Redis sessions | Referencia a Redis | Informal |
| `threat_indicators` → `security_logs` | IOC matching durante ingesta | Via código, no BD |

---

## DATOS HUÉRFANOS Y DUPLICADOS

### Riesgo de datos huérfanos

1. `security_logs.userId` puede referenciar un user eliminado de PostgreSQL — MongoDB no tiene FK
2. Los documentos con `immutable: true` no pueden ser borrados por TTL, pero el usuario puede haber sido eliminado de PostgreSQL
3. `threat_indicators` con `addedBy` referenciando users eliminados

### Riesgo de datos duplicados

1. La ingesta sin deduplicación puede crear múltiples `ThreatIndicator` con el mismo valor si el índice unique `(value, type)` falla (por ej: value case sensitivity)
2. La ingesta batch no tiene transacciones — si falla parcialmente, puede haber eventos duplicados

---

## RECOMENDACIONES

| Prioridad | Acción |
|-----------|--------|
| 🔴 CRÍTICA | Eliminar `db-nosql/security-log.model.js` — modelo duplicado con TTL conflictivo |
| 🔴 CRÍTICA | Unificar todos los usos a `db-nosql/models/SecurityLog.js` |
| 🟡 MEDIA | Verificar si `endpoint_agent_telemetry` tiene modelo o se usa con driver nativo |
| 🟡 MEDIA | Agregar script de seed con datos de ejemplo para desarrollo |
| 🟡 MEDIA | Implementar límite de filas en exportaciones de audit logs |
| 🟢 BAJA | Documentar el ciclo de vida de datos (TTL, archivado, retención) |
| 🟢 BAJA | Considerar archivado a cold storage para `security_logs` >365 días |
