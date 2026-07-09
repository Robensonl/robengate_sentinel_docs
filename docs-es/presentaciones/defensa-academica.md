# Defensa de Proyecto — Práctica Profesional / TFG

**Formato:** Presentación académica para defensa ante tribunal  
**Audiencia:** Director de TFG, Tribunal evaluador, Coordinador de prácticas  
**Duración recomendada:** 20-30 minutos + 10 minutos de preguntas

---

## ÍNDICE DE LA DEFENSA

1. Motivación y Objetivos
2. Estado del Arte
3. Propuesta de Solución
4. Arquitectura Técnica
5. Implementación — Módulos Clave
6. Resultados Obtenidos
7. Evaluación de Seguridad
8. Dificultades y Soluciones
9. Conclusiones y Trabajo Futuro
10. Preguntas Frecuentes del Tribunal

---

## PARTE 1 — MOTIVACIÓN Y OBJETIVOS

### El Problema Abordado

La ciberseguridad empresarial enfrenta un paradoja grave: las organizaciones que más necesitan protección (medianas empresas, startups en crecimiento) son las que menos pueden permitirse las herramientas de detección y respuesta disponibles en el mercado.

**Datos de contexto:**
- Microsoft Sentinel: $200+/GB/día
- Splunk Enterprise: $150,000+/año de licencia
- IBM QRadar: $500,000+ en implementación
- Resultado: el 86% de las empresas con <500 empleados no tiene SIEM implementado

### Objetivos del Proyecto

**Objetivo Principal:**
Diseñar e implementar una plataforma de ciberseguridad de nivel enterprise que sea accesible, operativa y escalable para organizaciones medianas.

**Objetivos Específicos:**
1. Implementar un motor de detección de amenazas basado en reglas Sigma mapeadas al framework MITRE ATT&CK
2. Desarrollar un sistema de autenticación multi-factor con soporte WebAuthn/FIDO2
3. Crear un motor de riesgo adaptativo para autenticación contextual
4. Implementar SOAR (Security Orchestration, Automation and Response) con playbooks configurables
5. Integrar un honeypot SSH/HTTP con correlación automática de amenazas
6. Diseñar una arquitectura multi-tenant para soporte de múltiples organizaciones
7. Desarrollar documentación técnica completa de nivel enterprise

---

## PARTE 2 — ESTADO DEL ARTE

### Soluciones SIEM Existentes

| Solución | Tipo | Ventajas | Limitaciones |
|---|---|---|---|
| Splunk | Comercial | Potente, escalable, ecosistema | $150K+/año, requiere expertise |
| Microsoft Sentinel | Cloud comercial | Integración Azure | Vendor lock-in, precio por GB |
| IBM QRadar | Enterprise | Compliance, flow analysis | $500K+, implementación lenta |
| Elastic Security | Open-source | Búsqueda potente, gratis | Sin SOAR, sin honeypot, configuración compleja |
| Wazuh | Open-source | Agentes endpoint, gratis | Sin SOAR maduro, sin multi-tenancy |

### Gap Identificado

Ninguna solución open-source existente combina:
- SIEM + SOAR + Honeypot + Threat Intelligence en una sola plataforma
- Instalación en <30 minutos
- Multi-tenancy nativo
- Autenticación WebAuthn/FIDO2
- Risk engine adaptativo

### Marco Teórico Aplicado
- **MITRE ATT&CK Framework:** Para categorización de técnicas adversariales
- **NIST Cybersecurity Framework:** Para estructura del ciclo de vida de seguridad
- **OWASP Top 10:** Para controles de seguridad de aplicaciones
- **ISO/IEC 27001/27035:** Para gestión de incidentes
- **Sigma Detection Format:** Para reglas de detección interoperables
- **FIDO2/WebAuthn (W3C):** Para autenticación sin contraseña

---

## PARTE 3 — PROPUESTA DE SOLUCIÓN

### Arquitectura de Alto Nivel

RobenGate Sentinel se estructura en 5 planos:

1. **Plano de Presentación:** React SPA con actualización en tiempo real via SSE
2. **Plano de API:** Express.js con 118+ endpoints, 10 capas de middleware de seguridad
3. **Plano de Procesamiento:** 5 motores especializados (Detection, Correlation, AI, Risk, SOAR)
4. **Plano de Datos:** PostgreSQL + MongoDB + Redis + Elasticsearch
5. **Plano de Ingesta:** Honeypot SSH/HTTP + API de ingesta externa

### Decisiones de Diseño Fundamentales

