# Inventario del Proyecto — Despliegue

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026

---

## Modos de Despliegue Disponibles

| Modo | Herramienta | Entorno | Descripción |
|---|---|---|---|
| Desarrollo local | `dev-start.ps1` | Windows/PowerShell | Inicia infraestructura + watchers |
| Docker Compose dev | `docker-compose.dev.yml` | Cualquier OS | Solo BD, backend/frontend en local |
| Docker Compose prod | `docker-compose.yml + prod.yml` | VPS / Servidor | Stack completo containerizado |
| Kubernetes | `kubectl apply -k k8s/` | Kubernetes cluster | Despliegue enterprise con HPA |
| Helm | `helm install` | Kubernetes cluster | Gestión avanzada con chart |

---

## 1. Despliegue de Desarrollo Local

### Prerrequisitos
- Node.js 20 LTS
- Docker Desktop (para BD)
- PowerShell 7+ (Windows) o bash (Linux/macOS)

### Paso 1: Iniciar bases de datos con Docker
```powershell
# Windows
.\dev-start.ps1

# O manualmente:
docker compose -f infra/docker/docker-compose.yml `
               -f infra/docker/docker-compose.dev.yml `
               --env-file infra/docker/.env.dev `
               up postgres mongodb redis -d
```

### Paso 2: Configurar backend
```bash
cd backend
cp .env.example .env
# Editar .env con valores de desarrollo
npm install
npm run dev    # Inicia con nodemon en puerto 5000
```

### Paso 3: Configurar frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm install
npm run dev    # Inicia Vite en puerto 5173
```

### Paso 4: Inicializar base de datos PostgreSQL
```bash
# Aplicar schema inicial
PGPASSWORD=devpass123 psql -h localhost -U postgres -d robengate_sentinel \
  -f db-sql/schema.sql

# Aplicar migraciones (en orden)
for migration in db-sql/migrations/*.sql; do
  PGPASSWORD=devpass123 psql -h localhost -U postgres -d robengate_sentinel \
    -f "$migration"
done
```

### Paso 5: Crear primer administrador
```bash
cd backend
node scripts/manage-admins.js create \
  --email admin@empresa.com \
  --name "Administrador" \
  --password "contraseña-segura"
```

### Verificación
```bash
curl http://localhost:5000/health
# {"status":"ok","uptime":...}

curl http://localhost:5000/ready
# {"status":"ready","postgres":"ok","mongodb":"ok","redis":"ok"}
```

---

## 2. Despliegue Docker Compose (Producción)

### Prerrequisitos
- Docker Engine 24+
- Docker Compose 2.x
- Certificados TLS (ver sección TLS)
- Variables de entorno de producción

### Paso 1: Clonar repositorio
```bash
git clone https://github.com/Robensonl/robengate-sentinel.git
cd robengate-sentinel
```

### Paso 2: Generar certificados TLS
```bash
# Desarrollo (auto-firmados):
# En Windows:
.\scripts\generate-dev-certs.ps1

# Producción (Let's Encrypt):
certbot certonly --standalone -d tudominio.com
cp /etc/letsencrypt/live/tudominio.com/fullchain.pem infra/nginx/ssl/
cp /etc/letsencrypt/live/tudominio.com/privkey.pem infra/nginx/ssl/
openssl dhparam -out infra/nginx/ssl/dhparam.pem 4096
```

### Paso 3: Configurar variables de entorno
```bash
cat > .env.prod << 'EOF'
DB_PASSWORD=<contraseña-fuerte-aleatoria>
MONGO_ROOT_USER=sentinel_admin
MONGO_ROOT_PASSWORD=<contraseña-fuerte-aleatoria>
REDIS_PASSWORD=<contraseña-fuerte-aleatoria>
JWT_SECRET=<256-bits-aleatorios>
JWT_REFRESH_SECRET=<256-bits-aleatorios>
INTERNAL_API_SECRET=<256-bits-aleatorios>
OTP_HMAC_KEY=<256-bits-aleatorios>
SSH_HOST_KEY_PEM=<clave-PEM-RSA>
CLIENT_URL=https://tudominio.com
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_PORT=587
EMAIL_USER=noreply@tudominio.com
EMAIL_PASS=<contraseña-smtp>
NODE_ENV=production
EOF
```

### Paso 4: Desplegar
```bash
# O usar el script de deploy:
./infra/scripts/deploy.sh production

# O manualmente:
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml \
  --env-file .env.prod \
  up -d --build --remove-orphans
```

### Paso 5: Verificar servicios
```bash
docker compose -f infra/docker/docker-compose.yml ps

# Health checks
curl https://tudominio.com/health
curl https://tudominio.com/ready
```

### Paso 6: Ejecutar migraciones en contenedor
```bash
docker compose exec backend node -e "
  require('./src/config/database.js')
    .runMigrations()
    .then(() => process.exit(0))
"
```

---

## 3. Despliegue Kubernetes

