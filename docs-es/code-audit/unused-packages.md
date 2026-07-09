# Auditoría de Código — Paquetes NPM No Utilizados o Mal Ubicados

**Scope:** `backend/package.json` + `frontend/package.json`  
**Estado:** Solo documentación — NO eliminar sin pruebas completas  

---

## Backend — Hallazgos

### 1. `@simplewebauthn/browser` en Backend — PAQUETE MAL UBICADO

**Versión:** ^13.3.0  
**Problema:** `@simplewebauthn/browser` es un paquete diseñado exclusivamente para el navegador (browser). El backend solo debería tener `@simplewebauthn/server`.

**Evidencia:**
- Búsqueda en `backend/src/**/*.js`: 0 referencias a `@simplewebauthn/browser`
- El frontend SÍ usa este paquete (ver `frontend/src/shared/hooks/useWebAuthn.js`)

**Riesgo:** Bajo (no se importa, no afecta runtime) pero aumenta el tamaño de `node_modules` innecesariamente.

**Recomendación:**
```bash
# En backend/
npm uninstall @simplewebauthn/browser
```

---

### 2. `express-validator` — DUPLICADO CON `zod`

**Versión:** ^7.3.2  
**Observación:** El backend usa primariamente `zod` para validación de schemas (importado en `validate.js` middleware). La búsqueda muestra que `express-validator` aparece en `validate.js` pero en el comentario del archivo, no como uso principal.

**Verificar:** Si `express-validator` tiene endpoints que lo usan, o si `zod` reemplaza completamente su funcionalidad.

**Riesgo:** Medio — mantener dos librerías de validación crea inconsistencia. Los desarrolladores pueden usar cualquiera en nuevos endpoints.

**Recomendación:** Migrar cualquier uso restante de `express-validator` a `zod`, luego eliminar la dependencia.

---

### 3. `password-prompt` — Solo en Scripts Administrativos

**Versión:** ^1.1.3  
**Uso confirmado:** `backend/scripts/manage-admins.js` — CLI interactivo para gestión de admins.

**Observación:** Este paquete es una dependencia de producción (`dependencies`) pero solo se usa en un script administrativo que no es parte del servidor Express.

**Recomendación:** Mover a `devDependencies`:
```bash
npm uninstall password-prompt
npm install --save-dev password-prompt
```

---

### 4. `@elastic/elasticsearch` — Dependencia Opcional No Marcada Como Tal

**Versión:** ^8.12.0  
**Situación:** El `elasticsearchService.js` tiene lógica condicional que lo hace opcional — si Elasticsearch no está disponible, el sistema funciona sin él.

**Problema:** No está marcado como `optionalDependencies` en `package.json`.

**Riesgo:** Bajo, pero una instalación sin ES no debería fallar el `npm install`.

**Recomendación:** Mover a `optionalDependencies` o mantener con documentación clara:
```json
"optionalDependencies": {
  "@elastic/elasticsearch": "^8.12.0"
}
```

---

### 5. `validator` + `zod` — Redundancia Potencial

**Situación:** `validator` (v13) es una librería de validación de strings. `zod` también puede validar strings con métodos como `.email()`, `.url()`, `.min()`.

**Verificar:** Si `validator` se usa para validaciones que `zod` no puede hacer, o si son completamente redundantes.

---

## Frontend — Hallazgos

### 6. `sonner` — Dependencia No Listada en package.json

**Observación:** `routes.jsx` importa `{ toast } from 'sonner'` pero revisar si está en `frontend/package.json`.

```javascript
// routes.jsx línea 3
import { toast } from 'sonner';
```

**Acción:** Verificar que `sonner` está en `frontend/package.json`. Si no, añadirlo explícitamente.

---

## Resumen de Paquetes

### Backend (`backend/package.json`)

| Paquete | Estado | Acción |
|---|---|---|
| `@simplewebauthn/browser` | ❌ Mal ubicado (browser en backend) | Eliminar |
| `express-validator` | ⚠️ Redundante con `zod` | Auditar usos, posible eliminación |
| `password-prompt` | ⚠️ Solo en scripts | Mover a `devDependencies` |
| `@elastic/elasticsearch` | ⚠️ Opcional no marcado | Mover a `optionalDependencies` |
| `validator` | ⚠️ Posible redundancia con `zod` | Auditar usos |
| `@simplewebauthn/server` | ✅ Correcto | Mantener |
| `bcryptjs` | ✅ En uso | Mantener |
| `jsonwebtoken` | ✅ En uso | Mantener |
| `mongoose` | ✅ En uso | Mantener |
| `pg` | ✅ En uso | Mantener |
| `ioredis` | ✅ En uso | Mantener |
| `zod` | ✅ En uso | Mantener |
| `helmet` | ✅ En uso | Mantener |
| `prom-client` | ✅ En uso | Mantener |
| `nodemailer` | ✅ En uso (mailer.js) | Mantener |
| `geoip-lite` | ✅ En uso (geoService.js) | Mantener |
| `otplib` | ✅ En uso (TOTP) | Mantener |
| `qrcode` | ✅ En uso (TOTP QR) | Mantener |
| `winston` | ✅ En uso (logger.js) | Mantener |

---

## Impacto en Seguridad

**Reducir superficie de dependencias es una buena práctica de seguridad:**
- Cada paquete es una posible superficie de ataque (supply chain attacks)
- `npm audit` reporta vulnerabilidades en TODAS las dependencias, incluyendo las no usadas
- Menos paquetes = menos ruido en auditorías de seguridad

**Prioridad:** Alta para `@simplewebauthn/browser` (mal ubicado) y `password-prompt` (categoría incorrecta).