**Decisión 1: Dual Database (PostgreSQL + MongoDB)**
- PostgreSQL para datos relacionales con integridad referencial
- MongoDB para audit logs inmutables con TTL automático
- Justificación: Los requisitos de logs de seguridad son contradictorios — necesitan ser inmutables (MongoDB) y consultables con joins (PostgreSQL)

**Decisión 2: Server-Sent Events vs. WebSockets**
- SSE para actualizaciones en tiempo real del dashboard
- Justificación: El flujo es unidireccional; SSE tiene reconexión automática nativa, menor complejidad, HTTP estándar

**Decisión 3: RBAC Jerárquico con minRole()**
- 4 roles: admin > analyst > responder > viewer
- Justificación: Una jerarquía lineal no requiere tablas de ACL complejas; `minRole()` es simple, predecible y sin over-engineering

---

## PARTE 4 — ARQUITECTURA TÉCNICA

### Stack Tecnológico

**Backend:** Node.js 20 + Express.js + PostgreSQL + MongoDB + Redis + Elasticsearch  
**Frontend:** React 18 + Vite 5 + React Router v6 + Recharts + Leaflet  
**DevOps:** Docker + Kubernetes + Helm + Nginx + GitHub Actions  
**Seguridad:** Helmet.js + bcrypt + JWT + WebAuthn + express-rate-limit

### Diagrama de Arquitectura

Ver: [docs-es/architecture/arquitectura-empresarial.md](../architecture/arquitectura-empresarial.md)

Los diagramas Mermaid incluidos cubren:
- Arquitectura lógica (componentes y relaciones)
- Arquitectura física (deployment en Kubernetes)
- Flujo de datos crítico (evento → detección → respuesta)
- Flujo de autenticación con Risk Engine
- Modelo de base de datos (ERD)

---

## PARTE 5 — IMPLEMENTACIÓN: MÓDULOS CLAVE

### Módulo 1: Sistema de Autenticación

**WebAuthn/FIDO2 Implementation:**
- Implementado desde el protocolo: challenge generation → credential creation → attestation verification → assertion flow
- Soporta hardware keys (YubiKey), biometría (Face ID, Touch ID)
- Almacenamiento seguro de public keys en PostgreSQL

**Risk Engine Adaptativo:**
- 10+ factores de evaluación de riesgo por login
- Score 0-100 → decisión de nivel de MFA requerido
- Impossible travel detection con distancia Haversine
- Integración con Redis cache para respuestas <1ms

**Flujo completo:** Ver diagrama de secuencia en arquitectura-empresarial.md, Sección 4.

### Módulo 2: Detection Engine

**Implementación de Sigma Rules:**
- 12+ reglas built-in en memoria (sin filesystem requerido en producción)
- Evaluación stateful con ventanas temporales configurables
- Agrupación por IP y usuario para detección de patrones
- Mapeo automático a MITRE ATT&CK (tácticas + técnicas)

**Ejemplo: Detección de Brute Force**
```javascript
// Ventana de 10 minutos, mínimo 5 fallos, agrupado por IP
evaluate(events, ctx) {
  if (ctx.EventType !== 'LOGIN_FAILURE') return false;
  const key = `bf:${ctx.ipAddress}`;
  const bucket = _getBucket(key, 600000); // 10 min window
  bucket.push(Date.now());
  return bucket.length >= 5; // threshold
}
```

### Módulo 3: SOAR Engine

**Arquitectura basada en EventEmitter:**
- PlaybookEngine evaluates trigger conditions en cada incidente
- ConditionEvaluator: operadores lógicos (eq, gt, in, contains, not_in)
- ActionExecutor: 10 acciones asíncronas con gestión de errores
- Fire-and-forget via `setImmediate()` para no bloquear el event loop

**Acción más compleja: ban_ip**
- INSERT en banned_ips (PostgreSQL) con duración configurable
- SETEX en Redis con TTL correspondiente (cache para sub-ms ban check)
- Logging del ban en audit trail

### Módulo 4: AI Correlation Engine

**Behavioral Baselining:**
- Construcción de baseline por usuario durante período de observación
- Feature vector de 15+ señales normalizadas (0-1)
- Z-score: desviación de comportamiento respecto al baseline personal
- Anomaly score 0-100 para triaje automático

---

## PARTE 6 — RESULTADOS OBTENIDOS

### Métricas del Proyecto

