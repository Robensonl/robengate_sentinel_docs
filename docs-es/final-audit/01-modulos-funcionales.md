# 01 — Módulos Funcionales: Estado Real vs Simulado

> **Auditoría:** RobenGate Sentinel — Junio 2026  
> **Rama:** `develop`

---

## MAPA DE ESTADO POR MÓDULO

| Módulo | Estado | Fuente de datos | Observación |
|--------|--------|----------------|-------------|
| Dashboard | 🟡 PARCIAL | Real API + hardcoded charts | KPIs reales, 3 de 4 charts con datos fijos |
| Attack Map | 🟢 FUNCIONAL | PostgreSQL + GeoIP + SSE | Funciona. Fallback visual a demo mode si SSE cae |
| Threat Intelligence | 🟡 PARCIAL | MongoDB fallback a INDICATORS[] | Charts MITRE y Actores completamente hardcodeados |
| Alerts | 🟡 PARCIAL | PostgreSQL fallback a SEED_ALERTS[] | Fallback silencioso, 5 alertas falsas |
| Incidents | 🟡 PARCIAL | PostgreSQL fallback a SEED_INCIDENTS[] | Fallback silencioso, 5 incidentes falsos |
| Honeypot | 🟡 PARCIAL | Real API fallback a arrays hardcodeados | Trampas y timeline 100% hardcodeados |
| AI Analysis | 🟢 FUNCIONAL | PostgreSQL queries + algoritmos reales | Sin datos simulados. Risk score calculado |
| Threat Hunting | 🔴 SIMULADO | SEED_HUNTS + Math.random() | Sin backend. Búsquedas 100% falsas |
| Vulnerabilities | 🟡 PARCIAL | PostgreSQL fallback a VULNS[] | Fallback silencioso, 8 CVEs hardcodeados |
| Security Logs | 🟢 FUNCIONAL | PostgreSQL `security_logs` | Real. Sin simulaciones detectadas |
| Audit Logs | 🟡 PARCIAL | MongoDB fallback a DEMO_LOGS[] | 40 eventos falsos como fallback |
| Sessions | 🟢 FUNCIONAL | PostgreSQL + Redis | Real. Revocación funciona |
| Devices | 🟢 FUNCIONAL | PostgreSQL `devices` | Real. Trust scoring funciona |
| Users | 🟢 FUNCIONAL | PostgreSQL `users` | Real. RBAC aplicado |
| Settings | 🟡 PARCIAL | Real perfil/MFA. DEMO_KEYS falso | API Keys no implementadas |
| RBAC | 🟢 FUNCIONAL | Middleware `authorize.js` | 4 roles reales, permisos aplicados |
| SOAR | 🟢 FUNCIONAL | PostgreSQL `playbooks` + soarEngine | 8 tipos de acción reales |
| Detection Engine | 🟢 FUNCIONAL | 9 reglas Sigma + BD customizables | Estado en memoria (volátil) |
| Correlation Engine | 🟢 FUNCIONAL | PostgreSQL `security_logs` | Crea incidentes reales. Cooldown 15min |
| Risk Engine | 🟢 FUNCIONAL | Algoritmo multi-factor 0-100 | Sin datos simulados |

---

## ANÁLISIS DETALLADO POR MÓDULO

---

