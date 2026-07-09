# Auditoría de Documentación — 04: Documentación Desactualizada

**Proyecto:** RobenGate Sentinel  
**Fecha:** Junio 2026

---

## Resumen

Se identificaron **9 documentos** con contenido desactualizado o que no refleja el estado actual del código. La mayoría datan de versiones previas al refactor RBAC de Mayo 2026 y a la auditoría de seguridad post-corrección.

---

## Documentos con Contenido Desactualizado

---

### DESACT-01: `docs/ARCHITECTURE.md`
**Estado:** 🔴 Desactualizado (Stub)

**Problema:** El archivo contiene únicamente una lista de 4 líneas (Context diagram, Container diagram, etc.) sin contenido real. No refleja la arquitectura actual de la plataforma con 6 contenedores Docker, 18 rutas de API, K8s, Helm.

**Contenido que falta:**
- Diagrama de arquitectura de sistema completo
- Descripción de todos los servicios
- Diagrama de despliegue K8s
- Flujos de datos entre componentes

**Acción:** Reemplazar completamente con documentación arquitectónica real.

---

### DESACT-02: `docs/API_REFERENCE.md`
**Estado:** 🔴 Desactualizado (Stub incompleto)

**Problema:** Lista solo 5 endpoints de los 70+ que existen realmente en el backend. No incluye:
- Rutas de organizaciones y multi-tenancy
- Rutas de playbooks/SOAR
- Rutas de agents/EDR
- Rutas de attack-map
- Rutas de AI
- Rutas de ingestion
- Rutas de metrics/health
- WebAuthn endpoints

**Acción:** Generar inventario completo de API desde código.

---

### DESACT-03: `docs/DEPLOYMENT_GUIDE.md`
**Estado:** 🟠 Parcialmente Desactualizado

**Problema:** Documenta Docker Compose pero no menciona:
- K8s manifests en `k8s/`
- Helm chart en `helm/`
- Overlays de producción (`k8s/overlays/prod/`)
- HPA (Horizontal Pod Autoscaler)
- Configuración de TLS/SSL con nginx

**Acción:** Ampliar con secciones K8s y Helm.

---

### DESACT-04: `docs/rbac/overview.md`
**Estado:** 🟡 Parcialmente Desactualizado

**Problema:** El RBAC fue refactorizado en Mayo 2026. La documentación existente puede no reflejar:
- Nuevo rol `viewer` con acceso a módulos SOC
- `PermissionGate.jsx` component
- `usePermission.js` hook
- `permissions.js` config centralizada
- `readOnly()` middleware en backend
- Badge "View Only" para viewers

**Acción:** Actualizar con la nueva arquitectura RBAC post-refactor.

---

### DESACT-05: `docs/PROJECT_STRUCTURE.md`
**Estado:** 🟡 Desactualizado

**Problema:** La estructura del proyecto ha evolucionado. Posiblemente no incluye:
- `backend/src/services/ingestion/` (pipeline de ingesta)
- `frontend/src/shared/config/permissions.js`
- `frontend/src/shared/hooks/usePermission.js`
- `frontend/src/shared/components/PermissionGate.jsx`
- `k8s/` directorio completo
- `helm/` directorio

**Acción:** Regenerar con estructura actual del repositorio.

---

### DESACT-06: `docs/DOCUMENTACION.md`
**Estado:** 🟡 Parcialmente Desactualizado

**Problema:** Documento general que puede referirse a versiones anteriores del stack. Necesita verificación de que todos los módulos mencionados existen y están operativos.

**Acción:** Revisar y actualizar referencias a módulos.

---

### DESACT-07: `docs-es/final-audit/04_recomendaciones.md`
**Estado:** 🟡 Parcialmente Obsoleto

**Problema:** Las recomendaciones del sprint 0 ya fueron implementadas (según el ADDENDUM v2.0 de `SECURITY_AUDIT_REPORT.md`). El documento puede listar tareas ya completadas como pendientes.

**Acción:** Marcar recomendaciones implementadas y actualizar estado.

---

### DESACT-08: `docs/future-roadmap/roadmap.md`
**Estado:** 🟡 Requiere Actualización

**Problema:** El roadmap no refleja:
- Correcciones de seguridad del Sprint 0 (ya completadas)
- Refactor RBAC de Mayo 2026 (completado)
- Estado actual de features simuladas vs reales

**Acción:** Actualizar con estado actual y próximos sprints.

---

### DESACT-09: `docs-es/architecture/arquitectura-sistema.md`
**Estado:** 🟡 Parcialmente Desactualizado

**Problema:** El diagrama de arquitectura no refleja el estado actual completo del sistema con honeypot, K8s, Helm, monitoring stack (Prometheus/Grafana/Alertmanager).

**Acción:** Actualizar con arquitectura completa y diagramas Mermaid.

---

## Tabla Resumen de Desactualización

| Documento | Severidad | Última Actualización Relevante | Estado Recomendado |
|---|---|---|---|
| `docs/ARCHITECTURE.md` | 🔴 Crítica | Nunca actualizado realmente | Reemplazar |
| `docs/API_REFERENCE.md` | 🔴 Crítica | Solo 5 endpoints | Reemplazar |
| `docs/DEPLOYMENT_GUIDE.md` | 🟠 Alta | Sin K8s/Helm | Ampliar |
| `docs/rbac/overview.md` | 🟡 Media | Pre-refactor Mayo 2026 | Actualizar |
| `docs/PROJECT_STRUCTURE.md` | 🟡 Media | Pre-ingestion pipeline | Actualizar |
| `docs/DOCUMENTACION.md` | 🟡 Media | Verificar referencias | Revisar |
| `docs-es/final-audit/04_recomendaciones.md` | 🟡 Media | Sprint 0 completado | Actualizar estados |
| `docs/future-roadmap/roadmap.md` | 🟡 Media | Pre-Sprint 1 | Actualizar |
| `docs-es/architecture/arquitectura-sistema.md` | 🟡 Media | Sin monitoring stack | Ampliar |

---

## Criterios de Versionado Propuestos

Para evitar documentación desactualizada en el futuro, se recomienda:

```
Cada archivo de documentación debe incluir en su encabezado:
- Versión del documento
- Fecha de última actualización
- Versión de la plataforma que documenta
- Revisado por
```

Ejemplo de encabezado estandarizado:

```markdown
---
version: 2.1
updated: 2026-06-06
platform-version: 2.0.0
reviewed-by: Principal Architect
---
```
