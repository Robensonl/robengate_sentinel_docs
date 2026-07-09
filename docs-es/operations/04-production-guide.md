# Guía de Producción — Operaciones Diarias

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Rutina Operacional Diaria

### Checklist de Apertura (9:00 AM)

```bash
# 1. Verificar salud de servicios
curl -s https://tudominio.com/health | python -m json.tool
curl -s https://tudominio.com/ready | python -m json.tool

# 2. Verificar estado contenedores/pods
docker compose ps                              # Docker Compose
kubectl get pods -n robengate-sentinel         # Kubernetes

# 3. Ver errores recientes (últimas 2 horas)
docker compose logs --since=2h backend | grep -E "ERROR|CRITICAL|FATAL"

# 4. Verificar métricas de alerta
# Acceder a Grafana: http://grafana.tudominio.com
# Dashboard: "RobenGate SOC Overview" → revisar panels rojos/amarillos

# 5. Revisar alertas pendientes en plataforma
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://tudominio.com/api/alerts?status=pending | jq '.data | length'
```

### Checklist de Cierre (6:00 PM)

```bash
# 1. Backup manual si no está automatizado
./infra/scripts/backup.sh ./backups/$(date +%Y%m%d)/

# 2. Verificar espacio en disco
df -h / && du -sh /var/lib/docker/volumes/

# 3. Revisar logs de auditoría del día
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://tudominio.com/api/audit?from=$(date +%Y-%m-%d)T00:00:00Z"
```

---

## Gestión de Usuarios

### Crear Usuario Administrador

```bash
# Via script de gestión
docker compose exec backend node scripts/manage-admins.js create \
  --email nuevo-admin@empresa.com \
  --name "Nombre Apellido" \
  --password "ContraseñaSegura2026!"

# Via API (necesita token admin)
curl -X POST https://tudominio.com/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@empresa.com",
    "password": "ContraseñaSegura!",
    "name": "Nombre",
    "role": "analyst"
  }'
```

### Revocar Sesiones de Usuario

```bash
# Revocar todas las sesiones de un usuario
curl -X DELETE https://tudominio.com/api/sessions/user/:userId \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Blacklist manual de token JWT (Redis)
docker compose exec redis redis-cli -a $REDIS_PASSWORD \
  SET "jwt:blacklist:<jti>" "revoked" EX 86400
```

### Resetear MFA

```bash
# Desactivar MFA para un usuario (emergencia)
docker compose exec backend node -e "
const { pool } = await import('./src/config/database.js');
await pool.query('UPDATE users SET mfa_enabled=false WHERE email=\$1', ['user@empresa.com']);
console.log('MFA desactivado');
process.exit(0);
"
```

---

## Gestión de Incidentes

### Crear Incidente de Seguridad Manualmente

```bash
curl -X POST https://tudominio.com/api/incidents \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Posible brecha de datos",
    "description": "Actividad sospechosa detectada desde IP 1.2.3.4",
    "severity": "high",
    "category": "unauthorized_access"
  }'
```

### Escalar Incidente

```bash
# Via API
curl -X PATCH https://tudominio.com/api/incidents/:id/escalate \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

---

## Rotación de Secretos

### Rotación Mensual Recomendada

```bash
# 1. Generar nuevos secretos
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# 2. Actualizar en el entorno
# Docker Compose: actualizar .env y reiniciar
echo "JWT_SECRET=$NEW_JWT_SECRET" >> infra/docker/.env.prod
docker compose restart backend

# Kubernetes: actualizar secret y rolling restart
kubectl create secret generic robengate-secrets \
  --from-literal=jwt-secret=$NEW_JWT_SECRET \
  --from-literal=jwt-refresh-secret=$NEW_JWT_REFRESH_SECRET \
  --namespace robengate-sentinel \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/backend -n robengate-sentinel

# 3. Invalidar todos los tokens activos (forzar re-login)
# Al cambiar JWT_SECRET todos los tokens existentes serán inválidos automáticamente
```

### Rotación de Credenciales de BD

```bash
# ADVERTENCIA: Coordinación necesaria. Causar breve downtime.

# 1. Nueva contraseña
NEW_DB_PASS=$(openssl rand -base64 32)

