# Guía de Desarrollo — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Flujo de Trabajo de Desarrollo

### Configuración del Entorno Local

#### Prerequisitos
```
Node.js 20 LTS
Docker Desktop (para bases de datos)
Git 2.40+
VS Code (recomendado)
```

#### Setup Inicial (una sola vez)

```powershell
# 1. Clonar repositorio
git clone https://github.com/Robensonl/robengate-sentinel.git
cd robengate-sentinel

# 2. Arrancar infraestructura de bases de datos
.\dev-start.ps1

# 3. Backend — instalar dependencias y configurar
cd backend
npm install
copy .env.example .env  # Windows
# cp .env.example .env   # Linux/Mac
# Editar .env con tus valores

# 4. Inicializar base de datos
docker exec -i robengate-postgres psql -U sentinel_user -d sentinel_db < ../db-sql/schema.sql
# O ejecutar migraciones (preferido):
node scripts/run-migrations.js

# 5. Crear primer admin
node scripts/manage-admins.js create \
  --email admin@dev.local \
  --name "Dev Admin" \
  --password "Admin1234!"

# 6. Frontend — instalar dependencias
cd ../frontend
npm install
copy .env.example .env  # Windows
# Editar VITE_API_URL=http://localhost:5000
```

#### Arranque Diario

```powershell
# Terminal 1: Infraestructura
.\dev-start.ps1

# Terminal 2: Backend con hot-reload
cd backend
npm run dev

# Terminal 3: Frontend con hot-reload
cd frontend
npm run dev
```

URLs de desarrollo:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health: `http://localhost:5000/health`

---

## Estructura del Código

### Backend (`backend/src/`)

```
routes/         # Express router (23 archivos, 1 por dominio)
controllers/    # Lógica de negocio HTTP (18 controladores)
services/       # Lógica de dominio reutilizable (22 servicios)
middleware/     # Express middleware (10 archivos)
models/         # Mongoose schemas (6 modelos MongoDB)
ingestion/      # Pipeline de eventos (5 servicios)
utils/          # Helpers: sanitize, logger, metrics
config/         # Configuración: DB, Redis, Elasticsearch
```

### Convención de Código

**Naming:**
- Archivos: `camelCase.js` (servicios, controladores), `kebab-case.js` (rutas)
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Clases: `PascalCase`

**Estructura de controladores:**
```javascript
// patron: try/catch con next(error)
async function getAlerts(req, res, next) {
  try {
    const data = await alertService.findAll(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err); // Error handler global
  }
}
```

**Rutas con permisos:**
```javascript
router.get('/', authenticate, authorize('analyst'), getAlerts);
router.get('/read', authenticate, readOnly(), getAlerts);  // viewer+
router.post('/', authenticate, authorize('analyst'), createAlert);
router.delete('/:id', authenticate, authorize('admin'), deleteAlert);
```

---

## Git Flow

### Ramas Principales

```
main          # Producción estable (protegida)
develop       # Rama de integración
```

### Flujo de Feature

```bash
# 1. Siempre partir de develop actualizado
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/nombre-descriptivo

# 3. Desarrollar con commits atómicos
git add .
git commit -m "feat(auth): add TOTP backup codes support"

# 4. Push y Pull Request hacia develop
git push origin feature/nombre-descriptivo
# Abrir PR en GitHub

# 5. Code review + merge
# No hacer squash de commits de feature
```

### Formato de Commits (Conventional Commits)

```
feat(modulo): descripción corta
fix(auth): descripcion del bug corregido
docs(api): actualizar referencia endpoints
refactor(risk-engine): extraer función calcular señales
test(users): añadir tests para crear usuario
chore(deps): actualizar dependencias
```

### Reglas de Branch Protection (main)
- Requerir Pull Request con al menos 1 review
- Status checks: lint + test (cuando se configure CI)
- No force push directo

---

## Debugging

### Backend

```powershell
# Modo debug con inspect (Node.js debugger)
cd backend
node --inspect src/app.js
# Conectar en chrome://inspect

# Con nodemon en modo debug
$env:NODE_OPTIONS="--inspect"; npm run dev

# Ver logs estructurados
docker compose logs -f backend | Select-String "ERROR|WARN"
```

