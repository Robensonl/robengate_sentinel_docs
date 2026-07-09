# 04 — Documentos Duplicados

**Auditoría:** RobenGate Sentinel — Junio 2026  

---

## Resumen

El repositorio contiene documentación en **dos idiomas** (`docs/` en inglés, `docs-es/` en español) lo que por diseño supone cierta duplicación. Sin embargo, existen duplicaciones no intencionadas dentro de `docs-es/` y dentro de `docs/` que deben gestionarse.

---

## Duplicaciones Identificadas

### 🔴 Duplicación Directa (Mismo Contenido)

#### `docs/ARCHITECTURE.md` vs `docs-es/architecture/arquitectura-sistema.md`
- **Overlap:** ~80% del contenido es equivalente (diagramas Mermaid, descripción de capas)
- **Decisión:** Mantener ambos (inglés para audiencia internacional, español principal)
- **Acción:** Asegurar que los dos estén sincronizados cuando haya cambios

#### `docs/DEPLOYMENT_GUIDE.md` vs `docs-es/operations/03-deployment-guide.md`
- **Overlap:** ~75% del contenido
- **Decisión:** Mantener ambos; `docs-es/` es más completo y actualizado
- **Acción:** El inglés puede deprecarse o apuntar a la versión española

#### `docs/ADMIN_MANAGEMENT.md` vs secciones de `docs-es/project-inventory/backend-inventory.md`
- **Overlap:** Información sobre gestión de administradores
- **Decisión:** Mantener `docs/ADMIN_MANAGEMENT.md` como guía operacional rápida; complementar con nueva `docs-es/admin/`

### 🟡 Duplicación Parcial (Información Solapada)

#### `docs-es/documentation-audit/01-existing-documentation.md` vs `docs-es/final-documentation-audit/01-documentation-coverage.md`
- **Overlap:** Ambos inventarían documentación existente
- **Diferencia:** El nuevo (Phase 1) añade métricas de cobertura % y análisis de gaps
- **Decisión:** El nuevo es más completo; el anterior puede marcarse como v1 del audit
- **Acción:** Añadir nota de versión en el antiguo

#### `docs-es/MASTER_DOCUMENTATION.md` vs `docs-es/project-inventory/system-overview.md`
- **Overlap:** El MASTER incluye resumen del sistema que también está en system-overview
- **Diferencia:** MASTER es el índice navegable; system-overview es más técnico
- **Decisión:** Mantener ambos con sus roles diferenciados
- **Acción:** Añadir cross-referencias claras entre ambos

#### `docs-es/security/resumen.md` vs `docs-es/project-inventory/security-inventory.md`
- **Overlap:** ~60% de contenido de seguridad
- **Diferencia:** resumen.md es narrativo; security-inventory.md es inventario técnico
- **Decisión:** Mantener ambos con sus propósitos distintos
- **Acción:** Cross-referencias en ambos

#### `docs/SECURITY_HARDENING.md` vs secciones de `docs-es/project-inventory/security-inventory.md`
- **Overlap:** Hardening de seguridad
- **Diferencia:** `SECURITY_HARDENING.md` es guía paso a paso; inventory es lista de features
- **Decisión:** Mantener ambos; son complementarios

#### `docs-es/database/resumen.md` vs `docs-es/project-inventory/database-inventory.md`
- **Overlap:** ~50% de contenido
- **Diferencia:** `database/resumen.md` es descriptivo; `database-inventory.md` es técnico
- **Decisión:** Mantener ambos; el nuevo `docs-es/database/` (Phase 3) será más completo

### 🟢 Duplicaciones Intencionales (Bilingüe — Aceptadas)

Los siguientes pares son traducciones intencionadas y se mantienen:

| `docs/` (Inglés) | `docs-es/` (Español) | Acción |
|---|---|---|
| `AUTHENTICATION_INTERNALS.md` | `architecture/flujo-autenticacion.md` | Mantener ambos |
| `SECURITY_AUDIT_REPORT.md` | `final-audit/00_resumen_auditoria.md` | Mantener ambos |
| `DISASTER_RECOVERY_RUNBOOK.md` | `operations/08-recovery-guide.md` | Mantener ambos |

---

## Recomendaciones

1. **Mantener bilingüismo** — `docs/` (inglés) para audiencia GitHub internacional; `docs-es/` (español) como documentación principal completa

2. **Deprecar docs/ duplicados** cuando la versión española sea claramente más completa — añadir nota `> ⚠️ Este documento ha sido reemplazado por [versión española]`

3. **Añadir `_DEPRECATED.md` suffix** a documentos obsoletos en lugar de eliminarlos (preservar historial)

4. **Cross-referencias** — Todos los documentos con contenido relacionado deben tener secciones "Ver también" / "See also"

5. **Fuente única de verdad para schemas** — `docs-es/database/` (Phase 3) debe ser la referencia definitiva para esquemas de BD; otros documentos deben enlazar a ella

---

## Inventario de Documentos por Categoría

### Solo en `docs/` (Inglés, Sin Equivalente Español Completo)
- `docs/ROBENGATE_SENTINEL_PLAN.md` — Plan original del proyecto
- `docs/final-audit/` — Directorio con auditoría final (parcialmente traducido)
- `docs/api/`, `docs/architecture/` — Subdirectorios con docs técnicos

### Solo en `docs-es/` (Español, Sin Equivalente Inglés)
- `docs-es/business/` — Estrategia de negocio y visión de producto
- `docs-es/operations/` — Todas las guías operacionales (9 documentos)
- `docs-es/ingestion/pipeline-ingesta.md` — Pipeline de ingesta detallado
- `docs-es/realtime/sistema-eventos.md` — Sistema de eventos en tiempo real
- `docs-es/project-inventory/` — Inventario completo del proyecto

### Recomendación Final de Estructura
La estructura **`docs-es/`** debe ser la **fuente de verdad principal** del proyecto. `docs/` se mantiene para:
- Audiencia de GitHub internacional
- Documentos de referencia técnica en inglés (como SECURITY_AUDIT_REPORT)
- Historial de documentación del proyecto
