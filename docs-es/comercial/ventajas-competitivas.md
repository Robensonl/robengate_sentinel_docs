# Ventajas Competitivas — RobenGate Sentinel

**Comparativa con las principales soluciones del mercado**  

---

## Posicionamiento en el Mercado

RobenGate Sentinel se posiciona en el segmento **"Enterprise capabilities at SMB pricing"** — llenando el vacío entre herramientas básicas y plataformas enterprise inalcanzables.

```
        Capacidades
            ↑
Splunk      ●    IBM QRadar ●
            |
            |    ← RobenGate Sentinel ●
            |
Wazuh   ●   |  Elastic SIEM ●
            |
            +---------------------------→ Precio
         Gratis              $150k+/año
```

---

## vs. Splunk Enterprise

### Resumen

| Aspecto | Splunk Enterprise | RobenGate Sentinel |
|---|---|---|
| **Precio** | $150,000+/año | Gratis (self-hosted) |
| **Implementación** | 4-8 semanas + consultoría | < 1 hora con Docker |
| **Curva de aprendizaje** | Certificaciones ($3,000+) | Docs incluidas |
| **Honeypot integrado** | ❌ | ✅ SSH + HTTP |
| **SOAR** | Splunk SOAR ($$$) | ✅ Incluido |
| **WebAuthn / FIDO2** | ❌ | ✅ |
| **Open-source** | ❌ Propietario | ✅ |
| **Vendor lock-in** | Total | Ninguno |
| **Multi-tenancy** | Sí (complejo) | ✅ (organizations) |

### Ventaja RobenGate
- **90% del valor** de Splunk a **< 1% del coste**
- Sin lock-in de vendor — el código es tuyo
- Honeypot y SOAR incluidos sin add-ons
- WebAuthn/FIDO2 para auth sin passwords

### Limitaciones vs Splunk
- Capacidad de ingestión: Splunk maneja petabytes/día vs. nuestros GBs/día actuales
- Machine Learning: Splunk ML toolkit es más avanzado que nuestro motor heurístico
- Marketplace de integraciones: Splunk tiene 2,500+ apps vs. nuestras integraciones nativas
- Soporte enterprise con SLA 24/7 global

---

## vs. Elastic SIEM (ELK Stack)

### Resumen

| Aspecto | Elastic SIEM | RobenGate Sentinel |
|---|---|---|
| **Precio base** | Gratis (open) / $95+/mes (cloud) | Gratis (self-hosted) |
| **Complejidad de setup** | Alta (ES + Kibana + Logstash) | Baja (Docker Compose) |
| **Honeypot integrado** | ❌ | ✅ |
| **SOAR integrado** | ❌ | ✅ |
| **Threat Intelligence nativo** | Partial | ✅ Completo |
| **Búsqueda full-text** | ✅ Muy potente | ✅ (con ES opcional) |
| **Auth avanzada (WebAuthn)** | ❌ | ✅ |
| **API documentada** | Básica | ✅ 91+ endpoints |

### Ventaja RobenGate
- **Todo en uno** — no necesitas montar un stack ELK complejo
- SOAR + Honeypot fuera de la caja
- Auth moderna con WebAuthn/FIDO2
- API RESTful completa y documentada

### Limitaciones vs Elastic
- Elasticsearch es opcional en RobenGate; el ELK stack nativo soporta indexación masiva
- Kibana tiene dashboards más potentes que nuestro dashboard React
- Elastic tiene más años de madurez en producción masiva

---

## vs. Wazuh

### Resumen

| Aspecto | Wazuh | RobenGate Sentinel |
|---|---|---|
| **Precio** | Gratis (self-hosted) | Gratis (self-hosted) |
| **Enfoque principal** | Endpoint detection (HIDS) | SIEM + Network + Honeypot |
| **Agente EDR** | ✅ Potente | ✅ Básico (roadmap) |
| **SOAR** | Limitado | ✅ Playbooks completos |
| **Honeypot** | ❌ | ✅ SSH + HTTP |
| **Threat Intelligence** | Básico | ✅ MongoDB IOC store |
| **Frontend UX** | Angular/React (complejo) | React 19 moderno |
| **WebAuthn** | ❌ | ✅ |
| **Multi-tenancy** | Complejo | ✅ Native |

### Ventaja RobenGate
- **SOAR más completo** con playbooks y automatización
- **Honeypot integrado** que Wazuh no tiene
- **UX moderna** y más intuitiva
- **Multi-tenancy nativo** más simple de gestionar

### Limitaciones vs Wazuh
- Wazuh tiene agentes endpoint más maduros
- Wazuh tiene más años de comunidad y reglas de detección
- Wazuh integra mejor con compliance frameworks (CIS, NIST) out-of-the-box

---

## vs. Microsoft Sentinel

### Resumen

| Aspecto | Microsoft Sentinel | RobenGate Sentinel |
|---|---|---|
| **Precio** | ~$2/GB ingestado | Gratis (self-hosted) |
| **Vendor lock-in** | 100% Azure | ❌ Ninguno |
| **Integración Microsoft** | Excelente | Via API/webhook |
| **SOAR** | Azure Logic Apps | ✅ Incluido |
| **Multi-cloud** | Difícil | ✅ Cualquier infra |
| **On-premise** | ❌ Solo Azure | ✅ |

### Ventaja RobenGate
- **Sin lock-in a Azure** — despliega en cualquier cloud u on-premise
- **Coste predecible** — no €/GB que escala con el volumen
- **Open-source** — total transparencia del código de seguridad

---

## Resumen de Posicionamiento

**RobenGate Sentinel NO compite directamente con Splunk o Microsoft Sentinel** en el segmento enterprise masivo. Se posiciona en:

1. **Organizaciones que salen del nivel básico** y necesitan más que herramientas aisladas
2. **MSPs y proveedores de servicios** que quieren ofrecer SIEM a sus clientes sin costes de licencia
3. **Startups y scale-ups** que necesitan cumplimiento (SOC 2, ISO 27001) con presupuesto limitado
4. **Equipos de seguridad soberanos** que no quieren depender de vendors cloud
5. **Proyectos académicos y research** con una plataforma real para estudiar seguridad
