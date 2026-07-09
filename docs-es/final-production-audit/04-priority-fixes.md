# Fixes Prioritarios — Orden de Acción

**Auditoría:** 2026-06-06  
**Principio:** Máximo impacto, mínimo esfuerzo primero. Solo fixes que mejoran la honestidad y funcionalidad real.  

---

## PRIORIDAD 1 — Fixes Inmediatos (< 1 día cada uno)

### F1: Eliminar datos seed de producción

**Archivo:** `db-sql/migrations/011_incidents_vulns.sql`  
**El problema:** Los `INSERT INTO incidents` y `INSERT INTO vulnerabilities` con datos de demo se ejecutan en toda instalación nueva.  

**Fix:**
```sql
-- Nueva migración: 014_remove_seed_data.sql
DELETE FROM incident_events WHERE incident_id IN (
  SELECT id FROM incidents WHERE tags @> ARRAY['demo-data']::text[]
);
DELETE FROM incidents WHERE title IN (
  'Coordinated DDoS on API Gateway',
  'Active SQL Injection on Users Endpoint',
  'Credential Stuffing Campaign — Auth Service',
  'Stored XSS in User Profile Component'
);
-- NO eliminar CVEs — pueden ser útiles como referencia
-- Pero marcarlos claramente como demo:
UPDATE vulnerabilities SET tags = array_append(tags, 'demo') WHERE cve_id IS NOT NULL;
```

**Alternativa menos invasiva:** Añadir `IF current_setting('app.demo_mode', TRUE) = 'true' THEN` alrededor de los inserts seed.

---

### F2: Configurar Email correctamente o mostrar error claro

**Archivo:** `backend/src/utils/mailer.js`  
**El problema:** El transporte `jsonTransport` simula envío sin hacerlo.  

**Fix A (configuración):** Añadir a `.env.example`:
```
EMAIL_HOST=smtp.mailgun.org  
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-usuario
EMAIL_PASS=tu-password
EMAIL_FROM=noreply@tudominio.com
```

**Fix B (fail-fast en producción):**
```javascript
function getTransport() {
  if (transport) return transport;
  if (process.env.EMAIL_HOST) {
    // ... crear transport real
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('EMAIL_HOST is required in production');
  } else {
    // dev: log to console
    transport = nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}
```

---

### F3: Documentar SSH_HOST_KEY_PEM en README y docker-compose

**Archivo:** `honeypot/src/ssh/sshServer.js`, `docker-compose.yml`  

**Fix:** Añadir al README de instalación:
```bash
# Generar clave para el honeypot SSH (una sola vez)
ssh-keygen -t rsa -b 4096 -N "" -f ssh_host_key
export SSH_HOST_KEY_PEM=$(base64 -w 0 ssh_host_key)
```

Y en `docker-compose.yml`:
```yaml
honeypot:
  environment:
    SSH_HOST_KEY_PEM: ${SSH_HOST_KEY_PEM:?Run: ssh-keygen -t rsa -b 4096 -N "" -f ssh_host_key && export SSH_HOST_KEY_PEM=$(base64 -w 0 ssh_host_key)}
```

---

## PRIORIDAD 2 — Fixes de Honestidad en la UI (< 1 semana)

### F4: Eliminar `_startLocalAnimators()` cuando SSE está conectado

**Archivo:** `frontend/src/shared/services/realTimeService.js`  

**El problema:** La función `_startLocalAnimators()` se llama desde `es.onopen` — es decir, se ejecuta precisamente cuando la conexión SSE real está establecida. Esto garantiza que incluso con datos reales, los gráficos muestran datos inventados.

**Fix:**
```javascript
es.onopen = () => {
  clearTimeout(timeout);
  this._es   = es;
  this._mode = "sse";
  emit(RT_EVENTS.CONNECTION, { status: "connected", mode: "sse" });
  // ELIMINAR: this._startLocalAnimators();
  // Los datos deben venir solo del backend via SSE
};
```

El gráfico de anomalías debe actualizarse solo cuando el backend envíe un evento `metric` — y si no envía, debe permanecer en el último valor conocido, no inventar uno nuevo cada 2 segundos.

---

### F5: Reemplazar métricas hardcodeadas del Dashboard

**Archivo:** `frontend/src/features/dashboard/pages/Dashboard.jsx`  

**Fix:** Calcular cambios porcentuales desde datos reales. Añadir a `GET /api/stats`:
```javascript
// En statsController.js — añadir comparación con período anterior
const yesterday = await query(`
  SELECT COUNT(*)::int AS n
  FROM security_logs
  WHERE created_at BETWEEN NOW() - INTERVAL '48h' AND NOW() - INTERVAL '24h'
`);
// Calcular delta
const change = ((last24h - yesterday) / Math.max(yesterday, 1)) * 100;
```

