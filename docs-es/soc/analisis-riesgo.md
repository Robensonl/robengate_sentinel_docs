# Guía SOC — Análisis de Riesgo

**Rol requerido:** `analyst`  
**Módulo:** AI Analysis / Risk Engine  

---

## Motor de Riesgo

El módulo AI de RobenGate Sentinel es un **motor heurístico** (no un modelo de ML externo). Calcula el Risk Score de la plataforma y el comportamiento anómalo de usuarios basándose en señales de comportamiento.

> ✅ **REAL:** Motor heurístico implementado en `backend/src/services/`  
> 🎭 **SIMULADO:** Las recomendaciones de seguridad son datos de demostración  

---

## Risk Score Global de la Plataforma

```bash
GET /api/ai/overview
```

**Respuesta:**
```json
{
  "risk_score": 67,
  "risk_level": "HIGH",
  "recommendations": ["..."],
  "anomaly_count": 3,
  "last_updated": "2026-06-01T14:30:00Z"
}
```

### Interpretación del Risk Score

| Score | Nivel | Color | Acción |
|---|---|---|---|
| 0-25 | LOW | 🟢 Verde | Monitorización normal |
| 26-50 | MEDIUM | 🟡 Amarillo | Review diario de alertas |
| 51-75 | HIGH | 🟠 Naranja | Hunting proactivo, revisar cada 4h |
| 76-100 | CRITICAL | 🔴 Rojo | Guardia continua, escalar a CISO |

---

## Señales que Contribuyen al Risk Score

El motor evalúa estas señales (documentadas en el código):

| Señal | Impacto | Cómo verificar |
|---|---|---|
| Alertas CRITICAL sin resolver | Muy Alto | `GET /api/alerts?severity=critical&status=new` |
| Incidentes `in_progress` activos | Alto | `GET /api/incidents?status=in_progress` |
| Intentos de login fallidos (15min) | Alto | `GET /api/logs?event_type=LOGIN_FAILED` |
| IPs baneadas nuevas (24h) | Medio | `GET /api/logs?event_type=IP_BANNED` |
| IOCs HIGH/CRITICAL vistos hoy | Medio | `GET /api/threats/indicators?severity=HIGH` |
| Intentos SQLi recientes | Alto | `GET /api/logs?event_type=SQL_INJECTION_ATTEMPT` |
| Intentos XXS recientes | Medio | `GET /api/logs?event_type=XSS_ATTEMPT` |
| Actividad de honeypot masiva | Bajo-Medio | `GET /api/honeypot/events?limit=10` |
| Usuarios con Risk Score alto | Medio | `GET /api/ai/user-behavior` |

---

## Anomalías del Sistema

```bash
GET /api/ai/anomaly-stream
```

El stream SSE envía anomalías detectadas en tiempo real. Cada anomalía incluye:
- `type` — tipo de anomalía
- `severity` — INFO/LOW/MEDIUM/HIGH/CRITICAL
- `description` — descripción textual
- `entity` — IP, usuario, o endpoint afectado

**Tipos de anomalías que puede detectar:**
- `UNUSUAL_LOGIN_PATTERN` — login a hora inusual para ese usuario
- `IMPOSSIBLE_TRAVEL` — mismo usuario, dos países en < 2h
- `HIGH_FAILED_LOGINS` — pico de fallos en ventana corta
- `MASS_EXPORT` — descarga masiva de datos
- `PRIVILEGE_ESCALATION_ATTEMPT` — intento de acceder a endpoint con rol insuficiente

---

## Risk Score por Usuario

```bash
GET /api/ai/user-behavior
```

Retorna usuarios con comportamiento anómalo ordenados por riesgo:
```json
[
  {
    "userId": 42,
    "email": "user@empresa.com",
    "risk_score": 85,
    "anomalies": ["UNUSUAL_LOGIN_TIME", "LOGIN_FROM_NEW_COUNTRY"],
    "last_seen": "2026-06-01T14:00:00Z"
  }
]
```

### Acciones por User Risk Score

| Score | Acción Recomendada |
|---|---|
| 75-100 | Contactar al usuario, verificar actividad, considerar bloqueo preventivo |
| 50-74 | Monitorización estrecha durante 48h |
| 25-49 | Registrar, revisar en próximo hunting semanal |
| 0-24 | Normal, no acción |

---

## Recomendaciones de Seguridad

```bash
GET /api/ai/recommendations
```

> 🎭 **Nota:** Las recomendaciones son datos de demostración en la versión actual.

Las recomendaciones priorizadas actualmente aparecen en el dashboard. Incluyen categorías:
- **Configuration** — Ajustes de configuración del sistema
- **Policy** — Cambios de políticas de seguridad
- **Response** — Acciones de respuesta ante amenazas activas
- **Monitoring** — Mejoras en detección y alertas

---

## Tendencias y Análisis Histórico

```bash
# Eventos de las últimas 24h
GET /api/stats
# new_events_count, critical_alerts_today, etc.

# Vista histórica de incidentes
GET /api/incidents?from=<30d_ago>&status=resolved
```

### Métricas a Monitorizar Semanalmente

| Métrica | Tendencia Saludable |
|---|---|
| Risk Score promedio (semana) | Decreciente o estable |
| Nuevos IOCs reportados | Creciente (más inteligencia) |
| MTTR de incidentes | Decreciente (mejora proceso) |
| False Positive Rate | Decreciente (mejor tuning) |
| Eventos honeypot | Estable o decreciente |
| Usuarios con high risk score | Decreciente (resolución activa) |
