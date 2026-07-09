# 10 — Plan de Producción: Checklist Completo

> **Auditoría:** RobenGate Sentinel — Junio 2026  
> Estado actual: **NO LISTO para producción**  
> Estimación para producción: **6-8 semanas de trabajo focalizado**

---

## VEREDICTO EJECUTIVO

RobenGate Sentinel tiene una **base técnica sólida** — el backend es genuinamente robusto, la seguridad está bien implementada, y la arquitectura es escalable. Sin embargo, el **frontend tiene demasiadas simulaciones en módulos críticos** que harían que un analista de SOC trabajara con datos falsos. Antes de producción deben resolverse los problemas de integridad de datos.

---

## CHECKLIST PRE-PRODUCCIÓN

### FASE 0 — Integridad de datos (CRÍTICO — Semana 1)

- [ ] **Eliminar** `db-nosql/security-log.model.js` (modelo duplicado con TTL conflictivo)
- [ ] **Crear** `db-sql/init.sql` que consolide schema.sql + todas las migraciones en orden
- [ ] **Verificar** que `NODE_ENV !== 'production'` proteja todos los `console.log` de credenciales
- [ ] **Añadir LIMIT** a los endpoints de export de logs y audit (máx. 100k filas)
- [ ] **Eliminar** trampas FTP/SMB de `HoneypotPage.jsx` (no existen en el honeypot real)
- [ ] **Reemplazar** fallbacks silenciosos por mensajes de error explícitos en: AuditLogs, Alerts, Incidents, Vulnerabilities, ThreatIntelligence, HoneypotPage

### FASE 1 — Integridad visual (CRÍTICO — Semana 2)

- [ ] **Conectar** `Dashboard.jsx` charts a `/api/metrics/timeline` y `/api/stats`
- [ ] **Conectar** MITRE distribution chart a datos reales de MongoDB (`security_logs.mitreTactic`)
- [ ] **Implementar** `GET /api/threat-hunting/execute` con query real a PostgreSQL
- [ ] **Reemplazar** `ThreatHunting.jsx` Math.random() por llamada a API real
- [ ] **Bundlear** `world-atlas.json` localmente (eliminar dependencia de CDN externo)

### FASE 2 — Robustez técnica (Semana 3-4)

- [ ] **Persistir** ventanas de detección y cooldowns de correlación en Redis (no en memoria)
- [ ] **Agregar** índices PostgreSQL faltantes: `(event_type, created_at)`, `(ip_address, created_at)`, `incidents.status`
- [ ] **Implementar** reconexión SSE con exponential backoff en `realTimeService.js`
- [ ] **Configurar** `SERVER_LAT`/`SERVER_LNG` correctos en variables de entorno de producción
- [ ] **Verificar** Elasticsearch disponible al inicio y loggear advertencia si no está
- [ ] **Agregar** Error Boundaries en módulos principales del frontend

### FASE 3 — Funcionalidades completadas (Semana 5-6)

- [ ] **Implementar** gestión real de API Keys (backend + frontend)
- [ ] **Implementar** email de invitaciones a organizaciones
- [ ] **Conectar** TerminalWidget a SSE real o eliminarlo
- [ ] **Crear** página de SOAR/Playbooks en el frontend
- [ ] **Crear** página de EDR Agents en el frontend
- [ ] **Añadir** timezone awareness en reportes

### FASE 4 — Calidad y observabilidad (Semana 7-8)

- [ ] **Implementar** export PDF (puppeteer o pdfkit)
- [ ] **Implementar** export Excel (exceljs)
- [ ] **Agregar** rangos "Hoy" / "Ayer" / "Últimos 30 min" en filtros de tiempo
- [ ] **Probar** responsive design en dispositivos móviles
- [ ] **Eliminar** `LandingPage_temp.jsx` (archivo sin importar)
- [ ] **Ejecutar** `depcheck` para identificar dependencias no utilizadas

