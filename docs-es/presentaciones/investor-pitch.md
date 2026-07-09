# Investor Pitch — RobenGate Sentinel

**Formato:** Pitch de inversión estilo Y Combinator / Seed Round  
**Audiencia:** Angel investors, VCs early stage, aceleradoras (Seedrocket, Wayra, Y Combinator)  
**Duración:** 10-15 minutos + Q&A

---

## SLIDE 1 — THE HOOK

**"Las empresas tardan 277 días en descubrir que fueron hackeadas."**
*— IBM Cost of Data Breach Report 2023*

**"El coste promedio de una brecha de datos es $4.45 millones."**

**"El 86% de las empresas medianas no tienen un SIEM implementado."**

*¿Por qué? Porque las herramientas existentes cuestan $150,000/año y requieren meses de implementación.*

---

## SLIDE 2 — EL PROBLEMA

### El Gap de Seguridad que Nadie Está Resolviendo

```
Pequeñas empresas        Medianas empresas         Grandes corporaciones
(< 50 personas)          (50-2,000 personas)        (2,000+ personas)
     │                          │                          │
 Básico o nada           ← GAP DESATENDIDO →         Splunk, Sentinel
                                │                     $150K-$500K/año
                         Necesitan más que            Inaccesible para
                         antivirus, pero menos        empresas en crecimiento
                         que enterprise SIEM
```

**El mercado desatendido:** 250,000 empresas medianas en Europa y Latinoamérica que necesitan ciberseguridad profesional pero no pueden pagar precios enterprise.

---

## SLIDE 3 — LA SOLUCIÓN

### RobenGate Sentinel

**SIEM + SOAR + Honeypot + Threat Intelligence + AI Analysis**  
**En una sola plataforma. En <30 minutos. Sin vendor lock-in.**

**Los tres pilares de la propuesta:**

**1. Capacidades Enterprise**
- Detection Engine con MITRE ATT&CK
- SOAR con automatización real
- Honeypot integrado
- Análisis comportamental AI
- WebAuthn/FIDO2

**2. Accesibilidad Real**
- Instalación: docker-compose up -d
- Onboarding: <30 minutos
- Precio: €0 a €999/mes (vs. €12,000+/mes de Splunk)

**3. Sin Lock-In**
- Open-source (código disponible en GitHub)
- Self-hosted o cloud
- API-first para integraciones

---

## SLIDE 4 — DEMO

### El Flujo de Detección en 60 Segundos

**T+0:** Atacante inicia credential stuffing con 847 intentos en 30 segundos  
**T+45s:** Detection Engine detecta el patrón (regla Sigma)  
**T+60s:** Correlation Engine crea incidente automático  
**T+61s:** SOAR banea las 12 IPs atacantes automáticamente  
**T+62s:** Dashboard SOC actualizado en tiempo real  
**T+62s:** SOC recibe notificación en Slack  

**Sin intervención humana para la contención inicial.**  
**El analista entra cuando el fuego ya está apagado.**

---

## SLIDE 5 — EL MERCADO

### TAM / SAM / SOM

**TAM (Total Addressable Market):**
- Mercado global SIEM: $6.4B (2023)
- CAGR: 14.5%
- **TAM 2028: $12.6B**

**SAM (Serviceable Addressable Market):**
- Empresas 50-2,000 empleados, Europa + LATAM
- 250,000 empresas potenciales
- ARPU objetivo: $600/año
- **SAM: $150M**

**SOM (Target Year 3):**
- 750 clientes pagos
- ARPU mixto: $650/año
- **SOM: $490K ARR**

---

## SLIDE 6 — MODELO DE NEGOCIO

### SaaS + Open-Source (PLG — Product-Led Growth)

```
Community (Gratis)
    ↓
Startup ($199/mes)  →  30% churn trimestral objetivo
    ↓
Business ($599/mes) →  ARPU $7,188/año
    ↓
Enterprise ($999+/mes) → ARPU $12,000+/año
```

