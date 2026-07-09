# 02 — Reportes y Analíticas: Auditoría Completa

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## ESTADO GLOBAL DE REPORTES

| Sistema de reporte | Estado | Observación |
|--------------------|--------|------------|
| Exportación CSV (Audit Logs) | 🟢 FUNCIONAL | `GET /api/audit/export?format=csv` |
| Exportación CSV (Security Logs) | 🟢 FUNCIONAL | `GET /api/logs/export?format=csv` |
| Exportación JSON (Audit Logs) | 🟢 FUNCIONAL | `GET /api/audit/export?format=json` |
| Exportación PDF | 🔴 NO EXISTE | No hay endpoint ni librería de PDF |
| Exportación Excel | 🔴 NO EXISTE | No hay exportación XLSX |
| Dashboard Timeline Chart | 🔴 HARDCODEADO | 7 puntos fijos, no consulta BD |
| Dashboard Activity Chart | 🔴 HARDCODEADO | Array estático, no consulta BD |
| Dashboard Severity Chart | 🔴 HARDCODEADO | Array estático, no consulta BD |
| Metrics Timeline (backend) | 🟢 FUNCIONAL | Rango 24h/7d/30d con agrupaciones |
| AI Anomaly Stream | 🟢 FUNCIONAL | Serie temporal hourly real |
| AI Radar Chart | 🟢 FUNCIONAL | 6 dimensiones reales |
| Threat Intelligence Charts | 🔴 HARDCODEADO | MITRE y actores estáticos |
| Honeypot Timeline | 🔴 HARDCODEADO | 7 puntos fijos |
| Attack Map Stats | 🟢 FUNCIONAL | Agrupación real por país/tipo |
| Top Attackers | 🟢 FUNCIONAL | Query real + GeoIP |

---

## ANÁLISIS DE RANGOS TEMPORALES

### Backend — `GET /api/metrics/timeline`

```javascript
// metricsController.js
const RANGE_CONFIG = {
  '24h':  { start: now - 24h,  groupBy: '1 hour'  },
  '7d':   { start: now - 7d,   groupBy: '6 hours' },
  '30d':  { start: now - 30d,  groupBy: '1 day'   },
};
```

| Rango | Endpoint | Disponible | Timezone | Agrupación | Estado |
|-------|----------|-----------|----------|------------|--------|
| Últimas 24h | `/metrics/timeline?range=24h` | ✅ | Server TZ | 1 hora | 🟢 |
| Últimos 7 días | `/metrics/timeline?range=7d` | ✅ | Server TZ | 6 horas | 🟢 |
| Últimos 30 días | `/metrics/timeline?range=30d` | ✅ | Server TZ | 1 día | 🟢 |
| Hoy | No disponible | ❌ | — | — | 🔴 |
| Ayer | No disponible | ❌ | — | — | 🔴 |
| Últimos minutos | No disponible | ❌ | — | — | 🔴 |
| Últimos segundos | No disponible | ❌ | — | — | 🔴 |
| Rango personalizado | No disponible | ❌ | — | — | 🔴 |

**Problema de timezone:** Las queries usan `NOW()` del servidor PostgreSQL. Si el servidor está en UTC pero el usuario espera datos locales, los rangos pueden tener un offset. No hay parámetro `timezone` en los endpoints.

### Backend — `GET /api/logs`

```javascript
// logController.js — soporta filtros por fecha
const { startDate, endDate, severity, eventType, page } = req.query;
// WHERE created_at BETWEEN $startDate AND $endDate
```

✅ Soporta rango personalizado via `startDate` / `endDate`.  
❌ No expone "Hoy", "Ayer" como opciones de UI — el frontend no pasa estos parámetros.

### Backend — `GET /api/audit`

```javascript
// auditController.js
const { from, to, category, severity, page } = req.query;
// WHERE timestamp BETWEEN $from AND $to
```

✅ Soporta rango personalizado.  
❌ Sin rangos predefinidos en el frontend.

---

## CONSULTAS SQL — CORRECTITUD Y RENDIMIENTO

### Consultas en `metricsController.js`

