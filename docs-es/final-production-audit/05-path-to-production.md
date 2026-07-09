# Path to Production — Plan de Acción

**Auditoría:** 2026-06-06  
**Objetivo:** Estado actual → plataforma honestamente desplegable en producción  
**Definición de "producción":** Un cliente real puede instalarla, usarla, y confiar en que los datos son reales.  

---

## Estado Actual Honesto

```
Lo que funciona en producción HOY:
✅ Autenticación completa (login, MFA, WebAuthn, password reset*)
✅ RBAC — roles y permisos aplicados en backend y frontend
✅ Security Logs — escritura y lectura real
✅ Audit Logs — inmutables en MongoDB
✅ Gestión de alertas — triaje, estados, workflow
✅ Gestión de incidentes — CRUD, timeline, correlación auto
✅ Threat Intelligence — IOCs, CRUD, lookup
✅ Honeypot SSH + HTTP*
✅ Detection Engine — 8 reglas Sigma integradas
✅ Correlation Engine — 4 reglas automáticas
✅ Multi-tenancy — aislamiento por organización
✅ Devices y Sessions — gestión real

*requiere configuración de env vars adicionales

Lo que aparenta funcionar pero NO funciona:
🎭 Attack Map — 100% datos inventados por defecto
🎭 Anomaly Score en tiempo real — random walk local
🎭 Métricas del dashboard (cambios %) — hardcodeadas
🎭 SOAR playbooks "habilitados" — no se disparan
🎭 Datos seed de incidentes/CVEs — inventados como si fueran reales

Lo que no funciona en la configuración por defecto:
❌ Email MFA / Password Reset — silenciosamente roto
❌ Elasticsearch / Threat Hunting — sin configurar
❌ Honeypot SSH — falta SSH_HOST_KEY_PEM
```

---

## Fase 0: Honestidad Inmediata (1-3 días)

Estos cambios no requieren nueva funcionalidad — solo eliminan las mentiras.

### 0.1 — Añadir badge DEMO al Attack Map

```javascript
// realTimeService.js
get mode() { return this._mode; }
```

```jsx
// AttackMap.jsx
{realTimeService.mode === "mock" && (
  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300 border border-yellow-600">
    MODO DEMO — DATOS SIMULADOS
  </div>
)}
```

**Resultado:** Un usuario viendo el attack map sabe si los datos son reales o demo.

### 0.2 — Eliminar `_startLocalAnimators()` de la conexión SSE

```javascript
// En es.onopen — eliminar esta línea:
this._startLocalAnimators(); // ← ELIMINAR
```

**Resultado:** Cuando hay datos reales, los gráficos muestran datos reales.

### 0.3 — Resetear métricas iniciales a 0

```javascript
this._metrics = { totalAttacks: 0, blocked: 0, activeSessions: 0, criticalAlerts: 0 };
```

### 0.4 — Eliminar datos seed de demo en nueva instalación

Crear `db-sql/migrations/014_cleanup_seed_data.sql` que elimine los incidentes y marque las vulnerabilidades como demo.

**Tiempo total Fase 0:** ~4 horas de código

---

## Fase 1: Funcionalidad Básica Completa (1-2 semanas)

### 1.1 — Email funcional

- Configurar SMTP en `.env.example`
- Añadir Mailhog a `docker-compose.yml` para desarrollo
- Fail-fast en producción si `EMAIL_HOST` no está configurado

### 1.2 — Honeypot completamente configurado

- Script de generación de `SSH_HOST_KEY_PEM`
- Integración en `docker-compose.yml`
- Documentación en README

### 1.3 — Métricas de Dashboard desde datos reales

- `statsController.js`: añadir comparación con período anterior (delta %)
- `Dashboard.jsx`: usar delta real, no strings hardcodeados
- `activeSessions`: obtener de `SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()`

### 1.4 — Script de instalación

- `scripts/setup.ps1` / `scripts/setup.sh`
- Genera JWT_SECRET, JWT_REFRESH_SECRET, SSH_HOST_KEY_PEM automáticamente
- Crea `.env` desde `.env.example`

