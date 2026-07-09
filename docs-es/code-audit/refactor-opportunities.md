# Auditoría de Código — Oportunidades de Refactorización

**Scope:** `frontend/src/` + `backend/src/`  
**Estado:** Solo documentación y recomendaciones — NO implementar sin planificación  
**Prioridad:** Estas mejoras son opcionales para la funcionalidad actual  

---

## Oportunidades Identificadas

### R1: Consolidar Duplicación de Validación (Backend)

**Archivo(s):** `backend/src/middleware/validate.js`  
**Problema:** El backend tiene dos librerías de validación instaladas: `zod` y `express-validator`. Si ambas se usan en distintos endpoints, hay inconsistencia.  

**Recomendación:**
- Estandarizar en `zod` (ya es el estándar principal)
- Migrar cualquier endpoint que use `express-validator` a schemas Zod
- Crear una librería de schemas reutilizables en `backend/src/schemas/`

**Beneficio:** Menos dependencias, código más consistente, tipos automáticos inferibles.

**Esfuerzo estimado:** Bajo-Medio — 2-4 horas

---

### R2: Separar Modelos Mongoose del Backend Principal

**Archivos:** `backend/src/models/*.js` y `backend/src/lib/SecurityLog.js`  
**Problema:** Hay modelos Mongoose en dos ubicaciones: `src/models/` y `src/lib/SecurityLog.js`.  

**Observación:** `lib/SecurityLog.js` parece ser un modelo que debería estar en `models/`. La convención en el resto del proyecto es `models/`.

**Recomendación:**
- Mover `lib/SecurityLog.js` a `models/SecurityLog.js` si no es ya un duplicado
- O verificar si `lib/SecurityLog.js` es diferente de `models/SecurityLog.js` (ambos existen)

**⚠️ Atención:** Hay dos archivos `SecurityLog.js`:
- `backend/src/lib/SecurityLog.js`
- `backend/src/models/SecurityLog.js`

Verificar si son diferentes o duplicados antes de cualquier acción.

---

### R3: Organización de Componentes Frontend

**Archivos:** `frontend/src/components/` — solo contiene `LoginForm.jsx`  
**Problema:** La carpeta `components/` está casi vacía mientras `shared/components/` tiene todos los componentes reutilizables.  

**Recomendación:**
- Si `LoginForm.jsx` no se usa, eliminar la carpeta `components/` entera
- Si se usa, moverlo a `shared/components/` o a `features/auth/components/`
- Estandarizar: todos los shared components en `shared/components/`, todos los feature-specific en `features/[feature]/components/`

**Beneficio:** Estructura de carpetas más predecible para nuevos desarrolladores.

**Esfuerzo estimado:** Bajo — 30 minutos

---

### R4: Feature Flag para `attackSimulator.js`

**Archivo:** `frontend/src/shared/services/attackSimulator.js`  
**Problema:** El simulador de ataques (fallback demo) no tiene un mecanismo de feature flag. En producción, podría mostrar datos falsos si el SSE no tiene datos.

**Recomendación:**
```javascript
// shared/services/attackSimulator.js
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function startSimulator(callback) {
  if (!DEMO_MODE) {
    console.warn('[attackSimulator] Demo mode disabled. No simulation.');
    return;
  }
  // ... simulation code
}
```

**Y en `.env.production`:**
```
VITE_DEMO_MODE=false
```

**Beneficio:** Separación clara entre demo y producción sin modificar código.

**Esfuerzo estimado:** Bajo — 1 hora

---

### R5: Centralizar Rutas de Marketing Bajo Feature Flag

**Archivos:** `routes.jsx` — rutas `/architecture`, `/database`, `/security-headers`, `/showcase`  
**Problema:** Estas rutas de demo/marketing están públicamente accesibles y revelan información de arquitectura interna.

**Recomendación:**
```javascript
// routes.jsx
const MARKETING_MODE = import.meta.env.VITE_MARKETING_PAGES === 'true';

// Solo incluir rutas de marketing en modo demo
{MARKETING_MODE && (
  <>
    <Route path="/architecture" element={<ArchitecturePage />} />
    <Route path="/database" element={<DatabaseArchitecture />} />
    <Route path="/showcase" element={<ComponentShowcase />} />
  </>
)}
```

**Beneficio:** Seguridad por defecto — en producción estas rutas no existen.

**Esfuerzo estimado:** Bajo — 1-2 horas

---

### R6: Error Handling Centralizado en Frontend

**Observación:** Los errores de API en el frontend se manejan en cada componente individualmente (`try/catch` local o `.catch()` local).  

**Patrón potencial:** Un interceptor centralizado en `api.js` podría manejar errores comunes (401 → logout, 403 → access denied, 500 → toast genérico) sin duplicar código.

**El `api.js` ya parece tener algo de esto** — verificar si hay consistencia en el manejo de 401 vs. casos donde se hace individualmente.

**Esfuerzo estimado:** Medio — 4-8 horas

---

### R7: OpenAPI / Swagger para Documentación Automática

**Observación:** La documentación de la API en `docs-es/api/` fue escrita manualmente, lo que crea riesgo de desincronización con el código.

**Recomendación:** Añadir `swagger-jsdoc` al backend para generar documentación desde comentarios JSDoc en las rutas.

```javascript
// backend/src/routes/auth.js
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 */
router.post('/login', ...);
```

**Beneficio:** Documentación siempre sincronizada con el código. Endpoint `/api-docs` disponible para testing interactivo.

**Esfuerzo estimado:** Alto — 8-16 horas para cobertura completa

---

## Priorización de Refactorizaciones

| ID | Descripción | Prioridad | Esfuerzo | Impacto |
|---|---|---|---|---|
| R1 | Consolidar validación (zod vs express-validator) | Alta | Bajo | Consistencia código |
| R4 | Feature flag attackSimulator | Alta | Bajo | Seguridad producción |
| R5 | Feature flag rutas marketing | Alta | Bajo | Seguridad producción |
| R3 | Organizar componentes frontend | Media | Bajo | Mantenibilidad |
| R2 | SecurityLog.js duplicado | Media | Bajo | Claridad |
| R6 | Error handling centralizado | Media | Medio | DX + UX |
| R7 | OpenAPI/Swagger | Baja | Alto | Documentación |

---

## Política de Refactorización

Antes de refactorizar cualquier código:

1. **Confirmar** que los tests pasan antes y después (o añadir tests)
2. **Crear branch** específico para la refactorización
3. **No mezclar** refactorización con nuevas features en el mismo commit
4. **Revisar** que el comportamiento es idéntico antes de hacer merge
5. **Actualizar documentación** si la refactorización cambia la API interna
