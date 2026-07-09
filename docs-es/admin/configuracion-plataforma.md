# Guía de Administrador — Configuración de la Plataforma

**Rol requerido:** `admin`  

---

## Variables de Entorno

La configuración completa de variables de entorno está en: [docs-es/infrastructure/environment-variables.md](../infrastructure/environment-variables.md)

---

## Configuración de Organización

### Obtener configuración actual

```bash
GET /api/organizations/me
Authorization: Bearer ADMIN_TOKEN
```

### Actualizar configuración

```bash
PATCH /api/organizations/1
Authorization: Bearer ADMIN_TOKEN

{
  "name": "Mi Empresa Security",
  "retention_days": 365,
  "mfa_required": true,
  "sso_enabled": false,
  "webhook_url": "https://hooks.empresa.com/security-alerts",
  "webhook_secret": "whsec_randomstring32chars"
}
```

### Configuración por Plan

| Configuración | Starter | Professional | Enterprise |
|---|---|---|---|
| `seats_limit` | 10 | 50 | Ilimitado |
| `retention_days` | 90 | 365 | Configurable |
| `mfa_required` | Opcional | Opcional | Opcional |
| `sso_enabled` | ❌ | ❌ | ✅ |
| Webhooks | ✅ | ✅ | ✅ |
| API Keys | ✅ | ✅ | ✅ |

---

## Playbooks SOAR — Administración

### Playbooks Recomendados por Defecto

#### 1. Auto-ban Brute Force

```json
{
  "name": "Auto-ban Brute Force IPs",
  "trigger_type": "threshold",
  "trigger_config": {
    "event_type": "LOGIN_FAILED",
    "threshold": 50,
    "window_minutes": 15
  },
  "actions": [
    {"type": "ban_ip", "duration_hours": 24},
    {"type": "create_incident", "severity": "high"}
  ]
}
```

#### 2. Critical Alert to Slack

```json
{
  "name": "Critical Alert Notification",
  "trigger_type": "event",
  "trigger_config": {
    "event_type": "SQL_INJECTION_ATTEMPT"
  },
  "actions": [
    {"type": "notify_webhook", "url": "https://hooks.slack.com/services/..."},
    {"type": "create_incident", "severity": "critical"}
  ]
}
```

#### 3. Honeypot Auto-report IOC

```json
{
  "name": "Honeypot IP to Threat Intel",
  "trigger_type": "threshold",
  "trigger_config": {
    "event_type": "HONEYPOT_SSH_AUTH",
    "threshold": 10,
    "window_minutes": 60
  },
  "actions": [
    {"type": "create_threat_indicator", "severity": "HIGH", "source": "honeypot"},
    {"type": "ban_ip", "duration_hours": 48}
  ]
}
```

### Gestionar Playbooks

```bash
# Listar playbooks
GET /api/playbooks

# Crear playbook
POST /api/playbooks
{body del playbook}

# Activar/desactivar
PATCH /api/playbooks/1
{"enabled": true}

# Eliminar
DELETE /api/playbooks/1
```

---

## Agentes EDR — Administración

### Registrar Nuevo Agente

```bash
POST /api/agents/register
Authorization: Bearer ADMIN_TOKEN

{
  "hostname": "laptop-marketing-01.empresa.com",
  "os": "macOS 14.0",
  "version": "1.0.0",
  "ip": "192.168.1.101"
}
```

### Ver Agentes Registrados

```bash
GET /api/agents
# Muestra: hostname, OS, status (online/offline), last_seen, isolated
```

### Aislar Agente (Emergencia)

En caso de detección de malware o C2:

```bash
POST /api/agents/agent-abc123/isolate
{
  "isolate": true,
  "reason": "Ransomware C2 communication detected - Emergency isolation"
}
```

> ⚠️ El aislamiento corta toda comunicación de red del endpoint. Usar solo en emergencias.

---

## Monitorización del Sistema

### Health Check

```bash
curl https://api.tudominio.com/health
# Respuesta: {"status": "healthy", "services": {...}}

curl https://api.tudominio.com/ready
# Respuesta: {"ready": true}
```

### Métricas Prometheus

```bash
# Ver métricas en texto plano
curl http://localhost:5000/metrics

# Dashboards Grafana
http://localhost:3000  # admin/admin
```

### Logs de la Aplicación

```bash
# Docker Compose
docker compose logs -f backend

# Kubernetes
kubectl logs -f deployment/robengate-backend -n robengate-sentinel
```

---

## Administración de la Base de Datos

### Backup Manual de Emergencia

```bash
# PostgreSQL
pg_dump -h localhost -U robengate -d robengate_db > backup_$(date +%Y%m%d).sql

# MongoDB  
mongodump --uri="mongodb://admin:pass@localhost/robengate" --out=./backup_$(date +%Y%m%d)

# Script completo
./infra/scripts/backup.sh ./backups/
```

### Verificar Integridad de Datos

```sql
-- Verificar logs recientes en PostgreSQL
SELECT COUNT(*), MAX(created_at) FROM security_logs WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verificar índices
SELECT indexname, tablename FROM pg_indexes WHERE tablename = 'security_logs';
```

---

## Checklist de Mantenimiento Diario

```
[ ] Revisar alertas críticas sin resolver
[ ] Verificar health checks: /health y /ready
[ ] Revisar métricas Grafana (error rate, latency)
[ ] Revisar logs de errores del backend
[ ] Verificar backups completados
[ ] Revisar IPs baneadas próximas a expirar
[ ] Revisar playbooks — ¿alguno fallando?
[ ] Purge de sesiones expiradas (si no hay job automático)
```

## Checklist de Mantenimiento Semanal

```
[ ] Auditar cambios de roles de usuario
[ ] Revisar IOCs de la semana y confirmar/desactivar
[ ] Revisar vulnerabilidades: ¿alguna nueva crítica?
[ ] Revisar métricas de la semana en Grafana
[ ] Verificar espacio en disco (logs, BD)
[ ] Revisar post-reviews de incidentes pendientes
[ ] Actualizar playbooks si hay nuevas amenazas
```
