# Demo Técnica — RobenGate Sentinel

**Guion completo para una demo técnica de 15-20 minutos**  
**Audiencia:** Desarrolladores, Ingenieros de Seguridad, Arquitectos  
**Formato:** Pantalla compartida + narración  

---

## Preparación (antes de la demo)

### Requisitos

- Plataforma ejecutándose en local o cloud (ver [docker-up.ps1](../../docker-up.ps1))
- Usuario admin creado con datos de demo
- `attackSimulator.js` generando datos en el attack map (modo demo)
- Honeypot activo en puertos 2222 y 8080

### Verificar Estado

```powershell
# Iniciar la plataforma completa
.\docker-up.ps1

# Verificar que todo está arriba
curl http://localhost:3000/health
# Expected: {"status": "ok", "database": "connected", "redis": "connected"}
```

---

## Segmento 1: Autenticación Enterprise (2-3 minutos)

### Narración

*"Empezamos por donde empieza todo: la autenticación. Esta no es tu autenticación de formulario básico."*

### Demo

1. Abrir `http://localhost:5173/login`
2. Hacer login con usuario/contraseña
3. *"El sistema genera un JWT de corta duración — 15 minutos — más un refresh token de 7 días con rotación automática. Esto es OAuth2-compatible."*
4. Mostrar el TOTP opcional
5. *"Pero lo más interesante es esto..."* — Mostrar la pantalla de WebAuthn
6. *"WebAuthn/FIDO2 — autenticación sin contraseña usando biometría o llaves de seguridad hardware. El secreto nunca sale del dispositivo."*

### Punto técnico clave

> "bcrypt con factor 12, tokens JWT HS256, rate limiting por IP — el stack de seguridad de auth está al nivel de empresas como GitHub o GitLab."

---

## Segmento 2: Dashboard en Tiempo Real (2-3 minutos)

### Narración

*"Este es el dashboard SOC — la vista de mando."*

### Demo

1. Navegar al Dashboard
2. Señalar el **Risk Score** global: *"Este número — el Risk Score — es calculado por nuestro motor heurístico analizando docenas de señales: alertas activas, IPs baneadas, intentos de intrusión recientes, comportamiento de usuarios."*
3. Señalar las **estadísticas en tiempo real**: *"Este dashboard se actualiza via Server-Sent Events — conexión persistente al servidor. No polling. Sin websockets complejos. Solo una conexión HTTP unidireccional eficiente."*
4. Señalar el **Attack Map**: *"El mapa de ataques muestra eventos de seguridad geolocalizados en tiempo real. En modo demo, el `attackSimulator.js` genera eventos realistas para la presentación."*

### Punto técnico clave

> "SSE (Server-Sent Events) sobre HTTPS. Reconexión automática. Compatible con cualquier proxy HTTP/2. Sin librerías de WebSocket adicionales."

---

## Segmento 3: Sistema de Alertas y RBAC (2-3 minutos)

### Narración

*"El sistema de alertas es el corazón de la plataforma."*

### Demo

1. Navegar a **Alerts**
2. Mostrar alertas de diferentes severidades
3. *"Tenemos 6 severidades: INFO, LOW, MEDIUM, HIGH, CRITICAL, EMERGENCY. Cada alerta tiene: tipo de evento, IP origen con país, timestamp, metadata del ataque."*
4. Abrir una alerta de `BRUTE_FORCE_DETECTED` para ver el detalle
5. Cambiar el estado de una alerta: *"Los analistas actualizan el estado del ciclo de vida: new → acknowledged → investigating → resolved o false_positive."*

**Mostrar RBAC en acción:**
6. *"Ahora voy a loguearme como un usuario viewer..."*
7. Login como viewer
8. *"¿Ves? El botón de 'Banear IP' no aparece. El RBAC se aplica tanto en backend (middleware `minRole()`) como en frontend (`PermissionGate` component). Ningún endpoint retorna datos a usuarios sin el rol mínimo requerido."*

---

## Segmento 4: Threat Intelligence (2-3 minutos)

### Narración

*"La inteligencia de amenazas es lo que transforma logs en conocimiento de seguridad."*

### Demo

1. Navegar a **Threat Intelligence**
2. Mostrar la lista de IOCs: *"Cada IOC tiene: tipo (IP, dominio, hash MD5/SHA256, URL, email, CVE, user agent), confidence score 0-100, severidad, táctica y técnica MITRE ATT&CK, país y ASN de origen."*
3. Añadir un nuevo IOC manualmente: *"El motor de correlación cruza automáticamente todos los eventos de seguridad con estos IOCs. Si una IP en la blacklist aparece en los logs, se genera una alerta automáticamente."*
4. Mostrar **IP Lookup**: `GET /api/search/ioc/185.220.101.44`

