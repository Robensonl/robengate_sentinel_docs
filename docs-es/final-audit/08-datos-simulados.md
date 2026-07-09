# 08 — Datos Simulados, Hardcodeados y Falsos

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## CATÁLOGO COMPLETO DE SIMULACIONES Y DATOS FALSOS

Este documento cataloga **cada instancia** de dato falso, simulado, hardcodeado o generado artificialmente encontrada en el codebase.

---

## CATEGORÍA 1: Math.random() — Generación Aleatoria

### Frontend

| Archivo | Línea | Expresión | Qué simula | Gravedad |
|---------|-------|-----------|-----------|---------|
| `realTimeService.js` | ~198 | `Math.round((Math.random() - 0.45) * 8)` | Drift del contador de sesiones activas | 🔴 Alta |
| `realTimeService.js` | ~219 | `Math.random() > 0.7` | Probabilidad de nueva alerta crítica | 🔴 Alta |
| `realTimeService.js` | ~222 | `1500 + Math.random() * 2500` | Tiempo hasta próximo evento de ataque | 🟡 Media |
| `realTimeService.js` | ~241 | `800 + Math.random() * 2400` | Tiempo hasta próximo evento SIEM | 🟡 Media |
| `realTimeService.js` | ~246 | `Math.round((Math.random() - 0.45) * 8)` | Drift de sesiones (duplicado) | 🟡 Media |
| `useRealTimeData.js` | ~53 | `Math.random() - 0.5` | Drift del puntaje de anomalía | 🔴 Alta |
| `useRealTimeData.js` | ~56 | `Math.random() - 0.5` | Historial de anomalías de fallback | 🔴 Alta |
| `TerminalWidget.jsx` | ~36 | `Math.floor(Math.random() * logTypes.length)` | Tipo de log aleatorio en terminal | 🔴 Alta |
| `TerminalWidget.jsx` | ~37 | `Math.floor(Math.random() * messages.length)` | Mensaje de log aleatorio | 🔴 Alta |
| `ThreatHunting.jsx` | ~120 | `Math.floor(Math.random() * 5000) + 1` | "Resultados encontrados" de búsqueda | 🔴 Crítica |
| `ThreatHunting.jsx` | ~121 | `Math.floor(Math.random() * 800) + 50` | "Tiempo de búsqueda" en ms | 🔴 Crítica |
| `attackSimulator.js` | múltiples | `Math.floor(Math.random() * arr.length)` | Selección de datos del pool de demo | 🟡 Media |

**Total: 12 usos de Math.random() en código de producción del frontend**

### Backend

**Resultado: 0 usos de Math.random() en el backend.**

El backend usa solo:
- `crypto.randomInt()` para generación segura de tokens
- `crypto.randomBytes()` para secretos criptográficos
- `Math.min()`, `Math.max()`, `Math.sqrt()` para cálculos estadísticos (correctos)

---

## CATEGORÍA 2: Arrays Hardcodeados como "Datos"

### `ThreatHunting.jsx` — SEED_HUNTS

```javascript
const SEED_HUNTS = [
  {
    id: 'hunt-001',
    hypothesis: 'Lateral movement via SMB from compromised workstation',
    status: 'active',
    confidence: 73,
    events_analyzed: 1247,
    last_updated: '2024-01-15T14:23:00Z',
  },
  // ... más entradas falsas
];
```

**Problema:** No existe endpoint backend para threat hunts. Estos datos nunca se actualizan.

### `Dashboard.jsx` — Charts hardcodeados

```javascript
const threatData = [
  { name: 'Lun', threats: 45, blocked: 38, incidents: 2 },
  { name: 'Mar', threats: 62, blocked: 55, incidents: 3 },
  { name: 'Mié', threats: 38, blocked: 32, incidents: 1 },
  { name: 'Jue', threats: 89, blocked: 78, incidents: 5 },
  { name: 'Vie', threats: 73, blocked: 67, incidents: 4 },
  { name: 'Sáb', threats: 45, blocked: 41, incidents: 2 },
  { name: 'Dom', threats: 28, blocked: 25, incidents: 1 },
];
// activityData y severityData también hardcodeados
```

**Problema:** Los gráficos del dashboard principal muestran siempre los mismos valores inventados, independientemente de los datos reales de la base de datos.

### `HoneypotPage.jsx` — honeypotTraps

```javascript
const honeypotTraps = [
  { id: 1, name: 'SSH Honeypot', port: 22, type: 'SSH', ... hits: 47 },
  { id: 2, name: 'HTTP Decoy', port: 80, type: 'HTTP', ... hits: 132 },
  { id: 3, name: 'FTP Trap', port: 21, type: 'FTP', ... hits: 23 },   // ← No existe
  { id: 4, name: 'SMB Lure', port: 445, type: 'SMB', ... hits: 8 },   // ← No existe
];
```

