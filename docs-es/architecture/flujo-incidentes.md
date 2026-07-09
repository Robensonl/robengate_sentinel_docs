# Flujo de Gestión de Incidentes y SOAR

**Módulo:** `backend/src/services/soarEngine.js`, `backend/src/controllers/incidentsController.js`  
**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Ciclo de Vida de un Incidente

```mermaid
stateDiagram-v2
    [*] --> NUEVO : Deteccion automatica

    NUEVO --> EN_REVISION : Analista asigna el caso
    EN_REVISION --> FALSO_POSITIVO : Verificado como legitimo
    EN_REVISION --> CONFIRMADO : Amenaza real verificada

    CONFIRMADO --> EN_PROGRESO : Respuesta iniciada
    CONFIRMADO --> ESCALADO : Supera umbral de severidad

    EN_PROGRESO --> ESPERANDO : Requiere accion externa
    ESPERANDO --> EN_PROGRESO : Accion completada
    EN_PROGRESO --> RESUELTO : Amenaza neutralizada
    ESCALADO --> RESUELTO : Resuelto a nivel superior

    RESUELTO --> CERRADO : Post-mortem completado
    FALSO_POSITIVO --> CERRADO : Archivado como FP

    CERRADO --> [*]

    note right of ESCALADO
        SSE notificacion a todos los analistas
    end note
    note right of NUEVO
        SOAR ejecuta playbook automatico
    end note
```

---

## Arquitectura SOAR

```mermaid
flowchart TD
    classDef trigger fill:#2E1A08,stroke:#FF9800,stroke-width:2px,color:#FFE0B2,font-weight:bold
    classDef engine  fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef action  fill:#2D1B1B,stroke:#FF6B6B,stroke-width:2px,color:#FFE0E0
    classDef store   fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0
    classDef output  fill:#0F2A1A,stroke:#4CAF50,stroke-width:2px,color:#E2E8F0

    TRIGGER["Disparador<br/>Alerta / Umbral / Manual"]:::trigger --> SOAR["SOAR Engine<br/>soarEngine.js"]:::engine
    SOAR --> MATCH["Buscar playbook<br/>por categoria / severidad"]:::engine
    MATCH --> PLAYBOOK[("PostgreSQL<br/>playbooks")]:::store
    PLAYBOOK --> EXEC["Ejecutar acciones<br/>del playbook en secuencia"]:::engine

    EXEC --> A1["Banear IP<br/>banned_ips + Redis"]:::action
    EXEC --> A2["Enviar alerta<br/>Email analistas"]:::action
    EXEC --> A3["Revocar sesiones<br/>JWT blacklist"]:::action
    EXEC --> A4["Crear incidente<br/>auto-correlacionado"]:::action
    EXEC --> A5["Notificar Slack<br/>Webhook"]:::action
    EXEC --> A6["Escalar incidente<br/>alert CISO"]:::action

    A1 & A2 & A3 & A4 & A5 & A6 --> AUDIT["Audit Trail<br/>accion registrada"]:::output
    A1 & A2 & A3 & A4 & A5 & A6 --> SSE_EMIT["SSE Notificacion<br/>tiempo real frontend"]:::output
```

---

## Playbooks SOAR

### Estructura de un Playbook

```json
{
  "id": "uuid",
  "name": "Respuesta a Brute Force SSH",
  "description": "Automáticamente banea y notifica en ataque SSH masivo",
  "trigger": {
    "category": "brute_force_ssh",
    "severity": "high",
    "threshold": 10
  },
  "actions": [
    {
      "type": "ban_ip",
      "duration_hours": 24,
      "reason": "Brute force SSH detectado"
    },
    {
      "type": "create_incident",
      "severity": "high",
      "title": "Brute Force SSH desde {{ip}}",
      "auto_assign": "on_call_analyst"
    },
    {
      "type": "send_alert",
      "channels": ["email", "sse"],
      "message": "Ataque SSH detectado desde {{ip}} - {{attempts}} intentos"
    }
  ],
  "enabled": true,
  "organization_id": "org-uuid"
}
```

