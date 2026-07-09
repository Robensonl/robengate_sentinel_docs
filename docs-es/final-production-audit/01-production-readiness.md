# Production Readiness — Clasificación por Módulo

**Auditoría:** 2026-06-06  
**Metodología:** Lectura directa del código fuente. Sin suposiciones.  
**Clasificaciones:**  
- ✅ **Production Ready** — funciona correctamente, no requiere cambios para producción  
- ⚠️ **Functional but Incomplete** — el núcleo funciona, faltan piezas reales  
- 🎭 **Simulated** — genera datos ficticios, no conecta a datos reales  
- ❌ **Non-Functional** — el código existe pero no funciona en la configuración por defecto  
- 🔧 **Technical Debt** — funciona pero con deuda técnica significativa que bloquea producción  

---

## Autenticación

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `authService.js` — bcrypt(12), JWT HS256 15m, refresh token 7d con rotación en Redis, blacklist en Redis
- `riskEngine.js` — score 0-100 con 10 señales reales (device trust, geo, impossible travel, banned IP, hora inusual) consultando PostgreSQL en cada login
- `webAuthnService.js` — WebAuthn/FIDO2 completo con `@simplewebauthn/server`
- `backupCodeService.js` — códigos de respaldo hasheados en BD
- TOTP con `otplib`, Email OTP con Redis TTL 5min
- Startup falla si `JWT_SECRET` o `JWT_REFRESH_SECRET` no están definidos (fail-fast correcto)

**Riesgos:**
- Email OTP no funciona en la configuración por defecto — ver módulo `mailer` abajo
- `BCRYPT_ROUNDS` configurable desde env → riesgo si se establece en un valor bajo

**Esfuerzo para producción:** 0 (ya es production-ready excepto SMTP)

---

## RBAC

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `authorize.js` — `ROLE_RANK = { admin:4, analyst:3, responder:2, viewer:1 }`, `minRole()`, `readOnly()` implementados
- Accesos denegados son auditados via `auditService.accessDenied()`
- `PermissionGate.jsx` y `usePermission.js` en frontend — RBAC aplicado en ambos lados
- `permissions.js` — mapa completo de permisos por rol

**Riesgos:** Ninguno crítico.

**Esfuerzo para producción:** 0

---

## Security Logs

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `loggingService.js` escribe a MongoDB (`security_logs`) de forma inmutable
- `models/SecurityLog.js` — sin métodos update/delete en el ODM
- TTL 365 días en MongoDB
- `logController.js` consulta PostgreSQL `security_logs` con filtros completos
- `auditController.js` consulta MongoDB para el audit trail

**Riesgo:** La tabla PostgreSQL `security_logs` y la colección MongoDB `security_logs` tienen propósitos distintos pero pueden confundir a los desarrolladores (dos stores con el mismo nombre).

**Esfuerzo para producción:** 0

---

## Audit Logs

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- MongoDB `SecurityLog` (en `lib/SecurityLog.js`) — schema inmutable con category, action, userId, ipAddress, requestId
- `auditController.js` — queries reales a MongoDB con paginación y filtros
- Si MongoDB no está disponible, retorna `{ logs: [], total: 0 }` gracefully

**Riesgo:** Dependiente de MongoDB. Si MongoDB cae, audit log se pierde para ese período.

**Esfuerzo para producción:** 0

---

## Gestión de Incidentes

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `incidentController.js` — CRUD completo contra PostgreSQL `incidents` + `incident_events`
- `correlationEngine.js` — crea incidentes automáticamente vía DB INSERT + emite SSE
- Timeline de eventos (`incident_events`) con actor y acción
- Datos seed de demo en migración 011 — deben limpiarse antes de producción

**Riesgo:** Los datos seed (4 incidentes falsos, 7 CVEs seed) están en la migración. En producción, un cliente nuevo ve datos inventados hasta que los limpie.

**Esfuerzo para producción:** Bajo — eliminar datos seed o añadir flag de demo

---

## Gestión de Alertas

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `alertController.js` — queries a `security_logs` (PostgreSQL) con overlay `alert_statuses`
- El overlay pattern es correcto: los logs son inmutables, `alert_statuses` guarda el estado del analista
- SSE emite nuevas alertas en tiempo real desde `sse.js`

