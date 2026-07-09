# Auditoría de Código — Dead Code

**Scope:** `frontend/src/` + `backend/src/`  
**Estado:** Solo documentación — NO eliminar sin aprobación  

---

## Definición

Dead code = código que existe en el repositorio pero que nunca se ejecuta durante el funcionamiento normal de la aplicación.

---

## Frontend — Dead Code Identificado

### 1. `frontend/src/features/landing/pages/LandingPage_temp.jsx`

**Tipo:** Página React completa  
**Evidencia de no uso:**
- No aparece en ningún `import` en `routes.jsx`
- El sufijo `_temp` confirma que es un borrador
- `LandingPage.jsx` (sin sufijo) está activo en la ruta `/`

**Riesgo:** Bajo — no se ejecuta. Solo ocupa espacio en el bundle si algún bundler lo procesa.  
**Recomendación:** Revisar si tiene contenido valioso no incluido en `LandingPage.jsx`. Si no, eliminar.

---

### 2. `frontend/src/components/LoginForm.jsx`

**Tipo:** Componente React  
**Evidencia de no uso:**
- Búsqueda en todo el codebase: 0 imports de este componente
- La lógica equivalente está en `shared/hooks/useLoginForm.js` (sí usado)
- El componente de login activo es `features/auth/pages/Login.jsx` que usa `useLoginForm.js`

**Riesgo:** Bajo — no se importa, no llega al bundle de producción (tree-shaking lo elimina).  
**Recomendación:** Candidato a eliminar. Verificar antes si contiene lógica no replicada en `Login.jsx`.

---

### 3. `frontend/src/features/attackmap/pages/AttackMap.jsx` + `frontend/src/shared/services/attackSimulator.js`

**Tipo:** Página + Servicio  
**Estado:** ✅ EN USO pero con parte simulada

**El `attackSimulator.js` es dead code de producción:**
- Genera eventos de ataque ficticios cuando el SSE real no tiene datos
- Actúa como fallback DEMO
- En producción real, debería estar desactivado o removido

**Recomendación:** Mantener para demos. Documentar claramente como `DEMO_ONLY`. Añadir flag de feature toggle para producción.

---

### 4. Páginas de Marketing Como Rutas Públicas en Producción

Las siguientes rutas son públicas (sin autenticación) y tienen contenido de demo/marketing:

| Ruta | Archivo | Propósito |
|---|---|---|
| `/architecture` | `ArchitecturePage.jsx` | Diagrama de arquitectura — demo visual |
| `/database` | `DatabaseArchitecture.jsx` | Schema de DB — demo técnica |
| `/security-headers` | `SecurityHeaders.jsx` | Headers de seguridad — demo |
| `/contact` | `BusinessCard.jsx` | Tarjeta de presentación |
| `/showcase` | `ComponentShowcase.jsx` | Showcase de componentes — desarrollo |
| `/biometric` | `BiometricAuth.jsx` | Biometric auth — demo experimental |

**Observación:** Estas rutas no son "dead code" (tienen código activo), pero **no deberían estar expuestas en producción sin acceso autenticado** ya que revelan información de arquitectura interna.

**Recomendación para producción:** Envolver en `<Protected>` o deshabilitar en entorno `NODE_ENV=production`.

---

## Backend — Dead Code Identificado

### 5. Código con Rol Dual (Demo vs. Producción)

En varios controladores existen bloques condicionales que retornan datos simulados cuando la fuente real no está disponible:

```javascript
// Patrón típico encontrado en aiAnalysisController.js, attackMapController.js
if (!elasticsearch_available) {
  return res.json({ data: MOCK_DATA });  // ← Dead code path en producción real
}
```

**Recomendación:** Documentar claramente con comentarios `// DEMO_FALLBACK` cada bloque simulado.

---

### 6. `backend/src/models/BannedIp.js`, `Device.js`, `MfaCode.js`, `SecurityLog.js`, `User.js`

**Observación:** Son modelos PostgreSQL-like sobre pg client. Verificar si están todos en uso o si alguno tiene métodos no llamados.

**Pendiente:** Auditoría de métodos no llamados requiere análisis más profundo (scope de auditoría v2).

---

## Resumen

| Archivo | Tipo | Impacto | Recomendación |
|---|---|---|---|
| `LandingPage_temp.jsx` | Página completa | Bajo | Revisar y eliminar |
| `LoginForm.jsx` | Componente | Nulo (tree-shaking) | Eliminar tras verificar |
| `attackSimulator.js` | Servicio demo | Solo demo | Añadir feature flag |
| Rutas marketing públicas | Páginas | Seguridad | Proteger en producción |
