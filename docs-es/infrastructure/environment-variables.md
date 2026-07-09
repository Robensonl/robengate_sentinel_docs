# Variables de Entorno — RobenGate Sentinel

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026  
**Clasificación:** Confidencial — Nunca comprometer valores reales en git

---

## Principios de Gestión de Secretos

1. **NUNCA** comprometer archivos `.env` con valores reales al repositorio
2. Usar `.env.example` como plantilla sin valores
3. En producción: usar un secret manager (AWS Secrets Manager, HashiCorp Vault, K8s Secrets)
4. Rotar todos los secretos cada 90 días como mínimo
5. Cada entorno (dev/staging/prod) debe tener secretos diferentes

---

## Backend (`backend/.env`)

### Variables Obligatorias 🔴

| Variable | Descripción | Ejemplo | Mínimo |
|---|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `production` | — |
| `DB_HOST` | Host de PostgreSQL | `localhost` o `postgres` | — |
| `DB_NAME` | Nombre de BD PostgreSQL | `robengate_sentinel` | — |
| `DB_USER` | Usuario PostgreSQL | `postgres` | — |
| `DB_PASSWORD` | Contraseña PostgreSQL | (secreto) | 16 chars |
| `MONGO_URI` | URI completa de MongoDB | `mongodb://user:pass@host:27017/db` | — |
| `REDIS_URL` | URL de Redis | `redis://:pass@localhost:6379` | — |
| `JWT_SECRET` | Secreto access tokens | (aleatorio 256+ bits) | 32 chars |
| `JWT_REFRESH_SECRET` | Secreto refresh tokens | (aleatorio diferente) | 32 chars |
| `INTERNAL_API_SECRET` | Secreto servicios internos | (aleatorio) | 32 chars |
| `OTP_HMAC_KEY` | Clave HMAC para TOTP | (aleatorio 256+ bits) | 32 chars |
| `CLIENT_URL` | URL del frontend (CORS) | `https://app.ejemplo.com` | — |

### Variables Opcionales 🟡

| Variable | Descripción | Default | Ejemplo |
|---|---|---|---|
| `PORT` | Puerto del servidor | `5000` | `5000` |
| `DB_PORT` | Puerto PostgreSQL | `5432` | `5432` |
| `DB_SSL` | TLS para PostgreSQL | `false` | `true` |
| `DB_POOL_MAX` | Máx. conexiones en pool | `20` | `20` |
| `JWT_EXPIRES_IN` | TTL access token | `15m` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh token | `7d` | `7d` |
| `BCRYPT_ROUNDS` | Work factor bcrypt | `12` | `12` |
| `MONGO_DB` | Nombre BD MongoDB | `robengate_sentinel` | — |
| `CORS_ORIGINS` | Orígenes adicionales CORS | — | `https://app1.com,https://app2.com` |
| `BODY_LIMIT` | Límite de payload JSON | `1mb` | `2mb` |

### Variables de Email (MFA) 🟠

| Variable | Descripción | Obligatoria |
|---|---|---|
| `EMAIL_HOST` | Servidor SMTP | Sí (para MFA por email) |
| `EMAIL_PORT` | Puerto SMTP | No (default: 587) |
| `EMAIL_USER` | Usuario SMTP / dirección From | Sí |
| `EMAIL_PASS` | Contraseña SMTP | Sí |
| `EMAIL_FROM` | Nombre del remitente | No |
| `EMAIL_SECURE` | TLS en SMTP | No (default: false para 587) |

**Nota:** Sin configuración de email, el MFA por email no funcionará. En desarrollo, el código OTP se imprime en los logs del servidor.

### Variables de Elasticsearch (Opcional) 🟢

| Variable | Descripción | Default |
|---|---|---|
| `ELASTICSEARCH_URL` | URL del cluster ES | — (búsqueda deshabilitada) |
| `ELASTICSEARCH_INDEX` | Nombre del índice principal | `security_events` |
| `ELASTICSEARCH_USERNAME` | Usuario ES | — |
| `ELASTICSEARCH_PASSWORD` | Contraseña ES | — |

---

## Honeypot (`honeypot/.env`)

| Variable | Descripción | Obligatoria | Default |
|---|---|---|---|
| `BACKEND_URL` | URL del backend para forwards | ✅ | `http://localhost:5000` |
| `INTERNAL_API_SECRET` | Mismo que backend | ✅ | — |
| `HONEYPOT_SSH_PORT` | Puerto del honeypot SSH | No | `2222` |
| `HONEYPOT_HTTP_PORT` | Puerto del honeypot HTTP | No | `8080` |
| `SSH_HOST_KEY_PEM` | Clave privada RSA para SSH | ✅ | — |

