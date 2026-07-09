# Features Faltantes — Lo Que Falta Para Producción Real

**Auditoría:** 2026-06-06  
**Criterio:** Algo está "faltante" si un usuario razonablemente esperaría que funcione pero no funciona.  

---

## CRÍTICO — Rompe la Propuesta de Valor

### M1: Email no se envía en configuración por defecto

**Módulo:** Auth / MFA  
**Código:** `backend/src/utils/mailer.js` línea 18: `{ jsonTransport: true }` cuando `EMAIL_HOST` no está definido  

**Impacto:** 
- MFA por Email no funciona → usuario no puede autenticarse con email OTP
- Password Reset no funciona → usuario bloqueado permanentemente si olvida contraseña
- No hay error visible → el flujo parece funcionar pero el código nunca llega

**Lo que falta:**
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=xxx
EMAIL_PASS=xxx
EMAIL_FROM=noreply@tudominio.com
```
Y documentación de configuración en el README de instalación.

**Riesgo:** Alto — el flujo silenciosamente no entrega emails  
**Esfuerzo:** Bajo (1-2 horas)

---

### M2: SOAR no se dispara automáticamente

**Módulo:** SOAR / Playbooks  
**Código:** `backend/src/services/soarEngine.js` — toda la lógica existe  

**Lo que falta:** Un listener que conecte eventos de seguridad con el motor SOAR. No existe ninguna llamada del tipo:

```javascript
// Esto NO EXISTE en el código:
correlationEngine.on('incident_created', (incident) => {
  soarEngine.processEvent(incident);
});
```

El `soarEngine.js` es una librería sin consumidor. Las acciones `ban_ip`, `create_incident`, `notify_webhook` están implementadas pero nunca se llaman automáticamente.

**Impacto:** Los 4 playbooks seed que aparecen como "habilitados" no hacen nada.

**Esfuerzo:** Alto (2-3 semanas) — requiere diseñar e implementar el event bus + trigger evaluation loop

---

### M3: Attack Map muestra datos 100% inventados por defecto

**Módulo:** Attack Map  
**Código:** `realTimeService._startMock()` + `_startLocalAnimators()`  

**Lo que falta:**
1. Eliminar `_startLocalAnimators()` cuando SSE está conectado
2. El Attack Map debe usar **exclusivamente** `GET /api/attack-map/recent` con polling o SSE real
3. Si no hay datos, mostrar un mapa vacío con texto "Sin eventos en las últimas 24h"

**Impacto:** Todos los "ataques" visualizados son ficticios  
**Esfuerzo:** Medio (1 semana)

---

### M4: Datos seed en producción

**Módulo:** Database  
**Código:** `db-sql/migrations/011_incidents_vulns.sql`  

**Lo que falta:** 
- Separar los datos seed a un archivo de fixtures separado que NO corra en producción
- O añadir una migración de limpieza: `DELETE FROM incidents WHERE tags @> ARRAY['demo-data']`
- El flag de "demo data" no existe actualmente

**Impacto:** Clientes nuevos ven incidentes y vulnerabilidades inventadas como datos reales  
**Esfuerzo:** Bajo (2-4 horas)

---

## ALTO — Funcionalidad Crítica Incompleta

### M5: SSH_HOST_KEY_PEM no configurado = Honeypot no arranca

**Módulo:** Honeypot  
**Código:** `honeypot/src/ssh/sshServer.js` línea 31: `throw new Error('SSH_HOST_KEY_PEM env variable is required')`  

**Lo que falta:**
- Instrucciones de generación de la clave en el README
- El `docker-compose.yml` debe incluir esta variable o un volumen con el archivo
- Script de generación automática para el primer arranque

**Esfuerzo:** Bajo (1-2 horas)

---

### M6: Elasticsearch no está en el docker-compose por defecto

**Módulo:** Threat Hunting / Search  
**Código:** `elasticsearchService.js` — degradación graceful implementada, pero la UI de Threat Hunting estará vacía  

**Lo que falta:**
- Añadir Elasticsearch al `docker-compose.yml` (o `docker-compose.full.yml`)
- Variables de entorno documentadas
- Mensaje en la UI cuando ES no está disponible: "Elasticsearch no configurado — búsqueda avanzada no disponible"

**Esfuerzo:** Bajo-Medio (1-3 días)

---

### M7: Métricas del Dashboard no reflejan datos reales

**Módulo:** Dashboard  
**Código:** `Dashboard.jsx`  

**Lo que falta:**
- Calcular cambios porcentuales reales comparando períodos (hoy vs ayer, etc.)
- `activeSessions` debe venir de `SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()`, no de un número aleatorio
- El "blocked" ratio debe calcularse de datos reales, no `h.n * 0.98`
- El badge de "All Systems Operational" debe conectarse al response de `/ready`

**Esfuerzo:** Medio (1 semana)

---

### M8: No hay UI de gestión de Organizaciones

**Módulo:** Multi-tenancy  
**Código:** `routes/organizations.js` — API existe; no hay página en el frontend  

**Lo que falta:** 
- Página `/organizations` para admin super-tenant
- Crear, editar, suspender organizaciones
- Ver uso y métricas por organización
- Gestionar `organization_api_keys`

**Esfuerzo:** Alto (2-3 semanas)

---

### M9: No hay UI de gestión de Playbooks SOAR

**Módulo:** SOAR  

**Lo que falta:**
- Página `/playbooks` para crear/editar playbooks
- Editor de condiciones y acciones visual
- Historial de ejecuciones de playbooks (`playbook_runs`)
- Toggle de habilitado/deshabilitado

**Esfuerzo:** Alto (2-4 semanas)

---

## MEDIO — Experiencia de Usuario Incompleta

### M10: No hay agentes EDR reales

**Módulo:** Endpoint Agents  
**Código:** Backend + DB implementados; no existe ningún binario de agente  

**Lo que falta:** Agentes para Windows, Linux, macOS que:
- Se registren con el backend
- Envíen telemetría de proceso/red/archivo
- Respondan al comando de aislamiento

**Esfuerzo:** Muy Alto (meses)

---

### M11: Threat Intel sin feeds automáticos

**Módulo:** Threat Intelligence  

**Lo que falta:** 
- Integración con Feodo Tracker, AbuseCH, AbuseIPDB, MISP
- Cron job que actualice IOCs automáticamente
- Deduplicación automática de IOCs

**Esfuerzo:** Medio (1-2 semanas)

---

### M12: No hay tests automatizados

**Todo el repositorio**  

Búsqueda en todo el proyecto: 0 archivos `*.test.js`, 0 archivos `*.spec.js`, 0 carpetas `__tests__`.

**Impacto:** Cualquier cambio en auth, RBAC, o detection puede introducir regresiones sin detección automática.

**Lo que falta:**
- Tests unitarios para `authService.js`, `riskEngine.js`, `detectionEngine.js`
- Tests de integración para endpoints críticos (login, MFA, RBAC)
- CI/CD pipeline que ejecute tests en cada PR

**Esfuerzo:** Alto (4-8 semanas para cobertura razonable)

---

### M13: No hay script de instalación completo

**Infraestructura**  

**Lo que falta:**
- `docker-compose.yml` no incluye Elasticsearch ni instrucciones para `SSH_HOST_KEY_PEM`
- No hay script de primera ejecución que genere `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SSH_HOST_KEY_PEM` automáticamente
- El README no documenta todos los env vars requeridos

**Esfuerzo:** Bajo (1-2 días)

---

## Resumen por Prioridad

| ID | Módulo | Severidad | Esfuerzo |
|---|---|---|---|
| M1 | Email/MFA no funciona | 🔴 Crítico | Bajo |
| M2 | SOAR no se dispara | 🔴 Crítico | Alto |
| M3 | Attack Map 100% falso | 🔴 Crítico | Medio |
| M4 | Datos seed en producción | 🔴 Crítico | Bajo |
| M5 | SSH_HOST_KEY_PEM faltante | 🟠 Alto | Bajo |
| M6 | ES no en docker-compose | 🟠 Alto | Bajo |
| M7 | Métricas dashboard falsas | 🟠 Alto | Medio |
| M8 | Sin UI de organizaciones | 🟠 Alto | Alto |
| M9 | Sin UI de playbooks | 🟠 Alto | Alto |
| M10 | Sin agentes EDR reales | 🟡 Medio | Muy Alto |
| M11 | Sin feeds de threat intel | 🟡 Medio | Medio |
| M12 | Sin tests automatizados | 🟡 Medio | Alto |
| M13 | Sin script de instalación | 🟡 Medio | Bajo |