**Problema crítico:** El honeypot real solo tiene SSH (2222) y HTTP (8080). FTP y SMB aparecen en la UI como activos con `hits: 23` y `hits: 8` pero son completamente inventados.

### `ThreatIntelligence.jsx` — MITRE y Actores

```javascript
const MITRE_TACTICS = [
  { name: 'Initial Access', count: 23 },
  { name: 'Execution', count: 18 },
  { name: 'Persistence', count: 12 },
  { name: 'Privilege Escalation', count: 9 },
  { name: 'Defense Evasion', count: 15 },
  { name: 'Credential Access', count: 21 },
  { name: 'Lateral Movement', count: 7 },
  { name: 'Exfiltration', count: 4 },
];

const THREAT_ACTORS = [
  { name: 'APT28', country: 'RU', campaigns: 3, lastSeen: '2024-01-10', ... },
  { name: 'Lazarus Group', country: 'KP', ... },
  { name: 'Scattered Spider', country: 'US', ... },
  { name: 'FIN7', country: 'UA', ... },
];
```

**Problema:** Estos datos nunca cambiarán. Un analista que confíe en estos números tomará decisiones equivocadas.

### `Alerts.jsx` — SEED_ALERTS (Fallback)

```javascript
const SEED_ALERTS = [
  {
    id: 'a1',
    type: 'Brute Force',
    severity: 'critical',
    source_ip: '192.168.1.105',
    timestamp: '2024-01-15T10:23:00Z',
    status: 'open',
  },
  // ... 4 más
];
```

### `Incidents.jsx` — SEED_INCIDENTS (Fallback)

```javascript
const SEED_INCIDENTS = [
  {
    id: 'inc-001',
    title: 'Brute Force Attack Detected',
    severity: 'high',
    status: 'open',
    // ...
  },
  // ... 4 más
];
```

### `Vulnerabilities.jsx` — VULNS (Fallback)

```javascript
const VULNS = [
  { id: 1, cve: 'CVE-2024-0001', title: 'Remote Code Execution', cvss: 9.8, ... },
  { id: 2, cve: 'CVE-2024-0002', title: 'SQL Injection Vulnerability', cvss: 8.5, ... },
  // ... 6 más CVEs inventados
];
```

### `AuditLogs.jsx` — DEMO_LOGS (Fallback)

```javascript
const DEMO_LOGS = [
  { id: 1, category: 'AUTH', action: 'LOGIN_SUCCESS', severity: 'INFO', ... },
  // ... 39 más eventos de audit falsos
];
```

### `Settings.jsx` — DEMO_KEYS

```javascript
const DEMO_KEYS = [
  {
    id: 'key-1',
    name: 'Production API Key',
    key: 'rg_prod_xxxxxxxxxxxx',
    created: '2024-01-01',
    lastUsed: '2024-01-15',
  },
  {
    id: 'key-2',
    name: 'Monitoring Service',
    key: 'rg_mon_xxxxxxxxxxxx',
    created: '2024-01-05',
    lastUsed: '2024-01-14',
  },
];
```

---

## CATEGORÍA 3: setInterval con Datos Falsos

| Componente | Intervalo | Qué genera |
|-----------|----------|-----------|
| `TerminalWidget.jsx` | 2000ms | Log line aleatoria con tipo y mensaje falsos |
| `SIEMTerminal.jsx` | 1500-3000ms | Eventos SIEM inventados |
| `realTimeService.js` (mock mode) | 1500-4000ms | Ataques desde IPs/coords falsas |
| `realTimeService.js` (anomaly) | 2000ms | Score de anomalía con drift aleatorio |
| `realTimeService.js` (sessions) | 10000ms | Counter de sesiones con drift |
| `realTimeService.js` (brute force) | 8000ms | Sesiones de brute force falsas |
| `realTimeService.js` (XSS) | 5000ms | Eventos XSS inventados |
| `Dashboard.jsx` | (animación) | Contador de métricas con efecto visual |
| `LandingPage.jsx` | (animación) | Animación de fondo decorativa |
| `MfaVerify.jsx` | 1000ms | Countdown real de MFA (este es VÁLIDO) |

---

## CATEGORÍA 4: Datos Hardcodeados en el Backend

El backend tiene los siguientes datos hardcodeados que son **técnicamente correctos** (reglas de negocio, no datos de prueba), pero deben estar documentados:

