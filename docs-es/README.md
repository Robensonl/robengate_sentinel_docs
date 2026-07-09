# RobenGate Sentinel — Documentación en Español

> **Versión:** 1.0.0 | **Plataforma:** Plataforma SOC de Ciberseguridad Empresarial | **Clasificación:** INTERNO

---

## Descripción General

**RobenGate Sentinel** es una plataforma de Centro de Operaciones de Seguridad (SOC) de nivel empresarial construida para detectar, analizar, correlacionar y responder a amenazas de ciberseguridad en tiempo real. Combina un frontend React moderno, backend Node.js/Express, arquitectura de base de datos dual (PostgreSQL + MongoDB + Redis), un servicio honeypot dedicado y un pipeline Server-Sent Events (SSE) en tiempo real en un ecosistema unificado de monitorización de amenazas.

---

## Índice de Documentación

### 📐 Arquitectura

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **Arquitectura del Sistema** | Arquitectura end-to-end, diagramas, topología de servicios | [architecture/arquitectura-sistema.md](architecture/arquitectura-sistema.md) |
| **Frontend** | React SPA, enrutamiento, RBAC visual, temas, UI en tiempo real | [frontend/resumen.md](frontend/resumen.md) |
| **Backend** | Express.js, cadena de 13 middlewares, servicios, mapa de rutas | [backend/resumen.md](backend/resumen.md) |
| **Base de Datos** | Esquema PostgreSQL, colecciones MongoDB, estructura Redis | [database/resumen.md](database/resumen.md) |
| **Infraestructura** | Docker Compose, Nginx, red sentinel_net, topología de contenedores | [infrastructure/resumen.md](infrastructure/resumen.md) |

### 🔐 Seguridad y Autenticación

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **Seguridad y Autenticación** | JWT, MFA 4 canales, WebAuthn, gestión de sesiones, Motor de Riesgo | [security/resumen.md](security/resumen.md) |
| **Control de Acceso (RBAC)** | Jerarquía de roles, matriz de permisos, aplicación multicapa | [rbac/resumen.md](rbac/resumen.md) |
| **Sistema de Auditoría** | Registro inmutable, cumplimiento SOC 2 / ISO 27001, TTL 365d | [audit-system/resumen.md](audit-system/resumen.md) |

### 🛡️ Operaciones SOC

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **SIEM** | Motor de correlación, niveles de severidad, flujos de trabajo SOC | [siem/resumen.md](siem/resumen.md) |
| **Motor de IA / Análisis de Riesgo** | 10 señales de riesgo, puntuación de anomalía, reconocimiento de patrones | [ai-analysis/resumen.md](ai-analysis/resumen.md) |
| **Gestión de Incidentes** | Ciclo de vida ISO 27035, marcado TLP, línea de tiempo inmutable | [incident-management/resumen.md](incident-management/resumen.md) |
| **Cacería de Amenazas** | Metodología hipótesis-driven, pivote IOC, plantillas MITRE ATT&CK | [threat-hunting/resumen.md](threat-hunting/resumen.md) |

### 🧩 Inteligencia y Detección

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **Inteligencia de Amenazas** | 8 tipos de IOC, MITRE ATT&CK, perfiles de actores, ciclo de vida | [threat-intelligence/resumen.md](threat-intelligence/resumen.md) |
| **Honeypot** | Trampa doble SSH + HTTP, sanitización de payloads, reenvío de eventos | [honeypot/resumen.md](honeypot/resumen.md) |
| **Mapa Global de Ataques** | Visualización geoespacial, arcos de Bézier animados, colores por severidad | [attack-map/resumen.md](attack-map/resumen.md) |

### ⚡ Tiempo Real e Integraciones

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **Sistema de Eventos en Tiempo Real** | SSE, pool de conexiones, 8 tipos de eventos, mecanismo keep-alive | [realtime/sistema-eventos.md](realtime/sistema-eventos.md) |
| **Integraciones Externas** | Nodemailer, Twilio, MaxMind GeoIP, WebAuthn FIDO2, API interna | [integrations/resumen.md](integrations/resumen.md) |

### 🚀 Despliegue y Planificación

| Módulo | Descripción | Archivo |
|--------|-------------|---------|
| **Guía de Despliegue** | Inicio rápido, variables de entorno, smoke tests, scripts PS | [deployment/resumen.md](deployment/resumen.md) |
| **Hoja de Ruta Futura** | H1/H2/H3 (0-36 meses), UEBA, SIEM connectors, SaaS multi-tenant | [future-roadmap/hoja-ruta.md](future-roadmap/hoja-ruta.md) |

### 📊 Auditoría Final

| Documento | Descripción | Archivo |
|-----------|-------------|---------|
| **Resumen de Auditoría** | Puntuación 5.2/10 producción, 7.5/10 arquitectura, hallazgos críticos | [final-audit/00_resumen_auditoria.md](final-audit/00_resumen_auditoria.md) |
| **Recomendaciones Profesionales** | Portfolio, universidad, clientes empresariales, inversores, SaaS | [final-audit/04_recomendaciones.md](final-audit/04_recomendaciones.md) |

---