**Resultado de Fase 1:** La plataforma puede instalarse correctamente con un README que funciona.

---

## Fase 2: SOAR Real (2-3 semanas)

### 2.1 — Event bus SOAR

```javascript
// correlationEngine.js
const soarEngine = require('./soarEngine');

async function createAutoIncident(...) {
  const incident = await db.insert(...);
  // Disparar SOAR
  await soarEngine.processEvent({
    type: 'INCIDENT_CREATED',
    severity: severity,
    ip_address: sourceIp,
    incident_id: incident.id,
  });
  return incident;
}
```

### 2.2 — UI de Playbooks

- Página `/playbooks` con lista de playbooks y toggle enabled/disabled
- Ver historial de ejecuciones (`playbook_runs`)
- El editor de playbooks puede ser JSON en v1 (sin builder visual)

**Resultado de Fase 2:** Los playbooks se disparan automáticamente. La propuesta de valor de SOAR es real.

---

## Fase 3: Threat Hunting Real (1-2 semanas)

### 3.1 — Elasticsearch en docker-compose

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
  healthcheck:
    test: curl -f http://localhost:9200/_cluster/health
```

### 3.2 — Mensaje en UI cuando ES no disponible

```jsx
{!elasticsearchAvailable && (
  <div className="warning-banner">
    Elasticsearch no configurado. Búsqueda avanzada no disponible.
    <a href="/docs/setup">Ver configuración →</a>
  </div>
)}
```

**Resultado de Fase 3:** Threat Hunting funciona o informa claramente por qué no funciona.

---

## Fase 4: Calidad de Producción (4-8 semanas)

### 4.1 — Tests automatizados

Tests mínimos obligatorios:
```
auth.test.js          — login, MFA, WebAuthn, refresh token
rbac.test.js          — roles, minRole, readOnly middleware
detectionEngine.test.js — reglas Sigma, buckets, thresholds
correlationEngine.test.js — creación de incidentes automáticos
riskEngine.test.js    — scoring, signals, thresholds
```

### 4.2 — CI/CD pipeline básico

```yaml
# .github/workflows/test.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
      mongodb:
        image: mongo:7
    steps:
      - run: npm test
```

### 4.3 — Persistir buckets de Detection Engine en Redis

Los in-memory event buckets sobreviven a reinicios si se almacenan en Redis con TTL apropiado.

---

## Cronograma Estimado

```
Semana 1:   Fase 0 + Fase 1 (honestidad + configuración básica)
Semana 2-3: Fase 2 (SOAR event bus + UI básica de playbooks)
Semana 4:   Fase 3 (Elasticsearch en docker-compose + UI fallback)
Semana 5-8: Fase 4 (tests, CI/CD, Redis buckets)
```

---

## Lo que NO necesita trabajo

Estas áreas están production-ready y no requieren cambios:

- Autenticación (auth service, JWT, WebAuthn, TOTP, backup codes)
- RBAC (backend + frontend, bien implementado)
- Security Logs + Audit Logs
- Gestión de Alertas e Incidentes
- Threat Intelligence CRUD
- Detection Engine (8 reglas built-in)
- Correlation Engine (4 reglas automáticas)
- Multi-tenancy (PostgreSQL RLS)
- Devices y Sessions

---

## Veredicto Final

**RobenGate Sentinel es un proyecto técnicamente sólido en sus componentes de seguridad core.** La autenticación, los logs, las alertas, el RBAC y la detección de amenazas están correctamente implementados.

**El problema no es el código — es la honestidad de la presentación.** Los módulos de visualización (attack map, dashboard metrics, anomaly score) están construidos sobre datos simulados que se mezclan con datos reales sin ninguna distinción visual. Esto es el bloqueador principal para uso en producción real.

**Con 2-3 días de trabajo en Fase 0, la plataforma ya puede presentarse honestamente.** Las features que son reales lo son genuinamente. Las que son demo deben etiquetarse como demo.

**Con 4-6 semanas adicionales, la plataforma está lista para un cliente piloto real.**