### Frontend

```powershell
# Vite con sourcemaps completos (ya habilitados en dev)
cd frontend
npm run dev

# Análisis de bundle
npm run build -- --mode analyze
npx vite-bundle-analyzer dist/
```

### Debugging Base de Datos

```bash
# PostgreSQL — conectar directamente
docker exec -it robengate-postgres psql -U sentinel_user -d sentinel_db

# Consultas frecuentes de debug:
# Ver sesiones activas
SELECT * FROM sessions WHERE expires_at > NOW();

# Ver IPs baneadas
SELECT * FROM banned_ips WHERE expires_at > NOW();

# MongoDB — ver últimos logs
docker exec -it robengate-mongodb mongosh sentinel_db \
  --eval "db.security_logs.find().sort({_id:-1}).limit(10).pretty()"

# Redis — ver blacklist JWT
docker exec -it robengate-redis redis-cli -a $REDIS_PASSWORD KEYS "jwt:blacklist:*"
```

---

## Variables de Entorno para Desarrollo

Archivo `backend/.env` mínimo para desarrollo:

```bash
NODE_ENV=development
PORT=5000

# DB — Docker local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sentinel_db
DB_USER=sentinel_user
DB_PASSWORD=dev_password

# MongoDB — Docker local
MONGO_URI=mongodb://localhost:27017/sentinel_db

# Redis — Docker local
REDIS_URL=redis://localhost:6379

# JWT — usar valores de prueba en dev
JWT_SECRET=dev-secret-not-for-production-use-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-not-for-production

# Frontend origin
CLIENT_URL=http://localhost:5173

# Email — usar Ethereal (fake SMTP) en dev
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=tu-usuario@ethereal.email
EMAIL_PASS=tu-password-ethereal

# Internal (honeypot)
INTERNAL_API_SECRET=dev-internal-secret
```

**Nota:** Para emails en desarrollo, crear cuenta gratuita en [ethereal.email](https://ethereal.email) para capturar emails de MFA sin enviarlos realmente.

---

## Linting y Formateo

```bash
# Backend — ESLint
cd backend
npm run lint
npm run lint -- --fix  # Auto-fix

# Frontend — ESLint + Prettier
cd frontend
npm run lint
npm run lint -- --fix

# Verificar formato antes de commit
npm run lint && npm run build
```

---

## Tests (Roadmap Q3 2026)

Los tests aún no están implementados. El plan para v2.1:

```
backend/tests/
  unit/
    services/authService.test.js
    services/riskEngine.test.js
    middleware/authorize.test.js
  integration/
    routes/auth.test.js
    routes/incidents.test.js

frontend/src/__tests__/
  components/
  hooks/
  pages/
```

```bash
# Cuando estén implementados:
cd backend && npm test
cd frontend && npm test
```

---

## Extensibilidad — Añadir Nueva Funcionalidad

### Añadir nuevo endpoint REST

1. Crear `backend/src/routes/nuevoModulo.js`
2. Crear `backend/src/controllers/nuevoModuloController.js`
3. Crear `backend/src/services/nuevoModuloService.js` (si necesario)
4. Registrar ruta en `backend/src/app.js`:
   ```javascript
   import nuevoModuloRoutes from './routes/nuevoModulo.js';
   app.use('/api/nuevo-modulo', nuevoModuloRoutes);
   ```
5. Añadir migración si requiere nueva tabla PostgreSQL:
   ```bash
   # Crear migration/014_nuevo_modulo.sql
   # Incrementar número de migración
   ```

### Añadir nueva página en Frontend

1. Crear `frontend/src/features/nuevoModulo/pages/NuevaPagina.jsx`
2. Añadir permisos en `frontend/src/features/auth/utils/permissions.js`
3. Registrar ruta en `frontend/src/App.jsx`:
   ```jsx
   <Route path="/nuevo-modulo" element={
     <PermissionGate permission="nueva_funcionalidad.read">
       <NuevaPagina />
     </PermissionGate>
   } />
   ```