**El Open-Source es el motor de adquisición:**
- GitHub stars → awareness → prueba → conversión a paid
- No hay coste de marketing en las primeras 500 instalaciones
- La comunidad construye integraciones y mejoras

**Unit Economics Objetivo (Año 2):**
- CAC: $250 (content marketing + PLG)
- LTV (Startup tier, 24 meses): $3,576
- LTV/CAC ratio: **14.3x** ✅

---

## SLIDE 7 — TRACCIÓN ACTUAL

### Estado del Proyecto

✅ Plataforma funcional: 118+ APIs, 11 módulos, deployment Docker/K8s  
✅ Documentación enterprise completa: 185+ archivos  
✅ Seguridad validada: OWASP Top 10 implementado  
✅ Stack moderno: Node.js, React, PostgreSQL, MongoDB, Redis  
✅ GitHub: Código disponible, README profesional

**Próximos hitos:**
- Lanzamiento beta privado: 10 clientes piloto gratuitos
- Product Hunt launch: Q3 2026
- Primera conferencia de ciberseguridad: RootedCon 2027

---

## SLIDE 8 — VENTAJAS COMPETITIVAS DEFENSIBLES

### ¿Por qué es difícil de replicar?

**1. Stack integrado único:**
Nadie más combina SIEM + SOAR + Honeypot + Threat Intel + AI en una sola instalación sin add-ons.

**2. Time-to-Value incomparable:**
<30 minutos vs. semanas para cualquier alternativa. En SaaS, el tiempo hasta el valor es el predictor #1 de conversión.

**3. Open-Source Moat:**
Una vez que hay comunidad activa, es el "network effect" del open-source. Los usuarios contribuyen rules, integrations, y casos de uso.

**4. Multi-tenancy desde el día 1:**
Permite el modelo MSP/MSSP (resellers) que multiplica la base de clientes sin multiplicar los costes de soporte.

---

## SLIDE 9 — EL EQUIPO

### Robenson L. — Founder & CTO

- Construyó RobenGate Sentinel individualmente en 9+ meses
- Full Stack Security Engineer: Node.js, React, PostgreSQL, Docker, K8s
- Implementó desde cero: WebAuthn, SOAR, Detection Engine, Risk Engine
- Profundo conocimiento del mercado SIEM y sus pain points

**Lo que busco en co-founders:**
- **CEO/Sales:** Experiencia en ventas B2B SaaS, especialmente ciberseguridad o DevOps
- **Growth:** Experiencia en PLG, developer marketing, community building

---

## SLIDE 10 — LA ASK

### Ronda Seed: €300,000

**Uso de los fondos:**
| Área | % | Objetivo |
|---|---|---|
| Producto: 2 ingenieros x 12 meses | 50% | Conectores, ML models, compliance reports |
| Go-to-Market | 25% | Content marketing, conferencias, PLG |
| Infraestructura cloud | 15% | Demo ambiente, beta clientes |
| Legal + overhead | 10% | Estructura empresa, IP protection |

**Milestones a 12 meses:**
- 50 clientes pagos ($Startup tier)
- 5,000 GitHub stars
- 10 conectores de ingesta
- Certificación SOC 2 Type II (roadmap)
- ARR: $120,000

---

## SLIDE 11 — VISIÓN A 5 AÑOS

**"El SIEM de referencia para empresas en crecimiento"**

- Año 1: Comunidad open-source activa, 50 clientes pagos
- Año 2: 500 clientes, MSP/MSSP partner program
- Año 3: €5M ARR, Serie A
- Año 5: €25M ARR, 5,000 clientes, IPO o adquisición estratégica

**Potential acquirers:**
- Palo Alto Networks (XSOAR division)
- CrowdStrike (SIEM expansion)
- Cisco (security portfolio)
- Any SIEM vendor needing open-source street credibility

---

*Investor Pitch — RobenGate Sentinel v2.0.0 — Junio 2026*