### `detectionEngine.js` — BUILT_IN_RULES

9 reglas de detección Sigma integradas directamente en el código fuente. Estas son reglas de negocio válidas, no datos de prueba. Sin embargo, un cambio requiere modificar el código.

**Alternativa:** Cargarlas desde la tabla `detection_rules` de PostgreSQL al inicio.

### `correlationEngine.js` — Umbrales de correlación

```javascript
const BRUTE_FORCE_THRESHOLD = 5;    // ataques en 10 minutos
const SPRAY_THRESHOLD = 10;          // failures
const SPRAY_USERS_THRESHOLD = 5;     // usuarios distintos
const HONEYPOT_SWEEP_THRESHOLD = 3;  // hits en 5 minutos
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos
```

Son valores de configuración hardcodeados. Deben moverse a variables de entorno o tabla de configuración.

### `attackMapController.js` — SERVER_LAT/LNG

```javascript
const SERVER_LAT = process.env.VITE_SERVER_LAT || 40.7128; // Nueva York
const SERVER_LNG = process.env.VITE_SERVER_LNG || -74.0060;
```

El servidor siempre aparece en Nueva York si no se configura el entorno.

### `aiAnalysisController.js` — Mapeo de recomendaciones

```javascript
const RECOMMENDATIONS_MAP = {
  'LOGIN_FAILURE': 'Brute-force activity detected. Consider enabling geo-blocking.',
  'SSH_AUTH_FAILURE': 'SSH brute-force in progress. Review firewall rules.',
  // ... 6 más entradas
};
```

Estas son recomendaciones fijas que no cambian con el contexto. Un sistema de IA real generaría recomendaciones dinámicas.

---

## CATEGORÍA 5: Timestamps Falsos

En los arrays de fallback (SEED_ALERTS, SEED_INCIDENTS, DEMO_LOGS, etc.), los timestamps están hardcodeados con fechas del pasado:

```javascript
timestamp: '2024-01-15T10:23:00Z'  // Fecha fija del pasado
```

Esto significa que si el backend falla y se muestran los datos de fallback, los "eventos" aparecen con fechas de hace meses, lo cual es inmediatamente visible como inconsistente para un usuario avanzado. **Sin embargo, un usuario menos técnico podría no notarlo.**

---

## RESUMEN DE IMPACTO POR MÓDULO

| Módulo | Tipo de dato falso | Impacto operativo |
|--------|-------------------|------------------|
| **Threat Hunting** | 100% simulado (Math.random + seedData) | 🔴 Analista toma decisiones con datos falsos |
| **Dashboard charts** | 3 gráficas hardcodeadas | 🔴 KPIs del SOC incorrectos |
| **Honeypot UI** | 2 servicios (FTP/SMB) que no existen | 🔴 Falsa sensación de cobertura |
| **MITRE ATT&CK** | Distribución de tácticas fija | 🔴 Inteligencia táctica incorrecta |
| **Threat Actors** | 4 actores estáticos | 🟡 No dinámico, no crítico |
| **TerminalWidget** | Logs completamente falsos | 🟡 Decorativo pero confuso |
| **Settings API Keys** | Claves demo, no funcionales | 🟡 Función de seguridad ausente |
| **Alerts fallback** | 5 alertas falsas si API falla | 🟡 Solo si backend cae |
| **Incidents fallback** | 5 incidentes falsos | 🟡 Solo si backend cae |
| **Vulnerabilities fallback** | 8 CVEs falsos | 🟡 Solo si backend cae |
| **Audit fallback** | 40 eventos falsos | 🟡 Solo si MongoDB cae |

---

## RECOMENDACIONES

| Prioridad | Acción |
|-----------|--------|
| 🔴 INMEDIATA | Conectar Dashboard charts a `/api/metrics/timeline` y `/api/stats` |
| 🔴 INMEDIATA | Implementar ThreatHunting con query real a `security_logs` |
| 🔴 INMEDIATA | Eliminar trampas FTP/SMB de HoneypotPage (no existen en backend) |
| 🔴 INMEDIATA | Conectar MITRE tactics a datos reales de MongoDB |
| 🟡 MEDIA | Reemplazar fallbacks silenciosos con mensajes de error explícitos |
| 🟡 MEDIA | Eliminar TerminalWidget o conectarlo a SSE real |
| 🟡 MEDIA | Implementar gestión real de API Keys |
| 🟡 MEDIA | Mover umbrales de correlación a variables de entorno |
| 🟢 BAJA | Decidir si el modo demo (attackSimulator) tiene lugar en producción |
| 🟢 BAJA | Migrar BUILT_IN_RULES a tabla `detection_rules` |
