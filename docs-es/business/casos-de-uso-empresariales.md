# Casos de Uso Empresariales — RobenGate Sentinel

**Autor:** SOC Director + Enterprise SaaS Product Strategist  
**Versión:** 2.0.0  
**Fecha:** Junio 2026  
**Nota:** Los escenarios son representativos de patrones de ataque reales documentados en la industria.

---

## Introducción

Este documento presenta escenarios empresariales completos que ilustran cómo RobenGate Sentinel detecta, correlaciona, investiga y responde a amenazas reales en diferentes verticales de industria. Cada escenario incluye el flujo técnico completo dentro de la plataforma.

---

## CASO 1 — E-Commerce: Campaña de Credential Stuffing

### Contexto
**Empresa:** TechShop360 — E-commerce de electrónica, 85 empleados, €8M revenue, 150,000 cuentas de clientes  
**Fecha del ataque:** Martes, 02:30 UTC  
**Origen:** Lista de credenciales robadas de otra brecha (combo list)

### Narrativa del Ataque

El atacante compra una combo list con 500,000 pares email/password en un foro underground. Configura un script de credential stuffing y apunta a la API de autenticación de TechShop360.

### Timeline del Incidente

```
02:30:00 — El atacante inicia el ataque desde 12 IPs rotando
02:30:01 — Los primeros intentos de LOGIN_FAILURE son registrados
02:30:45 — Detection Engine: rule-brute-force-001 se activa en IP_01
02:31:00 — 847 intentos fallidos en 30 segundos (multi-IP)
02:31:02 — Detection Engine: rule-credential-spray-001 detecta patrón
           → 45 usuarios distintos, 847 intentos, 12 IPs
02:31:03 — Correlation Engine crea incidente CRÍTICO automáticamente:
           "Credential Stuffing Campaign — 12 IPs — 45 target accounts"
02:31:04 — SOAR evalúa playbook "Credential Stuffing Response"
02:31:05 — SOAR ejecuta:
           → ban_ip (12 IPs atacantes, 48h)
           → notify_webhook (alerta en Slack del equipo de seguridad)
           → create_incident (con todos los IOCs)
02:31:06 — SSE broadcast: dashboard SOC actualizado en tiempo real
02:31:10 — 3 cuentas comprometidas identificadas (login exitoso antes del ban)
02:45:00 — Analista SOC (despertado por alerta PagerDuty) revisa incidente
02:50:00 — Analista ejecuta: revoke_user_sessions (3 cuentas comprometidas)
02:52:00 — Analista envía email forzando reset de password a 3 usuarios
03:00:00 — Incidente contenido, atacante bloqueado
```

### Acciones de RobenGate Sentinel

| Fase | Acción | Tiempo | Módulo |
|---|---|---|---|
| Detección | 847 intentos detectados como patrón | T+45s | Detection Engine |
| Correlación | Incidente creado automáticamente | T+1min | Correlation Engine |
| Contención | 12 IPs baneadas automáticamente | T+1min | SOAR + autoban |
| Notificación | SOC alertado vía Slack + SSE | T+1min | SOAR webhook |
| Investigación | Cuentas comprometidas identificadas | T+14min | Analista + logs |
| Erradicación | Sesiones revocadas, passwords reset | T+20min | SOAR + admin |
| Documentación | Audit trail completo en MongoDB | Continuo | Audit Service |

### IOCs Generados y Añadidos a Threat Intelligence

- 12 IPs atacantes → Threat Intelligence (confidence: 95, severity: critical)
- Patrón de User-Agent del script → Threat Intelligence
- Rango ASN del proveedor VPN utilizado → watchlist

### Métricas del Incidente
- **MTTD:** 45 segundos (automático)
- **MTTR (contención):** 1 minuto (automático)
- **MTTR (completo):** 20 minutos (manual + automático)
- **Cuentas protegidas:** 147 de 150 (las 3 comprometidas fueron reseteadas)
- **Daño estimado evitado:** €45,000 en fraude potencial

---

## CASO 2 — E-Commerce: Compromiso de Cuenta Administrador

### Contexto
**Empresa:** TechShop360 (continuación del caso anterior)  
**Fecha:** 3 semanas después  
**Vector:** Phishing dirigido (spear phishing) al administrador de e-commerce

### Narrativa del Ataque

El atacante identifica al administrador de TechShop360 en LinkedIn. Envía un email de spear phishing con un PDF malicioso que incluye un link a una página de login falsa. El administrador introduce sus credenciales en la página falsa.

### Detección del Incidente

