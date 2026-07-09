# Flujo del Honeypot — RobenGate Sentinel

**Módulo:** `honeypot/`  
**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Descripción General

El honeypot de RobenGate Sentinel es una trampa de dos vectores que captura y analiza ataques reales:

| Servicio | Puerto | Protocolo | Propósito |
|---|---|---|---|
| SSH Honeypot | 2222 | TCP/SSH | Capturar credential stuffing, brute force |
| HTTP Honeypot | 8080 | HTTP | Capturar web scanners, bots, exploits |

---

## Arquitectura del Honeypot

```mermaid
flowchart TB
    subgraph Internet
        ATK1[Atacante\nSSH Brute Force]
        ATK2[Web Scanner\nBot/Exploit]
    end

    subgraph Honeypot Container ["Contenedor Honeypot"]
        SSH[SSH Server\npuerto 2222\nssh2 module]
        HTTP[HTTP Server\npuerto 8080\nExpress]
        CAPTURE[Capture Module\ncapture-module.js]
        API_INT[API Integration\napi-integration.js]
    end

    subgraph Backend
        HP_ROUTE[POST /api/honeypot/events\nX-Internal-Secret]
        HP_SVC[honeypotService.js]
        DETECT[Detection Engine]
        AUDIT[Audit Service]
    end

    subgraph Storage
        MG[(MongoDB\nhoneypot_events)]
        PG[(PostgreSQL\nsecurity_logs)]
    end

    ATK1 -->|SSH:2222| SSH
    ATK2 -->|HTTP:8080| HTTP
    SSH --> CAPTURE
    HTTP --> CAPTURE
    CAPTURE --> API_INT
    API_INT -->|HTTP POST\n+ Internal Secret| HP_ROUTE
    HP_ROUTE --> HP_SVC
    HP_SVC --> DETECT
    HP_SVC --> AUDIT
    DETECT --> MG
    AUDIT --> PG
```

---

## Flujo SSH Honeypot

```mermaid
sequenceDiagram
    participant Attacker as Atacante
    participant SSH as SSH Honeypot :2222
    participant Capture as Capture Module
    participant Backend as Backend API
    participant DB as MongoDB

    Attacker->>SSH: Conexión TCP :2222
    SSH->>SSH: Aceptar conexión (simular servidor real)
    
    Attacker->>SSH: SSH Handshake
    SSH->>Capture: Registrar: IP, puerto, timestamp, fingerprint
    
    Attacker->>SSH: AUTH: usuario/contraseña
    SSH->>SSH: Siempre rechazar (pero capturar credenciales)
    SSH->>Capture: Capturar: username, password intentado

    Note over SSH: Simular delay realista para\naumentar tiempo del atacante

    Attacker->>SSH: Reintentar con otras credenciales
    SSH->>Capture: Capturar nueva combinación
    
    Note over Capture: Acumular todos los intentos

    Capture->>Backend: POST /api/honeypot/events\n{type: 'ssh', ip, credentials[], timestamps}
    Backend->>DB: Guardar evento honeypot
    Backend->>Backend: Trigger Detection Engine
    Backend-->>Capture: 200 OK
    
    Note over Attacker,SSH: Atacante se cansa o es baneado\nHoneypot sigue funcionando
```

---

## Flujo HTTP Honeypot

```mermaid
sequenceDiagram
    participant Bot as Bot/Scanner
    participant HTTP as HTTP Honeypot :8080
    participant Capture as Capture Module
    participant Backend as Backend API

    Bot->>HTTP: GET /.env (secret file probe)
    HTTP->>Capture: Capturar: IP, path, user-agent, headers
    HTTP-->>Bot: 200 OK (respuesta falsa)

    Bot->>HTTP: POST /admin/login {root:root}
    HTTP->>Capture: Capturar: credentials, método, payload
    HTTP-->>Bot: 200 OK {token: "fake"}
    
    Bot->>HTTP: GET /wp-admin (WordPress probe)
    HTTP->>Capture: Capturar: WordPress scanner
    HTTP-->>Bot: 200 OK (HTML WordPress fake)
    
    Bot->>HTTP: POST /api/eval {code: "require('child_process')"} 
    HTTP->>Capture: 🚨 Capturar: Code injection attempt
    HTTP-->>Bot: 200 OK (respuesta vacía)
    
    Capture->>Backend: POST /api/honeypot/events\n{type: 'http', events: [...]}
    Backend->>Backend: Analyze: known_scanner | credential_theft | exploit_attempt
    Backend->>Backend: Auto-ban IP si criticidad alta
```

