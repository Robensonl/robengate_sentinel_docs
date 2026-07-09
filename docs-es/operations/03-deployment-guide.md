# Guía de Despliegue — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Opciones de Despliegue

| Opción | Complejidad | Escalabilidad | Recomendado para |
|---|---|---|---|
| Docker Compose (simple) | Baja | Media | VPS, demos, small teams |
| Docker Compose + prod | Media | Media | Staging, equipos pequeños |
| Kubernetes (kustomize) | Alta | Alta | Producción enterprise |
| Helm chart | Alta | Alta | Producción enterprise CI/CD |

---

## 1. Despliegue Docker Compose — Producción

### Prerrequisitos del Servidor
```
OS: Ubuntu 22.04 LTS (recomendado) / Debian 12 / CentOS 9
RAM: 8 GB mínimo
CPU: 4 cores mínimo
Disco: 50 GB SSD mínimo
Red: IP pública, puertos 80/443 abiertos
```

### Paso 1: Instalar Docker en el servidor
```bash
# Ubuntu 22.04
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version   # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

### Paso 2: Clonar el repositorio
```bash
git clone https://github.com/Robensonl/robengate-sentinel.git
cd robengate-sentinel
git checkout develop
```

### Paso 3: Generar certificados TLS

**Opción A: Let's Encrypt (Recomendado para dominio real)**
```bash
# Instalar certbot
sudo apt install certbot -y

# Generar certificados (el puerto 80 debe estar libre)
sudo certbot certonly --standalone -d tudominio.com