```
Día 1, 14:23 UTC — Admin credentials comprometidas (phishing)
Día 1, 14:25 UTC — Atacante hace login desde Frankfurt, Alemania
                    (IP: 88.150.x.x — ISP: DigitalOcean)

RISK ENGINE — Análisis:
  + Usuario: admin@techshop360.com (rol: admin → +10 pts)
  + Dispositivo: DESCONOCIDO (+20 pts)
  + IP: NUNCA VISTA (+15 pts)
  + País: Alemania (usuario historicamente desde Madrid) (+15 pts)
  + Hora: 14:25 UTC — dentro de horario laboral (0 pts)
  Total Risk Score: 60/100 → HIGH → Requiere MFA fuerte

Día 1, 14:25 UTC — Risk Engine solicita WebAuthn/FIDO2
Día 1, 14:25 UTC — Atacante NO tiene hardware key del admin
Día 1, 14:26 UTC — Atacante intenta Email OTP (fallback)
                   RobenGate: envía OTP al email del admin
                   Admin real: NO recibió solicitud de MFA esperada
                   → Admin sospecha y no responde el email
                   → Atacante no puede completar autenticación

Día 1, 14:30 UTC — 3 intentos MFA fallidos
Día 1, 14:31 UTC — Detection Engine: rule-mfa-failure-001
Día 1, 14:32 UTC — Correlation Engine: INCIDENT — "Admin MFA Failure — Frankfurt IP"
Día 1, 14:32 UTC — SOAR: ban_ip(88.150.x.x, 72h) + notify_webhook(crítico)
Día 1, 14:45 UTC — Admin reporta el phishing al equipo de seguridad
Día 1, 15:00 UTC — Contraseña del admin cambiada + revisión de audit logs
```

### Por Qué el Risk Engine fue Decisivo

Sin el Risk Engine adaptativo, el atacante con credenciales válidas hubiera iniciado sesión directamente. El Risk Engine detectó que la combinación de:
- Dispositivo desconocido
- IP nunca vista (cloud provider en Alemania)
- Rol de administrador (alto privilegio)

...justificaba exigir el segundo factor más fuerte disponible (WebAuthn), que el atacante no tenía.

**Resultado:** Compromiso de cuenta bloqueado por la autenticación multi-factor adaptativa.

---

## CASO 3 — E-Commerce: Inyección XSS en el Panel de Búsqueda

### Contexto
**Empresa:** TechShop360  
**Attacker Type:** Vulnerability researcher / hacker oportunista  
**Vector:** Cross-Site Scripting (XSS) reflected en endpoint de búsqueda

### Flujo de Detección

```
POST /api/search?q=<script>alert(document.cookie)</script>
                  ↓
Sanitize Middleware (backend):
  → DOMPurify-equivalent stripping
  → Parámetro sanitizado antes de llegar al controlador

Simultaneously:
attackDetection.js middleware detecta:
  → Patrón regex: /<script[^>]*>/i en input
  → Event type: XSS_ATTEMPT
  → INSERT security_log (severity: warning)

Detection Engine:
  → rule-xss-attempt-001 evaluado
  → ≥3 intentos XSS en 10 min desde misma IP → ALERT created

Resultado:
  → Ataque sanitizado (no ejecutado)
  → Evento registrado con evidencia completa
  → Alerta generada para el SOC
  → IP añadida a watchlist
```

### Valor Demostrado

- El ataque **no tuvo efecto** gracias a la sanitización defensiva
- El ataque **fue detectado y registrado** gracias al Detection Engine
- El **audit trail completo** permite análisis forense posterior
- Si el mismo IP intenta más ataques → ban automático vía SOAR

---

## CASO 4 — Servicios Financieros: Account Takeover (ATO)

### Contexto
**Empresa:** NovoPago — Plataforma de pagos fintech, 45 empleados, €2M ARR  
**Target:** Cuentas de usuarios con saldo alto (>€5,000)  
**Técnica:** Combinación de credential stuffing + SIM swapping

### Narrativa del Ataque

El atacante identifica cuentas de NovoPago con alto saldo utilizando una API no protegida de "check balance". Luego utiliza credenciales de una brecha anterior para intentar acceder.

### Detección y Respuesta