## Arquitectura de la Plataforma

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNET / CLIENTES                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS :443
                    ┌───────▼────────┐
                    │  Proxy Nginx   │  ← Terminación TLS, proxy inverso
                    └──┬──────────┬──┘
                       │          │
              ┌────────▼──┐  ┌────▼──────────┐
              │ Frontend  │  │  Backend API   │
              │  React    │  │  Express.js    │
              │  :3000    │  │  :5000         │
              └────────┬──┘  └────┬───────────┘
                       │          │
              ┌────────▼──────────▼──────────┐
              │         Capa de Datos         │
              │  PostgreSQL :5432  Redis :6379│
              │  MongoDB    :27017           │
              └──────────────────────────────┘
                       │
              ┌────────▼──────────┐
              │ Servicio Honeypot │
              │  SSH :2222        │
              │  HTTP :8080       │
              └───────────────────┘
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite | 19.2 / Latest |
| **Estado** | React Context + Zustand | — |
| **HTTP Client** | Axios | 1.6.2 |
| **Gráficas** | Recharts | 3.8.1 |
| **Mapas** | react-simple-maps | 3.0.0 |
| **Animaciones** | Motion | 12.38.0 |
| **Backend** | Node.js + Express.js | 20 LTS / 5.x |
| **BD Relacional** | PostgreSQL | 15+ |
| **BD Documentos** | MongoDB | 7+ |
| **Caché** | Redis | 7+ |
| **Proxy/TLS** | Nginx | Alpine |
| **Contenedores** | Docker + Docker Compose | 24+ / 2.20+ |

---

## Resumen de Capacidades de Seguridad

### Autenticación y Acceso
- ✅ **JWT doble token** — access (15min, en memoria) + refresh (7d, HttpOnly cookie)
- ✅ **MFA de 4 canales** — Email OTP, SMS Twilio, TOTP RFC 6238, WebAuthn FIDO2
- ✅ **Motor de Riesgo Adaptativo** — 10 señales → puntuación 0-100 → decisión PASS/MFA/BLOCK
- ✅ **Huella Digital del Dispositivo** — Detección de dispositivos nuevos y Viaje Imposible
- ✅ **H-RBAC** — admin(4) > analyst(3) > responder(2) > viewer(1) con herencia

### Detección y Respuesta
- ✅ **Honeypot doble canal** — SSH + HTTP, captura de credenciales, reenvío al SIEM
- ✅ **Detección de ataques en middleware** — XSS, SQLi, path traversal bloqueados antes de controladores
- ✅ **Motor de Correlación** — 4 reglas: fuerza bruta, rociado, barrido honeypot, multivector
- ✅ **Gestión de Incidentes** — ISO 27035, estados, marcado TLP, línea de tiempo inmutable
- ✅ **Inteligencia de Amenazas** — 8 tipos de IOC, MITRE ATT&CK, perfiles de actores

### Operaciones SOC
- ✅ **Eventos en Tiempo Real** — SSE, 8 tipos de eventos, keepalive cada 20s
- ✅ **Mapa Global de Ataques** — react-simple-maps, arcos de Bézier animados
- ✅ **Logs Inmutables** — MongoDB append-only, TTL 365d, hook de inmutabilidad
- ✅ **Cacería de Amenazas** — Hipótesis-driven, pivote IOC, plantillas MITRE ATT&CK

---

## Terminología Clave

| Inglés | Español |
|--------|---------|
| Risk Engine | Motor de Riesgo |
| Threat Intelligence | Inteligencia de Amenazas |
| Threat Hunting | Cacería de Amenazas |
| Security Logs | Registros de Seguridad |
| Audit Logs | Registros de Auditoría |
| Incident Management | Gestión de Incidentes |
| Detection Engine | Motor de Detección |
| Correlation Engine | Motor de Correlación |
| Attack Map | Mapa Global de Ataques |
| Brute Force | Fuerza Bruta |
| Credential Spraying | Rociado de Credenciales |
| Honeypot Sweep | Barrido de Honeypot |
| Impossible Travel | Viaje Imposible |
| Anomaly Score | Puntuación de Anomalía |
| Device Fingerprint | Huella Digital del Dispositivo |

---

## Casos de Uso por Audiencia

### Para Defensa Universitaria
Ver [final-audit/04_recomendaciones.md → Sección 3](final-audit/04_recomendaciones.md) para guía completa de presentación académica y preguntas anticipadas del tribunal.

### Para Clientes Empresariales
Ver [final-audit/04_recomendaciones.md → Sección 4](final-audit/04_recomendaciones.md) para propuesta de valor y script de demo empresarial.

### Para Entrevistas Técnicas
Destacar: [security/resumen.md](security/resumen.md), [rbac/resumen.md](rbac/resumen.md), [architecture/arquitectura-sistema.md](architecture/arquitectura-sistema.md)

### Para Inversores / Demo Day
Ver [final-audit/04_recomendaciones.md → Sección 5](final-audit/04_recomendaciones.md) para pitch ejecutivo y métricas clave.

---

*Documentación en español generada para: Presentación de Portfolio · Defensa Universitaria · Entrevistas Técnicas · Clientes Empresariales · Inversores · Comercialización SaaS*