En el frontend:
```jsx
change={realStats?.threatChange 
  ? `${realStats.threatChange > 0 ? '+' : ''}${realStats.threatChange.toFixed(0)}% vs ayer`
  : "Sin datos comparativos"}
```

---

### F6: Mostrar indicador "DEMO" cuando el simulador está activo

**Archivo:** `frontend/src/shared/services/realTimeService.js` + `AttackMap.jsx`  

**Fix:** Exponer el modo actual del servicio:
```javascript
get mode() { return this._mode; } // "sse" | "mock" | "idle"
```

En `AttackMap.jsx`:
```jsx
{realTimeService.mode === "mock" && (
  <div className="demo-badge">
    MODO DEMO — Datos Simulados
  </div>
)}
```

Este fix no elimina la simulación pero la hace honesta.

---

### F7: Limpiar métricas iniciales hardcodeadas

**Archivo:** `frontend/src/shared/services/realTimeService.js`  

```javascript
// ANTES:
this._metrics = {
  totalAttacks:  8742,   // ← inventado
  blocked:       8634,   // ← inventado
  activeSessions: 342,   // ← inventado
  criticalAlerts: 3,     // ← inventado
  uptime:        99.99,  // ← nunca calculado
};

// DESPUÉS:
this._metrics = {
  totalAttacks:  0,
  blocked:       0,
  activeSessions: 0,
  criticalAlerts: 0,
  uptime:        null,
};
```

Los valores deben poblarse desde la primera respuesta de `GET /api/stats`, no desde valores arbitrarios.

---

## PRIORIDAD 3 — Fixes de Robustez (1-3 semanas)

### F8: Conectar SOAR al Correlation Engine

**Archivos:** `backend/src/services/correlationEngine.js`, `backend/src/services/soarEngine.js`  

**Fix mínimo:**
```javascript
// En correlationEngine.js, después de createAutoIncident():
const soarEngine = require('./soarEngine');
soarEngine.processEvent({
  type:        'incident_created',
  ip_address:  sourceIp,
  severity:    severity,
  incident_id: incident.id,
}).catch(err => logger.error('SOAR trigger failed', { err: err.message }));
```

Esto activa el motor SOAR en cada incidente auto-creado. Los playbooks con `trigger_type='event'` deben evaluarse contra el evento.

**Esfuerzo:** Medio — la infraestructura ya existe, falta el "cable"

---

### F9: Persistir cooldowns del Detection Engine en Redis

**Archivo:** `backend/src/services/detectionEngine.js`  

```javascript
// ANTES: in-memory Map — se pierde en reinicios
const _eventBuckets = new Map();

// DESPUÉS: Redis con TTL
async function getBucketFromRedis(key, windowMs) {
  const data = await redis.get(`det:${key}`);
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = data ? JSON.parse(data).filter(t => t > cutoff) : [];
  return bucket;
}
```

**Esfuerzo:** Bajo-Medio — Redis ya está en el proyecto

---

### F10: Script de instalación con generación automática de secrets

**Archivo:** Nuevo `scripts/setup.sh` o `scripts/setup.ps1`  

```powershell
# Generar JWT_SECRET y JWT_REFRESH_SECRET
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach { [byte](Get-Random -Max 256) }))
$refreshSecret = [Convert]::ToBase64String((1..32 | ForEach { [byte](Get-Random -Max 256) }))

# Generar SSH host key para el honeypot
ssh-keygen -t rsa -b 4096 -N "" -f ssh_host_key
$sshKey = [Convert]::ToBase64String([IO.File]::ReadAllBytes("ssh_host_key"))

# Escribir .env
@"
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$refreshSecret
SSH_HOST_KEY_PEM=$sshKey
EMAIL_HOST=
EMAIL_PORT=587
"@ | Out-File -Encoding UTF8 .env
```

---

## Tabla de Priorización Final

| Fix | Archivo(s) | Esfuerzo | Impacto |
|---|---|---|---|
| F1 — Eliminar datos seed | migrations/011 | 2h | 🔴 Crítico |
| F2 — Fix email / fail-fast | mailer.js | 2h | 🔴 Crítico |
| F3 — SSH_HOST_KEY_PEM docs | README, docker-compose | 2h | 🟠 Alto |
| F4 — Eliminar _startLocalAnimators | realTimeService.js | 2h | 🔴 Crítico |
| F5 — Métricas reales en dashboard | statsController + Dashboard | 1 semana | 🟠 Alto |
| F6 — Badge DEMO en Attack Map | realTimeService + AttackMap | 2h | 🟠 Alto |
| F7 — Métricas iniciales = 0 | realTimeService.js | 30min | 🟠 Alto |
| F8 — Conectar SOAR | correlationEngine + soarEngine | 2 semanas | 🟠 Alto |
| F9 — Redis para buckets | detectionEngine | 3 días | 🟡 Medio |
| F10 — Script de instalación | scripts/setup | 1 día | 🟡 Medio |
