# Hoja de Ruta Futura — RobenGate Sentinel

> **Clasificación:** INTERNO | **Horizonte:** 12–36 Meses

---

## Visión

RobenGate Sentinel está posicionado para evolucionar desde una **plataforma SOC auto-alojada** hacia una **plataforma de operaciones de seguridad SaaS multi-tenant empresarial**. La hoja de ruta está organizada en tres horizontes:

| Horizonte | Temporalidad | Enfoque |
|-----------|-------------|---------|
| **H1 — Mejora** | 0-6 meses | Profundizar capacidades existentes |
| **H2 — Expansión** | 6-18 meses | Nuevas categorías de detección + integraciones |
| **H3 — Plataforma** | 18-36 meses | Arquitectura SaaS + escalado empresarial |

---

## H1 — Mejora (0-6 Meses)

### 1.1 Mejoras de Detección

**Integración AbuseIPDB**
- Verificación de reputación de IP en tiempo real en cada intento de autenticación
- Cachear resultados en Redis (TTL 1 hora) para evitar límites de tasa
- Añadir `abuse_confidence > 50` como señal de riesgo (+20 puntos)
- Crear IOC automáticamente para IPs de alta confianza

**Motor de Reglas de Detección Personalizadas**
- Permitir a analistas crear reglas de correlación personalizadas via UI
- DSL de reglas: `SI event.action EN [...] Y count > N EN 15min AGRUPAR POR ip ENTONCES create_incident`
- Compatibilidad con formato de reglas Sigma
- Sandbox de prueba de reglas con reproducción de datos históricos

**Mejora de Viaje Imposible**
- Integrar detección de cambio de ASN (cambio de ISP durante sesión)
- Detección de VPN/proxy via APIs de reputación de IP
- Aumento de puntuación de riesgo para nodos de salida VPN/Tor conocidos

### 1.2 Gestión de Alertas

**Escalado de Alertas**
- Escalado automático: si alerta HIGH no reconocida en 30 min → escalado CRITICAL
- Integración de rotación de guardias
- Notificación email/SMS en alertas críticas no reconocidas

**Correlación de Alertas**
- Agrupar alertas relacionadas de la misma IP/usuario en clusters
- Reducir fatiga de alertas via deduplicación inteligente
- Reglas de supresión de alertas (ventanas de mantenimiento planificado)

### 1.3 Inteligencia de Amenazas

**Integración VirusTotal**
- Lookup de hash para indicadores de archivo subidos
- Escaneo de URL para URLs reportadas
- Cliente API con límite de tasa y caché de resultados

**Programador de Feeds**
- Importación programada de IOC desde feeds públicos (AlienVault OTX, Feodo Tracker)
- Fuentes de feeds configurables con parsers personalizados
- Deduplicación automática de IOC y puntuación de confianza

---

## H2 — Expansión (6-18 Meses)

### 2.1 Nuevas Categorías de Detección

**UEBA (Análisis de Comportamiento de Usuario y Entidad)**
- Establecer línea base de comportamiento por usuario (horarios normales de login, geo, endpoints)
- Detección de anomalías estadísticas: desviación 2σ activa elevación de riesgo
- Puntuación de comportamiento de sesión: patrones de acceso inusuales a endpoints
- Implementar usando datos existentes de `risk_events` como conjunto de entrenamiento

**Señales de Detección de Endpoint**
- Detección de deriva de huella digital del navegador (cambios de hash Canvas/WebGL/Audio)
- Verificación de cumplimiento del dispositivo (características de seguridad detectables via JavaScript)
- Detección de extensiones del navegador para verificación de herramientas de seguridad

**Detección de Abuso de API**
- Detección de enumeración de endpoints (muchos 404 seguidos)
- Detección de bots automatizados via análisis de timing de solicitudes
- Detección de ataque de introspección GraphQL
- Reconocimiento de patrones de fuzzing de parámetros

### 2.2 Nuevas Integraciones

**Framework de Conectores SIEM**
- **Splunk HEC:** Reenviar eventos como JSON al Splunk HTTP Event Collector
- **Elasticsearch:** Indexar eventos en stack ELK via Elasticsearch bulk API
- **QRadar:** Reenvío de syslog en formato CEF
- **Microsoft Sentinel:** Integración con Azure Monitor REST API

