# Guía de Troubleshooting — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Comandos de Diagnóstico Rápido

```bash
# Estado general de todos los servicios
docker compose -f infra/docker/docker-compose.yml ps

# Health check completo
curl -s http://localhost:5000/health | python3 -m json.tool
curl -s http://localhost:5000/ready | python3 -m json.tool

# Logs recientes del backend
docker compose logs --tail 50 backend

# Uso de recursos
docker stats --no-stream
```

---

## Problemas Comunes y Soluciones

---

### PROB-01: Backend no inicia

**Síntomas:** El contenedor `sentinel-backend` está en estado `Restarting` o `Exiting`.

**Diagnóstico:**
```bash
docker compose logs backend | tail -30
```

**Causas y soluciones:**

| Causa | Mensaje de error | Solución |
|---|---|---|
| Variable env faltante | `Error: JWT_SECRET is required` | Verificar .env, añadir variable |
| PostgreSQL no disponible | `Connection refused to postgres:5432` | Verificar que postgres está healthy |
| MongoDB no disponible | `MongoConnectionError` | Verificar credenciales MONGO_URI |
| Redis no disponible | `Redis connection refused` | Verificar REDIS_URL y contraseña |
| Puerto ocupado | `EADDRINUSE :5000` | Cambiar PORT en .env |

---

### PROB-02: Error 401 en todas las peticiones

**Síntomas:** Todas las peticiones API devuelven `{"success": false, "error": "No token provided"}`.

**Diagnóstico:**
```bash
# Verificar que el token se está enviando
curl -v -H "Authorization: Bearer <token>" http://localhost:5000/api/stats/dashboard
```

**Causas:**
1. Token expirado → El frontend debería renovarlo automáticamente. Si no ocurre, verificar `useTokenRefresh.js`
2. JWT_SECRET cambiado → Todos los tokens existentes son inválidos. Hacer logout/login
3. Cookie httpOnly no se envía → Verificar que CORS permite credentials
4. Token en localStorage (vulnerabilidad) → Migrar a tokenManager (en memoria)

---

### PROB-03: Login falla con 429 Too Many Requests

**Síntomas:** `{"error": "Too many requests"}` después de varios intentos de login.

**Causa:** Rate limiter activado (5 intentos de login por 15 minutos por IP).

**Solución (desarrollo):**
```bash
# Limpiar rate limit en Redis
redis-cli -a $REDIS_PASSWORD KEYS "ratelimit:*" | xargs redis-cli -a $REDIS_PASSWORD DEL
```

**Solución (producción):**
- Esperar 15 minutos
- O un admin puede limpiar via interfaz de administración

---

### PROB-04: IP baneada automáticamente

**Síntomas:** `{"error": "IP address is banned"}` en todas las peticiones desde una IP.

**Diagnóstico:**
```bash
# Ver IPs baneadas en PostgreSQL
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME \
  -c "SELECT ip_address, reason, banned_at, expires_at FROM banned_ips ORDER BY banned_at DESC LIMIT 10;"

# Ver en Redis (bans temporales)
redis-cli -a $REDIS_PASSWORD KEYS "ban:*"
```

**Desbanear una IP:**
```bash
# Via PostgreSQL
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME \
  -c "DELETE FROM banned_ips WHERE ip_address = '1.2.3.4';"

# Via Redis (ban temporal)
redis-cli -a $REDIS_PASSWORD DEL "ban:1.2.3.4"
```

---

### PROB-05: MFA no envía email

**Síntomas:** El login requiere MFA pero el código no llega por email.

**Diagnóstico:**
```bash
# En desarrollo, el código se imprime en los logs del backend:
docker compose logs backend | grep "MFA\|OTP\|code"
```