**Riesgo:** Sin alertas de ingesta (no hay datos en `security_logs` si no hay ataques reales), la UI de alertas estará vacía. Los datos demo vienen del simulador del frontend, no de esta tabla.

**Esfuerzo para producción:** 0

---

## Sessions y Devices

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `sessionController.js` — queries a PostgreSQL `sessions` + `refresh_tokens`
- `deviceController.js` — queries a PostgreSQL `devices` con fingerprint hash
- `deviceFingerprint.js` en frontend — genera fingerprint real del navegador
- Revocación de sesiones funcional via `DELETE sessions WHERE user_id = $1`

**Riesgos:** Ninguno crítico.

**Esfuerzo para producción:** 0

---

## Threat Intelligence (IOCs)

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `threatController.js` — CRUD completo sobre MongoDB `ThreatIndicator`
- IOC lookup en `/api/search/ioc/:ip` consulta MongoDB real
- Correlación automática: `detectionEngine.js` cruza eventos con IOCs de MongoDB
- `searchController.js` — búsqueda full-text en ES (con fallback si ES no disponible)

**Riesgo:** Los IOCs iniciales son solo los que el equipo añade manualmente. No hay feed automático de threat intel (Feodo, AbuseCH, etc.) implementado.

**Esfuerzo para producción:** 0 (funcional), Medio si se quiere feed automático

---

## Honeypot

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `honeypot/src/ssh/sshServer.js` — servidor SSH real con `ssh2`, captura credenciales, siempre rechaza auth
- `honeypot/src/http/httpServer.js` — HTTP listener real
- `honeypot/src/api/client.js` — reporta eventos al backend via HTTP POST a `/internal/event`
- `honeypotService.js` en backend — procesa eventos, ejecuta auto-ban, activa correlation engine

**Riesgo REAL:**
- `SSH_HOST_KEY_PEM` env variable es REQUERIDA — sin ella el honeypot falla al arrancar con un error explícito
- Si `HONEYPOT_INTERNAL_SECRET` no coincide con el backend, todos los eventos son rechazados (401)
- El honeypot en la config por defecto de `docker-compose.yml` puede no tener la clave configurada

**Esfuerzo para producción:** Bajo — generar y configurar `SSH_HOST_KEY_PEM`

---

## Detection Engine

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `detectionEngine.js` — 8 reglas Sigma embedded hardcodeadas (brute force, credential spray, SQLi, XSS, honeypot sweep, port scan, impossible travel, IOC match)
- In-memory event buckets con ventanas de tiempo para threshold detection
- Mapeo MITRE ATT&CK real (táctica + técnica en cada regla)
- Integrado con middleware `attackDetection.js` que corre en cada request

**Riesgo:**
- Buckets en memoria: si el proceso reinicia, los contadores se resetean. Un atacante que distribuye el ataque en ventanas de tiempo separadas por un reinicio puede evitar la detección.
- Sin reglas de archivo externas — añadir nuevas reglas requiere modificar código y redesplegar.

**Esfuerzo para producción:** 0 (funcional), Medio para persistencia de buckets en Redis

---

## Correlation Engine

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- `correlationEngine.js` — 4 reglas: BRUTE_FORCE, CREDENTIAL_SPRAY, HONEYPOT_SWEEP, MULTI_VECTOR
- Cooldown de 15min por IP/regla en memoria (previene duplicados)
- Crea incidentes reales en PostgreSQL + emite SSE
- Consulta `security_logs` PostgreSQL para conteo de eventos recientes

**Riesgo:** Mismo que Detection Engine — cooldowns en memoria se pierden con reinicios.

**Esfuerzo para producción:** 0 (funcional), Bajo para mover cooldowns a Redis

---

## SOAR Engine

**Clasificación: ⚠️ Functional but Incomplete**

**Evidencia del código:**
- `soarEngine.js` — 10 tipos de acción implementados: ban_ip, unban_ip, disable_account, revoke_user_sessions, create_incident, add_ioc, notify_webhook, send_email, isolate_endpoint, run_enrichment
- Playbooks en PostgreSQL con trigger_type y conditions
- `playbook_runs` tabla para historial de ejecuciones