| Indicador | Valor Alcanzado |
|---|---|
| Endpoints API implementados | 118+ |
| Tablas de base de datos | 17 |
| Módulos frontend | 11 |
| Reglas de detección Sigma | 12+ |
| Tácticas MITRE ATT&CK cubiertas | 12 de 14 |
| Métodos de autenticación | 5 |
| Roles RBAC | 4 |
| Acciones SOAR | 10 |
| Archivos de documentación | 185+ |
| Líneas de código | ~25,000 |

### Funcionalidades Completadas

✅ Autenticación completa (JWT + WebAuthn + MFA + Risk Engine)  
✅ RBAC jerárquico 4 roles con frontend + backend enforcement  
✅ Detection Engine con 12+ reglas Sigma + MITRE ATT&CK  
✅ Correlation Engine (4 reglas de correlación multi-evento)  
✅ AI Behavioral Analytics (baselining + Z-score + impossible travel)  
✅ SOAR Engine con 10 acciones + playbooks configurables  
✅ Honeypot SSH + HTTP con integración al ecosistema  
✅ Threat Intelligence con IOC correlation  
✅ Attack Map geoespacial en tiempo real  
✅ Multi-tenancy con organizations  
✅ Deployment Docker + Kubernetes + Helm  
✅ Documentación enterprise completa (185+ archivos)

---

## PARTE 7 — EVALUACIÓN DE SEGURIDAD

### Cobertura OWASP Top 10

| ID OWASP | Vulnerabilidad | Implementación |
|---|---|---|
| A01 | Broken Access Control | RBAC + readOnly() + tenant isolation |
| A02 | Cryptographic Failures | bcrypt factor 12 + JWT RS256 + HSTS |
| A03 | Injection | Parameterized queries + sanitize middleware |
| A04 | Insecure Design | Defense in depth, least privilege |
| A05 | Security Misconfiguration | Helmet.js + CSP strict + no X-Powered-By |
| A06 | Vulnerable Components | Dependencias auditadas |
| A07 | Auth & Session Failures | WebAuthn + MFA + risk engine + httpOnly JWT |
| A08 | Integrity Failures | Audit log inmutable + integrity checks |
| A09 | Logging & Monitoring | Detection Engine + audit trail + SSE alerting |
| A10 | SSRF | Validación de URLs en webhooks |

### Hallazgos de la Auditoría Interna

Se realizó una auditoría de seguridad completa del código. Los hallazgos y mitigaciones están documentados en `docs-es/security/resumen.md` y `docs/SECURITY_AUDIT_REPORT.md`.

---

## PARTE 8 — DIFICULTADES Y SOLUCIONES

### Dificultad 1: WebAuthn desde el Protocolo

**Problema:** WebAuthn requiere entender criptografía de clave pública, CBOR encoding, y el protocolo de challenge-response. No hay muchos recursos para implementación custom.

**Solución:** Estudio del spec W3C completo + uso de `@simplewebauthn/server` para operaciones criptográficas, implementando la lógica de flujo desde cero.

### Dificultad 2: Circular Dependencies en los Engines

**Problema:** El SOAR Engine necesita el Correlation Engine, y el Correlation Engine necesita el SOAR Engine.

**Solución:** Lazy require — `function getSoarEngine() { return require('./soarEngine') }` — carga el módulo solo cuando se necesita en runtime, no en la inicialización del módulo.

### Dificultad 3: State en el Detection Engine (Sliding Windows)

**Problema:** Las reglas Sigma requieren evaluar el historial de eventos recientes (ventana de 10 minutos). Mantener esto en memoria requiere limpieza de datos stale.

**Solución:** Map con buckets de timestamps + limpieza periódica + cooldowns para evitar alertas duplicadas.

### Dificultad 4: Seguridad del JWT en el Frontend

**Problema:** localStorage es vulnerable a XSS. La práctica correcta (httpOnly cookies) complica el acceso al token desde React.

**Solución:** httpOnly cookies con `credentials: 'include'` en fetch. El token es transparente para el código React — el browser lo adjunta automáticamente.

---

## PARTE 9 — CONCLUSIONES Y TRABAJO FUTURO

### Conclusiones

1. **Es posible construir capacidades enterprise con tecnologías modernas:** Node.js, React, PostgreSQL y MongoDB son suficientes para construir un SIEM funcional de nivel enterprise cuando se diseñan correctamente.

2. **La seguridad debe ser arquitectónica, no reactiva:** Las decisiones de seguridad tomadas en el diseño inicial (dual database para inmutabilidad, httpOnly cookies, defense in depth) son exponencialmente más efectivas que añadir seguridad después.

