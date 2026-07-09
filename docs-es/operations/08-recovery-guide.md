# Guía de Recuperación ante Desastres

**Versión:** 2.0 | **Fecha:** Junio 2026

---

> **RTO Objetivo:** < 2 horas | **RPO Objetivo:** < 24 horas

---

## Escenarios de Desastre

| Escenario | Probabilidad | Impacto | Tiempo Recuperación |
|---|---|---|---|
| Crash de contenedor | Alto | Bajo | < 5 min (auto-restart) |
| Corrupción de datos PostgreSQL | Bajo | Crítico | 30-90 min |
| Pérdida de servidor completo | Muy Bajo | Crítico | 1-4 horas |
| Brecha de seguridad | Bajo | Crítico | 2-8 horas |
| Pérdida de secretos/config | Muy Bajo | Alto | 30-60 min |

---

## Procedimiento de Recuperación — PostgreSQL

### Escenario: Tabla Corrompida o Datos Eliminados Accidentalmente

```bash
# PASO 1: Detener el backend para evitar escrituras durante restore
docker compose stop backend

# PASO 2: Identificar el backup más reciente disponible
ls -lth ./backups/*.tar.gz | head -5
# Seleccionar el más reciente antes del incidente

# PASO 3: Extraer backup
BACKUP_DATE="20260615"  # Fecha del backup a restaurar
tar -xzf "./backups/backup_${BACKUP_DATE}.tar.gz" -C ./restore_tmp/

# PASO 4: Restaurar PostgreSQL
# Opción A: Restauración completa (reemplaza toda la BD)
docker compose exec -T postgres pg_restore \
  -U sentinel_user \
  --clean \
  --if-exists \
  -d sentinel_db < ./restore_tmp/backup_${BACKUP_DATE}/postgresql_${BACKUP_DATE}.dump

# Opción B: Restaurar solo una tabla específica
docker compose exec -T postgres pg_restore \
  -U sentinel_user \
  -d sentinel_db \
  -t incidents \              # Solo tabla incidents
  < ./restore_tmp/backup_${BACKUP_DATE}/postgresql_${BACKUP_DATE}.dump

# PASO 5: Verificar integridad
docker compose exec postgres psql -U sentinel_user -d sentinel_db -c "
SELECT 
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM incidents) AS incidents,
  (SELECT COUNT(*) FROM security_logs) AS security_logs;"

# PASO 6: Reiniciar backend
docker compose start backend

# PASO 7: Verificar funcionamiento
curl http://localhost:5000/health
curl http://localhost:5000/ready
```

---

## Procedimiento de Recuperación — MongoDB

```bash
# PASO 1: Detener backend
docker compose stop backend

# PASO 2: Restaurar desde archivo
BACKUP_DATE="20260615"
tar -xzf "./backups/backup_${BACKUP_DATE}.tar.gz" -C ./restore_tmp/

docker compose exec -T mongodb mongorestore \
  --username sentinel_user \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --drop \                    # Eliminar colecciones existentes antes de restaurar
  --archive < ./restore_tmp/backup_${BACKUP_DATE}/mongodb_${BACKUP_DATE}.archive

# PASO 3: Verificar
docker compose exec mongodb mongosh sentinel_db --eval "
db.security_logs.countDocuments({})
db.audit_events.countDocuments({})
db.threat_indicators.countDocuments({})"

# PASO 4: Reiniciar
docker compose start backend
```

---

## Procedimiento de Recuperación — Redis

Redis es caché/sesiones. Su pérdida no implica pérdida de datos críticos de negocio.

```bash
# PASO 1: Si hay RDB disponible, restaurar
BACKUP_DATE="20260615"
tar -xzf "./backups/backup_${BACKUP_DATE}.tar.gz" -C ./restore_tmp/

docker cp ./restore_tmp/backup_${BACKUP_DATE}/redis_${BACKUP_DATE}.rdb \
  robengate-redis:/data/dump.rdb

# PASO 2: Reiniciar Redis para cargar el RDB
docker compose restart redis

# Si NO hay RDB disponible:
# - No es crítico: Redis se repoblará automáticamente
# - Solo consecuencia: todos los usuarios deberán re-hacer login
# - Los bans de IP se perderán temporalmente
docker compose restart redis
```

---

## Recuperación de Servidor Completo

### Prerequisitos
- Backup reciente disponible (local o S3)
- Variables de entorno guardadas de forma segura (no en el servidor)
- Documentación de infra/docker/.env.prod en un gestor de secretos

### Pasos

