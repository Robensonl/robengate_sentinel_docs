# Guía de Instalación — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Prerrequisitos del Sistema

### Software Requerido

| Herramienta | Versión Mínima | Propósito |
|---|---|---|
| Node.js | 20 LTS | Runtime backend + frontend dev |
| npm | 10+ | Gestor de paquetes |
| Docker Desktop | 24+ | Contenedores de infraestructura |
| Docker Compose | 2.x | Orquestación multi-contenedor |
| Git | 2.x | Control de versiones |
| OpenSSL | 3.x | Generación de certificados TLS |

### Opcional (para funcionalidades avanzadas)

| Herramienta | Versión | Para qué |
|---|---|---|
| kubectl | 1.29+ | Despliegue en Kubernetes |
| Helm | 3.x | Gestión de chart K8s |
| PostgreSQL client (`psql`) | 16 | Administración directa de BD |
| `mongosh` | 2.x | Administración directa de MongoDB |

### Recursos de Hardware (Desarrollo)

| Recurso | Mínimo | Recomendado |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disco | 10 GB | 20+ GB |
| SO | Windows 10/11, macOS 12+, Ubuntu 20.04+ | — |

### Recursos de Hardware (Producción)

| Recurso | Mínimo | Recomendado |
|---|---|---|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Disco | 50 GB SSD | 100+ GB SSD |
| Red | 100 Mbps | 1 Gbps |

---

## Instalación en Desarrollo

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Robensonl/robengate-sentinel.git
cd robengate-sentinel

# Verificar la rama principal
git checkout develop
git pull origin develop
```

### Paso 2: Iniciar Infraestructura con Docker

```bash
# Windows (PowerShell)
.\dev-start.ps1

# Linux / macOS
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.dev.yml \
  --env-file infra/docker/.env.dev \
  up postgres mongodb redis -d
```

**Verificar que los servicios están corriendo:**
```bash
docker compose -f infra/docker/docker-compose.yml ps
# Deben mostrar state: healthy
```

### Paso 3: Configurar el Backend

```bash
cd backend

# Copiar plantilla de variables de entorno
cp .env.example .env

# Editar .env con tu editor preferido
# Valores mínimos necesarios para desarrollo:
```

**Valores mínimos en `backend/.env` para desarrollo:**
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robengate_sentinel
DB_USER=postgres
DB_PASSWORD=devpass123
MONGO_URI=mongodb://devadmin:devpass123@localhost:27017/robengate_sentinel?authSource=admin
REDIS_URL=redis://:devpass123@localhost:6379
JWT_SECRET=dev-jwt-secret-change-in-production-minimum-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-different-from-jwt-secret-32chars
INTERNAL_API_SECRET=dev-internal-secret-32-chars-minimum
OTP_HMAC_KEY=dev-otp-hmac-key-also-32-chars-minimum
CLIENT_URL=http://localhost:5173
```

```bash
# Instalar dependencias
npm install

# Verificar instalación
npm run lint
```

### Paso 4: Inicializar la Base de Datos PostgreSQL

```bash
# Desde el directorio raíz del proyecto
# Aplicar schema inicial
PGPASSWORD=devpass123 psql \
  -h localhost -p 5432 \
  -U postgres \
  -d robengate_sentinel \
  -f db-sql/schema.sql

# Aplicar todas las migraciones en orden
for migration in db-sql/migrations/*.sql; do
  echo "Aplicando: $migration"
  PGPASSWORD=devpass123 psql \
    -h localhost -p 5432 \
    -U postgres \
    -d robengate_sentinel \
    -f "$migration"
done
```

**En PowerShell (Windows):**
```powershell
$env:PGPASSWORD = "devpass123"
psql -h localhost -p 5432 -U postgres -d robengate_sentinel -f "db-sql\schema.sql"

Get-ChildItem "db-sql\migrations\*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Aplicando: $($_.Name)"
    psql -h localhost -p 5432 -U postgres -d robengate_sentinel -f $_.FullName
}
```

### Paso 5: Crear el Primer Administrador

```bash
cd backend
node scripts/manage-admins.js create \
  --email admin@empresa.com \
  --name "Administrador Principal" \
  --password "Admin@Seguro123!"
```