**Lo que NO está implementado:**
- El **trigger automático** — no hay código que escuche eventos y dispare el motor SOAR automáticamente. Las acciones de `soarEngine.js` existen pero solo se llaman si el controlador de playbooks las invoca manualmente.
- No hay listener de eventos que conecte `correlationEngine.js` → `soarEngine.js`
- La acción `send_email` llama a `mailer.js` que NO envía emails por defecto (ver abajo)
- `isolate_endpoint` solo actualiza la BD — no hay agente real que ejecute el aislamiento

**Riesgo ALTO:** Los playbooks aparecen como "habilitados" en la UI pero no se ejecutan automáticamente. Un usuario puede creer que el SOAR está respondiendo cuando no lo hace.

**Esfuerzo para producción:** Alto — 2-3 semanas para conectar el event bus al motor SOAR

---

## AI Analysis

**Clasificación: ⚠️ Functional but Incomplete**

**Evidencia del código:**
- `aiAnalysisController.js` — `getOverview()` consulta PostgreSQL real → cuenta `security_logs`, calcula risk score, anomaly score desde datos reales
- `getAnomalyStream()` — datos horarios reales de `security_logs`
- `getUserBehavior()` — consulta `security_logs` agrupando por `user_id`
- `getRecommendations()` — consulta alertas e incidentes reales para generar recomendaciones dinámicas

**Lo que NO es real:**
- `aiCorrelationEngine.js` tiene feature extraction matemáticamente correcto pero **no tiene modelo ML entrenado** — es heurística estadística presentada con terminología ML ("feature vectors", "inference engine")
- `getRadar()` — los 6 valores del radar de superficie de ataque son calculados con fórmulas simplistas, no con análisis real
- El **anomaly score** en el frontend: incluso cuando SSE está conectado, `realTimeService._startLocalAnimators()` reemplaza el score real con un número generado aleatoriamente cada 2 segundos

**Riesgo:** El Risk Score del overview ES real (de la DB). El gráfico de anomalías en tiempo real en el dashboard ES FALSO — generado localmente en el cliente.

**Esfuerzo para producción:** Medio — principalmente eliminar `_startLocalAnimators()` y confiar en los datos reales

---

## Attack Map

**Clasificación: 🎭 Simulated**

**Evidencia del código:**
- `attackMapController.js` existe y consulta `security_logs` con GeoIP real
- PERO `realTimeService.js` en el frontend: cuando no hay token o el SSE falla, llama a `_startMock()` que usa `attackSimulator.js`
- **Incluso cuando SSE está conectado:** `_startLocalAnimators()` continúa generando IPs falsas, países falsos, payloads falsos para el gráfico de anomalías y las métricas
- `attackSimulator.js` genera IPs aleatorias, países de riesgo inventados, payloads sintéticos
- El contador `totalAttacks: 8742` en `realTimeService.js` está **hardcodeado** como valor inicial

**Lo que es real:** Si hay eventos en `security_logs` con IPs geolocalizables, `GET /api/attack-map/recent` retorna datos reales. Pero la UI del Attack Map NO usa exclusivamente este endpoint — el flujo SSE con simulador inyecta datos falsos mezclados con los reales.

**Riesgo CRÍTICO:** En una demo o producción, el 100% de los "ataques" visualizados en el mapa pueden ser inventados por `attackSimulator.js`. No hay ningún indicador visual que distinga datos reales de simulados.

**Esfuerzo para producción:** Medio — refactorizar `realTimeService.js` para NO ejecutar `_startLocalAnimators()` cuando SSE está conectado; mostrar datos reales únicamente de `GET /api/attack-map/recent`

---

## Dashboard

**Clasificación: ⚠️ Functional but Incomplete**

**Evidencia del código:**
- `statsApi.get()` y `alertsApi.getAll()` son llamadas reales al backend
- `realStats` se usa para los metric cards cuando está disponible
- Los "Recent Alerts" vienen del backend real

**Lo que NO es real:**
- Las etiquetas de cambio porcentual están hardcodeadas: `"-12% respecto a ayer"`, `"+8% de incremento"` — nunca calculadas
- `"Todos los sistemas operativos"` badge es siempre verde — no consulta `GET /ready`
- El gráfico de actividad de amenazas tiene fallback `threatData` con valores estáticos (`[12,8,24,18,32,15,7]`)
- `activeSessions` en `realTimeService._metrics` inicia en **342 hardcodeado** y deriva aleatoriamente cada 10 segundos
- `blocked: Math.round(h.n * 0.98)` — el "92% bloqueado" es una aproximación inventada, no un contador real

