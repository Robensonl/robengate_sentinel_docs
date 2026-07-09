# Demo de 15 Minutos — RobenGate Sentinel

**Guion completo para demo estándar — ventas y evaluación técnica**  
**Audiencia:** Equipos técnicos + decision makers mezclados  
**Objetivo:** Mostrar las 5 capacidades clave, generar confianza, abrir el piloto  

---

## Estructura del Tiempo

| Segmento | Duración | Qué muestra |
|---|---|---|
| Intro + contexto | 1 min | El problema que resuelve |
| Auth + seguridad básica | 2 min | Confianza técnica |
| Dashboard + tiempo real | 2 min | Visibilidad operacional |
| Alerta → Respuesta → Resolución | 3 min | El flujo de trabajo SOC |
| Honeypot | 2 min | El wow factor |
| SOAR — respuesta automática | 2 min | El diferenciador |
| Cierre + siguiente paso | 1 min | Call to action |

---

## Minuto 0:00 — Inicio

*"Voy a mostraros RobenGate Sentinel en acción. En 15 minutos veremos el flujo completo: desde detectar un ataque hasta resolverlo. Todo lo que voy a mostrar es código real ejecutándose."*

---

## Minuto 0:00-1:00 — Contexto

*"Este es el escenario: tenemos una plataforma web en producción. En este momento hay atacantes probando nuestros endpoints. Esto no es hipotético — con RobenGate activo, podemos ver exactamente qué está pasando."*

---

## Minuto 1:00-3:00 — Autenticación

1. Abrir la página de login
2. *"La autenticación usa JWT con tokens de 15 minutos y refresh tokens rotativos de 7 días."*
3. Login con usuario/contraseña → se muestra la pantalla TOTP
4. *"Segundo factor. Pero también tenemos WebAuthn..."*
5. Mostrar la opción de WebAuthn/passkey
6. *"Sin contraseñas. Solo biometría o hardware key. El estándar FIDO2 más moderno."*
7. Completar el login
8. *"El sistema ha logueado este acceso: IP, país, dispositivo, fingerprint. Auditable e inmutable."*

---

## Minuto 3:00-5:00 — Dashboard

1. Pantalla del dashboard
2. *"El Risk Score ahora es [X]. Calculado en tiempo real por el motor heurístico."*
3. Señalar el **Attack Map**: *"Cada punto en el mapa es un evento de seguridad en los últimos minutos. Geolocalizados."*
4. *"El mapa se actualiza via Server-Sent Events — conexión persistente. No hay polling."*
5. Señalar las estadísticas: eventos hoy, alertas críticas, IPs baneadas, incidentes abiertos
6. *"Esta pantalla es lo que ve el equipo SOC al empezar su turno."*

---

## Minuto 5:00-8:00 — Flujo Completo: Alerta → Respuesta

### Escenario: Brute Force en curso

1. Navegar a **Alerts** y filtrar: `severity=critical, status=new`
2. *"Aquí hay una alerta: BRUTE_FORCE_DETECTED. IP 185.220.101.44 intentó 847 veces en 8 minutos."*
3. Abrir la alerta para ver el detalle
4. *"Metadata completa: user-agent, endpoints objetivo, distribución temporal."*
5. Hacer clic en "Investigate IP":
   ```bash
   # Lo que el sistema hace internamente
   GET /api/search/ioc/185.220.101.44
   ```
6. *"La IP está en la base de IOCs. Confidence 92. Es un nodo Tor conocido. Esto confirma que es una amenaza real."*
7. Cambiar estado: `investigating`
8. Banear la IP: *"Con este botón, la IP se bloquea inmediatamente. El sistema crea el registro en `banned_ips` y reporta el IOC automáticamente."*
9. Marcar como `resolved`
10. *"Tiempo total de respuesta: 2 minutos. En el mundo real, esto podría ocurrir automáticamente con un playbook SOAR."*

---

## Minuto 8:00-10:00 — Honeypot

1. Navegar a **Honeypot**
2. *"El honeypot ha estado corriendo en paralelo. Este es su registro de actividad."*
3. Señalar los eventos más recientes
4. *"Puerto 2222 — SSH. Puerto 8080 — HTTP. Cualquier conexión a estos puertos es sospechosa por definición."*
5. Mostrar un evento de HTTP: *"Mirad el path que probaron: /.env. Están buscando archivos de configuración con credenciales. Una técnica clásica."*
6. *"Todos estos atacantes están ahora en nuestra base de IOCs. Y no llegaron a tocar ningún sistema real."*

---

## Minuto 10:00-12:00 — SOAR en Acción

1. Navegar a **Settings → Playbooks**
2. Abrir el playbook `SQL Injection Auto-Response`
3. *"Este playbook se activa automáticamente cuando se detecta un SQL_INJECTION_ATTEMPT."*
4. Mostrar las acciones: Ban IP → Crear alerta → Notificar Slack → Escalar si éxito
5. *"Sin intervención humana. En segundos."*
6. Mostrar la pestaña **Playbook Executions**
7. *"Aquí está el historial. Cada ejecución tiene: trigger, acciones ejecutadas, timestamps, resultado."*
8. *"MTTC — Mean Time to Contain — reducido de horas a segundos."*

---

## Minuto 12:00-13:30 — Threat Intelligence

1. Navegar a **Threat Intelligence**
2. Mostrar la lista de IOCs
3. *"8 tipos de IOC: IP, dominio, hash MD5, hash SHA256, URL, email, CVE, user-agent. Cada uno con confidence score, severidad, táctica MITRE ATT&CK."*
4. Añadir rápidamente un IOC de prueba
5. *"El sistema empieza a cruzar este IOC contra todos los logs en tiempo real inmediatamente."*

---

## Minuto 13:30-15:00 — Cierre

*"Hemos visto en 15 minutos:"*
- *"Auth enterprise — WebAuthn, TOTP, JWT rotativo"*
- *"Dashboard en tiempo real — Risk Score, Attack Map, SSE"*
- *"Flujo completo de alerta — de nueva a resuelta con evidencia"*
- *"Honeypot — atacantes capturados antes de llegar a sistemas reales"*
- *"SOAR — respuesta automática sin intervención humana"*

*"Todo esto open-source. Desplegado en 1 hora con Docker. Kubernetes-ready para producción."*

*"El siguiente paso que propongo: un piloto de 30 días en vuestra infraestructura. ¿Tenéis 2 horas la semana que viene para hacer la instalación guiada?"*

---

## Notas para el Presentador

### Si la Demo Falla

- Tener capturas de pantalla preparadas en un PDF como fallback
- El `/health` endpoint debería mostrar el estado del sistema
- El `attackSimulator.js` puede reiniciarse si los datos del attack map se detienen

### Qué No Mostrar en Demo Ejecutiva

- El schema SQL o los modelos de datos
- Los errores de consola del navegador (tener DevTools cerrado)
- Los endpoints de `/internal/` (solo para integración)
- Las opciones de configuración avanzada (abrumar con opciones)

### Qué Mostrar Si Hay Tiempo Extra

- El módulo de **Audit Logs** para compliance
- El **AI Analysis** con el Risk Score por usuario
- Las **Vulnerabilidades** con los CVEs precargados
- La **API Reference** (para audiencias técnicas)