> **Seguridad:** Cambia la contraseña en el primer acceso y activa MFA.

### Paso 6: Iniciar el Backend en Modo Desarrollo

```bash
cd backend
npm run dev
# ✅ Backend corriendo en http://localhost:5000
# ✅ Nodemon activo — recarga automática al guardar
```

### Paso 7: Configurar el Frontend

```bash
cd ../frontend

# Copiar plantilla
cp .env.example .env

# Contenido del .env del frontend:
echo "VITE_API_URL=http://localhost:5000" > .env
echo "VITE_APP_NAME=RobenGate Sentinel" >> .env

# Instalar dependencias
npm install
```

### Paso 8: Iniciar el Frontend en Modo Desarrollo

```bash
npm run dev
# ✅ Frontend corriendo en http://localhost:5173
# ✅ Vite HMR activo — recarga instantánea
```

### Paso 9: (Opcional) Iniciar el Honeypot

```bash
cd ../honeypot

# Generar clave SSH para el honeypot
ssh-keygen -t rsa -b 4096 -N "" -f honeypot_host_key -q
SSH_KEY=$(cat honeypot_host_key)

# Configurar .env
cat > .env << EOF
BACKEND_URL=http://localhost:5000
INTERNAL_API_SECRET=dev-internal-secret-32-chars-minimum
HONEYPOT_SSH_PORT=2222
HONEYPOT_HTTP_PORT=8080
SSH_HOST_KEY_PEM=${SSH_KEY}
EOF

# Instalar e iniciar
npm install
npm start
```

---

## Verificación de la Instalación

### Comprobaciones de Salud

```bash
# 1. Backend health check
curl http://localhost:5000/health
# Esperado: {"status":"ok","uptime":...}

# 2. Backend readiness check
curl http://localhost:5000/ready
# Esperado: {"status":"ready","postgres":"ok","mongodb":"ok","redis":"ok"}

# 3. Frontend cargado
# Abrir http://localhost:5173 en el navegador
# Debe mostrar la landing page de RobenGate Sentinel
```

### Verificación de Base de Datos

```bash
# PostgreSQL — verificar tablas creadas
PGPASSWORD=devpass123 psql -h localhost -U postgres -d robengate_sentinel \
  -c "\dt"
# Debe listar: users, devices, sessions, security_logs, etc.

# MongoDB — verificar conexión
mongosh "mongodb://devadmin:devpass123@localhost:27017/robengate_sentinel?authSource=admin" \
  --eval "db.runCommand({ping: 1})"
# Debe devolver: { ok: 1 }

# Redis — verificar conexión
redis-cli -a devpass123 ping
# Debe devolver: PONG
```

### Test de Login

```bash
# Intentar login con el admin creado
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"Admin@Seguro123!"}' \
  | python3 -m json.tool
```

---

## Detener el Entorno de Desarrollo

```bash
# Windows
.\dev-stop.ps1

# Linux / macOS
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.dev.yml \
  down

# Con limpieza completa (elimina volúmenes = borra datos)
# ⚠️ CUIDADO: esto elimina todos los datos de desarrollo
docker compose -f infra/docker/docker-compose.yml down -v
```

---

## Solución de Problemas de Instalación

### Error: Puerto ya en uso

```bash
# Puerto 5432 (PostgreSQL)
# Verificar si hay un PostgreSQL local corriendo
pg_lsclusters  # Linux
# o
netstat -ano | findstr "5432"  # Windows

# Si hay conflicto, cambiar el puerto en docker-compose.dev.yml
# ports: "5433:5432"  y actualizar DB_PORT=5433 en .env
```

### Error: Docker no conecta a MongoDB

```bash
# Verificar credenciales en docker-compose.dev.yml y .env
# El MONGO_URI debe incluir ?authSource=admin
MONGO_URI=mongodb://devadmin:devpass123@localhost:27017/robengate_sentinel?authSource=admin
```

### Error: npm install falla

```bash
# Limpiar caché de npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Backend no conecta a Redis

```bash
# Verificar REDIS_URL con contraseña
REDIS_URL=redis://:devpass123@localhost:6379
# Nota: los dos puntos antes de la contraseña son necesarios
```
