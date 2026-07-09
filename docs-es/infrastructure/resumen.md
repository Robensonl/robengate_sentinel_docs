# Infraestructura y Despliegue — RobenGate Sentinel

> **Clasificación:** INTERNO | **Plataforma:** Docker Compose + Nginx

---

## Resumen Ejecutivo

La infraestructura de RobenGate Sentinel está completamente **contenerizada con Docker Compose**, con tres configuraciones para diferentes entornos: base (desarrollo), dev (TLS auto-firmado) y prod (Let's Encrypt). Todos los servicios se comunican en una red Docker bridge privada (`sentinel_net`), con Nginx como proxy inverso TLS en el perímetro.

El diseño de infraestructura sigue el **principio de menor superficie de ataque**: el honeypot no tiene acceso directo a las bases de datos, el frontend no tiene acceso directo al backend (siempre via Nginx), y las bases de datos no son accesibles desde fuera de la red Docker.

---

## 1. Visión General de la Infraestructura

```mermaid
graph TB
    subgraph "Internet"
        USER[🧑 Usuario\nNavegador]
        ATK[🔴 Atacante]
    end

    subgraph "Host Docker"
        subgraph "sentinel_net (Red Bridge Privada)"
            NGINX[Nginx :443\nProxy Inverso TLS]
            FE[Frontend :3000\nReact SPA]
            BE[Backend :5000\nNode.js + Express]
            HP[Honeypot :2222 + :8080\nTrampas SSH + HTTP]
            REDIS[Redis :6379]
            PG[PostgreSQL :5432]
            MONGO[MongoDB :27017]
        end
    end

    USER -->|HTTPS :443| NGINX
    ATK -->|SSH :2222| HP
    ATK -->|HTTP :8080| HP

    NGINX -->|/api/*| BE
    NGINX -->|/* (SPA)| FE
    
    BE --> REDIS & PG & MONGO
    HP -->|API interna\n+ X-Internal-Secret| BE
    
    HP -.->|Sin acceso directo| PG
    HP -.->|Sin acceso directo| MONGO
```

---

## 2. Servicios Docker

| Servicio | Imagen | Puerto Expuesto | Descripción |
|----------|--------|-----------------|-------------|
| **nginx** | nginx:alpine | 443 (TLS), 80 (redir) | Proxy inverso + terminación TLS |
| **backend** | node:20-alpine | 5000 (interno) | API Express.js |
| **frontend** | nginx:alpine | 3000 (interno) | SPA React servida por Nginx |
| **honeypot** | node:20-alpine | 2222, 8080 (externos) | Trampas SSH + HTTP |
| **redis** | redis:7-alpine | 6379 (interno) | Caché + JTI blacklist |
| **postgres** | postgres:15 | 5432 (interno) | BD relacional principal |
| **mongodb** | mongo:7 | 27017 (interno) | BD de eventos append-only |

---

## Descripción Técnica

### 3. Configuraciones Docker Compose

#### 3.1 Configuración Base (`docker-compose.yml`)

Configuración mínima compartida por todos los entornos:
- Definición de servicios sin configuración de TLS
- Red `sentinel_net` bridge privada
- Volúmenes para persistencia de datos

#### 3.2 Configuración Dev (`docker-compose.dev.yml`)

Extiende la configuración base con:
- **TLS auto-firmado**: Certificados generados por `generate-dev-certs.ps1`
- **Hot reload**: Volúmenes bind mount al código fuente
- **Variables de entorno**: `.env.development`
- **Logging verbose**: Para debugging

```bash
# Iniciar entorno de desarrollo
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### 3.3 Configuración Prod (`docker-compose.prod.yml`)

Extiende la configuración base con:
- **Let's Encrypt**: Certificados TLS gestionados por Certbot
- **Health checks**: Para todos los servicios críticos
- **Restart policies**: `unless-stopped` para alta disponibilidad
- **Resource limits**: CPU y memoria para cada contenedor
- **Variables de entorno**: `.env.production`

```bash
# Iniciar entorno de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

### 4. Configuración Nginx

#### 4.1 Nginx como Proxy Inverso

```nginx
# Redirigir HTTP → HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}

# Servidor HTTPS principal
server {
    listen 443 ssl http2;
    
    # Certificados TLS
    ssl_certificate     /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    
    # Proxy al backend API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Bloquear acceso externo a rutas internas
    location /internal/ {
        deny all;
        return 403;
    }
    
    # SSE: deshabilitar buffering para tiempo real
    location /api/events {
        proxy_pass http://backend:5000;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
    }
    
    # Frontend SPA (fallback a index.html para React Router)
    location / {
        proxy_pass http://frontend:3000;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4.2 Seguridad de Rutas Internas

La directiva `location /internal/` con `deny all` previene que cualquier solicitud externa alcance el endpoint `/api/internal/honeypot/events`. Solo el servicio honeypot dentro de `sentinel_net` puede comunicarse directamente con el backend.

---

### 5. Red Docker (`sentinel_net`)

```yaml
networks:
  sentinel_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

**Principios de aislamiento:**
- Solo Nginx está expuesto a Internet (puerto 443)
- El honeypot está expuesto en puertos SSH (2222) y HTTP (8080) para atraer atacantes
- Backend, frontend, Redis, PostgreSQL y MongoDB NO tienen puertos expuestos al host
- El honeypot solo puede comunicarse con el backend via API interna, no con las BDs directamente

---

### 6. Variables de Entorno

#### Entorno de Producción (`.env.production`)

```env
# Servidor
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://tu-dominio.com

# Base de datos
DATABASE_URL=postgresql://sentinel:contraseña_segura@postgres:5432/sentinel_db
MONGODB_URI=mongodb://mongo:27017/sentinel_logs
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=cadena-aleatoria-segura-mínimo-32-caracteres
JWT_REFRESH_SECRET=otra-cadena-aleatoria-diferente-mínimo-32-caracteres
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email
EMAIL_HOST=smtp.proveedor.com
EMAIL_PORT=587
EMAIL_USER=seguridad@empresa.com
EMAIL_PASS=contraseña-aplicación

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567

# Secreto interno (honeypot ↔ backend)
INTERNAL_SECRET=secreto-compartido-seguro-mínimo-32-caracteres
```

---

## Flujo Operacional

### 7. Scripts de Gestión

```powershell
# Iniciar la plataforma completa
.\docker-up.ps1

# Detener la plataforma
.\docker-down.ps1

# Generar certificados TLS auto-firmados (solo dev)
.\scripts\generate-dev-certs.ps1

# Iniciar en modo desarrollo con hot-reload
.\dev-start.ps1

# Detener modo desarrollo
.\dev-stop.ps1
```

### 8. Verificaciones Post-Despliegue (Smoke Tests)

```bash
# 1. Verificar que todos los contenedores están corriendo
docker ps

# 2. Health check del backend
curl -k https://localhost/api/health

# 3. Verificar que el frontend carga
curl -k https://localhost/

# 4. Verificar que el endpoint SSE responde
curl -k -H "Authorization: Bearer $JWT" https://localhost/api/events

# 5. Verificar que las rutas internas están bloqueadas
curl -k https://localhost/internal/anything
# → Debe retornar 403 Forbidden
```

---

## Casos de Uso

### Caso 1: Despliegue en VPS de Producción

```bash
# 1. Clonar repositorio
git clone https://github.com/Robensonl/robengate-sentinel.git

# 2. Configurar variables de entorno
cp .env.example .env.production
vim .env.production  # Configurar valores reales

# 3. Iniciar con configuración de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Verificar logs
docker compose logs -f backend
```

### Caso 2: Entorno de Desarrollo Local

```powershell
# 1. Instalar dependencias del backend
cd backend; npm install

# 2. Instalar dependencias del frontend
cd frontend; npm install

# 3. Generar certificados TLS auto-firmados
.\scripts\generate-dev-certs.ps1

# 4. Iniciar en modo dev (con hot-reload)
.\dev-start.ps1
```

### Caso 3: Escalado Horizontal del Backend

Añadir múltiples instancias del backend detrás del balanceador Nginx:

```yaml
# docker-compose.prod.yml
backend:
  scale: 3  # 3 instancias del backend
  
nginx:
  # upstream backend automáticamente balancearía entre las 3 instancias
```

Esto es posible porque el backend es **stateless** — el estado de sesión está en Redis, accesible por todas las instancias.

---

## Beneficios para una Empresa

| Beneficio | Descripción |
|-----------|-------------|
| **Despliegue Reproducible** | Docker garantiza entorno idéntico en cualquier host |
| **Aislamiento de Red** | Sin acceso externo a bases de datos |
| **TLS Automático** | Let's Encrypt gestiona certificados automáticamente |
| **Escalabilidad** | Añadir instancias del backend sin cambios de arquitectura |
| **Portabilidad** | Migración de proveedor cloud en horas, no días |

---

## Seguridad

- **Red privada**: Bases de datos no expuestas a Internet
- **Bloqueo de rutas internas**: Nginx bloquea `/internal/*` externamente
- **TLS forzado**: Redirección HTTP→HTTPS automática
- **Honeypot aislado**: Sin acceso directo a bases de datos
- **Secreto interno**: Autenticación de todos los mensajes honeypot→backend

---

## Roadmap

| Capacidad | Estado |
|-----------|--------|
| **Kubernetes (k8s)** manifiestos incluidos en `k8s/` | En progreso |
| **Helm chart** para despliegue en clusters Kubernetes | En progreso |
| **Monitorización** (Prometheus + Grafana) | Incluido en `monitoring/` |
| **CI/CD** con GitHub Actions | Planificado |

---

*Ver también: [../database/resumen.md](../database/resumen.md) | [../backend/resumen.md](../backend/resumen.md) | [../security/resumen.md](../security/resumen.md)*
