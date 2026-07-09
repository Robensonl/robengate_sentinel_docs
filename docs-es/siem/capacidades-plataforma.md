# Capacidades de la Plataforma — RobenGate Sentinel

**Autor:** Principal Cybersecurity Architect + Technical Writer  
**Versión:** 2.0.0  
**Fecha:** Junio 2026

---

## Índice de Módulos

1. [Dashboard SOC](#1-dashboard-soc)
2. [Attack Map](#2-attack-map)
3. [Threat Intelligence](#3-threat-intelligence)
4. [Threat Hunting](#4-threat-hunting)
5. [AI Analysis](#5-ai-analysis)
6. [Incidents](#6-incidents)
7. [Alerts](#7-alerts)
8. [Honeypot](#8-honeypot)
9. [Security Logs](#9-security-logs)
10. [Audit Logs](#10-audit-logs)
11. [Sessions](#11-sessions)
12. [Devices](#12-devices)
13. [RBAC](#13-rbac)
14. [Detection Engine](#14-detection-engine)
15. [Correlation Engine](#15-correlation-engine)
16. [Risk Engine](#16-risk-engine)
17. [SOAR](#17-soar)

---

## 1. Dashboard SOC

### Propósito
Panel de control central del Security Operations Center. Proporciona visibilidad instantánea del estado de seguridad de la organización mediante métricas en tiempo real.

### Arquitectura
- **Frontend:** React SPA con polling SSE para actualizaciones en vivo
- **Backend:** `/api/stats` → agregaciones en PostgreSQL + MongoDB
- **Real-time:** SSE broker emite eventos a todos los analistas conectados
- **Rendering:** Recharts para gráficos, CSS Modules para estilos

### Widgets del Dashboard

| Widget | Datos | Actualización |
|---|---|---|
| Risk Score Global | Score 0-100, nivel LOW/MEDIUM/HIGH/CRITICAL | Tiempo real (SSE) |
| Alertas por Severidad | Critical / High / Medium / Low (contador) | Tiempo real |
| Eventos 24h | Gráfico de barras por hora | Cada 60s |
| Top IPs Atacantes | TOP 10 IPs con contador de ataques | Cada 30s |
| Incidentes Activos | Lista con tiempo de apertura y SLA | Tiempo real |
| Mapa de Calor | Actividad por hora del día y día de la semana | Cada 5min |
| Tácticas MITRE | Top 5 tácticas detectadas en el período | Cada 5min |
| Honeypot Activity | Capturas en las últimas 24h | Tiempo real |

### APIs
```
GET /api/stats/dashboard    → Métricas generales del dashboard
GET /api/stats/events       → Eventos agrupados por tipo y tiempo
GET /api/stats/top-ips      → TOP atacantes por IP
GET /api/stats/mitre        → Distribución de tácticas MITRE
GET /api/sse                → Stream de eventos en tiempo real
```

### Limitaciones Actuales
- Métricas de demo parcialmente hardcodeadas — producción requiere eventos reales
- No hay personalización de widgets (drag & drop — en roadmap)
- Sin exportación de reports en PDF (roadmap Q2)

### Roadmap
- Widgets personalizables por analista
- Exportación de reportes ejecutivos en PDF
- Comparativa de períodos (semana actual vs. semana anterior)
- Drill-down desde widget → logs filtrados correspondientes

---

## 2. Attack Map

### Propósito
Visualización geoespacial en tiempo real de los ataques dirigidos a la organización. Permite identificar patrones geográficos, campañas coordinadas y orígenes de amenaza.

### Arquitectura
```
Honeypot SSH/HTTP → GeoIP enrichment → PostgreSQL → API → React + Leaflet/D3
                                                          ↑
                                                   SSE broadcast (eventos nuevos)
```

### Características
- Mapa mundial con pins geolocalizados de IPs atacantes
- Colores por severidad: rojo (crítico), naranja (alto), amarillo (medio)
- Animación de "ataque en vuelo" para eventos recientes
- Filtros: por tipo de ataque, período, severidad
- Panel lateral con detalle de IP: geolocalización, ASN, historial, IOC lookup
- Modo histórico: reproducción de ataques en el tiempo

### Fuentes de Datos
- Honeypot SSH/HTTP (ataques en vivo)
- Authentication failures (IPs de intentos de login)
- Ingestion API (fuentes externas)
- Threat Intelligence (IOCs conocidos pintados en el mapa)

### APIs
```
GET /api/attackmap/live      → Eventos activos en tiempo real
GET /api/attackmap/history   → Historial filtrable por período
GET /api/attackmap/heatmap   → Datos de densidad para heatmap
GET /api/attackmap/stats     → Estadísticas de países y tipos
```

### Enriquecimiento de IPs
Cada IP atacante se enriquece automáticamente con:
- País + ciudad (GeoIP database)
- ISP / ASN (Autonomous System Number)
- Tipo de red: datacenter, VPN, TOR, residencial
- Score de reputación (si disponible en Threat Intel)

### Limitaciones
- GeoIP tiene precisión de ciudad (~90% a nivel país, ~70% a nivel ciudad)
- IPs de TOR/VPN aparecen con geolocalización del exit node, no del atacante real
- Animaciones pueden ser pesadas en pantallas con 1000+ eventos activos

### Roadmap
- Clústering automático para alta densidad de eventos
- Correlación visual: líneas conectando IPs de la misma campaña
- Export de mapa en PNG para reportes ejecutivos
- Integración con ASN reputation databases

---

## 3. Threat Intelligence

### Propósito
Base de datos central de indicadores de compromiso (IOCs) y conocimiento de amenazas. Correlaciona automáticamente IOCs con eventos de seguridad en tiempo real.

### Arquitectura
```
Fuentes → Ingesta → MongoDB (threat_indicators) → Correlation → Alerting
```

### Modelo de Datos (MongoDB)
```javascript
{
  type:           'ip' | 'domain' | 'hash' | 'email' | 'url' | 'cidr',
  value:          'string',
  severity:       'critical' | 'high' | 'medium' | 'low',
  confidence:     0-100,
  tags:           ['tor-exit-node', 'scanner', 'ransomware', ...],
  source:         'honeypot' | 'manual' | 'feed' | 'incident',
  first_seen:     Date,
  last_seen:      Date,
  hit_count:      Number,
  organization_id: Number,  // aislamiento multi-tenant
  ttl_expires:    Date
}
```

### Tipos de Indicadores

| Tipo | Ejemplo | Detección |
|---|---|---|
| IP | 185.220.101.45 | Match en security_logs.ip_address |
| CIDR | 185.220.0.0/16 | Range match en IPs |
| Dominio | c2-malware.evil.com | HTTP host headers, DNS queries |
| Hash MD5 | d41d8cd98f00b204... | File integrity (roadmap) |
| Hash SHA256 | e3b0c44298fc1c14... | File integrity (roadmap) |
| Email | phishing@evil.com | Auth attempts with matching email |
| URL | http://evil.com/dl | Request path matching |

### Correlación Automática
Cuando un evento de seguridad llega al sistema, se comprueba automáticamente si la IP origen coincide con algún IOC en la base de datos. Si hay coincidencia:
1. La alerta generada se eleva en severidad
2. Se añade contexto de Threat Intelligence a la alerta
3. SOAR puede ejecutar un playbook específico para IOCs conocidos

### APIs
```
GET  /api/threats              → Lista de IOCs (paginada, filtrable)
POST /api/threats              → Crear nuevo IOC (analyst+)
GET  /api/threats/:id          → Detalle de IOC
PUT  /api/threats/:id          → Actualizar IOC
DELETE /api/threats/:id        → Eliminar IOC (admin)
POST /api/threats/lookup       → Lookup: ¿está esta IP/domain en la DB?
GET  /api/threats/stats        → Estadísticas por tipo y severidad
```

### Limitaciones
- No hay integración automática con feeds externos (VirusTotal, AbuseIPDB) — en roadmap
- El lookup de CIDR ranges es computacionalmente intensivo para grandes datasets
- Sin soporte STIX/TAXII de forma nativa (roadmap)

### Roadmap
- Integración con VirusTotal API (enrichment automático)
- Integración con AbuseIPDB (feeds de IPs maliciosas)
- Soporte STIX 2.x / TAXII 2.1 para intercambio de inteligencia
- Auto-expire de IOCs con baja confianza
- Confidence decay automático para IOCs antiguos

---

## 4. Threat Hunting

### Propósito
Módulo de búsqueda proactiva de amenazas. Permite a los analistas ejecutar queries complejos sobre los logs de seguridad para identificar actividad maliciosa que no ha sido detectada por las reglas automáticas.

### Arquitectura
```
Analyst → Query Builder UI → REST API → PostgreSQL + Elasticsearch → Results
```

### Capacidades de Búsqueda
- Búsqueda full-text sobre logs y metadatos de eventos
- Filtros combinables: tipo de evento, severidad, IP, usuario, país, período
- Elasticsearch para búsquedas de texto libre eficientes
- PostgreSQL para queries estructurados con joins
- Guardado de búsquedas frecuentes (saved hunts)
- Exportación de resultados en CSV/JSON

### Elasticsearch Integration
```javascript
// Ejemplo: buscar eventos relacionados con una IP sospechosa
GET /api/search?q=185.220.101&filters[event_type]=LOGIN_FAILURE&period=7d

// Backend: ElasticsearchService ejecuta:
{
  "query": {
    "bool": {
      "must": [
        { "match": { "ip_address": "185.220.101" } }
      ],
      "filter": [
        { "term": { "event_type": "LOGIN_FAILURE" } },
        { "range": { "created_at": { "gte": "now-7d" } } }
      ]
    }
  }
}
```

### APIs
```
GET /api/search                → Búsqueda full-text + filtros
GET /api/logs                  → Logs de seguridad paginados
GET /api/logs/stats            → Estadísticas de logs
GET /api/threats               → IOCs para correlación manual
```

### Limitaciones
- Elasticsearch es opcional (requiere infraestructura adicional); sin ES, la búsqueda cae a PostgreSQL LIKE queries
- No hay lenguaje de query tipo KQL/SPL (Kibana Query Language o Splunk Processing Language)
- Sin visualizaciones avanzadas tipo pivot table

### Roadmap
- Query language propio tipo KQL simplificado
- Saved hunts con notificaciones automáticas
- Hunt templates predefinidos (MITRE ATT&CK hunt library)
- Integración con Jupyter Notebooks para análisis avanzado

---

## 5. AI Analysis

### Propósito
Motor de análisis de comportamiento basado en estadística avanzada. Detecta anomalías comportamentales que no coinciden con patrones de ataque conocidos pero que estadísticamente desvían del comportamiento normal de usuarios y sistemas.

### Arquitectura
```
EventStream → FeatureExtractor → BaselineEngine → AnomalyScorer → AlertGenerator
                                                ↑
                                         Redis (baseline cache)
```

### Metodología: Behavioral Baselining
1. **Construcción de baseline:** Para cada usuario, el sistema aprende su comportamiento típico durante un período de observación (7-30 días):
   - Horarios de login habituales
   - IPs y rangos de red utilizados
   - Países de acceso habituales
   - Dispositivos registrados
   - Velocidad típica de consumo de API

2. **Extracción de features:** Para cada nuevo evento, se extraen 15+ señales normalizadas:
   - hora del día (normalizada 0-1)
   - ¿es fin de semana? (0 o 1)
   - ¿es país nuevo? (0 o 1)
   - ¿es IP nueva? (0 o 1)
   - z-score de la hora respecto al baseline del usuario
   - velocidad de impossible travel (km/h si hay 2 logins recientes)

3. **Scoring de anomalía:** Se calcula el z-score de la desviación respecto al baseline y se normaliza a una escala 0-100.

### Algoritmos Estadísticos Implementados

| Algoritmo | Uso | Implementación |
|---|---|---|
| Mean + StdDev | Baseline de horarios y frecuencia | `mean(arr)`, `stdev(arr)` en `aiCorrelationEngine.js` |
| Z-score | Detección de desviación del comportamiento | `zscore(value, mean, stdev)` |
| Impossible Travel | Velocidad geográfica > 900 km/h | Distancia Haversine / tiempo transcurrido |
| Clustering (roadmap) | Agrupación de patrones de ataque | K-means sobre feature vectors |
| Anomaly Detection (roadmap) | Isolation Forest / Autoencoder | PyTorch/TF integración futura |

### Feature Vector Completo
```javascript
{
  hour_of_day:       0.604,  // 14:30 / 23 = 0.63
  is_business_hours: 1,
  is_weekend:        0,
  is_new_country:    1,      // ← Anomalía: país nunca visto
  is_new_city:       1,      // ← Anomalía: ciudad nueva
  is_new_ip:         1,      // ← Anomalía: IP nueva
  is_datacenter_ip:  1,      // ← Sospechoso: cloud provider
  login_velocity:    0.92,   // ← Alta velocidad de logins
  failed_ratio_1h:   0.15,   // ratio de fallos recientes
  hour_zscore:       0.8,    // dentro del rango normal
  travel_speed_kmh:  12500,  // ← CRITICAL: impossible travel
  device_mismatch:   1,      // ← Dispositivo diferente al habitual
  user_agent_mismatch: 0
}
```

### APIs
```
GET /api/ai/summary           → Resumen de análisis de riesgo
GET /api/ai/anomalies         → Lista de anomalías detectadas
GET /api/ai/baselines/:userId → Baseline de comportamiento del usuario
GET /api/ai/risk-score/:userId → Score de riesgo actual del usuario
```

### Limitaciones
- El baseline requiere 7-30 días de datos para ser fiable (cold start problem)
- Los modelos estadísticos tienen mayor tasa de falsos positivos que modelos ML entrenados
- Sin soporte para algoritmos de ML supervisado (requeriría dataset etiquetado)
- El análisis se hace event-by-event, sin análisis de series temporales continuo

### Roadmap
- Integración con modelos ML pre-entrenados (scikit-learn, TF Lite)
- Dataset de entrenamiento generado automáticamente desde los eventos de la plataforma
- Isolation Forest para detección de anomalías multidimensional
- Explicabilidad de predicciones (SHAP values)

---

## 6. Incidents

### Propósito
Gestión completa del ciclo de vida de incidentes de seguridad. Desde la creación automática por el Correlation Engine hasta el cierre con post-mortem documentado.

### Estados del Incidente
```
new → assigned → in_progress → contained → resolved → closed
                             ↘ escalated →
```

### Campos del Incidente
- `title`: Título descriptivo (auto-generado o manual)
- `summary`: Descripción detallada del incidente
- `severity`: critical / high / medium / low
- `status`: Estado actual en el workflow
- `tags`: Etiquetas (auto-detected, brute-force, honeypot, etc.)
- `tlp`: Traffic Light Protocol (RED / AMBER / GREEN / WHITE)
- `assigned_to`: Analista responsable
- `timeline`: Array de `incident_events` con todas las acciones

### Timeline Inmutable
Cada acción sobre un incidente genera un `incident_event`:
```sql
INSERT INTO incident_events (incident_id, actor, action)
VALUES ($1, 'Correlation Engine', 'Auto-detected from 185.x.x.x');
```
El timeline es append-only — nunca se borran eventos del timeline.

### APIs
```
GET    /api/incidents           → Lista de incidentes (filtros, paginación)
POST   /api/incidents           → Crear incidente manual (analyst+)
GET    /api/incidents/:id       → Detalle + timeline completo
PATCH  /api/incidents/:id       → Actualizar estado/severidad (analyst+)
POST   /api/incidents/:id/events → Añadir entrada al timeline (analyst+)
DELETE /api/incidents/:id       → Eliminar incidente (admin only)
```

### Limitaciones
- Sin integración nativa con ticketing systems (Jira, ServiceNow) — webhook available
- Sin SLA timers automáticos en la UI
- Sin plantillas de post-mortem estructurado

### Roadmap
- SLA countdown timer por severidad
- Integración Jira bidireccional
- Plantilla de post-mortem estructurada
- Vinculación entre incidentes relacionados

---

## 7. Alerts

### Propósito
Cola de alertas de seguridad priorizada automáticamente. Centraliza todas las alertas generadas por el Detection Engine con contexto completo para triaje eficiente.

### Tipos de Alerta

| Tipo | Origen | Severidad Típica |
|---|---|---|
| BRUTE_FORCE | Auth failures > umbral | HIGH |
| CREDENTIAL_SPRAY | Auth failures multi-usuario | HIGH |
| HONEYPOT_HIT | Honeypot events | MEDIUM-HIGH |
| XSS_ATTEMPT | attackDetection middleware | MEDIUM |
| SQLI_ATTEMPT | attackDetection middleware | HIGH |
| PATH_TRAVERSAL | attackDetection middleware | MEDIUM |
| IMPOSSIBLE_TRAVEL | AI Engine | HIGH |
| NEW_DEVICE | Risk Engine | LOW-MEDIUM |
| BANNED_IP_LOGIN | autoban middleware | HIGH |
| API_ABUSE | Rate limiter excess | MEDIUM |

### Flujo de Triaje
```
Alert generada → Cola de alertas (ordenada por severity) → Analista revisa
                                                        → Acknowledge (asignar)
                                                        → Investigate (añadir notas)
                                                        → Resolve / False Positive
                                                        → (opcional) Escalar a Incidente
```

### APIs
```
GET    /api/alerts              → Lista de alertas paginadas
PATCH  /api/alerts/:id/status   → Actualizar estado (analyst+)
POST   /api/alerts/:id/escalate → Escalar a incidente (analyst+)
DELETE /api/alerts/:id          → Eliminar alerta (admin)
```

---

## 8. Honeypot

### Propósito
Sistema de trampas activas que captura, analiza y genera inteligencia a partir de atacantes reales que interactúan con servicios falsos desplegados específicamente para detectar actividad maliciosa.

### Arquitectura
```
Internet
    │
    ├── SSH Honeypot (Puerto 2222) → ssh-honeypot.js → capture-module.js
    │                                                       ↓
    └── HTTP Honeypot (Puerto 8888) → index.js         api-integration.js
                                           ↓                ↓
                                    capture-module.js   POST /api/honeypot/events
                                                            ↓
                                                      honeypotService.js
                                                            ↓
                                               Detection Engine + Threat Intel
```

### Servicios de Honeypot

#### SSH Honeypot
- Acepta conexiones SSH en puerto configurable
- Captura: IP origen, nombre de usuario intentado, contraseña intentada
- Genera: eventos `HONEYPOT_SSH_AUTH`
- **Seguridad:** Nunca permite acceso real; sandbox completamente aislado
- **Inteligencia capturada:** Listas de credenciales usadas por atacantes, patrones de timing

#### HTTP Honeypot
- Simula aplicación web con paths típicos de vulnerabilidades
- Paths monitorizados: `/admin`, `/wp-admin`, `/.env`, `/config.php`, `/backup.zip`
- Captura: IP, User-Agent, path solicitado, payload del body si existe
- Genera: eventos `HONEYPOT_HTTP_PROBE`
- **Inteligencia capturada:** Herramientas de scanning utilizadas (User-Agent), payloads de explotación

### Integración con el Ecosistema
Cada evento del honeypot fluye automáticamente hacia:
1. **Security Logs** → persistido en PostgreSQL
2. **Detection Engine** → evalúa reglas Sigma
3. **Threat Intelligence** → IP añadida como IOC
4. **Attack Map** → pintada en el mapa geoespacial
5. **SOAR** → playbooks evaluados automáticamente

### APIs
```
POST /api/honeypot/events     → Ingestar evento del honeypot (internal)
GET  /api/honeypot/events     → Lista de capturas (analyst+)
GET  /api/honeypot/stats      → Estadísticas de actividad
GET  /api/honeypot/credentials → Credenciales capturadas (admin)
```

### Consideraciones de Seguridad para Deployment
- Desplegar en red aislada o VLAN separada
- No conectar a la misma red que sistemas de producción
- Los servicios honeypot no tienen acceso a datos reales
- Usar contenedor Docker aislado con recursos limitados

### Limitaciones
- SSH honeypot básico: no simula shell post-autenticación
- HTTP honeypot no genera respuestas dinámicas complejas
- Sin soporte para honeypots de base de datos (MySQL, PostgreSQL falsos)

### Roadmap
- Shell interactivo post-autenticación SSH para observar TTPs del atacante
- HTTP honeypot con respuestas dinámicas tipo webshell falso
- Honeypot de base de datos (credenciales de MySQL/PostgreSQL falsos)
- Deception tokens en documentos (canary tokens)

---

## 9. Security Logs

### Propósito
Registro centralizado de todos los eventos de seguridad del sistema. Almacén primario para investigación, threat hunting y generación de reportes de compliance.

### Almacenamiento
- **PostgreSQL:** `security_logs` table — queries estructurados, joins, aggregaciones
- **MongoDB:** `security_logs` collection — logs de alto volumen, schema flexible
- **Elasticsearch:** Índice searchable — búsqueda full-text, analytics

### Tipos de Eventos Registrados

| Categoría | Eventos |
|---|---|
| Autenticación | LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, MFA_CHALLENGE, MFA_SUCCESS, MFA_FAILURE |
| Honeypot | HONEYPOT_SSH_AUTH, HONEYPOT_HTTP_PROBE, HONEYPOT_EXPLOIT_ATTEMPT |
| API Security | XSS_ATTEMPT, SQLI_ATTEMPT, PATH_TRAVERSAL, API_ABUSE, RATE_LIMIT_HIT |
| Acceso | ACCESS_DENIED, UNAUTHORIZED_ACCESS, PRIVILEGE_ESCALATION_ATTEMPT |
| Sistema | BACKUP_CREATED, CONFIG_CHANGED, SYSTEM_ERROR |

### Retención y Compliance
- Retención configurable por plan: 30 días (free) → 90 días (startup) → 365 días (enterprise)
- Logs en MongoDB son append-only (no se pueden modificar)
- Audit trail separado garantiza trazabilidad de todas las modificaciones

### APIs
```
GET /api/logs                  → Logs paginados con filtros
GET /api/logs/stats            → Estadísticas por tipo, severidad, período
GET /api/logs/export           → Exportación en JSON/CSV
GET /api/search                → Búsqueda full-text vía Elasticsearch
```

---

## 10. Audit Logs

### Propósito
Registro inmutable de todas las acciones administrativas y de seguridad realizadas por usuarios de la plataforma. Diferente de Security Logs: los Audit Logs registran lo que los usuarios hacen *dentro* de la plataforma, no los eventos externos.

### Inmutabilidad
- Almacenados en MongoDB sin métodos UPDATE ni DELETE en el modelo
- Ningún endpoint de la API expone DELETE sobre audit_logs
- Único mecanismo de eliminación: TTL automático (mínimo 365 días)
- Estructura append-only: un documento por evento

### Casos de Uso
- **Compliance:** Demostrar a auditores que las acciones administrativas están registradas
- **Forense:** Reconstruir la secuencia de eventos en un incidente
- **Responsabilidad:** Identificar qué usuario realizó qué acción
- **Integridad:** Detectar si un atacante modificó configuraciones

### APIs
```
GET /api/audit                 → Logs de auditoría paginados (analyst+)
GET /api/audit/user/:id        → Acciones de un usuario específico (admin)
GET /api/audit/export          → Exportación para auditorías externas (admin)
```

---

## 11. Sessions

### Propósito
Gestión y monitorización de sesiones de usuario activas. Permite ver quién está conectado, desde dónde, con qué dispositivo y revocar sesiones sospechosas.

### Información de Sesión
- User ID + email + rol
- IP de origen + geolocalización
- User-Agent + dispositivo
- Tiempo de inicio + último acceso
- Organización (multi-tenant)

### APIs
```
GET    /api/sessions           → Sesiones activas del usuario actual
GET    /api/sessions/all       → Todas las sesiones activas (admin)
DELETE /api/sessions/:id       → Revocar sesión específica
DELETE /api/sessions/user/:id  → Revocar todas las sesiones de un usuario
```

---

## 12. Devices

### Propósito
Registro de dispositivos de confianza asociados a cada usuario. Contribuye al Risk Engine para reducir el score de riesgo de dispositivos conocidos.

### Funcionamiento
1. En el primer login desde un dispositivo, se calcula un fingerprint hash (SHA-256 de características del dispositivo)
2. El dispositivo se registra como "untrusted" por defecto
3. Un admin o el usuario propio puede marcar el dispositivo como "trusted"
4. Los logins desde dispositivos trusted reciben -20 pts en el Risk Score

### APIs
```
GET    /api/devices            → Dispositivos del usuario actual
GET    /api/devices/all        → Todos los dispositivos (admin)
PATCH  /api/devices/:id/trust  → Marcar como confiable (admin)
DELETE /api/devices/:id        → Eliminar dispositivo
```

---

## 13. RBAC

### Propósito
Control de acceso basado en roles con jerarquía de 4 niveles que gobierna qué acciones puede realizar cada usuario en cada módulo de la plataforma.

### Jerarquía de Roles
```
admin (4) > analyst (3) > responder (2) > viewer (1)
```

### Matriz de Permisos por Módulo

| Módulo | Viewer | Responder | Analyst | Admin |
|---|---|---|---|---|
| Dashboard | R | R | R | R+W |
| Alerts | R | R+Ack | R+W | R+W+D |
| Incidents | R | R+Actions | R+W | R+W+D |
| Attack Map | R | R | R | R+W |
| Threat Intel | R | R | R+W | R+W+D |
| Threat Hunt | R | R | R+W | R+W |
| AI Analysis | R | R | R | R+W |
| Logs | R | R | R | R |
| Audit Logs | - | - | R | R |
| Sessions | Own | Own+R | R+W | R+W+D |
| Devices | Own | Own | R | R+W+D |
| Users | - | - | R | R+W+D |
| Playbooks | - | - | R+W | R+W+D |
| Organizations | - | - | - | R+W+D |

*R = Read, W = Write, D = Delete, Ack = Acknowledge, Own = Solo propios*

### Implementación Técnica
- **Backend:** `minRole()` middleware en cada ruta
- **Frontend:** `usePermission()` hook + `PermissionGate` component
- **ReadOnly:** `readOnly()` middleware bloquea POST/PUT/PATCH/DELETE para viewers
- **ViewOnly badge:** Viewers ven badge "View Only" en el header de la UI

---

## 14. Detection Engine

### Propósito
Motor de detección basado en reglas Sigma mapeadas al framework MITRE ATT&CK. Evalúa cada evento de seguridad contra las reglas definidas y genera alertas cuando se detectan amenazas.

### Reglas Implementadas (12+)
Ver tabla completa en [Operaciones SOC → Sección 2.2](../soc/operaciones-soc.md)

### Características
- 12+ reglas Sigma built-in en memoria (sin filesystem access requerido)
- Soporte para reglas custom cargadas desde archivos YAML (extensible)
- Ventanas temporales configurables (10 min, 15 min, 30 min)
- Agrupación por IP, usuario, o combinación
- Cooldown anti-duplicados por IP y tipo de regla
- Mapeo automático a tácticas y técnicas MITRE ATT&CK

### Arquitectura de Evaluación
```javascript
// Para cada evento entrante:
1. FieldExtractor(event) → context object
2. RuleEvaluator(context, rules) → matching rules
3. MitreMapper(matchingRules) → tactic + technique
4. AlertCreator(alert, mitreMapping) → INSERT alerts
5. SSE.emit('alert', alertData) → broadcast
```

---

## 15. Correlation Engine

### Propósito
Motor de correlación de eventos que identifica patrones de ataque multi-evento y crea incidentes automáticamente cuando los eventos individuales alcanzan umbrales de correlación.

### Reglas de Correlación
- **BRUTE_FORCE:** ≥5 LOGIN_FAILURE / misma IP / 10 minutos
- **CREDENTIAL_SPRAY:** ≥10 LOGIN_FAILURE / ≥5 usuarios distintos / 15 minutos
- **HONEYPOT_SWEEP:** ≥3 hits honeypot / misma IP / 5 minutos
- **MULTI_VECTOR:** Honeypot + Login Failure + Threat / misma IP / 30 minutos

### Diferencia con Detection Engine
- **Detection Engine:** Evalúa reglas contra **un solo evento** (stateless)
- **Correlation Engine:** Agrega **múltiples eventos** en el tiempo y crea **incidentes** (stateful)

---

## 16. Risk Engine

### Propósito
Sistema de scoring de riesgo adaptativo que calcula un score 0-100 para cada intento de autenticación y determina el nivel de verificación requerido (ninguno, OTP, WebAuthn).

### Factores de Scoring

| Factor | Puntos | Dirección |
|---|---|---|
| Dispositivo de confianza | -20 | Reduce riesgo |
| Dispositivo desconocido | +20 | Aumenta riesgo |
| Sin fingerprint | +15 | Aumenta riesgo |
| IP nunca vista | +15 | Aumenta riesgo |
| IP en banned_ips | +40 | Aumenta riesgo |
| Fallos previos (por IP, 24h) | +5 cada uno (max +20) | Aumenta riesgo |
| País diferente al habitual | +15 | Aumenta riesgo |
| Impossible travel | +30 | Aumenta riesgo |
| Hora inusual (00:00-06:00) | +10 | Aumenta riesgo |
| Rol privilegiado (admin/analyst) | +10 | Aumenta riesgo |
| User-Agent diferente al habitual | +10 | Aumenta riesgo |

### Umbrales y Decisiones

| Score | Nivel | Decisión |
|---|---|---|
| 0-30 | LOW | Login directo, sin MFA adicional |
| 31-60 | MEDIUM | Requiere Email OTP |
| 61-80 | HIGH | Requiere WebAuthn/FIDO2 o TOTP |
| 81-100 | CRITICAL | Bloqueo + alerta SOC |

---

## 17. SOAR

### Propósito
Motor de automatización de respuesta a incidentes. Ejecuta playbooks configurables automáticamente cuando se detectan incidentes, eliminando la necesidad de intervención manual para respuestas predecibles.

### Acciones Implementadas (10)

| Acción | Descripción | Parámetros |
|---|---|---|
| `ban_ip` | Bloquear IP en banned_ips + Redis cache | duration_minutes, reason |
| `unban_ip` | Eliminar bloqueo de IP | ip_address |
| `disable_account` | Suspender cuenta de usuario | user_id, duration_minutes, reason |
| `revoke_user_sessions` | Invalidar todos los JWT del usuario | user_id |
| `create_incident` | Crear incidente automáticamente | title, summary, severity, tags |
| `add_ioc` | Añadir IP/dominio a Threat Intelligence | value, type, severity, confidence |
| `notify_webhook` | HTTP POST a URL externa (Slack/Teams/PagerDuty) | url, payload_template |
| `send_email` | Enviar email de notificación | to, subject, template |
| `isolate_endpoint` | Aislar endpoint via EDR agent | device_id |
| `run_enrichment` | GeoIP + ASN enrichment de IP | ip_address |

### Estructura de Playbook
```json
{
  "name": "Brute Force Auto-Response",
  "enabled": true,
  "trigger": {
    "event_type": "BRUTE_FORCE_DETECTED",
    "severity": ["high", "critical"]
  },
  "conditions": [
    { "field": "ip_reputation", "operator": "not_in", "value": "whitelist" }
  ],
  "actions": [
    {
      "type": "ban_ip",
      "params": { "duration_minutes": 1440, "reason": "Automated brute force response" }
    },
    {
      "type": "create_incident",
      "params": { "severity": "high", "tags": ["brute-force", "auto-detected"] }
    },
    {
      "type": "notify_webhook",
      "params": { "url": "{{org.slack_webhook}}", "message": "Brute force detected from {{ip}}" }
    }
  ]
}
```

### APIs
```
GET    /api/playbooks          → Lista de playbooks
POST   /api/playbooks          → Crear playbook (analyst+)
PUT    /api/playbooks/:id      → Actualizar playbook
DELETE /api/playbooks/:id      → Eliminar playbook (admin)
POST   /api/playbooks/:id/test → Probar playbook con evento simulado
```

---

*Documento generado por: Principal Cybersecurity Architect + Technical Writer*  
*RobenGate Sentinel v2.0.0 — Junio 2026*
