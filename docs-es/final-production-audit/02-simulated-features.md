# Features Simuladas — Inventario Exhaustivo

**Auditoría:** 2026-06-06  
**Criterio:** Feature simulada = el usuario ve datos que no provienen de eventos reales del sistema  

---

## SIMULACIÓN 1: Attack Map — 100% Ficticias por Defecto

**Archivo:** `frontend/src/shared/services/attackSimulator.js` + `realTimeService.js`

**Lo que pasa exactamente:**

1. `realTimeService.start()` intenta abrir SSE a `/api/events`
2. Si no hay token → va directo a `_startMock()` (el simulador)
3. Si hay token pero SSE falla en 5s → va a `_startMock()`
4. Si SSE conecta → `_startLocalAnimators()` **SIGUE CORRIENDO EN PARALELO**

**En `_startMock()`, cada 1.5s se genera:**
```javascript
const attack = generateAttackEvent();
// IP: "185.220.101." + randInt(1,255)  ← INVENTADA
// País: rnd(COUNTRIES)                 ← ALEATORIO de una lista hardcodeada
// Tipo: rnd(ATTACK_TYPES)              ← ALEATORIO
// payload: rnd(payloads[type])         ← HARDCODEADO
// blocked: Math.random() > 0.08       ← SIEMPRE ~92% bloqueado (inventado)
```

**En `_startLocalAnimators()` (corre SIEMPRE incluso con SSE real):**
```javascript
// Anomaly score — cada 2 segundos
this._anomalyScore = generateAnomalyScore(this._anomalyScore); // ← RANDOM WALK

// Active sessions — cada 10 segundos
this._metrics.activeSessions += Math.round((Math.random() - 0.45) * 8); // ← INVENTADO
```

**Valor inicial hardcodeado:**
```javascript
this._metrics = {
  totalAttacks:  8742,    // ← NO ES UN CONTEO REAL
  blocked:       8634,    // ← NO ES UN CONTEO REAL
  activeSessions: 342,    // ← NO ES UN CONTEO REAL
  criticalAlerts: 3,      // ← NO ES UN CONTEO REAL
  uptime:        99.99,   // ← NUNCA CALCULADO REALMENTE
};
```

**Impacto visual:** El attack map muestra arcos de ataques volando entre países en tiempo real. El 100% de estos arcos son generados aleatoriamente, incluyendo las IPs, países de origen, tipos de ataque, payloads mostrados, y contadores.

---

## SIMULACIÓN 2: Anomaly Score en Tiempo Real — Generado Localmente

**Archivo:** `realTimeService.js` → `_startLocalAnimators()`

```javascript
// Cada 2 segundos, el gráfico de anomalías del dashboard se actualiza con:
this._anomalyScore = generateAnomalyScore(this._anomalyScore);
```

**En `attackSimulator.js`:**
```javascript
export function generateAnomalyScore(current = 25) {
  const delta = (Math.random() - 0.45) * 8;  // ← RANDOM WALK
  return Math.max(0, Math.min(100, Math.round(current + delta)));
}
```

**Esto ocurre incluso cuando el usuario está autenticado y el SSE está conectado.**  
El Risk Score del overview (`GET /api/ai/overview`) ES real (calcula de la BD). El gráfico de línea que se actualiza cada 2 segundos es completamente inventado.

---

## SIMULACIÓN 3: Métricas del Dashboard — Cambios Porcentuales Hardcodeados

**Archivo:** `frontend/src/features/dashboard/pages/Dashboard.jsx`

```jsx
<SecurityMetricCard
  title="Amenazas Bloqueadas"
  change="+8% de incremento"    // ← HARDCODEADO, nunca calculado
  ...
/>
<SecurityMetricCard
  title="Amenazas Activas"
  change="-12% respecto a ayer" // ← HARDCODEADO, nunca calculado
  ...
/>
<SecurityMetricCard
  title="Sesiones Activas"
  change="+24 en línea"         // ← HARDCODEADO, nunca calculado
  ...
/>
```

**También en el gráfico de actividad:**
```javascript
// Fallback estático cuando no hay datos reales:
const threatData = [
  { time: "00:00", threats: 12, blocked: 12 },
  { time: "04:00", threats: 8,  blocked: 8  },
  // ... valores inventados
];

// El "blocked" en el cálculo real también es falso:
blocked: Math.round(h.n * 0.98), // "aproximación" — siempre 98%
```

---

## SIMULACIÓN 4: Actividad de Sistema (activityData)

**Archivo:** `Dashboard.jsx`

