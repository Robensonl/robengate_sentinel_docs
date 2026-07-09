# 03 — Documentos Desactualizados

**Auditoría:** RobenGate Sentinel — Junio 2026  

---

## Criterios de Evaluación

Un documento se considera **desactualizado** si:
- Describe una versión anterior del código no refleja el estado actual
- Contiene información contradictoria con el código fuente
- Faltan referencias a componentes añadidos posteriormente
- Los ejemplos de código o configuración son incorrectos

---

## Documentos Desactualizados Detectados

### 🔴 Desactualización Crítica

#### `docs/API_REFERENCE.md`
- **Problema:** Documenta ~40 endpoints; el sistema tiene 91+
- **Faltantes documentados:** Ingestion (POST /batch, /syslog, /windows, /webhook), AI (anomaly-stream, radar), Internal (ban management), WebAuthn completo, TOTP endpoints
- **Acción:** Reemplazar por docs-es/api/ (files individuales creados en Phase 2)

#### `docs-es/documentation-audit/02-missing-documentation.md`
- **Problema:** Fue creado en auditoría previa; algunos gaps ya se han cerrado, otros nuevos han aparecido
- **Obsoleto:** La lista de "missing" ya no es completamente válida tras la creación de docs-es/operations/ y docs-es/architecture/
- **Acción:** Reemplazado por este directorio `final-documentation-audit/`

#### `docs/PROJECT_STRUCTURE.md`
- **Problema:** Estructura original del proyecto; no refleja expansión de:
  - `backend/src/services/ingestion/` (5 archivos del pipeline)
  - `frontend/src/shared/config/permissions.js` (RBAC refactor May 2026)
  - `frontend/src/shared/hooks/usePermission.js`
  - `frontend/src/shared/components/PermissionGate.jsx`
  - `db-sql/migrations/011-013` (incidentes, multi-tenancy, SOAR)
- **Acción:** Actualizar con estructura real actual

### 🟡 Desactualización Importante

#### `docs-es/rbac/resumen.md`
- **Problema:** Puede no reflejar el refactor RBAC de Mayo 2026:
  - `meetsMinRole()` en lugar de `roles[]` array
  - `readOnly()` middleware nuevo
  - `viewer` ahora accede a módulos SOC que antes eran `analyst+`
  - `PermissionGate.jsx` es nuevo
- **Acción:** Revisar y actualizar con cambios del refactor

#### `docs-es/frontend/resumen.md`
- **Problema:** No incluye:
  - Nuevo hook `usePermission.js`
  - Componente `PermissionGate.jsx`
  - `ReadOnlyBadge` en viewer mode
  - `attackSimulator.js` (nuevo, DEMO)
  - `tokenManager.js` (gestión tokens en memoria)
- **Acción:** Actualizar con componentes shared actuales

#### `docs-es/architecture/flujo-rbac.md`
- **Problema:** Puede usar esquema de roles anterior (array-based en lugar de minRole-based)
- **Acción:** Verificar y actualizar si es necesario

#### `docs-es/project-inventory/api-inventory.md`
- **Problema:** Lista endpoints pero falta información de:
  - Request/response schemas
  - Ejemplos concretos
  - Códigos de error específicos
  - Headers requeridos
- **Acción:** Completado por docs-es/api/ (Phase 2)

### 🟢 Actualizados y Correctos

Los siguientes documentos están **actualizados y son precisos**:

| Documento | Última Revisión | Estado |
|---|---|---|
| `docs-es/MASTER_DOCUMENTATION.md` | Junio 2026 | ✅ Correcto |
| `docs-es/operations/01-installation-guide.md` | Junio 2026 | ✅ Correcto |
| `docs-es/operations/03-deployment-guide.md` | Junio 2026 | ✅ Correcto |
| `docs-es/infrastructure/environment-variables.md` | Junio 2026 | ✅ Correcto |
| `docs-es/infrastructure/kubernetes.md` | Junio 2026 | ✅ Correcto |
| `docs-es/infrastructure/monitoring-stack.md` | Junio 2026 | ✅ Correcto |
| `docs-es/security/motor-riesgo.md` | Junio 2026 | ✅ Correcto |
| `docs-es/siem/motor-deteccion.md` | Junio 2026 | ✅ Correcto |
| `docs-es/architecture/flujo-autenticacion.md` | Junio 2026 | ✅ Correcto |
| `docs-es/ingestion/pipeline-ingesta.md` | Junio 2026 | ✅ Correcto |
| `docs/SECURITY_AUDIT_REPORT.md` | Mayo 2026 | ✅ Correcto |
| `docs/AUTHENTICATION_INTERNALS.md` | Mayo 2026 | ✅ Correcto |

---

## Plan de Remediación

| Documento | Acción | Prioridad | Responsable |
|---|---|---|---|
| `docs/API_REFERENCE.md` | Deprecar → reemplazar con `docs-es/api/` | 🔴 Alta | Technical Writer |
| `docs/PROJECT_STRUCTURE.md` | Actualizar con estructura actual completa | 🟡 Media | Architect |
| `docs-es/rbac/resumen.md` | Revisar cambios May 2026 RBAC refactor | 🟡 Media | Technical Writer |
| `docs-es/frontend/resumen.md` | Añadir nuevos componentes shared | 🟡 Media | Frontend Dev |
| `docs-es/documentation-audit/02-missing-documentation.md` | Marcar como deprecated | 🟢 Baja | Technical Writer |