# Copiar a la carpeta nginx
sudo cp /etc/letsencrypt/live/tudominio.com/fullchain.pem infra/nginx/ssl/
sudo cp /etc/letsencrypt/live/tudominio.com/privkey.pem infra/nginx/ssl/
sudo chown $USER:$USER infra/nginx/ssl/*.pem

# Generar parámetros DH (tarda varios minutos)
openssl dhparam -out infra/nginx/ssl/dhparam.pem 4096
```

**Opción B: Auto-firmados (solo demo/staging)**
```bash
# Instalar OpenSSL si no está disponible
sudo apt install openssl -y

# Generar CA y certificados
mkdir -p infra/nginx/ssl
cd infra/nginx/ssl

# Clave privada
openssl genrsa -out privkey.pem 4096

# Self-signed certificate (válido 365 días)
openssl req -x509 -new -nodes -key privkey.pem \
  -sha256 -days 365 -out fullchain.pem \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=RobenGate/CN=tudominio.com"

# DH params
openssl dhparam -out dhparam.pem 2048  # 2048 para staging
cd ../../..
```

### Paso 4: Crear archivo de variables de producción
```bash
# NUNCA usar los valores de ejemplo en producción
# Generar secretos reales:
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH=$(openssl rand -base64 64)
INTERNAL=$(openssl rand -hex 32)
OTP_KEY=$(openssl rand -base64 48)
DB_PASS=$(openssl rand -base64 32 | tr -d '/' | head -c 32)
MONGO_PASS=$(openssl rand -base64 32 | tr -d '/' | head -c 32)
REDIS_PASS=$(openssl rand -base64 32 | tr -d '/' | head -c 32)

# Generar clave SSH para honeypot
ssh-keygen -t rsa -b 4096 -N "" -f /tmp/honeypot_key -q
SSH_KEY=$(cat /tmp/honeypot_key)
rm /tmp/honeypot_key*

# Crear archivo .env.prod
cat > .env.prod << EOF
NODE_ENV=production
DB_PASSWORD=${DB_PASS}
MONGO_ROOT_USER=sentinel_admin
MONGO_ROOT_PASSWORD=${MONGO_PASS}
REDIS_PASSWORD=${REDIS_PASS}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
INTERNAL_API_SECRET=${INTERNAL}
OTP_HMAC_KEY=${OTP_KEY}
SSH_HOST_KEY_PEM=${SSH_KEY}
CLIENT_URL=https://tudominio.com
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_PORT=587
EMAIL_USER=noreply@tudominio.com
EMAIL_PASS=tu-contraseña-smtp
DB_NAME=robengate_sentinel
DB_USER=sentinel_user
MONGO_DB=robengate_sentinel
EOF

# Proteger el archivo de secretos
chmod 600 .env.prod
```

### Paso 5: Desplegar

```bash
# Opción A: Usando el script de deploy
chmod +x infra/scripts/deploy.sh
./infra/scripts/deploy.sh production

# Opción B: Manualmente
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml \
  --env-file .env.prod \
  build --no-cache

docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml \
  --env-file .env.prod \
  up -d --remove-orphans
```

### Paso 6: Verificar despliegue
```bash
# Ver estado de contenedores
docker compose -f infra/docker/docker-compose.yml ps

# Todos deben estar "healthy" o "running"
# sentinel-nginx      running
# sentinel-backend    healthy
# sentinel-frontend   running
# sentinel-postgres   healthy
# sentinel-mongodb    healthy
# sentinel-redis      healthy
# sentinel-honeypot   running

# Health checks
curl -k https://tudominio.com/health
curl -k https://tudominio.com/ready
```

### Paso 7: Inicializar BD y crear admin
```bash
# Aplicar schema (primera vez)
docker compose exec backend node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool();
const schema = fs.readFileSync('/app/../db-sql/schema.sql', 'utf8');
pool.query(schema).then(() => { console.log('Schema aplicado'); process.exit(0); });
"

# Crear administrador
docker compose exec backend node scripts/manage-admins.js create \
  --email admin@tudominio.com \
  --name "Administrador" \
  --password "$(openssl rand -base64 16)"
```

### Paso 8: Configurar auto-renovación de certificados (Let's Encrypt)
```bash
# Añadir al crontab
crontab -e

# Renovar certificados automáticamente cada mes
0 2 1 * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/tudominio.com/fullchain.pem /ruta/proyecto/infra/nginx/ssl/ && \
  cp /etc/letsencrypt/live/tudominio.com/privkey.pem /ruta/proyecto/infra/nginx/ssl/ && \
  docker compose -f /ruta/proyecto/infra/docker/docker-compose.yml restart nginx
```

---

## 2. Despliegue Kubernetes

### Preparación del Cluster
```bash
# Prerrequisitos en el cluster:
# - Nginx Ingress Controller
# - cert-manager (para TLS automático)
# - Persistent Volume provisioner

# Verificar
kubectl get pods -n ingress-nginx
kubectl get pods -n cert-manager
```

### Despliegue completo
```bash
# 1. Crear namespace y secrets
kubectl create namespace robengate-sentinel

kubectl create secret generic robengate-secrets \
  --namespace robengate-sentinel \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 64)" \
  --from-literal=INTERNAL_API_SECRET="$(openssl rand -hex 32)" \
  --from-literal=OTP_HMAC_KEY="$(openssl rand -base64 48)"

kubectl create secret generic db-credentials \
  --namespace robengate-sentinel \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGO_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)"

# 2. Actualizar hosts en ingress
# Editar k8s/base/ingress/ingress.yaml con tu dominio

# 3. Aplicar manifests
kubectl apply -k k8s/base/

# 4. Verificar despliegue
kubectl get pods -n robengate-sentinel -w
# Esperar a que todos estén Running

# 5. Obtener IP del Ingress
kubectl get ingress -n robengate-sentinel
# Configurar DNS para apuntar al Ingress IP
```

---

## 3. Despliegue con Helm

```bash
# Instalar desde el directorio local del chart
helm install robengate-sentinel ./helm/robengate-sentinel \
  --namespace robengate-sentinel \
  --create-namespace \
  --set backend.image.tag=2.0.0 \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=app.tudominio.com \
  --set-string secrets.jwtSecret="$(openssl rand -base64 64)" \
  --set-string secrets.jwtRefreshSecret="$(openssl rand -base64 64)" \
  --set-string secrets.dbPassword="$(openssl rand -base64 32)" \
  --set-string secrets.mongoPassword="$(openssl rand -base64 32)" \
  --set-string secrets.redisPassword="$(openssl rand -base64 32)" \
  --set-string secrets.internalSecret="$(openssl rand -hex 32)" \
  --set-string secrets.otpHmacKey="$(openssl rand -base64 48)" \
  --wait --timeout 10m
```

---

## 4. Checklist Post-Despliegue

```
Seguridad:
  ☐ Certificados TLS válidos (no auto-firmados)
  ☐ HTTPS funcionando correctamente
  ☐ Header HSTS presente en respuestas
  ☐ /internal/ no accesible desde internet
  ☐ MongoDB solo accesible internamente
  ☐ Contraseñas cambiadas desde valores por defecto
  ☐ Admin creado con contraseña segura + MFA activado

Funcionalidad:
  ☐ GET /health → {"status":"ok"}
  ☐ GET /ready → todas las BDs "ok"
  ☐ Login funciona correctamente
  ☐ MFA envía email correctamente
  ☐ Dashboard carga sin errores
  ☐ SSE events funcionan (/api/events)

Operaciones:
  ☐ Backups programados configurados
  ☐ Monitorización activa (Prometheus + Grafana)
  ☐ Alertas configuradas en Alertmanager
  ☐ Log rotation configurada
  ☐ Renovación automática de certificados (si Let's Encrypt)
  ☐ Proceso de actualización documentado y probado
```

---

## 5. Variables de Entorno en Producción

Ver documento completo: [infrastructure/environment-variables.md](../infrastructure/environment-variables.md)

**Resumen de obligatorias:**
- `DB_PASSWORD`, `MONGO_ROOT_PASSWORD`, `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`  
- `INTERNAL_API_SECRET`, `OTP_HMAC_KEY`
- `SSH_HOST_KEY_PEM` (para honeypot)
- `CLIENT_URL`, `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