**Generación de clave SSH para honeypot:**
```bash
ssh-keygen -t rsa -b 4096 -N "" -f honeypot_host_key
# SSH_HOST_KEY_PEM = contenido del archivo honeypot_host_key (clave privada)
```

---

## Frontend (`frontend/.env`)

| Variable | Descripción | Obligatoria | Default |
|---|---|---|---|
| `VITE_API_URL` | URL base del backend | No | `http://localhost:5000` |
| `VITE_APP_NAME` | Nombre de la aplicación | No | `RobenGate Sentinel` |
| `VITE_APP_ENV` | Entorno actual | No | `development` |

---

## Docker Compose (`infra/docker/.env.prod`)

| Variable | Descripción |
|---|---|
| `DB_PASSWORD` | Contraseña PostgreSQL |
| `MONGO_ROOT_USER` | Usuario root MongoDB |
| `MONGO_ROOT_PASSWORD` | Contraseña root MongoDB |
| `REDIS_PASSWORD` | Contraseña Redis |
| `JWT_SECRET` | Secreto JWT |
| `JWT_REFRESH_SECRET` | Secreto refresh JWT |
| `INTERNAL_API_SECRET` | Secreto interno |
| `OTP_HMAC_KEY` | Clave HMAC |
| `SSH_HOST_KEY_PEM` | Clave SSH honeypot |
| `CLIENT_URL` | URL del frontend |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_USER` | SMTP usuario |
| `EMAIL_PASS` | SMTP contraseña |
| `DB_NAME` | Nombre BD (default: robengate_sentinel) |
| `DB_USER` | Usuario PG (default: postgres) |
| `MONGO_DB` | Nombre BD Mongo (default: robengate_sentinel) |

---

## Generación Segura de Secretos

### Linux / macOS
```bash
# JWT Secret (base64, 64 bytes = 512 bits)
openssl rand -base64 64

# Internal API Secret
openssl rand -hex 32

# OTP HMAC Key
openssl rand -base64 48

# Redis Password
openssl rand -base64 32 | tr -d '=' | head -c 32
```

### PowerShell (Windows)
```powershell
# JWT Secret
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Internal API Secret (hex)
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })

# Contraseña simple (32 chars)
-join (([char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%') | Get-Random -Count 32 | ForEach-Object { $_ })
```

### Node.js
```javascript
const crypto = require('crypto')
console.log(crypto.randomBytes(64).toString('base64'))   // JWT secrets
console.log(crypto.randomBytes(32).toString('hex'))       // API secrets
```

---

## Kubernetes Secrets

En producción con Kubernetes, las variables sensibles NO deben estar en ConfigMaps:

```bash
# Crear Secret de Kubernetes
kubectl create secret generic robengate-secrets \
  --namespace robengate-sentinel \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 64)" \
  --from-literal=INTERNAL_API_SECRET="$(openssl rand -hex 32)" \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGO_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=OTP_HMAC_KEY="$(openssl rand -base64 48)"
```

**Recomendado para producción enterprise:** Usar External Secrets Operator con AWS Secrets Manager, HashiCorp Vault, o Azure Key Vault.

---

## Archivo `.env.example` Recomendado

```bash
# ─── SERVIDOR ──────────────────────────────────────────────
NODE_ENV=production
PORT=5000

# ─── POSTGRESQL ────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robengate_sentinel
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_SSL=false
DB_POOL_MAX=20

# ─── MONGODB ───────────────────────────────────────────────
MONGO_URI=mongodb://user:CHANGE_ME@localhost:27017/robengate_sentinel?authSource=admin
MONGO_DB=robengate_sentinel

# ─── REDIS ─────────────────────────────────────────────────
REDIS_URL=redis://:CHANGE_ME@localhost:6379

# ─── JWT ───────────────────────────────────────────────────
JWT_SECRET=CHANGE_ME_RANDOM_256_BITS
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_RANDOM_256_BITS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── SEGURIDAD ─────────────────────────────────────────────
INTERNAL_API_SECRET=CHANGE_ME_RANDOM_HEX_32
OTP_HMAC_KEY=CHANGE_ME_RANDOM_256_BITS
BCRYPT_ROUNDS=12

# ─── FRONTEND ──────────────────────────────────────────────
CLIENT_URL=https://app.tudominio.com

# ─── EMAIL (MFA) ───────────────────────────────────────────
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_PORT=587
EMAIL_USER=noreply@tudominio.com
EMAIL_PASS=CHANGE_ME_SMTP_PASSWORD
EMAIL_SECURE=false

# ─── ELASTICSEARCH (Opcional) ──────────────────────────────
# ELASTICSEARCH_URL=http://localhost:9200
```
