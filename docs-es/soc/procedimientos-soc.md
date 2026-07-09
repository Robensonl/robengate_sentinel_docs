# Guía SOC — Procedimientos Operativos Estándar

**SOPs — Standard Operating Procedures**  
**Versión:** 2.0.0  

---

## SOP-001: Inicio de Turno de Guardia

**Duración:** 10-15 minutos  
**Frecuencia:** Al inicio de cada turno  

### Checklist

```
□ 1. Revisar dashboard — Risk Score actual
□ 2. Revisar alertas críticas sin resolver (severity=critical, status=new)
□ 3. Revisar incidentes abiertos (status=in_progress)
□ 4. Leer notas del turno anterior (último incidente o handoff note)
□ 5. Verificar que el sistema está operativo (GET /health)
□ 6. Verificar SSE stream conectado (notificaciones en tiempo real activas)
□ 7. Revisar estadísticas de las últimas 8h (GET /api/stats)
```

---

## SOP-002: Gestión de Alerta Crítica

**Trigger:** Nueva alerta con severity=critical  
**SLA:** Respuesta inicial < 15 minutos  

### Pasos

1. **Acknowledge** la alerta:
   ```
   PATCH /api/alerts/<id>/status {"status": "acknowledged"}
   ```

2. **Investigar contexto** (ver [investigacion-alertas.md](investigacion-alertas.md))

3. **Determinar si es amenaza real o falso positivo**

4. **Si es amenaza real:**
   - Aplicar containment (ban IP, bloquear cuenta si aplica)
   - Marcar como `investigating`
   - Evaluar si crear incidente

5. **Si es falso positivo:**
   - Marcar como `false_positive`
   - Documentar razón en notas

6. **Escalar si:**
   - Servicio de producción afectado
   - Datos de usuarios comprometidos
   - Múltiples vectores de ataque simultáneos

---

## SOP-003: Respuesta a Brute Force Detectado

**Trigger:** event_type = BRUTE_FORCE_DETECTED  
**SLA:** < 30 minutos  

```
1. Verificar si el auto-ban ya se aplicó:
   GET /api/logs?ip=<ip>&event_type=IP_BANNED

2. Si no fue baneado automáticamente, banear manualmente:
   POST /internal/ban {"ip": "<ip>", "reason": "Brute force attack"}

3. Verificar si hubo acceso exitoso desde esa IP:
   GET /api/logs?ip=<ip>&event_type=LOGIN_SUCCESS

4. Si hubo acceso exitoso:
   a. Identificar cuenta comprometida
   b. Bloquear cuenta: PATCH /api/users/<id>/lock
   c. Revocar sesiones: notificar al usuario
   d. Crear incidente: severity=high

5. Reportar IP como IOC si no está ya:
   POST /api/threats/report {type: IP, value: <ip>, severity: HIGH}

6. Resolver alerta: PATCH /api/alerts/<id>/status {"status": "resolved"}
```

---

## SOP-004: Respuesta a SQL Injection Detectado

**Trigger:** event_type = SQL_INJECTION_ATTEMPT  
**SLA:** < 15 minutos (es crítico por naturaleza)  

```
1. Ver payload y endpoint afectado en metadata de la alerta
2. Determinar si el ataque tuvo éxito (status_code = 200)

SI TUVO ÉXITO:
   a. CREAR INCIDENTE INMEDIATAMENTE (severity=critical)
   b. Escalar a Tier 2 / CISO
   c. Verificar qué datos se expusieron
   d. Aislar/parchear el endpoint si es posible

SI FUE BLOQUEADO:
   a. Banear IP
   b. Reportar IOC
   c. Verificar que el WAF/sanitización funciona
   d. Resolver alerta
```

---

## SOP-005: Respuesta a Honeypot Masivo

**Trigger:** > 100 eventos honeypot de misma IP en 1 hora  
**SLA:** < 1 hora  

```
1. Verificar eventos del honeypot:
   GET /api/honeypot/events?ip=<ip>&limit=100

2. Clasificar el tipo de actividad:
   - Solo SSH → Probable brute force / scanning
   - Solo HTTP → Scanning web / exploitation
   - Ambos → Reconocimiento agresivo

3. Banear IP y reportar IOC con source=honeypot

4. Si el patrón es sofisticado (prueba de exploits específicos):
   → Investigar si hay más IPs con mismo patrón
   → Posible campaña coordinada → Crear incidente
```

---

## SOP-006: Fin de Turno / Handoff

**Duración:** 10-15 minutos  
**Frecuencia:** Al final de cada turno  

### Checklist

```
□ 1. Resolver o documentar estado de todas las alertas críticas revisadas
□ 2. Actualizar estado de incidentes activos
□ 3. Preparar nota de handoff con:
   - Incidentes activos y estado actual
   - Amenazas activas identificadas
   - Acciones pendientes para el próximo turno
□ 4. Verificar que los playbooks están habilitados
□ 5. Confirmar que las métricas están en rango normal
```

---

## SOP-007: Análisis de Riesgo Diario

**Frecuencia:** Una vez al día (recomendado 08:00 o inicio del turno día)  
**Duración:** 20-30 minutos  

```
1. Ver Risk Score actual y tendencia:
   GET /api/ai/overview

2. Revisar recomendaciones de seguridad del AI:
   GET /api/ai/recommendations

3. Revisar nuevos IOCs de las últimas 24h:
   GET /api/threats/indicators?from=<24h_ago>

4. Revisar comportamiento anómalo de usuarios:
   GET /api/ai/user-behavior

5. Verificar vulnerabilidades críticas sin parchear:
   GET /api/vulnerabilities?severity=critical&status=open

6. Documentar observaciones en incidente o log de turno
```

---

## Escalado — Matriz de Decisión

| Situación | Escalado | A quién |
|---|---|---|
| Alerta crítica, contenida | No | — |
| Brute force exitoso (cuentas comprometidas) | Sí | Tier 2 SOC |
| SQLi exitoso | Sí | Tier 2 + CISO |
| Ransomware/Malware en endpoint | Sí | Tier 2 + CISO + CTO |
| Datos personales comprometidos | Sí | CISO + DPO + Legal |
| Servicio de producción caído > 30min | Sí | CTO + Management |
| Incident TLP=RED | Sí | CISO + equipo directo |

---

## Contactos de Emergencia

> **Nota:** Completar con información real de la organización.

| Rol | Nombre | Contacto |
|---|---|---|
| SOC Lead / Tier 2 | — | — |
| CISO | — | — |
| CTO | — | — |
| DPO | — | — |
| On-call Infra | — | — |

---

## Referencias Rápidas

| Recurso | URL |
|---|---|
| Dashboard SOC | `https://tudominio.com/dashboard` |
| API docs | `docs-es/api/` |
| Guía de alertas | [investigacion-alertas.md](investigacion-alertas.md) |
| Guía de incidentes | [investigacion-incidentes.md](investigacion-incidentes.md) |
| Threat Hunting | [threat-hunting.md](threat-hunting.md) |
| MITRE ATT&CK | `https://attack.mitre.org` |
| CVE Database | `https://nvd.nist.gov` |