### 1. DASHBOARD

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/stats` → contador total de eventos, críticos, últimas 24h, top IPs (PostgreSQL real)
- `GET /api/metrics/overview` → KPIs en tiempo real (eventos/hora, incidentes, agentes)
- Actualizaciones en tiempo real via SSE (`RT_EVENTS.ATTACK`, `RT_EVENTS.METRICS`)
- Tarjetas de métricas (`SecurityMetricCard`) con datos reales

**Lo que está simulado / hardcodeado:**

```javascript
// Dashboard.jsx línea ~32
const threatData = [
  { name: 'Lun', threats: 45, blocked: 38, incidents: 2 },
  { name: 'Mar', threats: 62, blocked: 55, incidents: 3 },
  // ... 5 más — DATOS FIJOS, no consultan BD
];
const activityData = [
  { name: 'Auth Failures', value: 234 },
  // ... DATOS FIJOS
];
const severityData = [
  { name: 'Critical', value: 12, color: '#ef4444' },
  // ... DATOS FIJOS
];
```

**Problema crítico:** Las 3 gráficas principales del dashboard (Threat Timeline, Activity Breakdown, Severity Distribution) muestran datos inventados. El backend tiene `GET /api/metrics/timeline` que devuelve series temporales reales, pero no se usa para las gráficas.

---

### 2. ATTACK MAP

**Estado:** 🟢 FUNCIONAL

**Lo que funciona:**
- `GET /api/attack-map/recent` → hasta 500 ataques reales de PostgreSQL con GeoIP
- `GET /api/attack-map/stats` → KPIs: total ataques, países únicos, top IPs
- SSE stream → nuevos ataques en tiempo real
- `useLiveAttacks()` hook → actualiza mapa dinámicamente
- Modo demo visual con badge "DEMO — Datos Simulados" cuando SSE no disponible

**Observaciones menores:**
- `SERVER_LAT: 40.7128, SERVER_LNG: -74.0060` (New York) como fallback hardcodeado en `attackMapController.js`
- Si `VITE_SERVER_LAT/LNG` no está en `.env`, el servidor origen del mapa siempre aparece en Nueva York

---

### 3. THREAT INTELLIGENCE

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/threats/indicators` → IOCs reales de MongoDB `ThreatIndicator`
- `GET /api/threats/feeds` → fuentes de inteligencia
- `POST /api/threats/report` → reportar IOC nuevo

**Lo que está simulado:**

```javascript
// ThreatIntelligence.jsx
const MITRE_TACTICS = [
  { name: 'Initial Access', count: 23 },
  { name: 'Execution', count: 18 },
  // ... 6 más — HARDCODEADO
];
const THREAT_ACTORS = [
  { name: 'APT28', country: 'RU', ... },
  // ... 3 más — HARDCODEADO
];
const TREND_DATA = [ /* 7 puntos hardcodeados */ ];
const INDICATORS = [ /* 6 IOCs de ejemplo — fallback si API falla */ ];
```

**Nota:** El gráfico de "MITRE ATT&CK Distribution" y la tabla de "Threat Actors" son decorativos. No hay endpoints backend que sirvan estos datos. Los indicadores reales del endpoint sí aparecen, pero si la API falla se muestran los 6 ejemplos estáticos sin aviso.

---

### 4. ALERTS

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/alerts` → alertas reales de PostgreSQL con filtros
- `PATCH /api/alerts/:id/status` → actualizar estado de alerta
- PermissionGate protege acciones de escritura para viewers

**Fallback silencioso:**

```javascript
// Alerts.jsx
const SEED_ALERTS = [
  { id: 'a1', type: 'Brute Force', severity: 'critical', ... },
  // ... 4 más — aparecen si la API falla SIN notificar al usuario
];
// catch block:
// setAlerts(SEED_ALERTS); // <-- silencio total, usuario no sabe
```

**Problema:** Si `GET /api/alerts` falla (backend caído, red interrumpida), el usuario ve 5 alertas falsas y no recibe ningún error. Una alerta crítica real podría no aparecer.

---

### 5. INCIDENTS

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/incidents` → incidentes reales de PostgreSQL
- `POST /api/incidents` → crear incidente (con timeline)
- `PATCH /api/incidents/:id` → actualizar estado/asignación
- PermissionGate correcto por rol

**Fallback silencioso:**

```javascript
// Incidents.jsx
const SEED_INCIDENTS = [
  { id: 'inc-001', title: 'Brute Force Attack', ... },
  // ... 4 más — misma problemática que Alerts
];
```