---

## CHECKLIST DE INFRAESTRUCTURA

### Variables de entorno requeridas

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/robengate
PGPOOL_MIN=5
PGPOOL_MAX=20

# MongoDB
MONGO_URI=mongodb://user:pass@host:27017/robengate

# Redis
REDIS_URL=redis://user:pass@host:6379

# Elasticsearch (opcional pero recomendado)
ELASTICSEARCH_URL=https://host:9200
ELASTICSEARCH_API_KEY=xxx

# Auth
JWT_SECRET=<64+ char random secret>
JWT_REFRESH_SECRET=<64+ char random secret — diferente del anterior>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_NAME=RobenGate Sentinel

# Email
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<password>
EMAIL_FROM=RobenGate Sentinel <noreply@yourdomain.com>

# Server Location para Attack Map
SERVER_LAT=<tu latitud real>
SERVER_LNG=<tu longitud real>

# Honeypot SSH Key
SSH_HOST_KEY_PEM=<persistent PEM key>

# Frontend
VITE_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

### Kubernetes / Docker

- [ ] **Verificar** que `health/ready` y `health/live` funcionan correctamente para k8s probes
- [ ] **Configurar** `resources.limits` en todos los deployments (CPU + memoria)
- [ ] **Verificar** que Redis tiene persistencia habilitada (AOF o RDB)
- [ ] **Configurar** PostgreSQL con réplica de lectura para queries de analytics
- [ ] **Configurar** backups automáticos de PostgreSQL y MongoDB
- [ ] **Configurar** PVC para Elasticsearch si se usa

### Seguridad de infraestructura

- [ ] **Habilitar** TLS en todos los servicios internos
- [ ] **Configurar** network policies en k8s (frontend → backend, backend → DBs, no frontend → DBs directo)
- [ ] **Revisar** CORS origin en producción (no wildcards)
- [ ] **Configurar** WAF externo (Cloudflare, AWS WAF, etc.)
- [ ] **Habilitar** audit logging de accesos a la base de datos
- [ ] **Rotar** secretos JWT antes de lanzamiento

---

## CHECKLIST DE SEGURIDAD

### Autenticación y autorización

- [x] JWT con secretos duales (access + refresh)
- [x] JWT en memoria (no localStorage para access token)
- [x] Refresh token en HttpOnly cookie
- [x] TOTP (Google Authenticator)
- [x] WebAuthn (Passkeys)
- [x] Backup codes
- [x] Email OTP
- [x] MFA step-up basado en risk score
- [x] RBAC 4 niveles con middleware enforce
- [x] Rate limiting en login (20 intentos/15min)
- [x] Rate limiting en MFA (10 intentos/5min)
- [x] Auto-ban de IPs tras fallos repetidos
- [ ] **PENDIENTE:** Verificar gate NODE_ENV en console.log de MFA codes

### Protección de API

- [x] Helmet (CSP, HSTS, X-Frame-Options, no-sniff)
- [x] CORS con whitelist de origins
- [x] HPP (HTTP Parameter Pollution)
- [x] NoSQL injection prevention
- [x] Null-byte prevention
- [x] XSS pattern matching en middleware
- [x] SQLi pattern matching en middleware
- [x] Input validation con Zod
- [x] Parameterized queries (sin string interpolation en SQL)
- [ ] **PENDIENTE:** LIMIT en exports para prevenir DoS

### Sesiones y tokens

- [x] Redis blacklist para tokens revocados
- [x] Sesiones con TTL
- [x] Revocación de sesión individual y masiva
- [x] Detección de dispositivos anómalos
- [x] Impossible travel detection

---

## CHECKLIST DE TESTING

> Estado actual: **Sin tests automatizados detectados**

