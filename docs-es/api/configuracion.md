# API — Configuración de Plataforma

Esta sección documenta los endpoints de configuración: organizaciones, playbooks SOAR, agentes EDR, e ingesta.

---

## Organizaciones (Multi-tenancy)

**Base URL:** `/api/organizations`  
**Auth mínima:** `viewer` (lectura) / `admin` (escritura)  

### GET /api/organizations/me

**Descripción:** Obtiene la organización del usuario autenticado.  
**Auth:** `viewer+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Acme Corp",
    "slug": "acme-corp",
    "plan": "professional",
    "status": "active",
    "seats_limit": 50,
    "retention_days": 365,
    "mfa_required": true,
    "sso_enabled": false,
    "webhook_url": "https://hooks.empresa.com/security",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

### GET /api/organizations/:id

**Descripción:** Obtiene los detalles de una organización.  
**Auth:** `analyst+`

### PATCH /api/organizations/:id

**Descripción:** Actualiza la configuración de la organización.  
**Auth:** `admin`

#### Request

```json
{
  "name": "Acme Corp Security",
  "retention_days": 730,
  "mfa_required": true,
  "webhook_url": "https://hooks.empresa.com/security",
  "webhook_secret": "whsec_abc123"
}
```

**Campos configurables:**

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre de la organización |
| `retention_days` | number | Días de retención de logs |
| `mfa_required` | boolean | Forzar MFA para todos |
| `webhook_url` | string | URL webhook de alertas salientes |
| `webhook_secret` | string | Secreto HMAC para firmar webhooks |

---

## Playbooks SOAR

**Base URL:** `/api/playbooks`  
**Auth mínima:** `analyst` (lectura) / `admin` (escritura)  
**Estado:** ✅ Real — soarEngine.js implementado  

### GET /api/playbooks

**Descripción:** Lista los playbooks configurados.  
**Auth:** `analyst+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "playbooks": [
      {
        "id": 1,
        "name": "Auto-ban Brute Force IPs",
        "description": "Automatically ban IPs with 50+ failed login attempts in 15 minutes",
        "trigger_type": "threshold",
        "trigger_config": {
          "event_type": "LOGIN_FAILED",
          "threshold": 50,
          "window_minutes": 15
        },
        "actions": [
          {"type": "ban_ip", "duration_hours": 24},
          {"type": "create_incident", "severity": "high"},
          {"type": "notify_email", "template": "brute_force_alert"}
        ],
        "enabled": true,
        "executions_count": 892,
        "last_executed": "2026-06-01T14:00:00Z"
      }
    ]
  }
}
```

### GET /api/playbooks/:id

**Descripción:** Obtiene el detalle de un playbook.  
**Auth:** `analyst+`

### POST /api/playbooks

**Descripción:** Crea un nuevo playbook.  
**Auth:** `admin`

#### Request

```json
{
  "name": "Quarantine Infected Endpoint",
  "description": "Isolate endpoint when malware is detected",
  "trigger_type": "event",
  "trigger_config": {
    "event_type": "MALWARE_DETECTED"
  },
  "actions": [
    {"type": "isolate_agent", "param": "affected_agent_id"},
    {"type": "create_incident", "severity": "critical"},
    {"type": "notify_slack", "channel": "#security-alerts"}
  ],
  "enabled": true
}
```

**Tipos de Trigger:**

| Tipo | Descripción |
|---|---|
| `event` | Disparado por tipo de evento específico |
| `threshold` | Disparado cuando se supera un umbral |
| `schedule` | Ejecutado en horario (cron) |
| `manual` | Ejecución manual por analista |

**Tipos de Acción:**

| Tipo | Descripción |
|---|---|
| `ban_ip` | Banear IP automáticamente |
| `create_incident` | Crear incidente |
| `isolate_agent` | Aislar agente EDR |
| `notify_email` | Enviar notificación email |
| `notify_slack` | Notificación Slack (webhook) |
| `notify_webhook` | Webhook genérico |

### PATCH /api/playbooks/:id

**Descripción:** Actualiza un playbook.  
**Auth:** `admin`

### DELETE /api/playbooks/:id

**Descripción:** Elimina un playbook.  
**Auth:** `admin`

---

## Agentes EDR

**Base URL:** `/api/agents`  
**Auth mínima:** `analyst` (lectura) / `admin` (registro)  
**Estado:** ⚠️ Implementación básica  

### POST /api/agents/register

**Descripción:** Registra un nuevo agente EDR.  
**Auth:** `admin`

#### Request

```json
{
  "hostname": "workstation-42.empresa.com",
  "os": "Windows 11",
  "version": "1.0.0",
  "ip": "192.168.1.42"
}
```

#### Respuesta 201

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "token": "agent-token-for-communication",
    "hostname": "workstation-42.empresa.com"
  }
}
```