### Punto técnico clave

> "MongoDB para el store de IOCs: índices compuestos en {value, type} unique, {severity, lastSeen} para queries analíticas. TTL de 365 días. Inmutable — no se borran, solo se desactivan."

---

## Segmento 5: Honeypot en Acción (2-3 minutos)

### Narración

*"El honeypot es mi módulo favorito para demos técnicas."*

### Demo

1. Navegar a **Honeypot Dashboard**
2. Mostrar eventos recientes del honeypot
3. *"Tenemos dos sensores: SSH en puerto 2222 y HTTP en puerto 8080. Son señuelos — cualquier conexión a esos puertos es sospechosa por definición, porque no son servicios legítimos."*
4. Si hay actividad en tiempo real, mostrar la tabla llenándose
5. *"Cuando el honeypot detecta actividad agresiva, automáticamente banea la IP y crea un IOC en Threat Intelligence. El atacante se queda mapeado antes de tocar los sistemas reales."*

**Demo en vivo (opcional):**
```powershell
# Desde otra terminal — simular una conexión al honeypot SSH
ssh -p 2222 admin@localhost  # Intentar conexión → aparece en el dashboard
```

---

## Segmento 6: SOAR y Respuesta Automatizada (2-3 minutos)

### Narración

*"SOAR — Security Orchestration, Automation and Response. La diferencia entre un equipo de 2 y un equipo de 20."*

### Demo

1. Navegar a **Settings → Playbooks**
2. Mostrar los playbooks disponibles
3. *"Un playbook define: qué trigger lo activa, qué acciones ejecuta, en qué orden, con qué delay entre acciones."*
4. Abrir playbook de ejemplo: `SQL Injection Response`
5. *"Cuando se detecta un SQL_INJECTION_ATTEMPT: ban IP → crear alerta → notificar Slack → si tuvo éxito, escalar como incidente. Todo en segundos, sin intervención humana."*
6. Mostrar las **ejecuciones** recientes de playbooks

### En la base de datos

```sql
-- Así se ve en la DB
SELECT * FROM playbook_executions ORDER BY started_at DESC LIMIT 5;
-- playbook_name, status (pending/running/completed/failed), trigger_event_id, started_at, completed_at
```

---

## Segmento 7: API y Arquitectura (2-3 minutos)

### Narración

*"Para los arquitectos: hablemos de cómo está construido."*

### Mostrar la API

```bash
# El sistema tiene 91+ endpoints documentados
# Demo: stats del sistema
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/stats

# Multi-tenancy en acción
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/logs?limit=5

# El mismo endpoint con org diferente devuelve datos de otro tenant
```

### Mostrar la Arquitectura

```
React 19 + Vite 5          Node.js 20 + Express 4
    Frontend          ←→       Backend API
    Zustand 5               JWT + Redis Sessions
    Tailwind CSS 4               ↓
                          PostgreSQL 16 (17 tablas)
                          MongoDB 7 (logs inmutables)
                          Redis 7 (cache + sessions)
                               ↓
                    Docker + Kubernetes + Helm
                    Prometheus + Grafana
```

---

## Cierre (1 minuto)

*"En resumen: SIEM + SOC + Honeypot + SOAR + Threat Intelligence + AI Analysis. Stack moderno, cloud-native, open-source, sin vendor lock-in. Desplegable en 1 hora. Escalable a enterprise."*

*"¿Qué preguntas tienen?"*

---

## Preguntas Técnicas Frecuentes y Respuestas

**¿Cómo escala bajo carga?**
> PostgreSQL con connection pooling, Redis para caching de sesiones, Nginx como reverse proxy con rate limiting. En Kubernetes con HPA para auto-scaling del backend.

**¿Cómo se integra con sistemas existentes?**
> API REST completa (91+ endpoints). Syslog receiver para integración con dispositivos de red. Windows Event Collector. Webhook inbound. CEF/JSON/syslog/Windows Event Log como formatos de entrada.

**¿Qué pasa si el atacante ataca el propio Sentinel?**
> Rate limiting en todas las rutas públicas. JWT de corta duración. Audit trail inmutable en MongoDB que no puede ser borrado via API. WAF-ready (Nginx + headers de seguridad). OWASP SAMM Level 4.

**¿El AI Analysis usa modelos de ML externos?**
> No. Es un motor heurístico interno — sin dependencias de APIs externas, sin datos que salen de tu infraestructura. Las recomendaciones actuales son datos de demo; el motor heurístico de riesgo es real y funcional.
