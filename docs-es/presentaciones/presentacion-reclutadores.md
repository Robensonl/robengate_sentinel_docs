# Presentación para Reclutadores — RobenGate Sentinel

**Formato:** Presentación ejecutiva para entrevistas y portfolio reviews  
**Audiencia:** Hiring Managers, Tech Leads, Head of Security, Engineering Directors  
**Idioma:** Bilingüe (Español / Inglés)  
**Duración de pitch:** 5-10 minutos

---

## SLIDE 1 — Quién Soy

### Robenson L. — Full Stack Security Engineer

**Sobre mí:**
- Ingeniero full stack con especialización en ciberseguridad
- Construí RobenGate Sentinel — plataforma SIEM/SOC enterprise de cero
- Desarrollo individual, 9+ meses, sin equipo ni presupuesto
- Stack: Node.js, React, PostgreSQL, MongoDB, Redis, Docker, Kubernetes

**Lo que busco:**
- Rol de ingeniería donde la seguridad sea core, no afterthought
- Equipo que construya software bien desde el principio
- Proyecto con impacto real y retos técnicos genuinos

---

## SLIDE 2 — ¿Qué es RobenGate Sentinel?

**"El SIEM que las empresas medianas pueden permitirse y operar"**

RobenGate Sentinel es una plataforma de ciberseguridad empresarial open-source que integra:

```
SIEM  +  SOAR  +  Honeypot  +  Threat Intelligence  +  AI Analysis
```

En una sola plataforma que se instala en <30 minutos.

**Por qué lo construí:**
Las soluciones SIEM enterprise (Splunk: $150K/año, Microsoft Sentinel: $200+/GB) están fuera del alcance del 90% del mercado. Quise demostrar que se pueden construir capacidades enterprise con tecnologías modernas y una arquitectura bien pensada.

---

## SLIDE 3 — Números que Importan

| Métrica | Valor |
|---|---|
| APIs implementadas | 118+ endpoints |
| Tablas de base de datos | 17 (PostgreSQL) |
| Módulos frontend | 11 feature modules |
| Líneas de código | ~25,000 |
| Archivos de documentación | 185+ |
| Meses de desarrollo | 9+ |
| Metodologías de auth | 5 (password, TOTP, Email OTP, WebAuthn, backup codes) |
| Capas de seguridad | 10 middleware layers |
| Reglas de detección MITRE | 12+ Sigma rules, 12 tácticas |
| Acciones SOAR | 10 automated actions |

---

## SLIDE 4 — Decisiones Técnicas Difíciles

Esto no fue un tutorial. Tuve que tomar y justificar decisiones de arquitectura reales:

### ¿Por qué PostgreSQL + MongoDB? (No solo uno)
Los logs de seguridad necesitan ser **inmutables** (evidencia forense) Y **consultables** con joins eficientes. PostgreSQL para datos relacionales; MongoDB append-only para audit trail que nunca se puede modificar.

### ¿Por qué SSE en lugar de WebSockets?
El dashboard SOC necesita actualizaciones en tiempo real. El flujo es unidireccional (servidor → cliente). SSE tiene reconexión automática nativa, es HTTP estándar, y es 5x más simple de implementar correctamente.

### ¿Por qué RBAC jerárquico con `minRole()`?
4 roles con jerarquía lineal. En lugar de 60+ permisos atómicos en tablas de ACL, un array ordenado con comparación de índices. Simple, predecible, sin over-engineering.

### ¿Por qué JWT en httpOnly cookies, no localStorage?
localStorage es vulnerable a XSS — cualquier script inyectado puede robar el token. httpOnly cookies son inaccesibles para JavaScript. Combinado con CSP estricto, el token es inasequible para atacantes.

---

## SLIDE 5 — Capacidades de Seguridad Implementadas

### Seguridad Ofensiva (comprendo los ataques)
- SSH + HTTP Honeypot que captura ataques reales
- 12+ reglas Sigma mapeadas a MITRE ATT&CK
- Detección de brute force, credential stuffing, port scanning
- Threat Intelligence con IOC correlation

### Seguridad Defensiva (sé cómo proteger)
- WebAuthn/FIDO2 implementation desde el protocolo
- Risk Engine con 10+ señales contextuales
- Impossible travel detection
- SOAR con 10 respuestas automatizadas
- Defense in depth: 10 capas de seguridad superpuestas
- Todos los controles OWASP Top 10 implementados

---

## SLIDE 6 — Lo Que Aprendí

**Aprendizaje técnico:**
- Implementar WebAuthn desde el protocolo (challenge-response, CBOR, attestation)
- Diseño multi-tenant escalable con organización de datos
- Behavioral analytics con estadística (Z-score, baselines, feature extraction)
- Elasticsearch para búsqueda full-text en logs de alta escala
- Kubernetes + Helm para deployment cloud-native

**Aprendizaje de ingeniería:**
- Las decisiones de arquitectura tienen consecuencias durante meses
- El código que parece simple hoy se convierte en deuda técnica mañana
- La documentación no es opcional — sin ella, el proyecto muere
- Probar manualmente no escala — necesitas automatización desde el principio

**Aprendizaje de seguridad:**
- La seguridad no es una feature que añades al final
- Defense in depth: asumir que cada capa fallará
- Los atacantes son persistentes y creativos — las defensas deben serlo también

---

## SLIDE 7 — Código que Puedo Mostrar

### Backend — Risk Engine (riskEngine.js)
Motor de scoring adaptativo con 10+ señales contextuales, cálculo de impossible travel con distancia Haversine, integración con PostgreSQL y Redis.

### Backend — SOAR Engine (soarEngine.js)
EventEmitter-based, 10 action implementations, Redis + PostgreSQL integration, webhook support, fire-and-forget execution.

### Frontend — RBAC System
`permissions.js` + `usePermission.js` + `PermissionGate.jsx` — sistema completo de control de acceso en React con 30+ permisos, 4 roles, renderizado condicional.

### Detection Engine (detectionEngine.js)
12+ reglas Sigma con evaluación en tiempo real, ventanas temporales, agrupación por IP, mapeo MITRE ATT&CK.

---

## SLIDE 8 — Roles que Me Interesan

### Ideal para:
- **Security Software Engineer** — Construir herramientas de seguridad
- **Full Stack Engineer** (empresa de ciberseguridad) — Frontend + Backend
- **Backend Engineer** (APIs, sistemas de eventos, real-time)
- **DevSecOps Engineer** — Integrar seguridad en pipelines
- **Security Engineer** (SME en seguridad de aplicaciones)

### Aportación inmediata:
- Puedo operar un SOC desde el día 1 (he diseñado los workflows)
- Entiendo los ataques más comunes y sus contramedidas
- Sé cómo diseñar APIs seguras (OWASP, RBAC, rate limiting)
- Tengo experiencia con el stack moderno: Node.js, React, K8s, Docker

---

## SLIDE 9 — GitHub + Demo

**GitHub:** `github.com/Robensonl/robengate-sentinel`

**Live Demo:** Disponible bajo petición  
**Tiempo de setup:** <5 minutos con `docker-compose up -d`

**Documentación:**
- `docs/` — Documentación técnica completa en Inglés
- `docs-es/` — 135+ archivos de documentación en Español
- `docs/API_REFERENCE.md` — 118+ endpoints documentados

---

*Preparado para entrevistas y portfolio reviews — Junio 2026*