```sql
-- getOverview: 5 queries en paralelo (Promise.all)
SELECT COUNT(*) FROM security_logs WHERE created_at > NOW() - INTERVAL '1 hour'
SELECT COUNT(*) FROM security_logs WHERE created_at > NOW() - INTERVAL '24 hours'
SELECT COUNT(*) FROM incidents WHERE status != 'resolved'
SELECT COUNT(*) FROM security_logs WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '24 hours'
-- + Redis GET para sessions activas

-- getTimeline: agrupación por hora/día
SELECT DATE_TRUNC($groupBy, created_at) AS bucket,
       COUNT(*) AS total,
       SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count
FROM security_logs
WHERE created_at >= $start
GROUP BY bucket ORDER BY bucket

-- getTopAttackers: top IPs + GeoIP enrichment
SELECT ip_address, COUNT(*) AS hit_count,
       MAX(created_at) AS last_seen
FROM security_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY hit_count DESC
LIMIT 10
```

**Estado:** ✅ Queries correctas y parametrizadas.  
**Riesgo de rendimiento:** `security_logs` sin particionamiento podría degradar en >100M rows. Los índices existentes (`idx_created DESC`, `idx_severity`) mitigan el riesgo a corto plazo.

### Consultas en `statsController.js`

```sql
-- 7 queries en paralelo:
SELECT COUNT(*) FROM security_logs                                    -- total
SELECT COUNT(*) WHERE severity = 'critical'                          -- críticos
SELECT COUNT(*) WHERE created_at > NOW() - INTERVAL '24 hours'       -- 24h
SELECT COUNT(*) WHERE created_at > NOW() - INTERVAL '1 hour'         -- 1h
SELECT severity, COUNT(*) GROUP BY severity                           -- distribución
SELECT event_type, COUNT(*) WHERE created_at > NOW() - INTERVAL '24h'  -- top types
SELECT ip_address, COUNT(*) GROUP BY ip_address ORDER BY count DESC LIMIT 10
```

**Estado:** ✅ Correcto. Sin Math.random(). Agrupaciones válidas.

### Consultas en `correlationEngine.js`

```sql
-- countRecentEvents: conta eventos por tipo en ventana de tiempo
SELECT COUNT(*) FROM security_logs
WHERE event_type LIKE $pattern
  AND ip_address = $ip
  AND created_at > NOW() - INTERVAL $window

-- Credential spray: usuarios distintos
SELECT COUNT(DISTINCT user_id) FROM security_logs
WHERE event_type = 'LOGIN_FAILURE'
  AND ip_address = $ip
  AND created_at > NOW() - INTERVAL '15 minutes'
```

**Estado:** ✅ Correcto.

---

## ANÁLISIS DE EXPORTACIONES

### CSV Export — Security Logs

```javascript
// logController.js
res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', 'attachment; filename="security-logs.csv"');
// Genera CSV con: id, event_type, severity, ip_address, country_code, created_at, metadata
```

**Estado:** ✅ Funcional.  
**Campos exportados:** id, event_type, severity, ip_address, country_code, created_at, metadata  
**Filtros respetados:** severity, eventType, startDate, endDate  
**Limitación:** Sin paginación en export — podría exportar millones de filas si no se filtra.

### CSV/JSON Export — Audit Logs

```javascript
// auditController.js
// Soporta format=csv y format=json
// Aplica filtros from/to/category/severity
```

**Estado:** ✅ Funcional.  
**Limitación:** Sin límite de filas en export.

### PDF Export

**Estado:** 🔴 NO EXISTE  
No hay librería de PDF (pdfkit, puppeteer, jspdf) en `backend/package.json`.  
No hay endpoint `/api/reports/pdf` o similar.  
El botón "Exportar PDF" en la UI (si existe) no funciona.

### Excel Export

**Estado:** 🔴 NO EXISTE  
No hay `xlsx`, `exceljs` o similar en las dependencias.

---

## GRÁFICAS — REAL VS HARDCODEADO

### Dashboard

| Gráfica | Componente | Datos | Estado | Corrección necesaria |
|---------|-----------|-------|--------|---------------------|
| Threat Timeline | LineChart | `threatData[]` hardcodeado | 🔴 FALSO | Conectar a `/metrics/timeline?range=7d` |
| Activity Breakdown | BarChart | `activityData[]` hardcodeado | 🔴 FALSO | Conectar a `/stats` → top event types |
| Severity Distribution | PieChart | `severityData[]` hardcodeado | 🔴 FALSO | Conectar a `/stats` → severity distribution |
| Live Metric Cards | SecurityMetricCard | `/api/stats` real | 🟢 REAL | — |