### Prerrequisitos
- Cluster Kubernetes 1.29+
- kubectl configurado
- Kustomize 5.x
- cert-manager instalado (para TLS)
- nginx ingress controller

### Paso 1: Crear namespace y secretos
```bash
kubectl apply -f k8s/base/namespace.yaml

# Crear secretos de base de datos
kubectl create secret generic db-credentials \
  --namespace robengate-sentinel \
  --from-literal=DB_PASSWORD="<contraseña>" \
  --from-literal=MONGO_ROOT_PASSWORD="<contraseña>" \
  --from-literal=REDIS_PASSWORD="<contraseña>"

# Crear secretos de aplicación
kubectl create secret generic app-secrets \
  --namespace robengate-sentinel \
  --from-literal=JWT_SECRET="<secret>" \
  --from-literal=JWT_REFRESH_SECRET="<secret>" \
  --from-literal=INTERNAL_API_SECRET="<secret>" \
  --from-literal=OTP_HMAC_KEY="<secret>"
```

### Paso 2: Desplegar con Kustomize
```bash
# Base (desarrollo/staging)
kubectl apply -k k8s/base/

# Producción (con overlays)
kubectl apply -k k8s/overlays/prod/
```

### Paso 3: Verificar despliegue
```bash
kubectl get pods -n robengate-sentinel
kubectl get services -n robengate-sentinel
kubectl get ingress -n robengate-sentinel
kubectl get hpa -n robengate-sentinel

# Logs del backend
kubectl logs -f deployment/backend -n robengate-sentinel
```

### Paso 4: Escalar manual (si necesario)
```bash
kubectl scale deployment backend --replicas=4 -n robengate-sentinel
```

---

## 4. Despliegue con Helm

### Instalación inicial
```bash
# Añadir repositorio (si se publicara en Helm Hub)
# helm repo add robengate https://charts.robengate-sentinel.com

# Instalar desde directorio local
helm install robengate-sentinel ./helm/robengate-sentinel \
  --namespace robengate-sentinel \
  --create-namespace \
  --set backend.image.tag=2.0.0 \
  --set ingress.hosts[0].host=tudominio.com \
  --set-string secrets.jwtSecret="<secret>" \
  --set-string secrets.dbPassword="<password>"
```

### Actualización
```bash
helm upgrade robengate-sentinel ./helm/robengate-sentinel \
  --namespace robengate-sentinel \
  --set backend.image.tag=2.1.0
```

### Rollback
```bash
helm rollback robengate-sentinel 1 -n robengate-sentinel
```

### Ver estado
```bash
helm status robengate-sentinel -n robengate-sentinel
helm history robengate-sentinel -n robengate-sentinel
```

---

## 5. Despliegue del Stack de Monitorización

### Docker Compose
```bash
docker compose -f monitoring/docker-compose.monitoring.yml up -d
```

### Acceso
```
Prometheus:   http://localhost:9090
Grafana:      http://localhost:3000  (admin/admin → cambiar en primer login)
Alertmanager: http://localhost:9093
```

### Importar Dashboards Grafana
1. Acceder a Grafana → Dashboards → Import
2. Importar archivos de `monitoring/grafana/dashboards/`
3. Seleccionar datasource: Prometheus

---

## 6. Checklist Pre-Producción

```
☐ Certificados TLS válidos (no auto-firmados)
☐ Todas las variables de entorno configuradas
☐ Contraseñas fuertes (mínimo 32 chars aleatorios)
☐ JWT secrets únicos y no predecibles (mínimo 256 bits)
☐ MongoDB con autenticación obligatoria
☐ Redis con contraseña
☐ PostgreSQL con SSL si la BD es remota
☐ /internal/ no accesible desde internet (solo IPs internas)
☐ Rate limiting configurado apropiadamente
☐ Email SMTP configurado (para MFA)
☐ Backups automatizados configurados
☐ Monitorización y alertas activas
☐ Health checks respondiendo correctamente
☐ Primer admin creado y MFA activado
☐ Plan de respuesta a incidentes preparado
```

---

## 7. Comandos de Gestión Post-Despliegue

### Gestión de admins
```bash
# Docker Compose
docker compose exec backend node scripts/manage-admins.js list
docker compose exec backend node scripts/manage-admins.js create \
  --email admin@empresa.com --name "Admin" --password "pass"

# Kubernetes
kubectl exec -n robengate-sentinel deployment/backend -- \
  node scripts/manage-admins.js list
```

### Backup manual
```bash
# Docker Compose
./infra/scripts/backup.sh ./backups/

# Kubernetes
kubectl exec -n robengate-sentinel statefulset/postgres -- \
  pg_dump -U postgres robengate_sentinel | gzip > backup.sql.gz
```

### Ver logs en tiempo real
```bash
# Docker Compose
docker compose logs -f backend

# Kubernetes
kubectl logs -f deployment/backend -n robengate-sentinel
```

### Reiniciar servicio
```bash
# Docker Compose
docker compose restart backend

# Kubernetes
kubectl rollout restart deployment/backend -n robengate-sentinel
```