**Federación de Proveedor de Identidad (IdP)**
- Implementación SP SAML 2.0 para SSO
- OIDC/OAuth 2.0 (Google Workspace, Azure AD, Okta)
- SCIM 2.0 para aprovisionamiento/desaprovisionamiento automático de usuarios
- Creación de cuenta just-in-time (JIT) en login SSO

**Plataformas de Comunicación**
- Notificaciones de alerta a Slack (webhook + bloques de mensajes ricos)
- Integración Teams para notificaciones de incidentes
- Integración PagerDuty para escalado de guardia
- Webhooks configurables para integraciones personalizadas

### 2.3 Mejoras de Detección Existentes

**Motor de Correlación Multi-Paso**
- Reglas de correlación multi-etapa: evento A → esperar 10min → evento B → incidente
- Persistencia de contexto entre fases de correlación
- Ventanas de tiempo configurables (5min, 1h, 24h)

**Enriquecimiento de Amenazas**
- Puntuación de reputación de IP via múltiples fuentes
- Enriquecimiento de indicadores de dominio (WHOIS, historial DNS)
- Reconocimiento de patrones de infraestructura de C2

---

## H3 — Plataforma (18-36 Meses)

### 3.1 Arquitectura SaaS Multi-Tenant

**Aislamiento Completo de Tenants**
- Segregación de datos a nivel de esquema de base de datos por tenant
- Redes de contenedores aisladas por tenant
- Honeypot dedicado por tenant (instancias separadas)

**Onboarding de Tenants**
- Portal de registro self-service
- Aprovisionamiento automático de recursos (BD, contenedores)
- Gestión del ciclo de vida del tenant (trial, activo, suspendido, eliminado)

**Facturación y Suscripciones**
- Integración Stripe para pagos recurrentes
- Tracking de uso por tenant (eventos procesados, usuarios activos, almacenamiento)
- Sobrepaso y alertas de cuota

### 3.2 Escalado Empresarial

**Despliegue Kubernetes**
- Completar templates de Helm (actualmente incompletos)
- Horizontal Pod Autoscaling (HPA) basado en cola de eventos
- Despliegue multi-región para baja latencia global

**Observabilidad**
- Métricas Prometheus/Grafana (endpoint `/metrics` en backend)
- Distributed tracing con OpenTelemetry
- Log aggregation con ELK Stack

**Alta Disponibilidad**
- PostgreSQL con streaming replication y failover automático
- Redis Sentinel para alta disponibilidad de caché
- MongoDB replica set con elección automática de primario

### 3.3 Capacidades Avanzadas de IA/ML

**Modelos de Detección de Anomalías**
- Entrenamiento de modelos de ML sobre datos históricos de `security_logs`
- Detección de anomalías de comportamiento de usuario (Isolation Forest, LSTM)
- Puntuación de amenazas predictiva basada en patrones históricos

**Motor EDR (Endpoint Detection & Response)**
- Agente ligero para endpoints (Node.js o Go)
- Telemetría de procesos, red y sistema de archivos
- Correlación de telemetría de endpoint con eventos de red SIEM

---

## Hoja de Ruta de Correcciones Críticas (Fase A — Inmediato)

Estas son las correcciones críticas que transforman la plataforma de "demostración" a "producción":

| ID | Corrección | Esfuerzo | Impacto |
|----|-----------|---------|---------|
| **A1** | Conectar panel a datos reales de la API | 2-3 días | CRÍTICO |
| **A2** | Arreglar pérdida de claim de organización en refresh token | 30 min | CRÍTICO |
| **A3** | Conectar pipeline de eventos a servicios avanzados | 3-5 días | ALTO |
| **A4** | Añadir endpoint `/metrics` al backend (Prometheus) | 1 día | ALTO |
| **A5** | Completar templates de Helm para Kubernetes | 2-3 días | MEDIO |

---

## Métricas de Éxito

| Métrica | Objetivo H1 | Objetivo H2 | Objetivo H3 |
|---------|------------|------------|------------|
| **Tasa de Detección de Ataques** | > 95% | > 98% | > 99.5% |
| **Falsos Positivos** | < 5% | < 2% | < 0.5% |
| **MTTD (Tiempo Medio de Detección)** | < 5 seg | < 2 seg | < 1 seg |
| **Tenants Activos** | — | 10-50 | 100-500 |
| **Uptime** | 99% | 99.5% | 99.9% |

---

*Ver también: [../final-audit/00_resumen_auditoria.md](../final-audit/00_resumen_auditoria.md) | [../architecture/arquitectura-sistema.md](../architecture/arquitectura-sistema.md)*
