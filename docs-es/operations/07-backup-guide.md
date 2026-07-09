# Guía de Backup y Retención de Datos

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Estrategia de Backup

### Política de Retención

| Base de Datos | Frecuencia | Retención | Tipo |
|---|---|---|---|
| PostgreSQL | Diario + Semanal | 30 días / 90 días | pg_dump |
| MongoDB | Diario | 14 días | mongodump |
| Redis | Cada 6h (AOF) | 7 días | AOF flush |
| Config/Secrets | Con cada cambio | Indefinido | Git cifrado |
| Logs | Semanal archivado | 1 año | Comprimido |

### Clasificación de Datos

| Dato | Criticidad | Backup Prioritario |
|---|---|---|
| `users` (PostgreSQL) | CRÍTICO | ✅ Sí |
| `incidents` | CRÍTICO | ✅ Sí |
| `playbooks` | ALTO | ✅ Sí |
| `audit_events` (MongoDB) | ALTO | ✅ Sí |
| `security_logs` | MEDIO | ✅ Sí |
| Redis cache/sessions | BAJO | ⚠️ Opcional |

---

## Scripts de Backup

### Backup Completo Manual

```bash
#!/bin/bash
# Script: infra/scripts/backup.sh
# Uso: ./infra/scripts/backup.sh /ruta/destino/

BACKUP_DIR="${1:-./backups/$(date +%Y%m%d_%H%M%S)}"
mkdir -p "$BACKUP_DIR"

echo "=== BACKUP RobenGate Sentinel ==="
echo "Destino: $BACKUP_DIR"
echo "Fecha: $(date)"

# 1. PostgreSQL
echo "[1/3] PostgreSQL backup..."
docker compose exec -T postgres pg_dump \
  -U sentinel_user \
  -Fc \
  sentinel_db > "$BACKUP_DIR/postgresql_$(date +%Y%m%d).dump"

echo "✅ PostgreSQL: $BACKUP_DIR/postgresql_$(date +%Y%m%d).dump"

# 2. MongoDB
echo "[2/3] MongoDB backup..."
docker compose exec -T mongodb mongodump \
  --username sentinel_user \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db sentinel_db \
  --archive > "$BACKUP_DIR/mongodb_$(date +%Y%m%d).archive"

echo "✅ MongoDB: $BACKUP_DIR/mongodb_$(date +%Y%m%d).archive"

# 3. Redis (RDB snapshot)
echo "[3/3] Redis snapshot..."
docker compose exec -T redis redis-cli \
  -a "$REDIS_PASSWORD" \
  BGSAVE

sleep 5  # Esperar que termine BGSAVE

docker cp robengate-redis:/data/dump.rdb \
  "$BACKUP_DIR/redis_$(date +%Y%m%d).rdb"

echo "✅ Redis: $BACKUP_DIR/redis_$(date +%Y%m%d).rdb"

# 4. Comprimir todo
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR/"
rm -rf "$BACKUP_DIR/"

echo ""
echo "✅ BACKUP COMPLETO: $BACKUP_DIR.tar.gz"
echo "Tamaño: $(du -sh $BACKUP_DIR.tar.gz)"
```

### Ejecución del Script

```bash
# Dar permisos
chmod +x infra/scripts/backup.sh

# Backup manual
./infra/scripts/backup.sh ./backups/

# Backup con destino personalizado
./infra/scripts/backup.sh /mnt/backup-externo/
```

---

## Automatización con Cron

### Linux / Servidor

```bash
# Editar crontab del usuario que corre docker compose
crontab -e

# Agregar:
# Backup diario a las 2:00 AM
0 2 * * * cd /opt/robengate-sentinel && ./infra/scripts/backup.sh /backups/daily/ >> /var/log/robengate-backup.log 2>&1

# Limpiar backups de más de 30 días (diarios) - cada domingo
0 3 * * 0 find /backups/daily/ -name "*.tar.gz" -mtime +30 -delete
```

### Windows Server / PowerShell

```powershell
# Crear tarea programada
$Action = New-ScheduledTaskAction -Execute "wsl" -Argument "-e bash -c 'cd /mnt/c/robengate-sentinel && ./infra/scripts/backup.sh ./backups/ >> ./logs/backup.log 2>&1'"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

Register-ScheduledTask -TaskName "RobenGate-Backup" `
  -Action $Action `
  -Trigger $Trigger `
  -Principal $Principal

