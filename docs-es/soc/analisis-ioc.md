# Guía SOC — Análisis de IOCs

**Rol requerido:** `analyst`  
**Módulo:** Threat Intelligence  

---

## Tipos de IOC y Cómo Trabajar con Ellos

### IP Address

**Lookup:**
```bash
GET /api/search/ioc/185.220.101.44
```

**Qué verificar:**
- ¿Está en la base de IOCs activa?
- ¿Es un nodo Tor/VPN conocido? (campo `is_tor`)
- ¿Cuál es el ASN? (¿hosting malicioso conocido?)
- ¿Cuántos eventos ha generado en nuestra plataforma?
- ¿Cuándo fue visto por primera vez?

**Herramientas externas** (fuera de la plataforma):
- [VirusTotal](https://virustotal.com) — reputación IP
- [AbuseIPDB](https://abuseipdb.com) — reportes de abuso
- [Shodan](https://shodan.io) — servicios expuestos de esa IP
- [IPInfo](https://ipinfo.io) — geolocalización y ASN

### Domain / Hash / URL

**Buscar en ThreatIndicator:**
```bash
GET /api/threats/indicators?type=DOMAIN&search=malware-c2.evil.com
GET /api/threats/indicators?type=HASH_SHA256&search=e3b0c4429...
```

**Reportar nuevo IOC:**
```bash
POST /api/threats/report
{
  "type": "DOMAIN",
  "value": "malware-c2.evil.com",
  "confidence": 95,
  "severity": "CRITICAL",
  "description": "Active C2 server for Cobalt Strike",
  "mitreTactic": "TA0011",
  "mitreTechnique": "T1071.001",
  "tags": ["C2", "Cobalt Strike", "APT"]
}
```

---

## Gestión del Ciclo de Vida de IOCs

### Revisar y Confirmar IOCs

Los IOCs sin revisar tienen `reviewedBy = null`. Los analistas deben revisar y confirmar:

```bash
# Ver IOCs sin revisar
GET /api/threats/indicators?active=true&limit=100
# Filtrar los que tienen reviewedAt = null

# Confirmar IOC (marcar como revisado)
PATCH /api/threats/indicators/<id>
{"reviewedBy": "ana@empresa.com", "reviewedAt": "2026-06-01T15:00:00Z"}
```

### Desactivar IOC Obsoleto

```bash
PATCH /api/threats/indicators/<id>
{"active": false}
# Nota: Los IOCs inactivos no se eliminan para preservar historial
```

### Actualizar Confianza

Si se obtiene más información sobre un IOC:
```bash
PATCH /api/threats/indicators/<id>
{
  "confidence": 98,
  "description": "Updated: Confirmed C2 by 3 independent sources",
  "tags": ["C2", "Cobalt Strike", "APT", "Confirmed"]
}
```

---

## Interpretación del Confidence Score

| Score | Significado | Acción |
|---|---|---|
| 90-100 | Confirmado por múltiples fuentes | Banear IP, crear incidente |
| 70-89 | Alta confianza, una fuente buena | Monitorizar, considerar ban |
| 50-69 | Confianza media | Aumentar alertas, no banear todavía |
| 25-49 | Baja confianza / posible FP | Solo vigilar |
| 0-24 | Casi sin evidencia | Desactivar o solicitar más info |

---

## Análisis de Riesgo

### Risk Score — Interpretación

El Risk Score (0-100) del módulo AI combina múltiples señales:

```bash
GET /api/ai/overview
# risk_score: 72 → HIGH
```

| Score | Nivel | Acción Recomendada |
|---|---|---|
| 0-25 | LOW | Monitorización estándar |
| 26-50 | MEDIUM | Revisar alertas daily |
| 51-75 | HIGH | Revisar alertas cada 4h, hunting activo |
| 76-100 | CRITICAL | Guardia continua, escalado a CISO |

### Qué Contribuye al Risk Score

1. Número de alertas críticas sin resolver (peso alto)
2. IPs baneadas activas (peso medio)
3. Incidentes in_progress (peso alto)
4. IOCs de alta severidad detectados recientemente (peso medio)
5. Comportamientos anómalos de usuarios (peso medio)
6. Score de seguridad de la organización (peso bajo)

---

## MITRE ATT&CK — Guía de Uso

Cuando se reporta un IOC o se crea un incidente, mapear a MITRE ATT&CK:

### Tácticas Más Comunes

| Táctica ID | Táctica | Ejemplos en RobenGate |
|---|---|---|
| TA0001 | Initial Access | SQLi, phishing detectado |
| TA0006 | Credential Access | Brute force, credential stuffing |
| TA0007 | Discovery | Port scanning, reconocimiento web |
| TA0008 | Lateral Movement | Impossible travel, account sharing |
| TA0010 | Exfiltration | Queries SQL masivos, export anómalo |
| TA0011 | Command & Control | Callbacks a dominios maliciosos |
| TA0040 | Impact | DDoS, ransomware, data destruction |

### Buscar por Técnica

```bash
# Ver todos los IOCs de una técnica específica
GET /api/threats/indicators?mitreTechnique=T1190

# Ver logs relacionados con una táctica
GET /api/search/logs?q=T1110  # Brute force
```
