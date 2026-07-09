# Auditoría de Código — Componentes No Utilizados (Frontend)

**Fecha de auditoría:** 2026  
**Scope:** `frontend/src/`  
**Herramienta:** Análisis estático manual  

> ⚠️ **POLÍTICA:** Este documento es SOLO un registro de hallazgos. NO eliminar nada sin un proceso de revisión y aprobación.

---

## Componentes con Uso Dudoso o Inexistente

### 1. `frontend/src/components/LoginForm.jsx` — Sin Importaciones

**Tipo:** Componente React  
**Estado:** ⚠️ POSIBLEMENTE NO UTILIZADO  
**Evidencia:** Búsqueda de `import LoginForm` en todo el proyecto retorna 0 resultados.  

**Observación:** Existe también `frontend/src/shared/hooks/useLoginForm.js` que SÍ se usa (en `Login.jsx`). El componente `LoginForm.jsx` parece ser un componente standalone duplicado o un artefacto de refactorización.

**Recomendación:** Verificar si algún archivo importa este componente. Si no hay ninguno, es dead code candidato a eliminar.

---

### 2. `frontend/src/features/landing/pages/LandingPage_temp.jsx` — Archivo Temporal

**Tipo:** Página React  
**Estado:** ⚠️ PROBABLEMENTE NO UTILIZADO  
**Evidencia:** No aparece en `routes.jsx`. El nombre `_temp` indica que es un borrador.

**Observación:** `LandingPage.jsx` sí está en uso en la ruta `/`. `LandingPage_temp.jsx` es probablemente una versión en desarrollo alternativa.

**Recomendación:** Evaluar si el contenido tiene valor. Si no, eliminar.

---

### 3. `frontend/src/features/security/components/SIEMTerminal.jsx` — Sin Ruta Asignada

**Tipo:** Componente React  
**Estado:** ⚠️ USO INCIERTO  
**Evidencia:** No aparece como ruta en `routes.jsx`. Puede ser importado como componente interno dentro de otra página.

**Recomendación:** Buscar imports de `SIEMTerminal` en otras páginas para confirmar su uso.

---

### 4. `frontend/src/features/security/components/TerminalWidget.jsx` — Sin Ruta Asignada

**Tipo:** Componente React  
**Estado:** ⚠️ USO INCIERTO  
**Evidencia:** No aparece como ruta en `routes.jsx`. Puede ser importado internamente.

**Recomendación:** Buscar imports de `TerminalWidget` para confirmar su uso.

---

### 5. `frontend/src/features/security/components/ThreatVisualization.jsx` — Sin Ruta Asignada

**Tipo:** Componente React  
**Estado:** ⚠️ USO INCIERTO  
**Evidencia:** No aparece como ruta en `routes.jsx`. Puede ser importado en `ThreatIntelligence.jsx` u otras páginas.

**Recomendación:** Buscar imports de `ThreatVisualization`.

---

### 6. `frontend/src/shared/components/SecurityBadge.jsx` — Shared Component Sin Confirmar

**Tipo:** Componente shared  
**Estado:** ⚠️ USO NO CONFIRMADO  
**Evidencia:** Está en `shared/components/` lo que implica uso múltiple, pero no ha sido rastreado en esta auditoría.

---

### 7. `frontend/src/shared/components/SocialButtons.jsx` — Shared Component Sin Confirmar

**Tipo:** Componente shared  
**Estado:** ⚠️ USO NO CONFIRMADO  
**Evidencia:** No hay rutas de redes sociales evidentes en `routes.jsx`. Podría ser usado en `LandingPage.jsx` o `Register.jsx`.

---

### 8. `frontend/src/features/marketing/pages/BusinessCard.jsx` — Ruta `/contact`

**Tipo:** Página marketing  
**Estado:** ✅ EN USO (ruta `/contact` en `routes.jsx`)  
**Observación:** Es una ruta pública de contacto/tarjeta de presentación. Está en uso pero su propósito en producción debe definirse.

---

### 9. `frontend/src/features/marketing/pages/ComponentShowcase.jsx` — Ruta `/showcase`

**Tipo:** Página de desarrollo/demo  
**Estado:** 🎭 SOLO DEMO — Ruta `/showcase` es una página de desarrollo  
**Observación:** Útil para demos técnicas y desarrollo. No debe estar expuesta en producción sin autenticación.

---

### 10. `frontend/src/features/marketing/pages/ArchitecturePage.jsx` y `DatabaseArchitecture.jsx`

**Tipo:** Páginas marketing/documentación visual  
**Estado:** ✅ EN USO (rutas `/architecture` y `/database`)  
**Observación:** Son páginas públicas de presentación técnica. Útiles para demos pero no para usuarios finales del SOC.

---

## Componentes Confirmados en Uso

| Componente | Ruta / Importado en |
|---|---|
| `Login.jsx` | `/login` |
| `Register.jsx` | `/register` |
| `Dashboard.jsx` | `/dashboard` |
| `Alerts.jsx` | `/alerts` |
| `Incidents.jsx` | `/incidents` |
| `SecurityLogs.jsx` | `/logs` |
| `AuditLogs.jsx` | `/audit` |
| `ThreatIntelligence.jsx` | `/threats` |
| `HoneypotPage.jsx` | `/honeypot` |
| `AttackMap.jsx` | `/attack-map` |
| `AIAnalysis.jsx` | `/ai-analysis` |
| `Vulnerabilities.jsx` | `/vulnerabilities` |
| `ThreatHunting.jsx` | `/threat-hunting` |
| `UserList.jsx` | `/users` |
| `Settings.jsx` | `/settings` |
| `DeviceList.jsx` | `/devices` |
| `SessionManagement.jsx` | `/sessions` |
| `PermissionGate.jsx` | Multiple pages |
| `Navbar.jsx` | `App.jsx` / layout |
| `ProtectedRoute.jsx` | `routes.jsx` |

---

## Acciones Recomendadas

| Prioridad | Archivo | Acción |
|---|---|---|
| Alta | `LoginForm.jsx` | Confirmar si se importa en algún lugar; si no, eliminar |
| Alta | `LandingPage_temp.jsx` | Revisar contenido; si es obsoleto, eliminar |
| Media | `SIEMTerminal.jsx` | Rastrear imports; si no tiene uso, documentar como dead code |
| Media | `TerminalWidget.jsx` | Rastrear imports |
| Baja | `ThreatVisualization.jsx` | Rastrear imports |
| Baja | `ComponentShowcase.jsx` | Evaluar si exponer en producción |
