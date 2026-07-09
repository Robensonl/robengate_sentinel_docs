# Guía de Actualización — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Procedimiento de Actualización Estándar

### Pre-Actualización Checklist

```bash
# 1. Verificar estado actual saludable
curl http://localhost:5000/health

# 2. Revisar changelog de la nueva versión
cat CHANGELOG.md | head -50

# 3. Identificar si hay migraciones de BD
ls -la db-sql/migrations/ | sort

# 4. BACKUP OBLIGATORIO antes de actualizar
./infra/scripts/backup.sh ./backups/pre-upgrade-$(date +%Y%m%d)/
```

---

## Actualización — Docker Compose

```bash
# 1. Pull cambios del repositorio
git fetch origin
git checkout main
git pull origin main

# 2. Revisar cambios en .env (nuevas variables)
diff .env infra/docker/.env.example
# Añadir cualquier variable nueva a tu .env.prod

# 3. Rebuild imágenes
docker compose -f infra/docker/docker-compose.yml \
               -f infra/docker/docker-compose.prod.yml \
               --env-file infra/docker/.env.prod \
               build --no-cache

# 4. Aplicar migraciones de BD (antes de reiniciar backend)
docker compose -f infra/docker/docker-compose.yml \
               --env-file infra/docker/.env.prod \
               run --rm backend node scripts/run-migrations.js

# 5. Rolling restart (si hay múltiples réplicas) o restart normal
docker compose -f infra/docker/docker-compose.yml \
               -f infra/docker/docker-compose.prod.yml \
               --env-file infra/docker/.env.prod \
               up -d --force-recreate backend frontend

# 6. Verificar post-actualización
curl http://localhost:5000/health
docker compose logs backend | tail -20
```

---

## Actualización — Kubernetes + Helm

```bash
# 1. Pull cambios
git pull origin main

# 2. Actualizar imagen en registry
docker build -t registry.io/robengate-backend:v2.1.0 \
  -f infra/Dockerfile.backend .
docker push registry.io/robengate-backend:v2.1.0

# 3. Aplicar migraciones (Job de migración)
kubectl apply -f k8s/base/migration-job.yaml
kubectl wait --for=condition=complete job/db-migration \
  --timeout=120s -n robengate-sentinel

# 4. Actualizar imagen en deployment
kubectl set image deployment/backend \
  backend=registry.io/robengate-backend:v2.1.0 \
  -n robengate-sentinel

# 5. Monitorizar rolling update
kubectl rollout status deployment/backend -n robengate-sentinel

# 6. Verificar
kubectl get pods -n robengate-sentinel
curl https://tudominio.com/health
```

### Actualización con Helm

```bash
# 1. Actualizar values.yaml con nueva versión de imagen
# helm/robengate-sentinel/values.yaml:
# image.tag: "v2.1.0"

# 2. Upgrade helm release
helm upgrade robengate-sentinel ./helm/robengate-sentinel \
  --namespace robengate-sentinel \
  --set image.tag=v2.1.0 \
  --atomic \            # Rollback automático si falla
  --timeout 5m

# 3. Ver historial
helm history robengate-sentinel -n robengate-sentinel

# Salida esperada:
# REVISION  STATUS     CHART                          APP VERSION
# 1         superseded robengate-sentinel-1.0.0       v2.0.0
# 2         deployed   robengate-sentinel-1.1.0       v2.1.0
```

---

## Migraciones de Base de Datos

### Convención de Migraciones

```
db-sql/migrations/
  001_initial_schema.sql
  002_add_refresh_tokens.sql
  003_devices_table.sql
  ...
  013_add_playbooks.sql
  014_nueva_feature.sql   <- Nueva migración
```

### Crear Nueva Migración

```sql
-- Archivo: db-sql/migrations/014_nueva_funcionalidad.sql
-- Siempre usar IF NOT EXISTS para idempotencia

-- Incrementar versión del schema
INSERT INTO schema_migrations (version, applied_at)
VALUES ('014', NOW())
ON CONFLICT DO NOTHING;

-- Tu cambio de schema
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS external_ticket_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_incidents_external_ticket 
ON incidents(external_ticket_id) 
WHERE external_ticket_id IS NOT NULL;
```

### Ejecutar Migraciones

```bash
# Script automático (aplica migraciones pendientes en orden)
docker compose exec backend node scripts/run-migrations.js

# Manual (si el script no existe)
for f in db-sql/migrations/*.sql; do
  echo "Aplicando: $f"
  docker compose exec -T postgres psql \
    -U sentinel_user \
    -d sentinel_db \
    -f "/migrations/$(basename $f)"
done
```

### Verificar Migraciones Aplicadas

```bash
docker compose exec postgres psql -U sentinel_user -d sentinel_db \
  -c "SELECT version, applied_at FROM schema_migrations ORDER BY version;"
```

---

## Rollback

### Rollback de Aplicación

```bash
# Docker Compose — volver a imagen anterior
git checkout v2.0.0  # Versión anterior conocida
docker compose build backend
docker compose up -d backend

# Kubernetes
kubectl rollout undo deployment/backend -n robengate-sentinel
# Verificar
kubectl rollout status deployment/backend -n robengate-sentinel

# Helm
helm rollback robengate-sentinel 1 -n robengate-sentinel  # Volver a revision 1
```

### Rollback de Migración de BD

```bash
# Las migraciones generalmente NO tienen rollback automático
# Para rollback manual, crear script de reversión:

# Archivo: db-sql/migrations/rollback/014_rollback.sql
ALTER TABLE incidents DROP COLUMN IF EXISTS external_ticket_id;
DELETE FROM schema_migrations WHERE version = '014';

# Aplicar rollback
docker compose exec -T postgres psql \
  -U sentinel_user -d sentinel_db \
  < db-sql/migrations/rollback/014_rollback.sql
```

---

## Actualización de Dependencias

### Backend

```bash
cd backend

# Ver dependencias desactualizadas
npm outdated

# Actualizar patch/minor (seguro)
npm update

# Actualizar major (con precaución)
npx npm-check-updates -u
npm install

# Verificar funcionamiento post-actualización
npm run lint
# npm test  (cuando estén implementados)
```

### Frontend

```bash
cd frontend

# Ver desactualizadas
npm outdated

# Actualizar
npm update

# Build para verificar que compila
npm run build

# Verificar bundle size no creció demasiado
ls -lh dist/assets/
```

### Dependencias de Seguridad

```bash
# Auditar vulnerabilidades conocidas
cd backend && npm audit
cd frontend && npm audit

# Fix automático de vulnerabilidades
npm audit fix

# Fix forzado (puede cambiar major versions — revisar con cuidado)
npm audit fix --force
```

---

## Notas de Versiones

### v2.0.0 → v2.1.0 (Planeada Q3 2026)
- **Cambios de BD:** Ninguno (solo correcciones)
- **Nuevas variables de entorno:** Ninguna
- **Breaking changes:** Ninguno
- **Procedimiento:** Actualización estándar

### v1.x → v2.0.0 (Realizada)
- **Cambios de BD:** Migraciones 001-013 completas
- **Nuevas variables:** `INTERNAL_API_SECRET`, `WEBAUTHN_RPID`, `WEBAUTHN_ORIGIN`
- **Breaking changes:** Refactor RBAC completo (rol viewer con acceso SOC)
- **Frontend:** tokens movidos de localStorage a memoria + httpOnly cookie