Write-Host "Tarea programada creada: RobenGate-Backup"
```

### Kubernetes — CronJob

```yaml
# k8s/base/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sentinel-backup
  namespace: robengate-sentinel
spec:
  schedule: "0 2 * * *"  # Diario 2:00 AM UTC
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: robengate-backend:latest
            command: ["/bin/sh", "-c", "/app/scripts/backup.sh /backups/"]
            env:
            - name: DB_HOST
              value: postgres-service
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: robengate-secrets
                  key: db-password
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

---

## Verificación de Backups

### Verificar Integridad Post-Backup

```bash
# 1. Verificar que los archivos existen y no están vacíos
ls -lh ./backups/
# Tamaños esperados:
#   postgresql_YYYYMMDD.dump: > 1MB (prod) o > 100KB (dev)
#   mongodb_YYYYMMDD.archive: > 500KB (prod)
#   redis_YYYYMMDD.rdb:       > 100KB

# 2. Verificar que el dump PostgreSQL es válido
pg_restore --list ./backups/postgresql_20260615.dump | head -20

# 3. Verificar MongoDB archive
mongorestore --dryRun --archive=./backups/mongodb_20260615.archive
```

### Test de Restauración Mensual

Es crítico probar la restauración mensualmente en un entorno de prueba:

```bash
# 1. Crear entorno de prueba aislado
docker compose -f infra/docker/docker-compose.test-restore.yml up -d

# 2. Restaurar PostgreSQL en entorno de prueba
pg_restore \
  -h localhost \
  -p 5433 \        # Puerto diferente para no afectar producción
  -U sentinel_user \
  -d sentinel_test \
  ./backups/postgresql_20260615.dump

# 3. Verificar conteo de registros
docker exec test-postgres psql -U sentinel_user -d sentinel_test \
  -c "SELECT 
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM incidents) AS incidents,
    (SELECT COUNT(*) FROM security_logs) AS security_logs;"

# 4. Confirmar integridad
# Expected: números cercanos a los de producción

# 5. Limpiar
docker compose -f infra/docker/docker-compose.test-restore.yml down -v
```

---

## Rotación y Limpieza Automática

### PostgreSQL — Purga de Datos Antiguos

```sql
-- Ejecutar semanalmente (o via cron)
-- Limpiar logs de seguridad de más de 90 días
DELETE FROM security_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Limpiar audit logs de más de 1 año (excepto CRITICAL)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year'
  AND severity != 'critical';

-- Limpiar tokens expirados hace más de 30 días
DELETE FROM refresh_tokens 
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Vacuum después de delete masivo
VACUUM ANALYZE security_logs;
VACUUM ANALYZE audit_logs;
```

### MongoDB — TTL Automático

Los índices TTL ya están configurados (ver `db-nosql/indexes.js`):

```javascript
// security_logs: TTL 90 días (automático)
SecurityLogModel.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Si necesitas cambiar el TTL:
db.security_logs.dropIndex("createdAt_1");
db.security_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: NEW_TTL_SECONDS });
```

---

## Backup en Cloud (Recomendado para Producción)

### AWS S3

```bash
# Instalar AWS CLI
# Configurar credenciales: aws configure

# Subir backup a S3
aws s3 cp ./backups/backup_20260615.tar.gz \
  s3://mi-bucket-backups/robengate/$(date +%Y/%m/)/

# Script integrado al backup principal
upload_to_s3() {
  local backup_file=$1
  if command -v aws &> /dev/null; then
    aws s3 cp "$backup_file" \
      "s3://${S3_BACKUP_BUCKET}/robengate/$(date +%Y/%m/)/"
    echo "✅ Subido a S3: $backup_file"
  fi
}
```

### Rclone (Compatible con múltiples clouds)

```bash
# Configurar rclone (compatible con S3, GCS, Azure, etc.)
rclone config

# Subir backup
rclone copy ./backups/backup_20260615.tar.gz \
  remote:mi-bucket/robengate/$(date +%Y/%m/)/

# Verificar
rclone ls remote:mi-bucket/robengate/
```