```mermaid
flowchart TD
    BalanceEnum[API /check-balance enumeration\n500 requests en 5 min] --> RateLimit[Rate Limiter\nBloquea IP tras 100 req/min]
    RateLimit --> LogEvent[security_log:\nAPI_ABUSE_DETECTED]
    LogEvent --> DetEngine[Detection Engine:\nrule-api-abuse-001]
    DetEngine --> Alert[ALERT: HIGH\nAPI Rate Abuse — Possible Enum]
    
    CredsAttempt[Login con credenciales\nde brecha previa] --> RiskScore[Risk Engine:\nScore 75/100 HIGH]
    RiskScore --> MFARequired[MFA Requerido:\nEmail OTP]
    MFARequired --> UserReal[Usuario real recibe OTP\nNo esperaba login → No introduce código]
    UserReal --> MFAFail[LOGIN_FAILURE\nMFA timeout]
    MFAFail --> CorrEngine[Correlation Engine:\nCombina API_ABUSE + AUTH_FAILURE\nmisma IP]
    CorrEngine --> Incident[INCIDENT CRÍTICO:\n"Account Takeover Attempt"]
    Incident --> SOAR[SOAR Playbook:\nban_ip + notify + add_ioc]
```

### Resultado

- 0 cuentas comprometidas
- API de enumeración bloqueada (rate limiting)
- IP baneada 72h automáticamente
- IOC añadido a Threat Intelligence (alta confianza)
- Auditoría completa disponible para regulador PSD2

---

## CASO 5 — Servicios Financieros: Indicadores de Fraude Interno

### Contexto
**Empresa:** NovoPago  
**Amenaza:** Insider threat — empleado con acceso excesivo intentando fraude  
**Vector:** Acceso a datos de clientes fuera de las responsabilidades del rol

### Detección de Anomalía Comportamental

```
Usuario: support@novopago.com (rol: analyst)
Comportamiento normal:
  - Accede a cuentas de clientes 20-30 veces/día
  - Solo durante horario laboral (09:00-18:00 UTC)
  - Desde IP de la oficina: 185.x.x.x

Día 15, comportamiento anómalo:
  - 22:30 UTC — login desde IP residencial: 88.x.x.x
  - Accede a 847 registros de clientes en 45 minutos
  - 95% de los accesos son a cuentas con saldo > €10,000
  - Patrón no visto en 6 meses de historial

AI Correlation Engine:
  → Baseline para user_id=42: 
    mean_accesses_per_hour = 4.2
    stddev = 1.8
    zscore(847/45min) = (18.8 - 4.2) / 1.8 = 8.1 — EXTREMO
  → Anomaly score: 97/100 — CRITICAL
  → Alerta: "Insider Threat Behavior Detected — Bulk Data Access"

Admin notificado. Audit trail completo de los 847 accesos disponible.
Account suspendida preventivamente vía SOAR (disable_account).
```

### Valor del AI Engine y Audit Log

- El AI Engine detectó una anomalía estadística imposible de detectar con reglas estáticas
- El audit log inmutable en MongoDB proporciona evidencia forense legal completa
- Toda acción del empleado está registrada con timestamp, IP, recurso accedido
- La evidencia es admisible en procedimientos disciplinarios y legales

---

## CASO 6 — Healthcare: Acceso No Autorizado a Datos de Pacientes

### Contexto
**Empresa:** MedData SaaS — Plataforma de gestión hospitalaria, 200+ hospitales como clientes  
**Regulación aplicable:** HIPAA (EE.UU.), GDPR (Europa), Ley de Protección de Datos de Salud  
**Incidente:** Acceso a registros de pacientes sin autorización

### Detección del Acceso No Autorizado

```
Sistema multi-tenant de MedData SaaS:
  - Hospital A: organization_id = 15
  - Hospital B: organization_id = 23

Empleado de Hospital A (user_id=442, org=15):
  - Intenta acceder a GET /api/patients?org=23
  
Tenant Middleware:
  → req.organizationId = 15 (del JWT del usuario)
  → Query: SELECT * FROM patients WHERE organization_id = 15
  → Ignora completamente el parámetro ?org=23
  → Aislamiento perfecto: NUNCA puede ver datos de otro tenant

Simultaneously:
  → attackDetection.js detecta intentos de manipulación de parámetros
  → IDOR_ATTEMPT registrado en security_logs
  → Si ≥3 intentos: ALERT generada + audit_log

Audit Trail para HIPAA compliance:
  → Cada acceso a registros de pacientes registrado
  → Actor, timestamp, IP, recurso, resultado
  → Inmutable en MongoDB — admisible como evidencia
  → TTL: 365 días mínimo (requisito HIPAA)
```

### Capacidades de Compliance Demostradas

| Requisito | Implementación en RobenGate |
|---|---|
| Audit log inmutable | MongoDB append-only, TTL 365 días |
| Control de acceso por rol | RBAC minRole() + tenant scoping |
| Detección de acceso no autorizado | Detection Engine + IDOR pattern detection |
| Notificación de breach | SOAR webhook + email a DPO |
| Evidence chain | Audit trail con hash de integridad (roadmap) |

---

## CASO 7 — SaaS B2B: API Abuse y Exfiltración de Datos

