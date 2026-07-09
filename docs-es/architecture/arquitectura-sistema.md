# Arquitectura del Sistema — RobenGate Sentinel

> **Clasificación:** INTERNO | **Versión:** 1.0.0

---

## Resumen Ejecutivo

RobenGate Sentinel está diseñado como una **plataforma SOC empresarial** que combina la cohesión de un monolito con la capacidad de despliegue independiente de los microservicios. La arquitectura implementa tres principios fundamentales de seguridad empresarial: **Confianza Cero** (Zero-Trust), **Defensa en Profundidad** (Defense-in-Depth) y **Arquitectura Orientada a Eventos**, garantizando que ningún fallo aislado comprometa la seguridad global de la plataforma.

---

## 1. Filosofía de Arquitectura

RobenGate Sentinel está diseñado como un **monolito adyacente a microservicios** — una plataforma cohesionada cuyos componentes son desplegables de forma independiente, se comunican mediante APIs internas bien definidas y pueden escalar horizontalmente en cada nivel. El diseño sigue:

- **Seguridad de Confianza Cero** — Cada solicitud es autenticada y autorizada independientemente del origen
- **Defensa en Profundidad** — Múltiples capas de seguridad superpuestas previenen fallos de punto único
- **Núcleo Orientado a Eventos** — Los eventos de seguridad fluyen a través de un pipeline centralizado para correlación
- **Degradación Elegante** — Los fallos de componentes individuales (Redis, MongoDB) no colapsan la plataforma

---

## 2. Topología del Sistema

```mermaid
flowchart TB
    classDef actor    fill:#1A0A2E,stroke:#7B68EE,stroke-width:2px,color:#E2E8F0
    classDef edge     fill:#0A1929,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef frontend fill:#0F2A1A,stroke:#4CAF50,stroke-width:2px,color:#E2E8F0
    classDef backend  fill:#1A2A4A,stroke:#00B4D8,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef data     fill:#0F2A2E,stroke:#26C6DA,stroke-width:2px,color:#E2E8F0
    classDef honeypot fill:#2E1A08,stroke:#FF9800,stroke-width:2px,color:#FFE0B2
    classDef external fill:#1A1A1A,stroke:#607D8B,stroke-width:1px,color:#B0BEC5

    USER(["👤 Analista SOC\nAdmin / Viewer"]):::actor
    ATK(["🔴 Actor de Amenaza\nExterno"]):::actor

    subgraph EDGE["🔀 Capa de Borde — Nginx"]
        NGINX["Nginx Reverse Proxy\n✦ Terminación TLS/443\n✦ Rate Limiting\n✦ WAF Headers"]:::edge
    end

    subgraph PRES["🖥️ Capa de Presentación"]
        REACT["React + Vite SPA\nPuerto 5173/80\nJWT · RBAC · SSE"]:::frontend
    end

    subgraph API["⚙️ Capa API — Express.js :5000"]
        BE["Backend Node.js\n✦ REST + SSE\n✦ Risk Engine\n✦ Correlation Engine\n✦ RBAC Middleware"]:::backend
    end

    subgraph DECEPTION["🍯 Capa de Engaño"]
        SSH["Honeypot SSH\nPuerto 2222\nCaptura Credenciales"]:::honeypot
        HTTP["Honeypot HTTP\nPuerto 8080\nPaneles Falsos"]:::honeypot
    end

    subgraph DATA["🗄️ Capa de Datos — Políglota"]
        PG[("PostgreSQL :5432\nUsuarios · Sesiones\nLogs · Alertas")]:::data
        MG[("MongoDB :27017\nEventos SIEM\nAudit · IOCs")]:::data
        RD[("Redis :6379\nSesiones · OTP\nBan List · Rate")]:::data
    end

    subgraph EXT["☁️ Servicios Externos"]
        SMTP["📧 SMTP Email\nCódigos MFA / OTP"]:::external
        GEO["🌍 GeoIP MaxMind\nGeolocalización Offline"]:::external
    end

    USER -- "HTTPS 443" --> NGINX
    ATK -- "Ataque :443" --> NGINX
    ATK -- "Sondeo SSH" --> SSH
    ATK -- "Escaneo HTTP" --> HTTP

    NGINX -- "Proxy /" --> REACT
    NGINX -- "Proxy /api" --> BE

    REACT -- "REST API + JWT" --> BE
    REACT <-- "SSE Tiempo Real" --> BE

    SSH -- "X-Internal-Secret" --> BE
    HTTP -- "X-Internal-Secret" --> BE

    BE <-- "Queries ORM" --> PG
    BE <-- "Eventos/Docs" --> MG
    BE <-- "Cache/Tokens" --> RD
    BE -- "Envío OTP" --> SMTP
    BE -- "Lookup Geo" --> GEO
```