**Riesgo:** Un CTO o inversor que ve el dashboard no puede distinguir qué datos son reales y cuáles son estimaciones hardcodeadas.

**Esfuerzo para producción:** Medio — eliminar hardcodes, calcular cambios porcentuales desde la BD, conectar métricas de sesiones al contador real de Redis

---

## Email / MFA por Email

**Clasificación: ❌ Non-Functional (por defecto)**

**Evidencia del código:**
- `mailer.js` línea 13: si `EMAIL_HOST` no está en `.env`, usa `nodemailer.createTransport({ jsonTransport: true })`
- `jsonTransport` solo serializa el email a JSON — **nunca lo envía**
- El código no lanza error — el email "se envía" sin error pero nunca llega

**Riesgo ALTO:** El flujo de MFA por email y password reset aparentan funcionar (no lanzan error) pero el código de verificación nunca llega al usuario. Esto es silenciosamente roto.

**Esfuerzo para producción:** Bajo — configurar `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` en `.env`; considerar Mailhog para dev

---

## Endpoint Agents (EDR)

**Clasificación: ⚠️ Functional but Incomplete**

**Evidencia del código:**
- `endpointAgentService.js` — registro, heartbeat, telemetría, aislamiento implementados contra PostgreSQL
- `endpoint_agents`, `endpoint_events`, `detection_rules` tablas en migración 013
- `routes/agents.js` existe con endpoints funcionales

**Lo que falta:**
- No existe ningún agente real (binario para Windows/Linux/macOS) que se instale en endpoints
- La acción SOAR `isolate_endpoint` solo pone `status='isolated'` en la BD — ningún proceso real en el endpoint responde a ese comando
- No hay UI de gestión de agentes en el frontend

**Riesgo:** La funcionalidad EDR es un esqueleto de backend sin ninguna parte cliente real.

**Esfuerzo para producción:** Muy Alto — requiere desarrollar agentes para cada OS

---

## Multi-Tenancy

**Clasificación: ✅ Production Ready**

**Evidencia del código:**
- Migración 012 — `organizations` table, `organization_id` FK en todos los recursos
- PostgreSQL Row-Level Security (RLS) habilitado con `FORCE ROW LEVEL SECURITY`
- `tenant.js` middleware — extrae `organization_id` del usuario y lo inyecta en el contexto
- `organization_api_keys` table con hashing SHA-256

**Riesgo:** La UI de gestión de organizaciones no existe — solo la API. Un admin super-tenant debe gestionar orgs vía API directa.

**Esfuerzo para producción:** 0 (backend), Alto para UI de gestión

---

## Elasticsearch / Threat Hunting

**Clasificación: ❌ Non-Functional (por defecto)**

**Evidencia del código:**
- `elasticsearchService.js` verifica `ELASTIC_ENABLED !== 'false'` y hace `_client.ping()`
- Si ES no está disponible (que es el caso por defecto), `_available = false` y todas las funciones retornan arrays vacíos o null
- `searchController.js` retorna respuestas vacías cuando ES no está disponible

**Riesgo:** La página de Threat Hunting muestra resultados vacíos sin indicar claramente al usuario que Elasticsearch no está configurado.

**Esfuerzo para producción:** Bajo (añadir ES al docker-compose), Medio (configurar índices y mappings correctamente)

---

## Ingestion Pipeline

**Clasificación: ⚠️ Functional but Incomplete**

**Evidencia del código:**
- `ingestion/pipeline.js`, `parser.js`, `normalizer.js`, `enricher.js` — código real y completo
- Soporta CEF, JSON, syslog, Windows Event Log
- `ingestionController.js` tiene endpoints para syslog, webhook, windows

**Lo que falta:**
- El syslog receiver escucha en un puerto TCP/UDP — no está claro si está correctamente expuesto en docker-compose
- No hay UI de configuración de fuentes de ingesta
- No hay documentación de instalación del Windows Event Forwarder

**Esfuerzo para producción:** Medio — documentar e integrar en docker-compose correctamente
