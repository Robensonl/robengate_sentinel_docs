# Auditoría de Localización — RobenGate Sentinel

**Objetivo:** Identificar cadenas de texto en inglés en el frontend y crear un plan para alcanzar 100% de la UI en español  
**Estado actual estimado:** ~85% español  
**Scope:** `frontend/src/` — todos los archivos `.jsx` y `.js`  

---

## Estado Actual de la Interfaz

### Páginas ya en Español ✅

| Componente | Estado | Notas |
|---|---|---|
| `Login.jsx` | ✅ Español | Mensajes de validación, labels, botones |
| `Register.jsx` | ✅ Español | Formulario completo |
| `MfaVerify.jsx` | ✅ Español | Verificación MFA |
| `ForgotPassword.jsx` | ✅ Español | |
| `ResetPassword.jsx` | ✅ Español | |
| `Navbar.jsx` | ✅ Español | "Panel Principal", "Registros", "Dispositivos", "Usuarios" |
| `Dashboard.jsx` | ⚠️ Parcial | Algunos labels de gráficas en inglés |
| `AccessDenied.jsx` | Verificar | |
| `ProtectedRoute.jsx` | N/A | Sin texto visible |

---

## Cadenas en Inglés Identificadas

### Dashboard (`features/dashboard/pages/Dashboard.jsx`)

**Datos de actividad (activityData) — líneas ~37-44:**
```javascript
const activityData = [
  { name: "Login", count: 1248 },   // ← Inglés
  { name: "API",   count: 3542 },   // ← Técnico (aceptable)
  { name: "DB",    count: 892  },   // ← Técnico (aceptable)
  { name: "Files", count: 456  },   // ← Inglés → "Archivos"
  { name: "MFA",   count: 234  },   // ← Acrónimo (aceptable)
  { name: "RBAC",  count: 89   },   // ← Acrónimo (aceptable)
];
```

**threatData labels:**
```javascript
{ time: "Now", threats: 7, blocked: 7 }  // ← Inglés → "Ahora"
```

**Cadenas para traducir en Dashboard:**
| Inglés | Español propuesto |
|---|---|
| "Login" (en gráfica) | "Accesos" |
| "Files" | "Archivos" |
| "Now" | "Ahora" |

---

### Datos del Attack Map (`features/attackmap/pages/AttackMap.jsx`)

Probable que tenga labels en inglés para tipos de ataque y severidades. Verificar:
- Tipos de evento: `BRUTE_FORCE`, `SQL_INJECTION`, etc. — estos son identificadores técnicos (pueden mantenerse o traducirse visualmente)
- Labels de eje/leyenda en gráficas Recharts

---

### Mensajes de API en `services/api.js`

Los mensajes de error hardcodeados en `api.js` pueden estar en inglés:
```javascript
// Probable en api.js
throw new Error("Network error. Please try again.");
throw new Error("Session expired");
```

**Traducción propuesta:**
| Inglés | Español |
|---|---|
| "Network error. Please try again." | "Error de red. Por favor intenta de nuevo." |
| "Session expired" | "Sesión expirada" |
| "Unauthorized" | "No autorizado" |
| "Forbidden" | "Acceso denegado" |
| "Not found" | "No encontrado" |
| "Internal server error" | "Error interno del servidor" |

---

### Alerts Page (`features/alerts/pages/Alerts.jsx`)

Los tipos de evento (`BRUTE_FORCE_DETECTED`, `SQL_INJECTION_ATTEMPT`) son identificadores técnicos. La pregunta es si la UI los muestra como está o los traduce visualmente:

**Recomendación:** Mantener el identificador técnico pero añadir un label legible en español:

```javascript
const EVENT_TYPE_LABELS = {
  'BRUTE_FORCE_DETECTED': 'Fuerza Bruta Detectada',
  'SQL_INJECTION_ATTEMPT': 'Intento de Inyección SQL',
  'XSS_ATTEMPT': 'Intento de XSS',
  'SUSPICIOUS_LOGIN': 'Acceso Sospechoso',
  'CREDENTIAL_STUFFING': 'Relleno de Credenciales',
  'HONEYPOT_SSH_AUTH': 'Auth en Honeypot SSH',
  'IP_BANNED': 'IP Baneada',
  'LOGIN_FAILED': 'Login Fallido',
  'LOGIN_SUCCESS': 'Login Exitoso',
  'UNAUTHORIZED_ACCESS': 'Acceso No Autorizado',
};
```

---

### Severity Labels

En varios componentes, las severidades pueden aparecer como identificadores ingleses:

| Inglés | Español propuesto | Contexto |
|---|---|---|
| `CRITICAL` | `Crítico` | Dashboard ya lo usa |
| `HIGH` | `Alto` | Dashboard ya lo usa |
| `MEDIUM` | `Medio` | Dashboard ya lo usa |
| `LOW` | `Bajo` | Dashboard ya lo usa |
| `INFO` | `Información` | |
| `EMERGENCY` | `Emergencia` | |

---

### Status Labels (Alertas e Incidentes)