### AI Analysis

| Gráfica | Datos | Estado |
|---------|-------|--------|
| Risk Score Ring | `aiApi.getOverview()` | 🟢 REAL |
| Anomaly Line Chart | `aiApi.getAnomalyStream()` | 🟢 REAL |
| User Behavior Table | `aiApi.getUserBehavior()` | 🟢 REAL |
| Attack Radar | `aiApi.getRadar()` | 🟢 REAL |
| AI Recommendations | `aiApi.getRecommendations()` | 🟢 REAL |

### Threat Intelligence

| Gráfica | Datos | Estado |
|---------|-------|--------|
| MITRE ATT&CK Pie | `MITRE_TACTICS[]` hardcodeado | 🔴 FALSO |
| Threat Trend Line | `TREND_DATA[]` hardcodeado | 🔴 FALSO |
| Threat Actors Table | `THREAT_ACTORS[]` hardcodeado | 🔴 FALSO |
| IOC Table | `threatApi.getIndicators()` | 🟢 REAL |

### Honeypot

| Gráfica | Datos | Estado |
|---------|-------|--------|
| Attack Timeline | `attackTimeline[]` hardcodeado | 🔴 FALSO |
| Attack Types | `attackTypes[]` hardcodeado | 🔴 FALSO |
| Stats Cards | `honeypotApi.getStats()` | 🟢 REAL |
| Recent Events | `honeypotApi.getEvents()` | 🟢 REAL |

---

## KPIs — REAL VS SIMULADO

| KPI | Fuente real | Estado | Valor real disponible |
|-----|------------|--------|----------------------|
| Total Events | `/api/stats` | 🟢 REAL | ✅ |
| Critical Events | `/api/stats` | 🟢 REAL | ✅ |
| Events last 24h | `/api/stats` | 🟢 REAL | ✅ |
| Events last 1h | `/api/stats` | 🟢 REAL | ✅ |
| Active Incidents | `/api/metrics/overview` | 🟢 REAL | ✅ |
| Risk Score | `/api/ai/overview` | 🟢 REAL | ✅ |
| Top Attackers | `/api/metrics/top-attackers` | 🟢 REAL | ✅ |
| IPs Blocked | Aproximado (`unique_ips_24h`) | 🟡 APROX | ⚠️ No tabla explícita |
| Events by Severity (pie) | Hardcodeado en dashboard | 🔴 FALSO | ✅ disponible en `/api/stats` |
| Weekly threat trend | Hardcodeado en dashboard | 🔴 FALSO | ✅ disponible en `/metrics/timeline` |

---

## PROBLEMAS DE TIMEZONE

**Problema identificado:**

1. PostgreSQL usa `NOW()` del servidor (UTC por defecto en contenedor)
2. No hay parámetro `timezone` en ningún endpoint
3. El frontend no envía offset de timezone del usuario
4. Para usuarios en UTC-5, el "día de hoy" empieza 5h tarde

**Corrección recomendada:**

```javascript
// En las queries que agrupan por día:
SELECT DATE_TRUNC('day', created_at AT TIME ZONE $tz) AS bucket, ...
// Con parámetro req.query.timezone || 'UTC'
```

---

## RESUMEN DE ESTADO DE REPORTES

| Capacidad | Estado |
|-----------|--------|
| Export CSV | ✅ Funcional |
| Export JSON | ✅ Funcional |
| Export PDF | ❌ No existe |
| Export Excel | ❌ No existe |
| Filtros por fecha | ✅ Funcional en logs/audit |
| Rangos 24h/7d/30d | ✅ En métricas backend |
| Rango personalizado | ✅ En logs, ❌ no en métricas |
| Hoy/Ayer | ❌ No disponible |
| Últimos minutos/segundos | ❌ No disponible |
| Timezone awareness | ❌ No implementado |
| Gráficas reales en dashboard | ❌ 3/4 hardcodeadas |
| KPIs reales | ✅ La mayoría reales |