### Contexto
**Empresa:** DataSync Pro — Plataforma de integración SaaS, 60 empleados  
**Incidente:** Competidor utilizando credenciales de prueba para exfiltrar datos de la API  
**Técnica:** Slow drip exfiltration — muchas requests pequeñas para evadir rate limits

### Detección del Ataque

```
API key obtenida de cuenta free trial expirada:
  - api_key: sk-test-abc123... (no revocada automáticamente)
  - Rate limit: 100 requests/min (tier gratuito)
  - El atacante usa exactamente 99 req/min para evadir el límite

Comportamiento observado durante 3 días:
  - 99 req/min durante 8h diarias = 47,520 requests/día
  - 100% de requests a endpoints de datos: GET /api/customers/*, GET /api/contracts/*
  - Patrón: sequential IDs (1, 2, 3... 10000+) → enumeración sistemática

AI Correlation Engine:
  → Patrón de acceso secuencial detectado (ID enumeration)
  → Ratio unique_resources/total_requests: 99.8% (normal: < 30%)
  → Anomaly score: 88/100 → HIGH
  → Alerta: "API Enumeration / Data Exfiltration Pattern Detected"

SOAR Response:
  → revoke_api_key(api_key_id=5543)
  → add_ioc(IP del atacante)
  → create_incident("Data Exfiltration — API Key Abuse")
  → notify_webhook(CTO + Legal team)
```

### Lección Aprendida

Este caso ilustra por qué los API keys deben tener:
1. Expiración automática (implementado en RobenGate)
2. Revocación al cancelar suscripción (implementado)
3. Monitorización de patrones de acceso (AI Engine)
4. Rate limits diferenciados por tier (implementado)

---

## CASO 8 — SaaS Multi-Tenant: Reconocimiento de Infraestructura

### Contexto
**Empresa:** RobenGate Sentinel en producción (dogfooding)  
**Incidente:** Scanner automatizado realizando reconocimiento de la API  
**Herramienta del atacante:** Burp Suite + script de enumeración

### Detección a través del Honeypot

```
03:15:22 UTC — Honeypot HTTP detecta GET /admin, /wp-admin, /.env, /config.php
03:15:22 UTC — Honeypot SSH detecta intento de login con user: root, admin, ubuntu
03:15:24 UTC — IP: 94.102.49.x (origen: Países Bajos, Tor exit node)

Honeypot Service → Detection Engine:
  → HONEYPOT_HTTP_PROBE: /admin, /.env detectados
  → HONEYPOT_SSH_AUTH: root login attempt
  → rule-honeypot-scan-001: ≥3 honeypot hits / 5 min / misma IP

Threat Intelligence lookup:
  → IP 94.102.49.x encontrada en base de datos TOR exit nodes
  → Confidence: 98, Severity: critical, Tags: tor-exit-node, scanner

SOAR Playbook "Tor Exit Node Activity":
  → ban_ip(permanent)
  → add_ioc(ip, confidence=98)
  → create_incident("Automated Scanner — Tor Exit Node")
  → notify_webhook(SOC)

API Gateway (para las requests que llegaron al backend):
  → attackDetection.js detecta path traversal patterns
  → /.env blocked con 403 antes de llegar al controlador
  → Ningún dato sensible expuesto
```

### Multi-vector Correlation

Este escenario demostró la correlación multi-vector única de RobenGate:
- Honeypot SSH + Honeypot HTTP + Threat Intel → INCIDENT automático
- Sin la correlación, habrían sido 3 alertas separadas sin contexto unificado

---

## Resumen de Casos de Uso

| Caso | Industria | Técnica | MTTD | MTTR | Automatización |
|---|---|---|---|---|---|
| Credential Stuffing | E-Commerce | T1110.003 | 45s | 1min (auto) | SOAR ban_ip |
| Admin Account Takeover | E-Commerce | T1078 | 45s | 0 (bloqueado en MFA) | Risk Engine |
| XSS Attempt | E-Commerce | T1059.007 | 30s | 0 (sanitizado) | Input sanitization |
| API ATO | Fintech | T1110 | 2min | 3min (auto) | SOAR ban + ioc |
| Insider Threat | Fintech | T1078.001 | 5min | 10min | Disable account |
| HIPAA Data Access | Healthcare | T1530 | 10s | 0 (bloqueado) | Tenant isolation |
| API Data Exfiltration | SaaS | T1213 | 8h | 5min | SOAR revoke key |
| Recon + Honeypot | Multi-tenant | T1046 | 2s | 30s (auto) | SOAR + IOC |

---

*Documento generado por: SOC Director + Enterprise SaaS Product Strategist*  
*RobenGate Sentinel v2.0.0 — Junio 2026*
