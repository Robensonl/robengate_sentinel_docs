# Auditoría de Documentación — 03: Documentación Duplicada

**Proyecto:** RobenGate Sentinel  
**Fecha:** Junio 2026

---

## Resumen

Se identificaron **11 grupos de contenido duplicado** entre los directorios `docs/` (inglés) y `docs-es/` (español), así como duplicaciones internas dentro de cada directorio. La mayoría son traducciones parciales o resúmenes del mismo contenido original.

---

## Duplicaciones por Categoría

### GRUPO 1: Auditoría Final

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/final-audit/00-executive-summary.md` | `docs/final-audit/00_audit_summary.md` | Misma información, dos formatos |
| `docs/final-audit/01-platform-audit.md` | `docs/final-audit/01_system_audit.md` | Auditoría de plataforma duplicada |
| `docs/final-audit/03-roadmap.md` | `docs/final-audit/07-roadmap.md` | Roadmap repetido |
| `docs-es/final-audit/00_resumen_auditoria.md` | `docs/final-audit/00-executive-summary.md` | Traducción parcial |

**Recomendación:** Consolidar `00-executive-summary.md` y `00_audit_summary.md` en un solo archivo. Eliminar `01_system_audit.md` (redundante con `01-platform-audit.md`).

---

### GRUPO 2: Documentación de Seguridad

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/SECURITY_AUDIT_REPORT.md` | `docs/SECURITY_HARDENING.md` | Contenido de hardening superpuesto |
| `docs/security/overview.md` | `docs/SECURITY_AUDIT_REPORT.md` (secciones) | Resumen duplica partes del informe |
| `docs-es/security/resumen.md` | `docs/security/overview.md` | Traducción incompleta |

**Recomendación:** Mantener `SECURITY_AUDIT_REPORT.md` como fuente de verdad. `SECURITY_HARDENING.md` queda como guía operacional separada. Eliminar solapamientos.

---

### GRUPO 3: Arquitectura

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/architecture/system-architecture.md` | `docs/architecture/system-design.md` | Mismo tema, diferente granularidad |
| `docs/ARCHITECTURE.md` | `docs/architecture/system-architecture.md` | `ARCHITECTURE.md` es stub que referencia al otro |
| `docs-es/architecture/arquitectura-sistema.md` | `docs/architecture/system-architecture.md` | Traducción parcial |

**Recomendación:** Usar `docs/architecture/system-architecture.md` como fuente principal. `ARCHITECTURE.md` puede ser un índice que apunte a los subdirectorios.

---

### GRUPO 4: API Reference

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/API_REFERENCE.md` | `docs/api/reference.md` | Mismo contenido, ambos son stubs |
| `docs/api/endpoints.md` | `docs/api/reference.md` | Endpoints listados en ambos |
| `docs/api/authentication.md` | `docs/AUTHENTICATION_INTERNALS.md` (secciones API) | Solapamiento en endpoints de auth |

**Recomendación:** `API_REFERENCE.md` debe ser el índice principal. `docs/api/` contiene el detalle por categoría.

---

### GRUPO 5: Deployment / Infrastructure

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/deployment/overview.md` | `docs/DEPLOYMENT_GUIDE.md` | Mismo contenido, distintas profundidades |
| `docs-es/deployment/resumen.md` | `docs/deployment/overview.md` | Traducción incompleta |
| `docs/infrastructure/overview.md` | `docs/deployment/overview.md` (secciones) | Infraestructura y deployment se solapan |

**Recomendación:** Separar claramente: `deployment/` = cómo desplegar, `infrastructure/` = qué hay desplegado.

---

### GRUPO 6: Backend Overview

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/backend/overview.md` | `docs/PROJECT_STRUCTURE.md` (secciones de backend) | Estructura de backend repetida |
| `docs-es/backend/resumen.md` | `docs/backend/overview.md` | Traducción parcial |

**Recomendación:** `backend/overview.md` como fuente principal. `PROJECT_STRUCTURE.md` solo referencia.

---

### GRUPO 7: Disaster Recovery

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/DISASTER_RECOVERY.md` | `docs/DISASTER_RECOVERY_RUNBOOK.md` | Conceptual vs operacional (OK tener ambos) |

**Recomendación:** Estos NO son realmente duplicados — tienen propósitos distintos. Solo necesitan cross-references.

---

### GRUPO 8: Roadmap

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/future-roadmap/roadmap.md` | `docs/final-audit/07-roadmap.md` | Mismo contenido de roadmap |
| `docs/final-audit/03_roadmap.md` | `docs/final-audit/07-roadmap.md` | Roadmap repetido en la auditoría |
| `docs-es/future-roadmap/hoja-ruta.md` | `docs/future-roadmap/roadmap.md` | Traducción parcial |

**Recomendación:** Un solo roadmap en `docs-es/future-roadmap/hoja-ruta.md` con referencia desde auditoría.

---

### GRUPO 9: Database

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/database/overview.md` | Contenido de migraciones SQL en el código | El schema SQL es la fuente de verdad |
| `docs-es/database/resumen.md` | `docs/database/overview.md` | Traducción parcial |

---

### GRUPO 10: SIEM / Threat

| Archivo Principal | Archivo Duplicado | Tipo |
|---|---|---|
| `docs/siem/overview.md` | `docs/detection-engine/README.md` | SIEM y motor de detección se solapan |
| `docs-es/siem/resumen.md` | `docs/siem/overview.md` | Traducción parcial |
| `docs/threat-hunting/overview.md` | `docs/threat-intelligence/overview.md` | Contenido relacionado con solapamiento |

---

### GRUPO 11: Refactor Audit

| Archivo | Nota |
|---|---|
| `docs/refactor/audit.md` | Existe en inglés pero no en español |
| `docs/refactor/bug-fixes.md` | Registro de bugs — no necesita duplicación |
| `docs/refactor/cleanup-report.md` | Reporte de limpieza — no necesita duplicación |

**Recomendación:** Los reportes de refactoring son históricos. No duplicar en español. Solo referencias desde el MASTER.

---

## Tabla de Acciones

| Acción | Archivos Afectados | Prioridad |
|---|---|---|
| Consolidar | `final-audit/00*` (2 archivos) | 🟡 Media |
| Consolidar | `final-audit/03_roadmap + 07-roadmap` | 🟡 Media |
| Limpiar solapamiento | `API_REFERENCE.md + api/reference.md` | 🟡 Media |
| Limpiar solapamiento | `deployment/overview.md + DEPLOYMENT_GUIDE.md` | 🟡 Media |
| Añadir cross-references | `DISASTER_RECOVERY + DISASTER_RECOVERY_RUNBOOK` | 🟢 Baja |
| Unificar roadmap | 3 archivos de roadmap | 🟡 Media |
| Traducir (no duplicar) | Todos los `resumen.md` | 🟠 Alta |

---

## Nota sobre la Estrategia de Idiomas

Las traducciones al español en `docs-es/` no son duplicaciones problemáticas — son **traducciones necesarias**. Sin embargo, deben ser traducciones **completas y actualizadas**, no resúmenes incompletos de los originales en inglés.

**Estrategia recomendada:** `docs/` es el directorio de documentación en inglés. `docs-es/` contiene la documentación oficial en español, que puede ser más completa que la inglesa en algunos módulos.
