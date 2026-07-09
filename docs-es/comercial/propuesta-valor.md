# Propuesta de Valor — RobenGate Sentinel

**Plataforma de ciberseguridad empresarial open-source de nueva generación**  
**Versión:** 2.0.0  

---

## El Problema

Las organizaciones medianas y en crecimiento enfrentan el mismo dilema de seguridad:

| Problema | Impacto |
|---|---|
| Las soluciones SIEM empresariales (Splunk, IBM QRadar) cuestan **$100,000+ al año** | Solo alcanzables para grandes enterprises |
| Las soluciones open-source (Wazuh, ELK Stack) requieren **semanas de configuración** y equipos especializados | Alto coste operativo |
| Las soluciones SaaS básicas **no tienen SOAR, ni Threat Intelligence, ni Honeypot integrados** | Múltiples herramientas sin integración |
| La **visibilidad en tiempo real** es compleja y cara de implementar | Respuesta lenta a amenazas |

**El resultado:** La mayoría de las PYMEs y startups en crecimiento operan sin visibilidad de seguridad adecuada, siendo objetivo fácil de actores maliciosos.

---

## La Solución

**RobenGate Sentinel** es una plataforma de ciberseguridad todo-en-uno que integra:

```
SIEM  +  SOC  +  Honeypot  +  SOAR  +  Threat Intelligence  +  AI Analysis
```

En una sola plataforma open-source que se despliega en cualquier infraestructura.

---

## Propuesta de Valor Central

### Para el CISO / Director de Seguridad

> **"Visibilidad completa de tu postura de seguridad en < 30 minutos de instalación"**

- Dashboard en tiempo real con Risk Score global
- Correlación automática de eventos con motor IA heurístico
- Playbooks SOAR para respuesta automatizada
- Cumplimiento SOC 2 / ISO 27001 / GDPR / PCI DSS con logs inmutables

### Para el Equipo SOC

> **"Todo lo que tu equipo necesita en una sola pantalla"**

- Cola de alertas priorizada automáticamente
- Threat Intelligence integrado — IOCs en contexto
- Honeypot activo que captura atacantes reales
- Guías de respuesta por tipo de amenaza

### Para el CTO / Director de Tecnología

> **"Stack moderno, cloud-native, sin lock-in"**

- Kubernetes + Helm ready
- API-first (91+ endpoints documentados)
- Multi-tenancy con organizations para múltiples clientes
- Open-source — sin dependencia de vendor

### Para la Dirección / CFO

> **"90% del valor de Splunk al 5% del coste"**

| | RobenGate Sentinel | Splunk Enterprise |
|---|---|---|
| Coste anual base | **Gratis** (self-hosted) / desde **€199/mes** (cloud) | $150,000+/año |
| Instalación | < 1 hora con Docker | Semanas + consultoría |
| Formación necesaria | Días | Certificaciones ($3,000+) |
| Customización | Código abierto, total | Limitada |
| SOAR incluido | ✅ Sí | ➕ Add-on caro |
| Honeypot integrado | ✅ Sí | ❌ No |

---

## Métricas Técnicas Clave

| Capacidad | Valor |
|---|---|
| Endpoints API | 91+ endpoints documentados |
| Tablas PostgreSQL | 17 tablas (schema completo) |
| Colecciones MongoDB | 2 (logs inmutables + threat intelligence) |
| Tiempo de respuesta API | < 200ms en operaciones típicas |
| Retención de logs | Configurable (90-365+ días según plan) |
| Multi-tenancy | ✅ Organizations + API Keys por tenant |
| Auth methods | 5 (password, TOTP, Email OTP, WebAuthn/FIDO2, backup codes) |
| RBAC roles | 4 (admin, analyst, responder, viewer) |

---

## Casos de Éxito Potenciales

> **Nota:** RobenGate Sentinel es un proyecto en desarrollo. Los siguientes son escenarios de valor típicos, no clientes reales.

**E-commerce mediano (50-200 empleados):**
- Detectar ataques de credential stuffing contra cuentas de clientes
- Visibilidad de intentos de SQLi en APIs de catálogo/checkout
- Reducir MTTD de días a minutos

**Startup SaaS B2B:**
- Cumplimiento SOC 2 Type II con audit logs inmutables
- Multi-tenancy para separar datos de cada cliente
- Evidencia de controles de seguridad para due diligence

**Institución educativa:**
- Monitorizar acceso a sistemas académicos sensibles
- Detectar uso indebido de credenciales de estudiantes
- Honeypot para investigación de amenazas

---

## Diferenciadores Clave

1. **Todo en uno** — SIEM + SOAR + Honeypot + Threat Intel en un stack
2. **Open-source** — Sin lock-in, total transparencia
3. **Modern stack** — React 19 + Node.js 20 + PostgreSQL 16 + MongoDB 7
4. **Seguridad por diseño** — WebAuthn/FIDO2, logs inmutables, bcrypt(12), RBAC granular
5. **Cloud-native** — Docker + Kubernetes + Helm listo para producción
6. **API-first** — Integrable con cualquier sistema existente