| Inglés (DB value) | Español UI propuesto |
|---|---|
| `new` | `Nuevo` |
| `acknowledged` | `Reconocida` |
| `investigating` | `Investigando` |
| `resolved` | `Resuelto` |
| `false_positive` | `Falso Positivo` |
| `in_progress` | `En Progreso` |
| `contained` | `Contenido` |
| `post_review` | `Post-Revisión` |
| `open` | `Abierto` |
| `patched` | `Parcheado` |
| `accepted` | `Aceptado` |

---

### TLP Labels

TLP es un estándar internacional — mantener en inglés es correcto:
- `WHITE`, `GREEN`, `AMBER`, `RED` — son parte del estándar TLP (Traffic Light Protocol)

---

## Plan de Implementación — i18n

### Opción A: Traducción directa (sin librería i18n) — RECOMENDADO A CORTO PLAZO

Crear archivos de constantes de traducción:

```javascript
// frontend/src/shared/config/labels.js

export const SEVERITY_LABELS = {
  INFO: 'Información',
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
  EMERGENCY: 'Emergencia',
};

export const STATUS_LABELS = {
  new: 'Nuevo',
  acknowledged: 'Reconocida',
  investigating: 'Investigando',
  resolved: 'Resuelto',
  false_positive: 'Falso Positivo',
  in_progress: 'En Progreso',
  contained: 'Contenido',
  post_review: 'Post-Revisión',
};

export const EVENT_TYPE_LABELS = {
  BRUTE_FORCE_DETECTED: 'Fuerza Bruta Detectada',
  SQL_INJECTION_ATTEMPT: 'Intento de Inyección SQL',
  XSS_ATTEMPT: 'Intento de XSS',
  CREDENTIAL_STUFFING: 'Relleno de Credenciales',
  SUSPICIOUS_LOGIN: 'Acceso Sospechoso',
  HONEYPOT_SSH_AUTH: 'Auth Honeypot SSH',
  IP_BANNED: 'IP Baneada',
  LOGIN_FAILED: 'Login Fallido',
  LOGIN_SUCCESS: 'Login Exitoso',
};

export const ACTIVITY_LABELS = {
  Login: 'Accesos',
  API: 'API',       // Técnico — mantener
  DB: 'BD',
  Files: 'Archivos',
  MFA: 'MFA',       // Acrónimo — mantener
  RBAC: 'RBAC',     // Acrónimo — mantener
};
```

**Uso en componentes:**
```jsx
import { SEVERITY_LABELS } from '../../../shared/config/labels';

// En el componente
<span>{SEVERITY_LABELS[alert.severity] ?? alert.severity}</span>
```

---

### Opción B: Librería i18n completa — PARA FUTURO

Si el producto necesita soporte multi-idioma (español + inglés + otros):

```bash
npm install react-i18next i18next
```

**Estructura de archivos:**
```
frontend/src/shared/i18n/
  es.json     ← Español (idioma principal)
  en.json     ← Inglés (para mercados internacionales)
```

**Cuándo implementar:** Cuando se decida apoyar el idioma inglés formalmente (internacionalización).

---

## Módulos con Mayor Prioridad de Traducción

| Módulo | Prioridad | Cadenas estimadas a traducir |
|---|---|---|
| Dashboard — gráficas | Alta | ~10 cadenas |
| Alerts — tipos y estados | Alta | ~20 cadenas |
| Incidents — estados | Alta | ~10 cadenas |
| Error messages (api.js) | Alta | ~15 cadenas |
| Vulnerabilities — estados | Media | ~8 cadenas |
| Honeypot — tipos de evento | Media | ~5 cadenas |
| Settings — labels de configuración | Media | ~20 cadenas |
| Attack Map — leyendas | Baja | ~5 cadenas |

**Total estimado:** ~93 cadenas a traducir para llegar al 100% español.

---

## Términos Técnicos que Se Mantienen en Inglés

Los siguientes términos son aceptables en inglés porque son estándares de la industria de ciberseguridad:

- **Acrónimos:** SIEM, SOC, SOAR, EDR, TIP, IOC, TTPs, CVE, CVSS, TLP, MITRE ATT&CK, RBAC, MFA, TOTP, JWT, SSE, API, FIDO2
- **Estándares de colores:** TLP:WHITE, TLP:GREEN, TLP:AMBER, TLP:RED
- **Identificadores técnicos de DB:** Los valores de enum en DB (`new`, `in_progress`) se pueden mantener internamente pero traducir en la UI
- **Nombres de tecnologías:** Docker, Kubernetes, PostgreSQL, MongoDB, Redis, WebAuthn, Nginx, Prometheus, Grafana

---

## Checklist de Validación Final

Para alcanzar 100% español en la UI:

```
□ Dashboard — traducir "Files" → "Archivos", "Login" → "Accesos", "Now" → "Ahora"
□ Alerts — añadir labels de EVENT_TYPE en español
□ Incidents — traducir estados en UI (manteniendo valores DB en inglés)
□ Vulnerabilities — traducir estados "patched", "accepted", "in_progress"
□ api.js — traducir mensajes de error
□ Verificar todas las notificaciones toast en cada componente
□ Verificar placeholder de formularios de búsqueda/filtro
□ Verificar mensajes de estado vacío (empty states)
□ Verificar aria-labels y tooltips
```