### GET /api/agents

**Descripción:** Lista todos los agentes EDR registrados.  
**Auth:** `analyst+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent_id": "agent-abc123",
        "hostname": "workstation-42.empresa.com",
        "os": "Windows 11",
        "status": "online",
        "last_seen": "2026-06-01T15:00:00Z",
        "ip": "192.168.1.42",
        "isolated": false
      }
    ]
  }
}
```

### GET /api/agents/:agentId

**Descripción:** Detalle de un agente específico.  
**Auth:** `analyst+`

### POST /api/agents/:agentId/isolate

**Descripción:** Envía comando de aislamiento de red al agente.  
**Auth:** `admin`

#### Request

```json
{
  "isolate": true,
  "reason": "Malware C2 communication detected"
}
```

---

## Ingesta de Eventos

**Base URL:** `/api/ingest`  
**Auth:** `internalAuth` (X-Internal-Secret) para endpoints de ingesta  

### POST /api/ingest/event

**Descripción:** Ingesta un evento de seguridad individual.  
**Auth:** `X-Internal-Secret`

#### Request (Formato JSON)

```json
{
  "format": "json",
  "source": "firewall",
  "event": {
    "timestamp": "2026-06-01T14:00:00Z",
    "src_ip": "185.220.101.44",
    "dst_ip": "10.0.0.1",
    "action": "BLOCKED",
    "protocol": "TCP",
    "dst_port": 22,
    "reason": "Blocked by firewall rule"
  }
}
```

### POST /api/ingest/batch

**Descripción:** Ingesta múltiples eventos en lote.  
**Auth:** `X-Internal-Secret`

#### Request

```json
{
  "format": "json",
  "events": [
    {"timestamp": "...", "src_ip": "...", "action": "..."},
    {"timestamp": "...", "src_ip": "...", "action": "..."}
  ]
}
```

### POST /api/ingest/syslog

**Descripción:** Ingesta eventos en formato syslog (RFC 5424).  
**Auth:** `X-Internal-Secret`

#### Request

```
<13>1 2026-06-01T14:00:00Z firewall.empresa.com sshd 1234 - - Failed password for root from 185.220.101.44 port 22
```

### POST /api/ingest/windows

**Descripción:** Ingesta Windows Event Log.  
**Auth:** `X-Internal-Secret`

#### Request

```json
{
  "EventID": 4625,
  "TimeCreated": "2026-06-01T14:00:00Z",
  "Computer": "DC01.empresa.local",
  "EventData": {
    "SubjectUserName": "-",
    "TargetUserName": "Administrator",
    "IpAddress": "192.168.1.100"
  }
}
```

### GET /api/ingest/stats

**Descripción:** Estadísticas del pipeline de ingesta.  
**Auth:** `admin`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "events_today": 15847,
    "events_total": 2341892,
    "by_format": {
      "json": 8923,
      "syslog": 4521,
      "windows": 2341,
      "cef": 62
    },
    "pipeline_latency_ms": 12,
    "errors_today": 3
  }
}
```

---

## Formatos de Ingesta Soportados

| Formato | Descripción | Endpoint |
|---|---|---|
| JSON | Eventos JSON genéricos | `/ingest/event` o `/ingest/batch` |
| CEF | Common Event Format (ArcSight) | `/ingest/event` con `format: "cef"` |
| Syslog | RFC 5424 syslog | `/ingest/syslog` |
| Windows Event Log | Formato Windows XML | `/ingest/windows` |
| Webhook | Cualquier sistema vía webhook | `/ingest/webhook` |

> **Pipeline:** Todos los eventos pasan por `ingestion/parser.js` → `normalizer.js` → `enricher.js` (geoIP + IOC lookup + MITRE mapping) → `pipeline.js` (almacenamiento dual PostgreSQL + MongoDB).