---

## Descripción Técnica

### 3. Topología de Servicios

| Servicio | Puerto | Protocolo | Descripción |
|----------|--------|-----------|-------------|
| **Nginx** | 80/443 | HTTP/HTTPS | Terminación TLS, proxy inverso, archivos estáticos |
| **Frontend** | 5173 (dev) / 80 (prod) | HTTP | SPA React servida por Nginx |
| **API Backend** | 5000 | HTTP + SSE | API REST Express.js y flujo de eventos en tiempo real |
| **PostgreSQL** | 5432 | TCP | Base de datos relacional principal |
| **MongoDB** | 27017 | TCP | Almacén de documentos para eventos e inteligencia de amenazas |
| **Redis** | 6379 | TCP | Lista negra de tokens, caché OTP, limitación de tasa |
| **Honeypot SSH** | 2222 | SSH | Servidor SSH falso para capturar ataques de rociado de credenciales |
| **Honeypot HTTP** | 8080 | HTTP | Paneles de administración falsos para capturar escaneos y exploits |

---

## Flujo Operacional

### 4. Arquitectura de Flujo de Solicitudes

#### 4.1 Flujo de Solicitud API Autenticada

```mermaid
sequenceDiagram
    participant C as Cliente React
    participant N as Nginx
    participant MW as Pila de Middleware
    participant API as Manejador de Ruta
    participant DB as PostgreSQL/MongoDB
    participant R as Redis

    C->>N: Solicitud HTTPS + JWT Bearer
    N->>MW: Reenviar al Backend
    MW->>MW: 1. Cabeceras Helmet
    MW->>MW: 2. Validación CORS
    MW->>MW: 3. Análisis de cuerpo + sanitización
    MW->>MW: 4. Verificación de auto-prohibición (PostgreSQL banned_ips)
    MW->>MW: 5. Limitador de tasa (contador Redis)
    MW->>MW: 6. Detección de ataques (XSS/SQLi)
    MW->>R: 7. Verificación de lista negra JWT
    R-->>MW: No está en lista negra
    MW->>MW: 8. Verificación JWT + adjuntar req.user
    MW->>MW: 9. Verificación RBAC minRole()
    MW->>API: Solicitud aprobada
    API->>DB: Consulta a base de datos
    DB-->>API: Resultado
    API-->>C: Respuesta JSON
```

#### 4.2 Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as Cliente
    participant B as Backend
    participant RE as Motor de Riesgo
    participant MFA as Servicio MFA
    participant PG as PostgreSQL
    participant R as Redis

    C->>B: POST /auth/login {email, password, deviceFingerprint}
    B->>PG: Buscar usuario por email
    PG-->>B: Registro de usuario
    B->>B: bcrypt.compare(password, hash)
    B->>RE: calcularRiesgo(userId, ip, device, ...)
    RE->>PG: Consultar fallos recientes, sesiones, geo
    RE-->>B: { score: 45, level: 'MEDIO' }

    alt Riesgo ALTO o MFA habilitado
        B->>MFA: generarOtp(userId)
        MFA->>R: Almacenar HMAC(otp) con TTL 5min
        B-->>C: { mfaPending: true, mfaToken }
        C->>B: POST /auth/verify-otp {otp, mfaToken}
        B->>R: Verificar HMAC(otp) + eliminar
        B-->>C: { accessToken, refreshToken cookie }
    else Riesgo BAJO
        B->>PG: Crear registro de sesión
        B->>R: Almacenar token de sesión
        B-->>C: { accessToken, refreshToken cookie }
    end
