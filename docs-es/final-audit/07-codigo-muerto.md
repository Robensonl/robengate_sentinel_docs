# 07 — Código Muerto: Archivos, Funciones y Endpoints Sin Uso

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## DEFINICIÓN

Se considera **código muerto** todo código que:
- Existe en el repositorio pero no es importado ni ejecutado
- Es importado pero ninguna ruta de código lo invoca
- Es una versión duplicada/obsoleta de una implementación activa
- Está comentado permanentemente sin intención de uso

---

## ARCHIVOS MUERTOS

| Archivo | Razón | Impacto | Acción |
|---------|-------|---------|--------|
| `frontend/src/features/landing/pages/LandingPage_temp.jsx` | No importado en `routes.jsx` ni en ningún otro archivo. Es la versión anterior en inglés de la landing page. | Bajo | Eliminar |
| `db-nosql/security-log.model.js` | Modelo duplicado de `db-nosql/models/SecurityLog.js`. Misma colección, esquema inferior, TTL conflictivo. Si no está importado activamente, es dead code. | **ALTO** (TTL conflict) | Eliminar |

---

## FUNCIONES MUERTAS / STUBS

### 1. Email de invitación en `organizations.js`

```javascript
// backend/src/routes/organizations.js ~línea 295
// TODO: Send invitation email via emailService
// El miembro se agrega a la BD pero NUNCA recibe email
const member = await addMember(orgId, userId);
// emailService.sendInvite(email, orgName); ← COMENTADO / NO IMPLEMENTADO
res.json({ member });
```

**Estado:** La función de agregar miembro funciona (escribe en BD), pero la parte de notificación está omitida. No es "código muerto" en sentido estricto pero es una funcionalidad prometida que no existe.

### 2. Elasticsearch — Import sin manejo de fallo

```javascript
// Varios controllers importan elasticsearchService
// Pero no hay fallback si Elasticsearch no está disponible
import { search, indexDocument } from '../services/elasticsearchService.js';
// Si ES está offline → throws en runtime sin catch en algunos paths
```

### 3. `SecurityHeaders.jsx` — Sin funcionalidad real

```javascript
// frontend/src/features/security/pages/SecurityHeaders.jsx
// Página completamente estática. No llama ninguna API.
// Muestra una lista hardcodeada de headers HTTP y sus valores "recomendados"
// No analiza los headers reales del servidor ni permite modificarlos
```

Esta página es contenido educativo estático disfrazado de módulo funcional.

---

## COMPONENTES DECORATIVOS (SIN CONEXIÓN A DATOS REALES)

Estos componentes existen y se renderizan, pero no tienen conexión a ninguna fuente de datos real. Son "vivos" en el sentido que el código se ejecuta, pero no tienen impacto informativo real:

| Componente | Archivo | Descripción | Estado |
|-----------|---------|-------------|--------|
| `TerminalWidget` | `frontend/src/features/security/components/TerminalWidget.jsx` | Terminal que genera logs aleatorios cada 2s con `Math.random()` | Decorativo |
| `SIEMTerminal` | `frontend/src/features/security/components/SIEMTerminal.jsx` | Terminal SIEM con eventos inventados | Decorativo |
| `ThreatHunting.jsx` | Página completa | Toda la lógica de búsqueda es simulada | Simulado |

---

## RUTAS SIN PÁGINA (Endpoints sin UI)

Los siguientes endpoints backend existen y funcionan, pero no hay ninguna página o componente en el frontend que los consuma:

