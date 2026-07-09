# Presentación Profesional — RobenGate Sentinel

**Para recruiters, evaluadores IPP, y revisión de portfolio**  
**Versión:** 2.0.0  

---

## ¿Qué es RobenGate Sentinel?

RobenGate Sentinel es una plataforma de ciberseguridad empresarial completa desarrollada como proyecto de aprendizaje y demostración de competencias avanzadas en ingeniería de software, arquitectura de sistemas y seguridad de la información.

### En Una Línea

> Una plataforma open-source que integra SIEM + SOC + Honeypot + SOAR + Threat Intelligence + AI Analysis, construida con un stack tecnológico moderno de nivel enterprise.

---

## El Porqué del Proyecto

Este proyecto nació de una pregunta simple: **¿puedo construir desde cero una plataforma de ciberseguridad de nivel enterprise?**

La respuesta después de [X meses] de desarrollo es: sí. Y en el proceso, he aprendido más sobre arquitectura de sistemas, seguridad de aplicaciones, y diseño de APIs que en cualquier curso o tutorial.

Los objetivos del proyecto:

1. **Técnico:** Dominar el stack completo moderno (React + Node.js + PostgreSQL + MongoDB + Redis + Docker + Kubernetes)
2. **Seguridad:** Implementar controles de seguridad reales, no teóricos (OWASP Top 10, WebAuthn, RBAC, audit trails)
3. **Arquitectura:** Diseñar un sistema escalable multi-tenant con separación de responsabilidades clara
4. **Documentación:** Crear documentación de nivel enterprise que refleje fielmente el código real

---

## Stack Tecnológico Completo

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime principal |
| Express | 4.x | Framework HTTP |
| jsonwebtoken | 9.x | JWT authentication |
| bcrypt | 5.x | Password hashing (factor 12) |
| @simplewebauthn/server | 9.x | WebAuthn/FIDO2 server-side |
| speakeasy | 2.x | TOTP generation/verification |
| zod | 3.x | Schema validation |
| pg | 8.x | PostgreSQL client con pooling |
| mongoose | 8.x | MongoDB ODM |
| ioredis | 5.x | Redis client |
| node-cron | 3.x | Scheduled tasks |

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI framework |
| Vite | 5 | Build tool + dev server |
| Tailwind CSS | 4 | Utility-first CSS |
| Zustand | 5 | Global state management |
| React Router | 7 | Client-side routing |
| @simplewebauthn/browser | 9.x | WebAuthn browser API |
| Recharts | 2.x | Charts y visualizaciones |
| Leaflet | — | Mapa de ataques geolocalizado |

### Infraestructura

| Componente | Tecnología |
|---|---|
| Containerización | Docker + Docker Compose |
| Orquestación | Kubernetes + Helm |
| Reverse Proxy | Nginx |
| Observabilidad | Prometheus + Grafana + Alertmanager |
| CI/CD Ready | Scripts + Helm values |

### Bases de Datos

| Base de datos | Versión | Uso |
|---|---|---|
| PostgreSQL | 16 | Datos principales (17 tablas, 13 migraciones) |
| MongoDB | 7 | Logs inmutables + Threat Intelligence |
| Redis | 7 | Sesiones + Cache + Rate limiting |

---

## Métricas del Proyecto

| Métrica | Valor |
|---|---|
| Endpoints API documentados | 91+ |
| Tablas PostgreSQL | 17 |
| Migraciones de schema | 13 |
| Archivos de rutas (backend) | 23 |
| Controladores | 18 |
| Servicios | 17 |
| Middleware | 10 |
| Archivos de documentación | 80+ |
| Líneas de código (backend) | ~15,000+ estimadas |
| Líneas de código (frontend) | ~10,000+ estimadas |

---

## Competencias Demostradas

### Seguridad de Aplicaciones

- ✅ Implementación completa de autenticación: JWT + TOTP + WebAuthn/FIDO2 + Email OTP + backup codes
- ✅ RBAC granular con 4 roles, aplicado tanto en backend como frontend
- ✅ Protección contra OWASP Top 10: SQLi, XSS, CSRF, broken auth, etc.
- ✅ Rate limiting por IP y por usuario
- ✅ Audit trail inmutable (MongoDB) y audit logs (PostgreSQL)
- ✅ Datos sensibles hasheados con bcrypt(12)
- ✅ Secrets en variables de entorno, nunca en código

### Arquitectura de Sistemas

- ✅ Diseño multi-tenant con aislamiento por `organization_id`
- ✅ Separación de responsabilidades (routes → controllers → services → repositories)
- ✅ Dual-storage pattern: PostgreSQL (fast queries) + MongoDB (immutable logs)
- ✅ Redis para caching y gestión de sesiones
- ✅ SSE para actualizaciones en tiempo real
- ✅ Schema migrations versionadas (13 migraciones)

### DevOps e Infraestructura

- ✅ Docker Compose para desarrollo
- ✅ Kubernetes + Helm para producción
- ✅ Nginx como reverse proxy con headers de seguridad
- ✅ Prometheus + Grafana para observabilidad
- ✅ Health check endpoints implementados
- ✅ PowerShell scripts para gestión del entorno (Windows)

### Diseño de APIs

- ✅ RESTful API con 91+ endpoints
- ✅ Validación de entrada con Zod en todos los endpoints
- ✅ Error handling consistente
- ✅ Paginación en endpoints de listado
- ✅ Documentación completa con ejemplos cURL

---

## Honestidad Técnica

El proyecto es honesto sobre qué es real y qué es demo/simulación:

| Componente | Estado Real |
|---|---|
| Auth completo | ✅ Implementación real, funciona en producción |
| RBAC | ✅ Implementación real en backend y frontend |
| Risk/Detection Engine | ✅ Motor heurístico real |
| SOAR Playbooks | ✅ Implementación real |
| Multi-tenancy | ✅ Implementación real |
| Honeypot | ✅ SSH + HTTP funcionales |
| Attack Map time real | 🎭 `attackSimulator.js` como fallback demo |
| Dashboard metrics | 🎭 Parcialmente estáticos en demo |
| AI recommendations | 🎭 Mock data en versión actual |
| Email service | 🎭 Dev-mock (no envía emails reales) |

Esta transparencia es parte del valor del proyecto: **documentar con rigor lo real vs. lo simulado** es una competencia clave en cualquier equipo de desarrollo.

---

## Repositorio y Código

- **GitHub:** [URL del repositorio]
- **Documentación:** `docs-es/` (español) + `docs/` (inglés)
- **Licencia:** MIT

---

## Contexto Académico / IPP

Este proyecto fue desarrollado en el contexto de [nombre del programa / prácticas]. Los objetivos de aprendizaje cumplidos incluyen:

- [ ] Completar con el contexto específico del programa
- [ ] Añadir nombre del tutor / empresa
- [ ] Añadir duración del proyecto
- [ ] Añadir tecnologías específicas evaluadas
