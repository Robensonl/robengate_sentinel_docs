# Industrias Objetivo — RobenGate Sentinel

**Análisis de verticales de mercado con mayor fit para la plataforma**  

---

## E-commerce y Retail Digital

### Necesidades de Seguridad

Las tiendas online son objetivo primario de:
- **Credential stuffing** — atacantes usan bases de datos filtradas para acceder a cuentas de clientes
- **Carding / Card testing** — prueba masiva de tarjetas robadas en el checkout
- **SQLi / XSS** — extracción de datos de clientes o tarjetas
- **Account takeover (ATO)** — robo de cuentas con puntos/bonos de fidelidad

### Cómo RobenGate Sentinel Ayuda

| Amenaza | Protección |
|---|---|
| Credential stuffing | BRUTE_FORCE_DETECTED + auto-ban + alertas en tiempo real |
| ATO | SUSPICIOUS_LOGIN con análisis de geolocalización e impossible travel |
| SQLi | SQL_INJECTION_ATTEMPT con payload logging y bloqueo |
| Bots de escaneo | Honeypot HTTP captura scanners antes del sitio real |

### Regulaciones Aplicables
- **PCI DSS** — Logs inmutables en MongoDB (audit trail inalterable)
- **GDPR** — Retención configurable y derecho al olvido documentable

---

## SaaS B2B

### Necesidades de Seguridad

Los SaaS que manejan datos empresariales de terceros son objetivo de:
- **API abuse** — explotación de endpoints mal securizados
- **Multi-tenant data leakage** — fuga de datos entre clientes
- **Compromiso de cuentas admin** — alto impacto por privilegios elevados
- **Espionaje industrial** — acceso no autorizado a datos competitivos

### Cómo RobenGate Sentinel Ayuda

| Necesidad | Solución |
|---|---|
| Aislamiento de datos por cliente | organizations table con FK en todos los recursos |
| Evidencia de controles para due diligence | Audit logs inmutables exportables |
| Detección de API abuse | Todos los endpoints logueados con metadata |
| Compromiso de cuentas admin | WebAuthn/FIDO2 para admins, TOTP obligatorio configurable |

### Caso de Uso SOC 2
Un SaaS que busca certificación SOC 2 Type II necesita demostrar controles de monitorización. RobenGate Sentinel proporciona:
- Logs de auditoría inmutables (requisito CC7.2)
- Monitorización continua de accesos (CC6.6)
- Respuesta a incidentes documentada (CC7.3)
- RBAC con mínimo privilegio (CC6.3)

---

## Servicios Financieros

### Necesidades de Seguridad

- **Fraude financiero** — acceso no autorizado a cuentas o transacciones
- **Ransomware** — cifrado de sistemas críticos
- **Insider threats** — empleados con acceso excesivo
- **APTs** — actores estado-nación apuntando a fintech

### Cómo RobenGate Sentinel Ayuda

| Necesidad | Solución |
|---|---|
| Detección de insider threats | User Risk Score + UNUSUAL_ACCESS anomalías |
| Impossible travel | Análisis de geolocalización en cada login |
| Compliance PCI DSS / SWIFT | Audit logs con retención configurable hasta 7 años |
| Respuesta a ransomware | EDR isolation + playbook SOAR automatizado |

### Regulaciones Aplicables
- **PSD2** — Strong Customer Authentication (SCA) → WebAuthn/FIDO2 nativos
- **DORA** — Digital Operational Resilience Act (EU) → incident management completo
- **PCI DSS** — Logs inmutables, RBAC, MFA obligatorio

---

## Administración Pública e Institucional

### Necesidades de Seguridad

- **Espionaje** — acceso a información gubernamental sensible
- **Desfiguración web** — ataques a presencia digital institucional
- **Acceso a infraestructura crítica** — energía, agua, transporte
- **Ransomware** — cada vez más común en hospitales y ayuntamientos

### Cómo RobenGate Sentinel Ayuda

| Necesidad | Solución |
|---|---|
| Soberanía tecnológica | Open-source, self-hosted, sin vendor extranjero |
| Audit trail legal | MongoDB inmutable, exportable para evidencia judicial |
| Multi-entidad | Multi-tenancy para diferentes departamentos |
| Análisis forense | Logs detallados con requestId, sessionId, fingerprint |

### Ventaja Competitiva
**Soberanía de datos:** La administración pública no puede depender de proveedores cloud extranjeros (Microsoft/AWS/Google) para datos sensibles. RobenGate Sentinel se despliega en infraestructura propia.

---

## Educación e Investigación

### Necesidades de Seguridad

- **Acceso a propiedad intelectual** — investigación universitaria robada
- **Compromiso de cuentas de estudiantes** — para spam, fraude académico
- **Compliance FERPA/LOPD** — protección de datos de menores
- **Redes heterogéneas** — miles de dispositivos BYOD sin control

### Cómo RobenGate Sentinel Ayuda

| Necesidad | Solución |
|---|---|
| Visibilidad de red | Honeypot + logs de toda la actividad |
| Protección de cuentas | Brute force detection + lockout automático |
| Investigación de seguridad | Plataforma real para prácticas académicas |
| Presupuesto limitado | Plan Starter gratuito con todas las funciones |

---

## Industria y OT/ICS

> 🚧 **Roadmap futuro** — Integración OT/ICS planificada en versión 3.0

La versión actual puede monitorizar el perímetro IT, pero la integración con protocolos OT (Modbus, PROFINET, DNP3) está en el roadmap.

---

## Matriz de Priorización por Industria

| Industria | Urgencia | Tamaño de mercado | Ciclo de venta | Prioridad |
|---|---|---|---|---|
| SaaS B2B | Alta | Grande | Corto (PoC) | ⭐⭐⭐⭐⭐ |
| E-commerce | Alta | Muy grande | Medio | ⭐⭐⭐⭐ |
| Servicios financieros | Muy alta | Grande | Largo (compliance) | ⭐⭐⭐⭐ |
| Educación | Media | Grande | Largo (burocracia) | ⭐⭐⭐ |
| Adm. pública | Alta | Grande | Muy largo | ⭐⭐⭐ |
