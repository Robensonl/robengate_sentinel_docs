# 09 — Prioridades de Corrección

> **Auditoría:** RobenGate Sentinel — Junio 2026  
> Ordenado por impacto operativo + riesgo de seguridad + complejidad de implementación

---

## MATRIZ DE PRIORIZACIÓN

| ID | Problema | Impacto | Urgencia | Esfuerzo | Prioridad |
|----|---------|---------|---------|---------|----------|
| P1 | ThreatHunting 100% simulado | CRÍTICO | ALTA | MEDIA | 🔴 P1 |
| P2 | Dashboard charts hardcodeados | CRÍTICO | ALTA | BAJA | 🔴 P1 |
| P3 | Fallbacks silenciosos (6 módulos) | ALTO | ALTA | BAJA | 🔴 P1 |
| P4 | Honeypot FTP/SMB falsos en UI | ALTO | ALTA | BAJA | 🔴 P1 |
| P5 | Modelo MongoDB duplicado (TTL conflict) | ALTO | ALTA | BAJA | 🔴 P1 |
| P6 | Schema PostgreSQL incompleto | ALTO | ALTA | BAJA | 🔴 P1 |
| P7 | MFA codes en console.log | SEGURIDAD | ALTA | MUY BAJA | 🔴 P1 |
| P8 | Estado de detección en memoria | MEDIO | MEDIA | MEDIA | 🟡 P2 |
| P9 | MITRE/Actores hardcodeados | MEDIO | MEDIA | MEDIA | 🟡 P2 |
| P10 | API Keys no implementadas | MEDIO | MEDIA | ALTA | 🟡 P2 |
| P11 | Export sin límite de filas | SEGURIDAD | MEDIA | MUY BAJA | 🟡 P2 |
| P12 | Email de invitaciones | BAJO | BAJA | MEDIA | 🟢 P3 |
| P13 | TerminalWidget decorativo | BAJO | BAJA | BAJA | 🟢 P3 |
| P14 | CDN externo (world-atlas) | BAJO | BAJA | BAJA | 🟢 P3 |
| P15 | Timezone en reportes | BAJO | BAJA | MEDIA | 🟢 P3 |
| P16 | Código muerto (archivos) | BAJO | BAJA | MUY BAJA | 🟢 P3 |
| P17 | Reconexión SSE automática | BAJO | BAJA | BAJA | 🟢 P3 |
| P18 | Export PDF/Excel | BAJO | BAJA | ALTA | 🟢 P3 |
| P19 | Error Boundaries | BAJO | BAJA | BAJA | 🟢 P3 |
| P20 | Índices PostgreSQL faltantes | PERFORMANCE | MEDIA | BAJA | 🟡 P2 |

---

## PRIORIDAD 1 — CORRECTIVOS INMEDIATOS (Antes de cualquier demo o entrega)

---

### P1: ThreatHunting — Implementar backend real

**Problema:** El módulo de Threat Hunting es 100% simulado. Los resultados son `Math.random()`.

**Corrección:**

1. **Backend** — Crear endpoint:
   ```javascript
   // backend/src/routes/threatHunting.js
   GET /api/threat-hunting/queries  // Listar hunts guardados
   POST /api/threat-hunting/execute  // Ejecutar query sobre security_logs
   GET /api/threat-hunting/results/:id  // Obtener resultados
   ```

2. **Backend** — `threatHuntingController.js`:
   ```javascript
   // executeHunt: query a security_logs con filtros MITRE
   SELECT * FROM security_logs
   WHERE event_type = ANY($1)        -- tácticas MITRE seleccionadas
     AND created_at BETWEEN $2 AND $3
     AND ($4 IS NULL OR ip_address = $4)
   ORDER BY created_at DESC
   LIMIT 500
   ```

3. **Frontend** — Reemplazar en `ThreatHunting.jsx`:
   ```javascript
   // ANTES:
   const result = { count: Math.floor(Math.random() * 5000) + 1 };
   
   // DESPUÉS:
   const result = await threatHuntingApi.execute(huntParams);
   ```

**Esfuerzo:** 2-3 días  
**Riesgo de regresión:** Bajo (módulo nuevo)

---

### P2: Dashboard — Conectar gráficas a datos reales

**Problema:** 3 de 4 gráficas del dashboard usan arrays hardcodeados.

**Corrección:**

```javascript
// Dashboard.jsx — ANTES:
const threatData = [
  { name: 'Lun', threats: 45, blocked: 38, incidents: 2 },
  // ...
];

// DESPUÉS:
const [timelineData, setTimelineData] = useState([]);
useEffect(() => {
  metricsApi.getTimeline('7d').then(data => {
    setTimelineData(data.buckets.map(b => ({
      name: new Date(b.bucket).toLocaleDateString('es', { weekday: 'short' }),
      threats: b.total,
      critical: b.critical_count,
    })));
  });
}, []);

// Para activityData → GET /api/stats → top event types
// Para severityData → GET /api/stats → distribution by severity
```