```

---

## 5. Pila de Middleware (Ordenada)

El backend procesa cada solicitud a través de una cadena de middleware determinista:

```
1. Helmet.js           → Cabeceras de seguridad (CSP, HSTS, XFO, etc.)
2. Middleware CORS      → Validación de origen, política de credenciales
3. Analizador JSON      → Análisis de cuerpo (límite 256kb)
4. Analizador Cookies   → Acceso a cookies HttpOnly
5. Confianza en Proxy   → Extracción precisa de IP detrás de Nginx
6. Sanitización Entrada → HPP, inyección NoSQL, eliminación de bytes nulos
7. Verificación Auto-Prohibición → Consulta PostgreSQL banned_ips
8. Limitador de Tasa Global → 200 req/15min por IP (respaldado por Redis)
9. Detección de Ataques → Coincidencia de patrones XSS/SQLi → transmisión SSE
10. authenticate()      → Verificación JWT + lista negra Redis
11. minRole()/authorize() → Aplicación RBAC + registro de denegación de acceso
12. Manejador de Ruta  → Lógica de negocio
13. Manejador de Errores → Respuestas de error normalizadas (enmascara 5xx en producción)
```

---

## 6. Arquitectura del Flujo de Datos

### 6.1 Pipeline de Eventos de Seguridad

```mermaid
flowchart TD
    A[Ocurre un Evento de Seguridad] --> B{Fuente del Evento}
    B -->|Ataque HTTP| C[Middleware attackDetection]
    B -->|Fallo de Auth| D[authService.login]
    B -->|Hit de Honeypot| E[Servicio Honeypot]
    B -->|Acción Admin| F[CLI manage-admins.js]

    C --> G[loggingService.create]
    D --> G
    E -->|POST /internal/honeypot| G
    F --> G

    G --> H[(PostgreSQL\nsecurity_logs)]
    G --> I[(MongoDB\nsecurity_logs)]
    G --> J[SSE Broadcast\nanalistas conectados]
    G --> K[correlationEngine\ndetección de incidentes]
```

---

## Casos de Uso

| Caso de Uso | Componentes Involucrados | Resultado |
|-------------|-------------------------|-----------|
| **Login con Riesgo Alto** | Motor de Riesgo → MFA → JWT | Acceso con step-up MFA |
| **Ataque XSS Bloqueado** | Middleware → SSE → Correlación | Alerta + posible prohibición de IP |
| **Sondeo de Honeypot** | Honeypot → API Interna → SIEM | IOC creado + incidente de reconocimiento |
| **Análisis Forense** | Logs MongoDB → Caza de Amenazas | Reconstrucción de timeline |

---

## Seguridad

### Controles de Seguridad por Capa

| Capa | Controles Implementados |
|------|------------------------|
| **Borde (Nginx)** | TLS 1.3, HSTS, limitación de tasa, bloqueo de /internal/* |
| **API (Express)** | Helmet CSP, CORS, sanitización de entradas, detección de ataques |
| **Autenticación** | bcrypt-12, JWT de doble token, lista negra Redis, MFA |
| **Autorización** | RBAC de 4 niveles, auditoría de denegaciones, acceso de solo lectura |
| **Datos (PostgreSQL)** | Consultas parametrizadas, principio de mínimo privilegio |
| **Datos (MongoDB)** | Logs de solo inserción (inmutabilidad), TTL 365 días |
| **Servicios** | Secreto interno de API con comparación en tiempo constante |

---

## Integraciones

La arquitectura se integra con los siguientes sistemas externos e internos:

- **MaxMind GeoLite2** — Geolocalización de IP para señales de riesgo
- **Twilio** — Entrega de SMS para MFA
- **SMTP** — Entrega de email para OTP y notificaciones
- **WebAuthn/FIDO2** — Autenticación sin contraseña mediante llaves de paso

---

## Escalabilidad

| Componente | Estrategia de Escalado |
|-----------|----------------------|
| Backend Express | Sin estado → múltiples instancias detrás de balanceador de carga |
| PostgreSQL | Réplicas de lectura para consultas analíticas |
| MongoDB | Fragmentación para colecciones de security_logs de alto volumen |
| Redis | Sentinel para alta disponibilidad + clúster para escala |
| Frontend | CDN + activos estáticos en Nginx |

---

## Roadmap

| Capacidad | Descripción | Estado |
|-----------|-------------|--------|
| **Multi-tenancy** | Aislamiento de organización a nivel de base de datos | Planificado |
| **Agentes EDR** | Telemetría de endpoints hacia la plataforma | Planificado |
| **Módulo SOAR** | Playbooks de respuesta automatizada | Planificado |
| **Federación SIEM** | Ingesta de logs de Splunk/Elastic/QRadar | Futuro |
| **IA/ML avanzado** | Detección de anomalías con Isolation Forest | Futuro |

---

*Ver también: [../security/resumen.md](../security/resumen.md) | [../siem/resumen.md](../siem/resumen.md) | [../infrastructure/resumen.md](../infrastructure/resumen.md)*