```javascript
const activityData = [
  { name: "Login", count: 1248 },  // ← HARDCODEADO
  { name: "API",   count: 3542 },  // ← HARDCODEADO
  { name: "DB",    count: 892  },  // ← HARDCODEADO
  { name: "Files", count: 456  },  // ← HARDCODEADO
  { name: "MFA",   count: 234  },  // ← HARDCODEADO
  { name: "RBAC",  count: 89   },  // ← HARDCODEADO
];
```

Estos valores nunca se actualizan. La barra "Login: 1248" siempre dice 1248, independientemente de los logs reales.

---

## SIMULACIÓN 5: Datos Seed en Base de Datos

**Archivo:** `db-sql/migrations/011_incidents_vulns.sql`

Los siguientes datos son insertados en **todas las instalaciones nuevas** y aparecen como datos reales:

**Incidentes falsos:**
- "Coordinated DDoS on API Gateway" (status: in_progress)
- "Active SQL Injection on Users Endpoint" (status: contained)
- "Credential Stuffing Campaign" (status: resolved)
- "Stored XSS in User Profile Component" (status: post_review)

**CVEs seed:**
- CVE-2024-4040 (CrushFTP) — status: open
- CVE-2024-3400 (PAN-OS) — status: in_progress
- CVE-2024-21413 (Outlook) — status: patched
- CVE-2024-27198 (TeamCity) — status: patched
- CVE-2024-1708 (ConnectWise) — status: in_progress
- CVE-2024-0519 (Chrome) — status: patched
- CVE-2023-46604 (ActiveMQ) — status: patched

**Impacto:** Un cliente nuevo abre el dashboard y ve 4 incidentes activos y 7 vulnerabilidades críticas que no tienen ninguna relación con su infraestructura.

---

## SIMULACIÓN 6: SOAR — Playbooks "Habilitados" que No Se Ejecutan

**Archivos:** `backend/src/services/soarEngine.js`, `db-sql/migrations/013_soar.sql`

La migración 013 inserta 4 playbooks con `enabled = TRUE`:
- "Auto IP Ban — Brute Force"
- "Critical Alert Escalation"
- "Account Compromise Response"
- "Honeypot Sweep IP Block"

**El problema:** No existe ningún listener de eventos que dispare estos playbooks automáticamente. El `soarEngine.js` tiene la lógica de acción, pero no hay código que conecte:

```
correlationEngine → soarEngine.triggerPlaybooks(event)
```

Los playbooks aparecen como habilitados en la UI pero **nunca se ejecutan** a menos que se invoquen manualmente via API.

---

## SIMULACIÓN 7: AI Analysis Radar Chart

**Archivo:** `aiAnalysisController.js` → `getRadar()`

```javascript
async function getRadar(req, res) {
  // 6 valores del radar de superficie de ataque
  // Calculados con fórmulas simplistas desde counts de la DB
  const networkExposure = Math.min(100, Math.round((t.last24h / 1000) * 100));
  const authRisk        = Math.min(100, Math.round((failedLogins / 100) * 100));
  // etc.
}
```

Los 6 ejes del radar (Network Exposure, Auth Risk, Data Risk, etc.) son estimaciones arbitrarias basadas en conteos simples. No son el resultado de un análisis de superficie de ataque real.

---

## SIMULACIÓN 8: "All Systems Operational" Badge

**Archivo:** `Dashboard.jsx`

```jsx
<div style={{ color: "var(--accent)" }}>
  Todos los sistemas operativos  {/* ← SIEMPRE VERDE */}
</div>
```

El dashboard intenta hacer `fetch('/ready')` para obtener el estado real de los sistemas, pero el badge nunca cambia visualmente — siempre muestra verde independientemente de la respuesta.

---

## Resumen de Simulaciones

| Feature | % Real | % Simulado | Engaño al usuario |
|---|---|---|---|
| Attack Map (arcos en vivo) | 0% | 100% | Muy Alto |
| Anomaly Score gráfico | 0% | 100% | Alto |
| Métricas de dashboard (cambios %) | 0% | 100% | Alto |
| Activity breakdown chart | 0% | 100% | Medio |
| Active Sessions counter | ~10% | ~90% | Alto |
| Datos seed incidentes/CVEs | — | 100% | Medio |
| SOAR playbooks "activos" | 0% | 100% | Muy Alto |
| Radar de superficie de ataque | ~20% | ~80% | Medio |
| Risk Score overview | **100%** | 0% | — |
| Security Logs list | **100%** | 0% | — |
| Alerts list | **100%** | 0% | — |
| Incidents list | **100%** | 0% | — |
| Threat Intelligence IOCs | **100%** | 0% | — |
| Honeypot events | **100%** | 0% | — |