```bash
# En el nuevo servidor:

# 1. Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clonar repositorio
git clone https://github.com/Robensonl/robengate-sentinel.git
cd robengate-sentinel
git checkout main

# 3. Restaurar variables de entorno desde gestor de secretos
# (recuperar desde HashiCorp Vault / AWS Secrets Manager / 1Password)
# Crear: infra/docker/.env.prod

# 4. Arrancar infraestructura
docker compose -f infra/docker/docker-compose.yml \
               -f infra/docker/docker-compose.prod.yml \
               --env-file infra/docker/.env.prod \
               up postgres mongodb redis -d

# Esperar que BD esté lista
sleep 10

# 5. Restaurar datos desde backup
BACKUP_DATE="20260615"
# Si en S3:
aws s3 cp "s3://mi-bucket/robengate/2026/06/backup_${BACKUP_DATE}.tar.gz" .

tar -xzf "backup_${BACKUP_DATE}.tar.gz" -C ./restore_tmp/

# Restaurar PostgreSQL
docker compose exec -T postgres pg_restore \
  -U sentinel_user -d sentinel_db \
  < "./restore_tmp/backup_${BACKUP_DATE}/postgresql_${BACKUP_DATE}.dump"

# Restaurar MongoDB
docker compose exec -T mongodb mongorestore \
  --username sentinel_user \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --drop \
  --archive < "./restore_tmp/backup_${BACKUP_DATE}/mongodb_${BACKUP_DATE}.archive"

# 6. Arrancar servicios completos
docker compose -f infra/docker/docker-compose.yml \
               -f infra/docker/docker-compose.prod.yml \
               --env-file infra/docker/.env.prod \
               up -d

# 7. Verificar
curl https://tudominio.com/health
curl https://tudominio.com/ready

# 8. Aplicar migraciones si hay nuevas
docker compose exec backend node scripts/run-migrations.js
```

---

## Recuperación ante Brecha de Seguridad

### Protocolo de Respuesta a Incidente

```bash
# FASE 1: CONTENCIÓN (0-15 minutos)
# 1. Aislar el sistema afectado
docker compose stop   # Todo offline

# 2. Preservar evidencias (antes de cualquier cambio)
docker compose logs backend > ./forensics/backend_$(date +%Y%m%d_%H%M%S).log
docker compose logs postgres >> ./forensics/postgres_$(date +%Y%m%d_%H%M%S).log

# 3. Bloquear IP del atacante (si identificada)
iptables -I INPUT -s <IP_ATACANTE> -j DROP

# FASE 2: EVALUACIÓN (15-60 minutos)
# 4. Revisar logs de auditoría
# Acceder a MongoDB backup o logs guardados
# Identificar qué datos fueron accedidos/modificados

# 5. Rotar TODOS los secretos
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_JWT_REFRESH_SECRET=$(openssl rand -base64 64)
NEW_INTERNAL_SECRET=$(openssl rand -base64 32)
# Actualizar .env.prod con todos los nuevos valores

# FASE 3: RECUPERACIÓN (60-120 minutos)
# 6. Volver a backup pre-brecha si hay datos comprometidos
# Seguir pasos de recuperación PostgreSQL/MongoDB arriba

# 7. Arrancar con secretos nuevos
docker compose -f infra/docker/docker-compose.yml \
               -f infra/docker/docker-compose.prod.yml \
               --env-file infra/docker/.env.prod \
               up -d

# 8. Invalidar TODAS las sesiones activas (tokens cambiados → auto-inválidos)
# Al cambiar JWT_SECRET, todos los tokens existentes son inválidos

# FASE 4: COMUNICACIÓN (dentro de 24h)
# 9. Notificar a usuarios afectados
# 10. Si datos de clientes expuestos: GDPR/LOPD obliga notificar en 72h a AEPD (España)
```

---

## Herramienta de Diagnóstico Rápido

```bash
#!/bin/bash
# Script de diagnóstico: infra/scripts/health-check.sh

echo "=== RobenGate Sentinel Health Check ==="
echo "Fecha: $(date)"
echo ""

# Contenedores
echo "--- Contenedores ---"
docker compose ps

echo ""

# Health endpoints
echo "--- API Health ---"
curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || echo "❌ Backend no responde"
curl -s http://localhost:5000/ready | python3 -m json.tool 2>/dev/null || echo "❌ Ready check falló"

echo ""

# Espacio en disco
echo "--- Disco ---"
df -h / | tail -1

echo ""

# Memoria
echo "--- Memoria ---"
free -h | grep Mem

echo ""

# Últimos errores (1 hora)
echo "--- Errores recientes (1h) ---"
docker compose logs --since=1h backend 2>&1 | grep -E "ERROR|FATAL" | tail -10
```

```bash
chmod +x infra/scripts/health-check.sh
./infra/scripts/health-check.sh
```
