# Flujo del Pipeline SIEM — RobenGate Sentinel

**Módulos:** Detection Engine, Correlation Engine, AI Correlation  
**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Arquitectura del Pipeline SIEM

```mermaid
flowchart LR
    subgraph Fuentes["Fuentes de Eventos"]
        BE[Backend API\nAuth/Access/CRUD]
        HP[Honeypot\nSSH + HTTP]
        AGENTS[Agentes EDR\nEndpoints]
        INGEST[Ingestion API\n/api/ingest]
    end

    subgraph Pipeline["Pipeline de Ingesta"]
        PARSER[Parser\nNormalización]
        ENRICHER[Enricher\nGeoIP + ASN + IOC]
        NORMALIZER[Normalizer\nEsquema común]
    end

    subgraph Storage["Almacenamiento"]
        PG[(PostgreSQL\nsecurity_logs)]
        MG[(MongoDB\nsecurity_logs)]
    end

    subgraph Detection["Motor de Detección"]
        DETECT[Detection Engine\nReglas + Umbrales]
        CORRELATE[Correlation Engine\nVentana temporal]
        AI[AI Correlation\nHeurístico]
    end

    subgraph Output["Salida"]
        ALERTS[Alertas]
        INCIDENTS[Incidentes]
        SSE[SSE Real-time\nFrontend]
        AUDIT[Audit Trail\nMongoDB]
    end

    BE --> Pipeline
    HP --> Pipeline
    AGENTS --> Pipeline
    INGEST --> Pipeline

    PARSER --> ENRICHER --> NORMALIZER
    NORMALIZER --> Storage
    NORMALIZER --> Detection

    DETECT --> CORRELATE --> AI
    AI --> ALERTS
    AI --> INCIDENTS
    ALERTS --> SSE
    INCIDENTS --> SSE
    ALERTS --> AUDIT
    INCIDENTS --> AUDIT
```

---

## 1. Pipeline de Ingesta

### 1.1 Parser — Normalización

**Archivo:** `backend/src/ingestion/parser.js`

```
Input:  Evento raw de cualquier fuente
Output: Evento con esquema normalizado

Esquema normalizado:
{
  eventId: UUID,
  timestamp: ISO8601,
  source: 'backend|honeypot|agent|external',
  type: 'login|access|command|file|network',
  severity: 'info|low|medium|high|critical',
  ip: '1.2.3.4',
  userId: 'uuid|null',
  action: 'string',
  result: 'success|failure|blocked',
  metadata: { ... }
}
```

### 1.2 Enricher — Enriquecimiento

**Archivo:** `backend/src/ingestion/enricher.js`

```
Añade a cada evento:
  - geoLocation: { country, city, lat, lon }  → MaxMind GeoIP2
  - asn: { number, name, type }               → ASN lookup
  - iocMatch: { matched: bool, indicator }    → MongoDB threat_indicators
  - userHistory: { sessionCount, riskLevel }  → PostgreSQL
  - deviceInfo: { trusted: bool, platform }   → PostgreSQL devices
```

### 1.3 Normalizer — Schema Final

**Archivo:** `backend/src/ingestion/normalizer.js`

Aplica transformaciones finales y almacena en:
- **PostgreSQL** `security_logs` — para queries relacionales
- **MongoDB** `security_logs` — para búsqueda full-text + TTL

---

## 2. Motor de Detección

### 2.1 Detection Engine

**Archivo:** `backend/src/services/detectionEngine.js`

El Detection Engine evalúa **reglas de detección** contra cada evento normalizado:

```mermaid
flowchart TD
    EVENT[Evento Normalizado] --> RULES[Evaluar Reglas]
    
    RULES --> R1{Brute Force\n>5 fails/min/IP}
    RULES --> R2{Login fuera\nde horario}
    RULES --> R3{Acceso a recurso\nrestringido}
    RULES --> R4{Command injection\ndetectado}
    RULES --> R5{IOC match\nen indicadores}
    RULES --> R6{Privilege escalation\npattern}
    
    R1 -->|true| ALERT1[Alerta: BRUTE_FORCE\nSeveridad: HIGH]
    R2 -->|true| ALERT2[Alerta: OFF_HOURS_ACCESS\nSeveridad: MEDIUM]
    R3 -->|true| ALERT3[Alerta: UNAUTHORIZED_ACCESS\nSeveridad: HIGH]
    R4 -->|true| ALERT4[Alerta: INJECTION_ATTEMPT\nSeveridad: CRITICAL]
    R5 -->|true| ALERT5[Alerta: IOC_MATCH\nSeveridad: HIGH]
    R6 -->|true| ALERT6[Alerta: PRIV_ESCALATION\nSeveridad: CRITICAL]
    
    ALERT1 & ALERT2 & ALERT3 & ALERT4 & ALERT5 & ALERT6 --> CORRELATE[→ Correlation Engine]
```