**Causas:**
1. Configuración SMTP faltante → Verificar `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
2. Puerto SMTP bloqueado → Probar con `telnet smtp.ejemplo.com 587`
3. Credenciales SMTP incorrectas

**Solución temporal (desarrollo):**
```bash
# El código OTP está en los logs:
docker compose logs backend 2>&1 | grep -i "otp\|mfa code"
```

---

### PROB-06: Frontend no carga (500 en nginx)

**Síntomas:** La aplicación muestra error de servidor o pantalla en blanco.

**Diagnóstico:**
```bash
docker compose logs frontend
docker compose logs nginx
```

**Causas comunes:**
1. Build de React fallido → Verificar `docker compose logs frontend` durante el build
2. Nginx config incorrecta → Verificar `infra/nginx.conf`
3. `try_files` faltante para SPA → Asegurarse de que nginx.conf tiene `try_files $uri $uri/ /index.html`

---

### PROB-07: Websocket/SSE desconectado frecuentemente

**Síntomas:** Los eventos en tiempo real del dashboard se desconectan.

**Diagnóstico:**
```bash
# En el browser: DevTools → Network → /api/events
# Debe mostrar "text/event-stream" y mantener conexión abierta
```

**Causas:**
1. Nginx timeout → Añadir en nginx.conf:
   ```nginx
   proxy_read_timeout 86400s;
   proxy_send_timeout 86400s;
   keepalive_timeout 86400s;
   ```
2. Load balancer corta conexiones largas → Configurar sticky sessions
3. Token expirado → Verificar que useTokenRefresh renueva antes de expiraciones

---

### PROB-08: Base de datos PostgreSQL llena / pool agotado

**Síntomas:** Errores `pool timeout` o `Connection count exceeded`.

**Diagnóstico:**
```bash
# Ver conexiones activas
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME \
  -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

**Solución:**
```bash
# Aumentar pool en connection-pool.js o .env
DB_POOL_MAX=30

# Matar conexiones idle
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
      WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';"
```

---

### PROB-09: MongoDB replica de logs muy grande

**Síntomas:** Disco lleno por colecciones MongoDB.

**Diagnóstico:**
```bash
# Ver tamaño de colecciones
mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB?authSource=admin" \
  --eval "db.stats()"
```

**Solución:**
```bash
# Ver y gestionar TTL index en security_logs
mongosh "..." --eval "
  db.security_logs.getIndexes()
  // Si no hay TTL index:
  db.security_logs.createIndex({createdAt: 1}, {expireAfterSeconds: 7776000}) // 90 días
"
```

---

### PROB-10: Honeypot no envía eventos al backend

**Síntomas:** No aparecen eventos del honeypot en el dashboard.

**Diagnóstico:**
```bash
docker compose logs honeypot | tail -20
# Buscar: "Failed to forward event" o errores de conexión
```

**Causas:**
1. `BACKEND_URL` incorrecto → Debe ser `http://backend:5000` en Docker o la URL interna
2. `INTERNAL_API_SECRET` diferente entre honeypot y backend
3. Backend no accesible desde el contenedor honeypot

**Test manual:**
```bash
# Desde el contenedor honeypot
docker compose exec honeypot wget -qO- \
  --header="X-Internal-Secret: $INTERNAL_API_SECRET" \
  --header="Content-Type: application/json" \
  --post-data='{"eventType":"TEST","ipAddress":"1.2.3.4","metadata":{}}' \
  http://backend:5000/internal/honeypot/events
```

---

## Comandos de Recuperación de Emergencia

### Reinicio limpio de todos los servicios
```bash
# Detener todo
docker compose -f infra/docker/docker-compose.yml down

# Esperar 10 segundos
sleep 10

# Iniciar de nuevo
docker compose -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml \
  --env-file .env.prod \
  up -d
```

### Forzar recreación de un servicio específico
```bash
docker compose -f infra/docker/docker-compose.yml up -d --force-recreate backend
```

### Ver todos los logs de error de los últimos 10 minutos
```bash
docker compose -f infra/docker/docker-compose.yml logs \
  --since 10m \
  2>&1 | grep -i "error\|warn\|critical\|fatal"
```

### Backup de emergencia antes de operaciones de riesgo
```bash
./infra/scripts/backup.sh ./emergency-backups/
```

---

## Escalación de Incidentes

| Severidad | Tiempo de Respuesta | Responsable |
|---|---|---|
| 🔴 Crítico (servicio caído) | 15 minutos | On-call Engineer |
| 🟠 Alto (degradación) | 30 minutos | SOC Analyst |
| 🟡 Medio (feature afectada) | 4 horas | Dev Team |
| 🟢 Bajo (mejora) | Próximo sprint | Product Team |