| Endpoint Backend | Funcionalidad | ¿En frontend? |
|-----------------|--------------|--------------|
| `POST /api/ingest/event` | Ingesta de log individual | ❌ No hay panel |
| `POST /api/ingest/batch` | Ingesta batch | ❌ No hay panel |
| `POST /api/ingest/syslog` | Syslog RFC | ❌ No hay panel |
| `POST /api/ingest/windows` | Windows Events | ❌ No hay panel |
| `POST /api/ingest/webhook` | Webhook | ❌ No hay panel |
| `GET /api/ingest/stats` | Stats de ingesta | ❌ No hay panel |
| `GET /api/search/*` | Elasticsearch search | ❌ Sin UI de búsqueda |
| `POST /api/playbooks/:id/execute` | Ejecutar playbook | ❌ No hay página SOAR en frontend |
| `GET /api/playbooks` | Listar playbooks | ❌ No hay página SOAR en frontend |
| `GET /api/agents` | Listar agents EDR | ❌ No hay página de agents en frontend |
| `POST /api/agents/:id/command` | Enviar comando a agent | ❌ Sin UI |
| `POST /api/agents/:id/isolate` | Aislar endpoint | ❌ Sin UI |
| `GET /api/organizations` | Listar organizaciones | ❌ Sin UI admin multi-tenant |
| `POST /api/organizations` | Crear organización | ❌ Sin UI |
| `GET /api/internal/*` | APIs internas | ✅ No deben tener UI |

**Resumen:** 14 endpoints funcionales sin interfaz de usuario correspondiente. Esto representa capacidades del backend que no son accesibles a través del frontend actual.

---

## CÓDIGO POTENCIALMENTE OBSOLETO

### `attackSimulator.js` — Simulador de ataques

```javascript
// frontend/src/shared/services/attackSimulator.js
export const DEMO_MODE_ACTIVE = false; // Flag global

export function generateAttackEvent() { ... }
export function generateLogEntry() { ... }
export function generateAnomalyScore() { ... }
// etc.
```

Este archivo es necesario como fallback de SSE, **pero** si el objetivo es producción, debería considerarse si el modo demo tiene sentido o si directamente debe desactivarse y mostrar un error cuando SSE no está disponible.

**Decisión pendiente:** ¿Se mantiene el modo demo para demos de venta o se elimina en producción?

---

## PÁGINAS DEL MARKETING SITE SIN DATOS DINÁMICOS

Las siguientes páginas son completamente estáticas y no tienen equivalente en el backend:

| Página | Ruta | Tipo | Utilidad |
|--------|------|------|---------|
| `ArchitecturePage` | `/architecture` | Diagrama estático | ✅ Documentación |
| `DatabaseArchitecture` | `/database` | Diagrama estático | ✅ Documentación |
| `ComponentShowcase` | `/showcase` | Demo de UI | ✅ Diseño |
| `BusinessCard` | `/contact` | Info de contacto | ✅ Marketing |
| `SecurityHeadersPage` | `/security-headers` | Contenido educativo | 🟡 Sin funcionalidad real |

Estas páginas no son "código muerto" en sentido estricto (tienen propósito de marketing/documentación), pero es importante que el equipo sepa que no tienen backend.

---

## DEPENDENCIAS INSTALADAS SIN USO APARENTE

Una auditoría superficial de `package.json` revela todas las dependencias en uso. Sin embargo, **es recomendable ejecutar** `npx depcheck` para identificar dependencias instaladas pero no importadas en el código.

Posibles candidatas según el análisis:
- `qrcode` — usado para TOTP QR codes (sí está en uso)
- `hpp` — usado en sanitize middleware (sí está en uso)

No se detectaron dependencias claramente sin uso en la exploración.

---

## RESUMEN DE CÓDIGO MUERTO

| Categoría | Cantidad | Impacto |
|-----------|---------|---------|
| Archivos completamente sin importar | 1 | Bajo (LandingPage_temp.jsx) |
| Modelos duplicados con conflicto | 1 | **Alto** (security-log.model.js) |
| Funciones stub / TODO no implementadas | 1 | Medio (email invitaciones) |
| Endpoints sin UI | 14 | Medio (capacidades no expuestas) |
| Componentes decorativos | 3 | Alto (impacto en confianza del usuario) |
| Páginas estáticas sin backend | 5 | Bajo (propósito marketing) |