**Esfuerzo:** 4 horas  
**Riesgo de regresión:** Bajo

---

### P3: Fallbacks silenciosos — Mostrar error visible

**Problema:** 6 módulos capturan errores de API y muestran datos falsos sin notificar al usuario.

**Corrección patrón (aplicar en todos los módulos afectados):**

```javascript
// ANTES (AuditLogs.jsx):
try {
  const data = await auditApi.getAll();
  setLogs(data);
} catch (err) {
  setLogs(DEMO_LOGS); // silencioso
}

// DESPUÉS:
try {
  const data = await auditApi.getAll();
  setLogs(data);
} catch (err) {
  setError('No se pudo cargar el audit log. Verifique la conexión al servidor.');
  setLogs([]); // o toast.error(...)
  // Si se desea modo demo explícito: setDemoMode(true)
}
```

**Módulos a corregir:** AuditLogs, HoneypotPage, ThreatIntelligence, Alerts, Incidents, Vulnerabilities  
**Esfuerzo:** 3 horas  
**Riesgo de regresión:** Bajo

---

### P4: Honeypot UI — Eliminar servicios FTP/SMB falsos

**Problema:** La UI muestra 4 honeypots pero solo existen 2 (SSH + HTTP).

**Corrección:**

```javascript
// HoneypotPage.jsx — ANTES:
const honeypotTraps = [
  { id: 1, name: 'SSH Honeypot', port: 22, ... },
  { id: 2, name: 'HTTP Decoy', port: 80, ... },
  { id: 3, name: 'FTP Trap', port: 21, ... },   // ← ELIMINAR
  { id: 4, name: 'SMB Lure', port: 445, ... },   // ← ELIMINAR
];

// DESPUÉS — solo los que existen:
const honeypotTraps = [
  { id: 1, name: 'SSH Honeypot', port: 2222, type: 'SSH', active: true },
  { id: 2, name: 'HTTP Decoy', port: 8080, type: 'HTTP', active: true },
];
// Y conectar atacTimeline a honeypotApi.getStats() real
```

**Esfuerzo:** 1 hora  
**Riesgo de regresión:** Ninguno

---

### P5: Eliminar modelo MongoDB duplicado

**Problema:** `db-nosql/security-log.model.js` compite con `db-nosql/models/SecurityLog.js` — misma colección, TTL conflictivo.

**Corrección:**
1. Verificar que ningún archivo importe `db-nosql/security-log.model.js`
2. Si no hay importaciones activas: `git rm db-nosql/security-log.model.js`
3. Si hay importaciones: actualizarlas a `db-nosql/models/SecurityLog.js`

**Esfuerzo:** 30 minutos  
**Riesgo de regresión:** Bajo (verificar con grep)

---

### P6: Schema PostgreSQL — Crear init.sql unificado

**Problema:** `schema.sql` tiene 5 tablas, el backend requiere ~17. Setup incompleto rompe el backend.

**Corrección:**
```bash
# Crear db-sql/init.sql que aplique en orden:
cat db-sql/schema.sql > db-sql/init.sql
for f in db-sql/migrations/*.sql; do
  echo "-- Migration: $f" >> db-sql/init.sql
  cat "$f" >> db-sql/init.sql
done
```

O bien, consolidar todo en un `schema.sql` completo y actualizado.

**Esfuerzo:** 2 horas  
**Riesgo de regresión:** Ninguno (solo afecta setup de entorno nuevo)

---

### P7: Remover/guardar console.log de MFA

**Problema:** Códigos MFA pueden aparecer en logs de producción.

**Corrección:**
```javascript
// authService.js — Buscar y envolver:
if (process.env.NODE_ENV !== 'production') {
  console.log(`[DEV ONLY] MFA Code for ${email}: ${code}`);
}
```

**Esfuerzo:** 15 minutos  
**Riesgo de regresión:** Ninguno

---

## PRIORIDAD 2 — MEJORAS IMPORTANTES (Sprint siguiente)

---

### P8: Persistir estado de detección en Redis

**Problema:** Las ventanas de tiempo de `detectionEngine` y los cooldowns de `correlationEngine` se pierden en restart.

**Corrección:**

```javascript
// En correlationEngine.js:
// ANTES:
const _cooldowns = new Map();

// DESPUÉS:
async function getCooldown(key) {
  return await redis.get(`cooldown:${key}`);
}
async function setCooldown(key, ttlMs) {
  await redis.set(`cooldown:${key}`, '1', 'PX', ttlMs);
}
```