### Playbooks Pre-configurados

| Playbook | Disparador | Acciones |
|---|---|---|
| **Brute Force SSH** | >10 intentos SSH/min | Ban 24h + Incidente + Email |
| **Credential Stuffing** | >5 logins fallidos/IP/5min | Ban 1h + Alerta SOC |
| **IOC Match** | IP/dominio en blacklist | Ban permanente + Incidente CRITICAL |
| **Impossible Travel** | Risk engine viaje imposible | Revocar sesiones + Forzar MFA |
| **Privilege Escalation** | Cambio de rol crítico | Auditoría + Notificar CISO |
| **Code Injection** | SQL/NoSQL/OS injection | Ban IP + Incidente CRITICAL |
| **Data Exfiltration** | Descarga masiva >100 registros | Revocar sesión + Alerta |

---

## Flujo de Creación de Incidente

```mermaid
sequenceDiagram
    participant Detective as Detection Engine
    participant SOAR as SOAR Engine
    participant PG as PostgreSQL
    participant Email as Email Service
    participant SSE as SSE Real-time
    participant Analyst as Analista SOC

    Detective->>SOAR: triggerPlaybook('brute_force_ssh', {ip, attempts: 15})
    
    SOAR->>PG: SELECT playbook WHERE category='brute_force_ssh' AND enabled=true
    PG-->>SOAR: Playbook "Brute Force SSH Response"
    
    SOAR->>PG: INSERT INTO banned_ips (ip, duration=24h, reason)
    SOAR->>SOAR: Redis SET "ban:1.2.3.4" TTL=86400
    
    SOAR->>PG: INSERT INTO incidents (title, severity, status, playbook_id, auto_created)
    PG-->>SOAR: incident_id: "inc-uuid"
    
    SOAR->>Email: Notificar analistas de guardia
    Email-->>Analyst: 📧 "Incidente Alto: Brute Force SSH"
    
    SOAR->>SSE: emit('NEW_INCIDENT', {id, severity, title})
    SSE-->>Analyst: 🔔 Notificación en dashboard tiempo real
    
    SOAR->>PG: INSERT INTO audit_logs (PLAYBOOK_EXECUTED, ...)
    
    SOAR-->>Detective: Playbook ejecutado exitosamente
```

---

## Gestión de Incidentes — API

| Endpoint | Método | Acción | Rol Mínimo |
|---|---|---|---|
| `/api/incidents` | GET | Listar incidentes | viewer |
| `/api/incidents/:id` | GET | Detalle incidente | viewer |
| `/api/incidents` | POST | Crear incidente | analyst |
| `/api/incidents/:id` | PATCH | Actualizar estado | analyst |
| `/api/incidents/:id/escalate` | POST | Escalar incidente | analyst |
| `/api/incidents/:id/assign` | POST | Asignar a analista | analyst |
| `/api/incidents/:id/close` | POST | Cerrar incidente | analyst |
| `/api/incidents/:id/timeline` | GET | Timeline del incidente | viewer |

---

## Métricas de Incidentes (KPIs SOC)

| Métrica | Descripción | Objetivo |
|---|---|---|
| **MTTD** | Mean Time to Detect | < 1 hora |
| **MTTA** | Mean Time to Acknowledge | < 30 min |
| **MTTR** | Mean Time to Respond | < 4 horas |
| **MTTC** | Mean Time to Contain | < 8 horas |
| **False Positive Rate** | % alertas que son FP | < 15% |
| **Playbook Success Rate** | % playbooks ejecutados exitosamente | > 95% |

Las métricas son visibles en el Dashboard SOC (`/dashboard`) y expuestas via Prometheus:

```promql
# MTTD promedio (últimas 24h)
avg(sentinel_incident_mttd_seconds)

# Incidentes por severidad
count by (severity) (sentinel_incidents_total)

# Playbooks ejecutados hoy
increase(sentinel_playbook_executions_total[24h])
```