### 2.2 Correlation Engine

**Archivo:** `backend/src/services/correlationEngine.js`

El Correlation Engine agrupa alertas relacionadas dentro de una **ventana temporal** (por defecto 15 minutos) para identificar ataques coordinados:

```mermaid
flowchart TD
    ALERTS[Stream de Alertas] --> WINDOW[Ventana temporal\n15 minutos]
    
    WINDOW --> GROUP{¿Mismo\ngrupo de ataque?}
    
    GROUP -->|Misma IP + patrón similar| CLUSTER[Cluster de alertas]
    GROUP -->|Múltiples IPs + mismo usuario| CLUSTER
    GROUP -->|Secuencia de acciones sospechosas| CLUSTER
    GROUP -->|No relacionadas| INDIVIDUAL[Alertas individuales]
    
    CLUSTER --> INCIDENT{¿Umbral\nalcanzado?}
    INCIDENT -->|>3 alertas cluster| CREATE_INCIDENT[Crear Incidente\nauto-correlacionado]
    INCIDENT -->|< umbral| ENRICH_ALERT[Enriquecer alerta\ncon contexto]
    
    CREATE_INCIDENT --> SOAR[→ SOAR Engine\nPlaybook automático]
    CREATE_INCIDENT --> SSE_ALERT[→ SSE\nNotificación tiempo real]
```

### 2.3 AI Correlation Engine

**Archivo:** `backend/src/services/aiCorrelationEngine.js`

Motor heurístico que detecta patrones de ataque complejos:

```
Algoritmos implementados:
  1. Anomaly detection por Z-score
     → Desviaciones estadísticas de comportamiento normal
  
  2. Temporal pattern matching
     → Secuencias de eventos con timing sospechoso
  
  3. Kill chain mapping
     → Mapeo de eventos a fases MITRE ATT&CK:
        Reconnaissance → Weaponization → Delivery → Exploitation
        → Installation → C2 → Exfiltration
  
  4. Behavioral baseline
     → Baseline por usuario/IP (30 días de historia)
     → Alertar cuando se desvía significativamente
```

---

## 3. Flujo de Alertas e Incidentes

```mermaid
stateDiagram-v2
    [*] --> NUEVA: Detección automática

    NUEVA --> REVISANDO: Analista toma el caso
    REVISANDO --> FALSO_POSITIVO: Es legítimo
    REVISANDO --> CONFIRMADA: Amenaza real
    CONFIRMADA --> ESCALADA: Requiere respuesta urgente
    CONFIRMADA --> EN_PROGRESO: SOAR activa playbook
    EN_PROGRESO --> RESUELTA: Amenaza neutralizada
    ESCALADA --> RESUELTA
    FALSO_POSITIVO --> [*]
    RESUELTA --> CERRADA: Post-mortem completado
    CERRADA --> [*]
```

---

## 4. SSE Real-Time

Los eventos críticos se emiten en tiempo real al frontend vía Server-Sent Events:

**Endpoint:** `GET /api/events`  
**Auth:** Bearer JWT

```
Tipos de eventos SSE:
  - NEW_ALERT          → Nueva alerta detectada
  - NEW_INCIDENT       → Incidente creado/escalado
  - HONEYPOT_ATTACK    → Ataque capturado en honeypot
  - RISK_SCORE_HIGH    → Usuario con score de riesgo alto
  - BAN_APPLIED        → IP baneada automáticamente
  - SYSTEM_HEALTH      → Métricas de salud
```

```javascript
// Frontend: uso del SSE
const es = new EventSource('/api/events', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
es.addEventListener('NEW_ALERT', (e) => {
  const alert = JSON.parse(e.data);
  showToastNotification(alert);
  updateDashboardMetrics();
});
```