- [ ] Unit tests para `detectionEngine.js` (reglas Sigma)
- [ ] Unit tests para `correlationEngine.js` (lógica de umbrales)
- [ ] Unit tests para `riskEngine.js` (scoring)
- [ ] Integration tests para `authService.js` (login flows)
- [ ] API tests para endpoints críticos (/auth, /incidents, /threats)
- [ ] E2E tests para flujo de login + MFA
- [ ] Load tests para `security_logs` con >1M registros

**Esta es una brecha crítica** para producción. Sin tests, cada corrección puede introducir regresiones no detectadas.

---

## ESTIMACIÓN DE ESFUERZO TOTAL

| Fase | Semanas | Equipo | Bloqueante para producción |
|------|---------|--------|--------------------------|
| Fase 0: Integridad de datos | 1 semana | 1 dev full-stack | ✅ SÍ |
| Fase 1: Integridad visual | 1 semana | 1 dev frontend | ✅ SÍ |
| Fase 2: Robustez técnica | 2 semanas | 1 dev full-stack | ✅ SÍ |
| Fase 3: Funcionalidades | 2 semanas | 2 devs | Recomendado |
| Fase 4: Calidad | 2 semanas | 1 QA + 1 dev | Recomendado |
| Testing básico | Continuo | 1 dev | ✅ SÍ (mínimo) |

**Mínimo para producción (Fases 0-2 + testing básico):** ~6 semanas  
**Producción completa (todas las fases):** ~8-10 semanas

---

## RESUMEN DE PUNTUACIONES FINALES

| Dimensión | Puntuación | Justificación |
|-----------|-----------|--------------|
| **Frontend** | **6.5 / 10** | Buen diseño, demasiados datos simulados en módulos críticos |
| **Backend** | **8.5 / 10** | Sólido, real, bien estructurado. Minors: estado volátil, email pendiente |
| **Seguridad** | **8.0 / 10** | Excelente base auth, MFA múltiple, RBAC. Menor: console.log MFA |
| **SIEM** | **7.0 / 10** | Correlación y detección reales, pero ThreatHunting es mock y estado no persiste |
| **Observabilidad** | **7.0 / 10** | Prometheus + Winston + SSE. Sin dashboards centralizados ni alerting externo |
| **Reportes** | **5.0 / 10** | Solo CSV funciona. Sin PDF/Excel. Charts principales hardcodeados |
| **Bases de Datos** | **7.0 / 10** | Buen diseño y esquema. Schema incompleto, modelo MongoDB duplicado |
| **Experiencia de Usuario** | **6.5 / 10** | UI profesional, pero módulos falsos visibles dañan credibilidad |
| **Preparación para Producción** | **5.5 / 10** | Infraestructura lista, pero datos falsos + sin tests = no listo |

### Promedio Ponderado: **6.78 / 10**

```
Interpretación:
  9-10: Listo para producción sin cambios
  7-8:  Listo con correcciones menores
  5-6:  Requiere trabajo significativo antes de producción
  3-4:  Prototipo, no apto para producción
  0-2:  Concepto, sin implementación real
  
→ RobenGate Sentinel: 6.78 — "Requiere trabajo significativo (6-8 semanas)"
```

---

## MENSAJE FINAL AL EQUIPO

**Las buenas noticias:**  
El backend es genuinamente excelente. La seguridad está bien pensada. La arquitectura de microservicios y el motor de correlación están a nivel enterprise. Hay mucho trabajo real y valioso aquí.

**El problema central:**  
El frontend prometió más de lo que entregó. Módulos que parecen funcionales (Threat Hunting, Dashboard, Honeypot, Threat Intelligence) están usando datos inventados. Esto no es solo una cuestión de UX — es una cuestión de **integridad**: un SOC que confíe en estos datos puede perder ataques reales.

**El camino a seguir:**  
6 semanas de trabajo focalizado (sin añadir funcionalidades nuevas) para conectar el frontend a los datos reales que el backend ya produce. El backend ya tiene los endpoints — el trabajo es conectarlos.