---

### 6. HONEYPOT

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/honeypot/events` → eventos reales capturados
- `GET /api/honeypot/attackers` → IPs atacantes únicas
- `GET /api/honeypot/stats` → estadísticas reales
- Honeypot SSH (puerto 2222) + HTTP (puerto 8080) capturan tráfico real

**Lo que está hardcodeado en el frontend:**

```javascript
// HoneypotPage.jsx — datos completamente fijos
const honeypotTraps = [
  { id: 1, name: 'SSH Honeypot', port: 22, ... },
  { id: 2, name: 'HTTP Decoy', port: 80, ... },
  { id: 3, name: 'FTP Trap', port: 21, ... },  // ← no existe en backend
  { id: 4, name: 'SMB Lure', port: 445, ... }, // ← no existe en backend
];
const attackTimeline = [ /* 7 puntos fijos */ ];
const attackTypes = [ /* distribución fija */ ];
const recentEvents = [ /* 4 eventos de ejemplo */ ];
```

**Nota crítica:** FTP (puerto 21) y SMB (puerto 445) aparecen en la UI como activos pero **no existen en el honeypot real** (solo SSH 2222 + HTTP 8080). La gráfica de timeline y tipos de ataque son decorativas.

---

### 7. AI ANALYSIS

**Estado:** 🟢 FUNCIONAL

**Lo que funciona:**
- `GET /api/ai/overview` → risk score calculado (0-100), threat level real
- `GET /api/ai/anomaly-stream` → serie temporal hourly de PostgreSQL (24-168h)
- `GET /api/ai/user-behavior` → perfiles de riesgo por usuario (IPs/países distintos)
- `GET /api/ai/recommendations` → recomendaciones basadas en tipos de eventos reales
- `GET /api/ai/radar` → 6 dimensiones de superficie de ataque desde queries reales
- Kill-chain detection en `aiCorrelationEngine.js` (Redis, 1h window)

**Sin simulaciones.** Risk score: `Math.min(100, Math.round((critical_count/total)*100 + last1h*2))` — completamente basado en datos de BD.

---

### 8. THREAT HUNTING

**Estado:** 🔴 SIMULADO — No funcional

**Problema crítico:**

```javascript
// ThreatHunting.jsx
const SEED_HUNTS = [
  { id: 'hunt-001', hypothesis: 'Lateral movement via SMB', status: 'active', ... },
  // ... datos fijos
];

// Al ejecutar una búsqueda:
const executeHunt = async (huntId) => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // espera falsa
  setResults({
    count: Math.floor(Math.random() * 5000) + 1,      // ← FALSO
    avgDuration: Math.floor(Math.random() * 800) + 50, // ← FALSO
    events: [],
  });
};
```

**No existe ningún endpoint backend** para threat hunting. El módulo entero es una maqueta interactiva.

**Impacto:** Un analista que ejecute una búsqueda MITRE ATT&CK verá "encontrados 3247 eventos en 342ms" — un número completamente inventado. **Este es el hallazgo más grave de la auditoría.**

---

### 9. VULNERABILITIES

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/vulnerabilities` → CVEs de PostgreSQL con CVSS
- `POST /api/vulnerabilities` → agregar vulnerabilidad
- `PATCH /api/vulnerabilities/:id` → actualizar estado

**Fallback silencioso:** 8 CVEs de ejemplo hardcodeados si API falla.

---

### 10. SECURITY LOGS

**Estado:** 🟢 FUNCIONAL

**Lo que funciona:**
- `GET /api/logs` → logs reales con filtros (severity, event_type, fecha)
- `GET /api/logs/stats` → estadísticas de logs
- `GET /api/logs/export` → exportación CSV real
- Protegido correctamente por `minRole('viewer')`

Sin simulaciones detectadas.

---

### 11. AUDIT LOGS

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- `GET /api/audit` → audit trail inmutable de MongoDB
- `GET /api/audit/stats` → estadísticas
- `GET /api/audit/export` → CSV/JSON

