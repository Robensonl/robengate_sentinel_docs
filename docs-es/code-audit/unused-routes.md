# Auditoría de Código — Rutas y Servicios Sin Frontend o Sin Uso

**Scope:** `backend/src/routes/` + `backend/src/services/`  
**Metodología:** Comparar rutas registradas en `app.js` con uso en frontend  

---

## Rutas Backend

### Rutas Plenamente Integradas con Frontend

Rutas con página de frontend correspondiente confirmada:

| Ruta backend | Página frontend | Estado |
|---|---|---|
| `/api/auth/*` | `Login.jsx`, `Register.jsx`, `MfaVerify.jsx` | ✅ Integrado |
| `/api/alerts` | `Alerts.jsx` | ✅ Integrado |
| `/api/incidents` | `Incidents.jsx` | ✅ Integrado |
| `/api/logs` | `SecurityLogs.jsx` | ✅ Integrado |
| `/api/audit` | `AuditLogs.jsx` | ✅ Integrado |
| `/api/threats` | `ThreatIntelligence.jsx` | ✅ Integrado |
| `/api/honeypot` | `HoneypotPage.jsx` | ✅ Integrado |
| `/api/ai` | `AIAnalysis.jsx` | ✅ Integrado |
| `/api/attack-map` | `AttackMap.jsx` | ✅ Integrado |
| `/api/vulnerabilities` | `Vulnerabilities.jsx` | ✅ Integrado |
| `/api/search` | `ThreatHunting.jsx` | ✅ Integrado |
| `/api/users` | `UserList.jsx` | ✅ Integrado |
| `/api/sessions` | `SessionManagement.jsx` | ✅ Integrado |
| `/api/devices` | `DeviceList.jsx` | ✅ Integrado |
| `/api/stats` | `Dashboard.jsx` | ✅ Integrado |
| `/health` | Dashboard health check | ✅ Integrado |
| `/metrics` | Prometheus | ✅ Integrado |

---

### Rutas Backend Sin Frontend Dedicado — Uso Via API

Estas rutas existen pero no tienen una página de frontend dedicada. Se usan via API directa (integraciones, scripts, honeypot interno):

#### `/api/ingestion/*` — Pipeline de Ingestión

**Estado:** ✅ Funcional, sin UI dedicada  
**Uso:** Recibe logs externos via syslog, webhook, Windows Event Collector, CEF  
**Consumidores:** Sistemas externos, no el frontend  
**Observación:** Correcto que no tenga UI — es un endpoint de ingestión de datos.

---

#### `/api/organizations/*` — Gestión de Organizaciones

**Estado:** ✅ Funcional, sin UI dedicada en esta versión  
**Uso:** CRUD de organizaciones multi-tenant  
**Pendiente:** La UI de gestión de organizaciones (para admin super-tenant) está en el roadmap  
**Observación:** La tabla `organizations` existe y está en uso, pero la gestión UI no está implementada. Se gestiona via API o `manage-admins.js`.

---

#### `/api/playbooks/*` — SOAR Playbooks

**Estado:** ✅ Funcional, sin UI dedicada completa  
**Uso:** La página `Settings.jsx` puede tener sección de playbooks, pero la gestión completa de SOAR es limitada en UI  
**Observación:** El motor SOAR (`soarEngine.js`) funciona en background. La UI de gestión de playbooks es parcial.

---

#### `/api/agents/*` — Endpoint Agents (EDR)

**Estado:** ⚠️ Parcialmente implementado — Sin UI dedicada  
**Uso:** `endpointAgentService.js` registra agentes, `endpoint_agents` tabla en DB  
**Observación:** La integración EDR es real en términos de API y DB, pero la UI de gestión de agentes no está implementada. Roadmap item.

---

#### `/internal/*` — Endpoints Internos

**Estado:** ✅ Funcional, solo para uso interno  
**Uso:** El honeypot usa `/internal/ban` y `/internal/log` para reportar al sistema principal  
**Seguridad:** Protegido por `X-Internal-Secret` header (middleware `internalAuth.js`)  
**Observación:** Correcto que sea interno. No exponer nunca públicamente.

---

#### `/api/webauthn/*` — WebAuthn Separation

**Estado:** ✅ Funcional, integrado con Login.jsx via `useWebAuthn.js`  
**Observación:** Las rutas WebAuthn tienen route file propio. Correctamente separadas de auth general.

---

## Servicios Backend — Evaluación de Uso

### Servicios Confirmados en Uso

| Servicio | Usado por |
|---|---|
| `authService.js` | `authController.js` |
| `webAuthnService.js` | `webAuthnController.js` |
| `backupCodeService.js` | `authController.js` |
| `riskEngine.js` | `aiAnalysisController.js` |
| `detectionEngine.js` | `attackDetection.js` middleware |
| `correlationEngine.js` | `alertController.js` |
| `aiCorrelationEngine.js` | `aiAnalysisController.js` |
| `auditService.js` | Múltiples controllers |
| `banService.js` | `autoban.js`, `internalController.js` |
| `honeypotService.js` | `honeypotController.js` |
| `loggingService.js` | Múltiples controllers |
| `geoService.js` | `loggingService.js`, auth middleware |
| `metricsService.js` | `metricsController.js` |
| `soarEngine.js` | `playbooks` controller |
| `ingestion/pipeline.js` | `ingestionController.js` |

### Servicios con Uso Condicional (Opcional)

| Servicio | Estado | Motivo |
|---|---|---|
| `elasticsearchService.js` | ⚠️ Opcional | Solo activo si ES está configurado |
| `endpointAgentService.js` | ⚠️ Parcial | API lista, UI pendiente |
| `deviceService.js` | ⚠️ Verificar | Puede estar siendo llamado desde `deviceController.js` |

---

## Conclusión

La mayoría de rutas y servicios están activamente en uso. Los hallazgos principales:

1. **Rutas sin UI:** `organizations`, `agents`, `playbooks` (gestión completa) — son rutas reales con funcionalidad, pero la interfaz de usuario está parcialmente implementada o es roadmap.

2. **Servicios opcionales:** `elasticsearchService.js` y `endpointAgentService.js` tienen código real pero son features de fase 2.

3. **No hay rutas "zombie"** (registradas pero sin handler implementado) identificadas en esta auditoría.