# 2. Cambiar en PostgreSQL
docker compose exec postgres psql -U postgres \
  -c "ALTER USER sentinel_user PASSWORD '$NEW_DB_PASS';"

# 3. Actualizar .env y reiniciar
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" infra/docker/.env.prod
docker compose restart backend
```

---

## Mantenimiento de Bases de Datos

### Mantenimiento PostgreSQL Semanal

```bash
# Vacuum y análisis de estadísticas
docker compose exec postgres psql -U sentinel_user -d sentinel_db \
  -c "VACUUM ANALYZE;"

# Limpiar sesiones expiradas
docker compose exec postgres psql -U sentinel_user -d sentinel_db \
  -c "DELETE FROM sessions WHERE expires_at < NOW();"

# Limpiar refresh tokens expirados (más de 30 días)
docker compose exec postgres psql -U sentinel_user -d sentinel_db \
  -c "DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days';"

# Ver tamaño de tablas
docker compose exec postgres psql -U sentinel_user -d sentinel_db -c "
SELECT tablename, 
  pg_size_pretty(pg_relation_size(tablename::regclass)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(tablename::regclass) DESC;"
```

### Mantenimiento MongoDB Mensual

```bash
# Compactar colecciones
docker compose exec mongodb mongosh sentinel_db \
  --eval "db.security_logs.compact()"

# Ver estadísticas
docker compose exec mongodb mongosh sentinel_db \
  --eval "db.stats()"

# Verificar índices TTL activos
docker compose exec mongodb mongosh sentinel_db \
  --eval "db.security_logs.getIndexes()"
```

### Mantenimiento Redis

```bash
# Ver uso de memoria
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO memory | grep used_memory_human

# Limpiar claves expiradas manualmente (normalmente automático)
docker compose exec redis redis-cli -a $REDIS_PASSWORD DEBUG SLEEP 0

# Ver estadísticas
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO stats
```

---

## Gestión de Capacidad

### Indicadores de Alerta

| Métrica | Umbral Advertencia | Umbral Crítico |
|---|---|---|
| CPU Backend | > 70% sostenido 5min | > 90% |
| RAM Backend | > 80% | > 95% |
| Disco PostgreSQL | > 70% | > 85% |
| Disco MongoDB | > 70% | > 85% |
| Redis memoria | > 80% `maxmemory` | > 95% |
| Latencia API P95 | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |

### Escalado Horizontal (Kubernetes)

```bash
# Escalar manualmente backend
kubectl scale deployment backend --replicas=5 -n robengate-sentinel

# Ver HPA (Horizontal Pod Autoscaler)
kubectl describe hpa backend-hpa -n robengate-sentinel

# El HPA ya está configurado: 2-10 replicas, CPU 70%, RAM 80%
```

---

## Gestión de IPs Baneadas

### Ver y Gestionar Bans

```bash
# Ver IPs baneadas activas
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://tudominio.com/api/bans?active=true"

# Desbanear IP (falso positivo)
curl -X DELETE "https://tudominio.com/api/bans/1.2.3.4" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Ver en Redis directamente
docker compose exec redis redis-cli -a $REDIS_PASSWORD KEYS "ban:*"

# Desbanear en Redis directamente
docker compose exec redis redis-cli -a $REDIS_PASSWORD DEL "ban:1.2.3.4"
```

---

## Actualizaciones de Emergencia

### Aplicar Hotfix Urgente

```bash
# 1. Pull de la imagen/código actualizado
git pull origin main

# 2. Rebuild y restart con zero-downtime (Kubernetes)
kubectl rollout restart deployment/backend -n robengate-sentinel
kubectl rollout status deployment/backend -n robengate-sentinel

# 3. Docker Compose (brief downtime)
docker compose build backend
docker compose up -d backend

# 4. Verificar post-deploy
curl https://tudominio.com/health
```

### Rollback Rápido

```bash
# Docker Compose: usar imagen anterior
docker compose down backend
docker tag robengate-backend:previous robengate-backend:latest
docker compose up -d backend

# Kubernetes: rollback automático
kubectl rollout undo deployment/backend -n robengate-sentinel
```