**Esfuerzo:** 1 día  
**Riesgo de regresión:** Medio (lógica de detección)

---

### P9: MITRE/Actores — Conectar a MongoDB real

**Problema:** Distribución de tácticas MITRE y actores de amenaza son arrays estáticos.

**Corrección:**
1. Crear endpoint `GET /api/threats/mitre-distribution` que agregue `security_logs.mitreTactic`
2. Crear endpoint `GET /api/threats/threat-actors` que sirva actores desde `ThreatIndicator` o nueva colección
3. Conectar `ThreatIntelligence.jsx` a estos endpoints

**Esfuerzo:** 3 días  
**Riesgo de regresión:** Bajo

---

### P11: Agregar LIMIT a exports

```javascript
// logController.js
const MAX_EXPORT_ROWS = 100000;
const result = await query(
  `SELECT * FROM security_logs WHERE ${conditions} LIMIT $${paramCount + 1}`,
  [...values, MAX_EXPORT_ROWS]
);
if (result.rows.length === MAX_EXPORT_ROWS) {
  res.setHeader('X-Export-Truncated', 'true');
}
```

**Esfuerzo:** 30 minutos  
**Riesgo de regresión:** Muy bajo

---

### P20: Índices PostgreSQL faltantes

```sql
-- Agregar a schema o nueva migración:
CREATE INDEX CONCURRENTLY idx_security_logs_event_type 
  ON security_logs(event_type, created_at DESC);

CREATE INDEX CONCURRENTLY idx_security_logs_ip_time 
  ON security_logs(ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY idx_incidents_status 
  ON incidents(status);
```

**Esfuerzo:** 1 hora  
**Riesgo de regresión:** Ninguno (CONCURRENTLY)

---

## PRIORIDAD 3 — MEJORAS DESEABLES (Antes de v1.0)

### P12: Implementar email de invitaciones

Descomentar y completar `emailService.sendInvite()` en `organizations.js`.  
Requiere: template de email, variables de entorno SMTP configuradas.  
**Esfuerzo:** 1 día

### P13: TerminalWidget — Conectar a SSE o eliminar

Opciones:
- Conectar a `RT_EVENTS.LOG` del SSE real para mostrar logs reales
- Reemplazar con un componente de "últimos 10 eventos" consultando `/api/logs`
- Eliminar el componente si no aporta valor real

**Esfuerzo:** 4 horas

### P14: Bundlear topología del mapa

```bash
# Descargar y bundlear world-atlas:
cd frontend/public
curl -o world-atlas.json "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

# En AttackMap.jsx:
const WORLD_TOPOLOGY = "/world-atlas.json"; // local, no CDN
```

**Esfuerzo:** 30 minutos

### P17: Reconexión SSE automática

```javascript
// realTimeService.js — agregar reconexión exponential backoff:
let reconnectDelay = 1000;
eventSource.onerror = () => {
  eventSource.close();
  setTimeout(() => connect(), reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 30000);
};
```

**Esfuerzo:** 2 horas

### P18: Export PDF/Excel

Requiere decisión de arquitectura:
- **PDF:** puppeteer (renderiza HTML a PDF) o pdfkit (generación programática)
- **Excel:** exceljs o xlsx

**Esfuerzo:** 3-5 días

### P19: Error Boundaries en React

```javascript
// Agregar a cada módulo principal:
<ErrorBoundary fallback={<ModuleErrorFallback />}>
  <ThreatHunting />
</ErrorBoundary>
```

**Esfuerzo:** 4 horas

---

## ROADMAP DE CORRECCIONES

```
Semana 1:
  ├── P7:  console.log MFA (15 min)
  ├── P5:  Eliminar modelo MongoDB duplicado (30 min)
  ├── P6:  Crear init.sql unificado (2h)
  ├── P4:  Corregir honeypot UI (1h)
  ├── P3:  Fallbacks silenciosos → error visible (3h)
  └── P11: LIMIT en exports (30 min)

Semana 2:
  ├── P2:  Dashboard charts → datos reales (4h)
  ├── P20: Índices PostgreSQL (1h)
  └── P14: Bundlear world-atlas (30 min)

Semana 3:
  ├── P8:  Estado detección en Redis (1 día)
  └── P9:  MITRE/Actores → datos reales (3 días)

Semana 4:
  ├── P1:  ThreatHunting backend real (2-3 días)
  └── P17: Reconexión SSE (2h)

Semana 5-6:
  ├── P10: API Keys (5+ días)
  ├── P13: TerminalWidget (4h)
  ├── P19: Error Boundaries (4h)
  └── P12: Email invitaciones (1 día)

Semana 7-8:
  ├── P15: Timezone en reportes (2 días)
  └── P18: Export PDF/Excel (3-5 días)
```