**Fallback silencioso:**

```javascript
// AuditLogs.jsx
const DEMO_LOGS = [ /* 40 eventos de ejemplo */ ];
// catch block captura CUALQUIER error y usa DEMO_LOGS
// El usuario no sabe que está viendo datos falsos
```

---

### 12. SESSIONS

**Estado:** 🟢 FUNCIONAL  
`GET /api/sessions`, `DELETE /api/sessions/:id`, `DELETE /api/sessions/all` — reales, Redis-backed.

---

### 13. DEVICES

**Estado:** 🟢 FUNCIONAL  
`GET /api/devices`, `DELETE /api/devices/:id`, `PATCH /api/devices/:id/trust` — reales, PostgreSQL.

---

### 14. USERS

**Estado:** 🟢 FUNCIONAL  
CRUD completo. Solo admin. RBAC aplicado correctamente.

---

### 15. SETTINGS

**Estado:** 🟡 PARCIAL

**Lo que funciona:**
- Perfil: `GET /auth/me`, `PATCH /auth/profile` — real
- Contraseña: `PUT /auth/change-password` — real
- TOTP: `POST /auth/totp/setup`, `POST /auth/totp/confirm` — real
- WebAuthn: endpoints completos — real

**Lo que está simulado:**

```javascript
// Settings.jsx
const DEMO_KEYS = [
  { id: 'key-1', name: 'Production API Key', ... },
  { id: 'key-2', name: 'Monitoring Service', ... },
];
```

No existe endpoint `/api/keys` en el backend. La sección de API Keys es completamente decorativa.

---

### 16. RBAC

**Estado:** 🟢 FUNCIONAL

- 4 roles: `admin > analyst > responder > viewer`
- Middleware `authorize.js` con `minRole()` y `readOnly()` 
- Frontend: `usePermission()` hook, `PermissionGate` component
- `PERMISSIONS` centralizado en `frontend/src/shared/config/permissions.js`

---

### 17. SOAR

**Estado:** 🟢 FUNCIONAL

- Playbooks CRUD: `GET/POST/PATCH/DELETE /api/playbooks`
- 8 tipos de acción: `ban_ip`, `disable_account`, `revoke_sessions`, `create_incident`, `add_ioc`, `notify_webhook`, `isolate_endpoint`, `send_notification`
- 4 tipos de trigger: `event`, `schedule`, `manual`, `threshold`
- Ejecución real via `soarEngine.js`
- Historial en `playbook_runs` table

---

### 18. DETECTION ENGINE

**Estado:** 🟢 FUNCIONAL (con advertencia)

- 9 reglas Sigma integradas con MITRE ATT&CK mapping
- Carga reglas personalizadas desde PostgreSQL `detection_rules`
- **Advertencia:** Ventanas de tiempo en `Map` en memoria — se pierden en restart

---

### 19. CORRELATION ENGINE

**Estado:** 🟢 FUNCIONAL (con advertencia)

- Detecta: brute-force (≥5/10min), credential spray (≥10 fail/5 users/15min), honeypot sweep (≥3/5min), multi-vector
- Crea incidentes reales en PostgreSQL
- **Advertencia:** Cooldown Map en memoria (15min) — se pierde en restart

---

### 20. RISK ENGINE

**Estado:** 🟢 FUNCIONAL

- Score 0-100 basado en: device trust, IP history, geo-mismatch, impossible travel, user-agent drift, failed attempts
- Usado en cada login para decidir step-up MFA
- Sin datos simulados

---

## RESUMEN DE CONTEO

| Estado | Módulos | Porcentaje |
|--------|---------|-----------|
| 🟢 FUNCIONAL | 12 | 60% |
| 🟡 PARCIAL | 7 | 35% |
| 🔴 SIMULADO | 1 | 5% |
| **Total** | **20** | **100%** |
