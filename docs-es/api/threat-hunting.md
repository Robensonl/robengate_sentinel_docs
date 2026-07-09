# API — Threat Hunting y Búsqueda

**Base URL:** `/api/search`  
**Auth mínima:** `analyst`  
**Backend:** Elasticsearch (opcional) con fallback a PostgreSQL full-text  

---

## Descripción General

El módulo de Threat Hunting permite búsquedas avanzadas sobre logs de seguridad, analíticas agregadas y lookups de IOCs. Usa Elasticsearch cuando está disponible, con fallback a PostgreSQL.

```mermaid
graph LR
    Analyst[Analista\nThreat Hunter] --> Search[/api/search]
    Search --> ES{Elasticsearch\nDisponible?}
    ES -->|Sí| ESIndex[(ES Index\nlogs)]
    ES -->|No| PG[(PostgreSQL\nsecurity_logs)]
    ESIndex --> Results[Resultados]
    PG --> Results
```

---

## Endpoints

### GET /api/search/logs

**Descripción:** Full-text search sobre logs de seguridad.  
**Auth:** `analyst+`

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `q` | string | Query de búsqueda (texto libre) |
| `from` | ISO8601 | Desde fecha |
| `to` | ISO8601 | Hasta fecha |
| `severity` | string | Filtrar por severidad |
| `page` | number | Página |
| `limit` | number | Por página (max: 100) |

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 58432,
        "event_type": "SQL_INJECTION_ATTEMPT",
        "severity": "critical",
        "ip_address": "45.148.10.22",
        "highlight": "Detected <em>SQL injection</em> payload: OR 1=1--",
        "metadata": {
          "endpoint": "/api/users",
          "payload": "' OR 1=1--"
        },
        "created_at": "2026-06-01T14:00:00Z"
      }
    ],
    "total": 47,
    "took_ms": 23,
    "engine": "elasticsearch"
  }
}
```

---

### GET /api/search/analytics

**Descripción:** Analíticas agregadas para threat hunting.  
**Auth:** `analyst+`

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `from` | ISO8601 | Desde fecha |
| `to` | ISO8601 | Hasta fecha |
| `aggregation` | string | `by_ip\|by_country\|by_event_type\|by_hour` |
| `limit` | number | Top N resultados (default: 10) |

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "aggregation": "by_ip",
    "results": [
      {"key": "185.220.101.44", "count": 2341, "severity_max": "HIGH"},
      {"key": "45.148.10.22", "count": 892, "severity_max": "CRITICAL"}
    ],
    "period": {
      "from": "2026-06-01T00:00:00Z",
      "to": "2026-06-01T23:59:59Z"
    }
  }
}
```

---

### GET /api/search/ioc/:ip

**Descripción:** Lookup de IOC para una IP específica — cruza con ThreatIndicator MongoDB.  
**Auth:** `analyst+`

#### Respuesta 200 — IOC encontrado

```json
{
  "success": true,
  "data": {
    "ip": "185.220.101.44",
    "found_in_threat_db": true,
    "indicator": {
      "type": "IP",
      "severity": "HIGH",
      "confidence": 95,
      "source": "honeypot",
      "description": "Tor exit node, brute force campaigns",
      "tags": ["Tor", "Brute Force"],
      "hitCount": 890,
      "mitreTechnique": "T1110",
      "country": "RO",
      "asn": "AS200350"
    },
    "security_log_count": 2341,
    "last_seen": "2026-06-01T14:00:00Z",
    "is_banned": true
  }
}
```

#### Respuesta 200 — IOC no encontrado

```json
{
  "success": true,
  "data": {
    "ip": "1.2.3.4",
    "found_in_threat_db": false,
    "security_log_count": 5,
    "last_seen": "2026-05-15T10:00:00Z",
    "is_banned": false
  }
}
```

---

### GET /api/search/health

**Descripción:** Estado del servicio de búsqueda (Elasticsearch).  
**Auth:** `analyst+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "elasticsearch": {
      "available": true,
      "status": "green",
      "indices": {
        "security_logs": {"docs": 847293, "size": "2.3gb"}
      }
    },
    "fallback_mode": false
  }
}
```

---

## Queries de Threat Hunting

### Ejemplos Prácticos

#### Buscar intentos de SQLi en las últimas 24 horas
```
GET /api/search/logs?q=SQL+injection&severity=critical&from=2026-06-01T00:00:00Z
```

#### Top IPs atacantes de la semana
```
GET /api/search/analytics?aggregation=by_ip&from=2026-05-26T00:00:00Z&limit=20
```

#### Investigar IP específica
```
GET /api/search/ioc/185.220.101.44
```

#### Buscar eventos de Tor exit nodes
```
GET /api/search/logs?q=Tor+exit+node
```

---

## Elasticsearch — Configuración

Elasticsearch es un componente **opcional**. El backend funciona sin él (fallback a PostgreSQL).

### Variables de Entorno

```env
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=robengate_logs
```

### Índices

| Índice | Descripción |
|---|---|
| `robengate_logs` | Security logs para full-text search |
| `robengate_audit` | Audit events para compliance queries |

### Mappings (extraído de elasticsearchService.js)

```json
{
  "mappings": {
    "properties": {
      "event_type": {"type": "keyword"},
      "severity": {"type": "keyword"},
      "ip_address": {"type": "ip"},
      "country_code": {"type": "keyword"},
      "metadata": {"type": "object", "dynamic": true},
      "created_at": {"type": "date"},
      "full_text": {"type": "text", "analyzer": "standard"}
    }
  }
}
```