---

## Datos Capturados

### Evento SSH Capturado

```json
{
  "type": "ssh",
  "ip": "185.220.101.45",
  "port": 2222,
  "timestamp": "2026-06-15T03:22:11Z",
  "credentials": [
    { "username": "root", "password": "root", "attempt": 1 },
    { "username": "root", "password": "123456", "attempt": 2 },
    { "username": "admin", "password": "admin", "attempt": 3 },
    { "username": "ubuntu", "password": "ubuntu", "attempt": 4 }
  ],
  "connectionDuration": 45,
  "clientVersion": "OpenSSH_8.1",
  "geoLocation": {
    "country": "RU",
    "city": "Moscow",
    "lat": 55.7558,
    "lon": 37.6173
  },
  "asn": {
    "number": 12345,
    "name": "Some-Hosting-AS",
    "type": "datacenter"
  }
}
```

### Evento HTTP Capturado

```json
{
  "type": "http",
  "ip": "45.33.32.156",
  "timestamp": "2026-06-15T03:25:00Z",
  "requests": [
    {
      "method": "GET",
      "path": "/.env",
      "userAgent": "Masscan/1.3",
      "category": "secret_file_probe"
    },
    {
      "method": "POST",
      "path": "/admin",
      "body": { "username": "admin", "password": "password123" },
      "category": "credential_stuffing"
    }
  ],
  "classification": "automated_scanner",
  "severity": "medium"
}
```

---

## Clasificación de Ataques

| Categoría | Descripción | Severidad | Acción Automática |
|---|---|---|---|
| `brute_force_ssh` | >10 intentos credenciales SSH | HIGH | Auto-ban 24h |
| `credential_stuffing` | Lista de credenciales conocidas | HIGH | Auto-ban 1h |
| `secret_file_probe` | GET /.env, /.git, etc. | MEDIUM | Log + alerta |
| `automated_scanner` | Patrones de scanner conocido | LOW | Log |
| `exploit_attempt` | Injection, RCE, SSRF | CRITICAL | Auto-ban permanente |
| `wordpress_scanner` | Probes de WordPress | LOW | Log |
| `vulnerability_scan` | Nikto, OpenVAS patterns | MEDIUM | Log + alerta |

---

## Configuración

### Variables de Entorno (`honeypot/.env`)

```bash
# Puerto de escucha SSH
SSH_PORT=2222

# Puerto de escucha HTTP  
HTTP_PORT=8080

# Backend API para enviar eventos
BACKEND_URL=http://backend:5000

# Secreto compartido con backend (CRÍTICO: no exponer)
INTERNAL_API_SECRET=secreto-interno-muy-seguro

# Delay máximo de simulación SSH (ms)
SSH_DELAY_MAX=3000

# Máximo de credenciales a capturar por sesión
MAX_CREDENTIALS_PER_SESSION=50
```

### Despliegue

```yaml
# docker-compose.yml (fragmento)
honeypot:
  build:
    context: ./honeypot
    dockerfile: Dockerfile
  ports:
    - "2222:2222"   # SSH honeypot (EXPUESTO al exterior)
    - "8080:8080"   # HTTP honeypot (EXPUESTO al exterior)
  environment:
    - BACKEND_URL=http://backend:5000
    - INTERNAL_API_SECRET=${INTERNAL_API_SECRET}
  networks:
    - sentinel_network
    - public_network  # Red separada para aislar el honeypot
```

**Nota de Seguridad:** El honeypot está en una red Docker separada (`public_network`) del resto de servicios. La comunicación hacia el backend usa la red interna (`sentinel_network`) con el `INTERNAL_API_SECRET` para autenticación.

---

## Análisis de Threat Intelligence desde Honeypot

Los datos capturados por el honeypot alimentan automáticamente la base de datos de **Threat Intelligence**:

```mermaid
flowchart LR
    HONEYPOT[Honeypot\nEventos] --> EXTRACT[Extraer IOCs\nIPs + Usuarios + Firmas]
    EXTRACT --> TI_DB[(MongoDB\nthreat_indicators)]
    TI_DB --> RISK_ENGINE[Risk Engine\nBlackListcheck]
    TI_DB --> DETECTION[Detection Engine\nIOC matching]
    TI_DB --> MAP[Attack Map\nVisualización geo]
```