3. **El tiempo de valor importa más que la escala:** Para el mercado objetivo, instalarse en 30 minutos y ser operativo el primer día tiene más valor que las capacidades de petabyte de Splunk.

4. **La documentación es parte del producto:** 185+ archivos de documentación no son un "extra" — son lo que hace que un proyecto sea mantenible y profesional.

### Limitaciones

- El análisis de IA es estadístico, no ML real (cold start problem, mayor tasa de falsos positivos)
- 3 conectores de ingesta vs. 300+ en soluciones maduras
- Sin File Integrity Monitoring
- Sin Network Flow Analysis

### Trabajo Futuro (Roadmap)

**Corto plazo (3-6 meses):**
- File Integrity Monitoring (FIM)
- Conectores adicionales (Windows Events, Syslog, AWS CloudTrail)
- SLA timers en incidentes
- Integración Jira bidireccional

**Medio plazo (6-12 meses):**
- Modelos ML reales (Isolation Forest para anomaly detection)
- Rules ecosystem comunitario (1,000+ reglas)
- Compliance reports automáticos (PCI DSS, ISO 27001, GDPR)
- STIX/TAXII para intercambio de threat intelligence

**Largo plazo (12-24 meses):**
- SaaS multi-region con alta disponibilidad
- Marketplace de integraciones (Jira, ServiceNow, PagerDuty, Slack)
- Network flow analysis (NetFlow/sFlow)
- Certificación SOC 2 Type II

---

## PARTE 10 — PREGUNTAS FRECUENTES DEL TRIBUNAL

### P: ¿Por qué usaste Node.js y no Python para el backend de seguridad?

**R:** Node.js tiene ventajas específicas para este caso de uso: el event loop no bloqueante es ideal para el SSE broker que mantiene conexiones persistentes con cientos de dashboards SOC simultáneos. La naturaleza asíncrona nativa de Node.js facilita las operaciones I/O-bound (múltiples base de datos simultáneas) sin el overhead de threads de Python. Para los algoritmos estadísticos del AI Engine, el rendimiento de JavaScript es suficiente. Si los modelos ML evolucionan a TensorFlow/PyTorch, se integrarían como microservicio Python separado.

### P: ¿Qué garantías de inmutabilidad tiene el audit log?

**R:** La inmutabilidad es a nivel de aplicación, no de base de datos. En MongoDB, el modelo Mongoose no expone métodos `update()` ni `delete()`. No existe ningún endpoint REST que permita DELETE sobre audit_logs. El único mecanismo de eliminación es el TTL automático de MongoDB (mínimo 365 días). Para garantías adicionales en producción, se puede habilitar MongoDB Auditing en el nivel del servidor de base de datos, y una hash chain podría añadirse en el roadmap para detección de tampering.

### P: ¿El sistema escala para grandes empresas?

**R:** En la arquitectura actual, escala a cientos de usuarios y millones de eventos con un servidor de 16 cores / 32GB RAM. Para escalar más, se necesitaría: (1) Elasticsearch como motor de logs principal (ya está integrado como opcional), (2) PostgreSQL con read replicas para distribución de carga de lectura, (3) Sharding de MongoDB para logs de alto volumen. La arquitectura está diseñada para esta evolución desde el principio.

### P: ¿Cómo diferencia entre falsos positivos y amenazas reales?

**R:** Múltiples capas: (1) Los umbrales de las reglas Sigma están calibrados para minimizar falsos positivos (5 fallos en 10 minutos, no 1). (2) El Risk Engine contextualiza cada evento (un analista que hace login desde su IP habitual con dispositivo conocido no genera alerta aunque sea las 3 AM). (3) El AI Engine aplica Z-scores sobre el baseline histórico del usuario. (4) La correlación multi-vector requiere múltiples señales convergentes para crear incidentes críticos. (5) Los analistas pueden marcar alertas como falsos positivos, lo que en el roadmap alimentaría el sistema de aprendizaje.

### P: ¿Qué aspectos mejorarías si tuvieras más tiempo?

**R:** Los 3 cambios de mayor impacto serían: (1) Testing automatizado — actualmente la validación es principalmente manual; un test suite completo sería esencial para producción. (2) Conectores de ingesta — ampliar de 3 a 20+ fuentes (Windows Events, Syslog, cloud providers). (3) Modelos ML reales — sustituir el análisis estadístico por Isolation Forest o autoencoders entrenados con datos de la plataforma.

---

*Preparado para defensa académica — Junio 2026*
