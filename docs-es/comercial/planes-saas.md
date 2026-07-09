# Planes SaaS — RobenGate Sentinel

**Modelos de precios propuestos para comercialización**  

> ⚠️ **Nota:** RobenGate Sentinel es actualmente un proyecto open-source en desarrollo. Los planes descritos aquí son la arquitectura SaaS objetivo documentada en el código (tabla `organizations` con campos `plan`, `seats_limit`, `retention_days`, `max_organizations_per_user`).

---

## Los Tres Planes

### Starter — Gratuito (Self-hosted)

**Para:** Startups, equipos técnicos, evaluación  

| Parámetro | Valor |
|---|---|
| **Precio** | Gratis (open-source self-hosted) |
| **Seats** | Hasta 10 usuarios |
| **Retención de logs** | 90 días |
| **Organizaciones** | 1 |
| **Soporte** | Comunidad (GitHub Issues) |

**Incluye:**
- ✅ SIEM completo (alertas, logs, dashboard)
- ✅ Threat Intelligence (IOCs)
- ✅ Honeypot SSH + HTTP
- ✅ SOAR básico (playbooks manuales)
- ✅ Auth completo (TOTP, WebAuthn, Email OTP)
- ✅ RBAC 4 roles
- ✅ API completa (91+ endpoints)
- ❌ Soporte prioritario
- ❌ SLA garantizado
- ❌ Multi-tenant managed
- ❌ Integraciones premium

---

### Professional — €199/mes (Cloud-managed)

**Para:** PYMEs, equipos de seguridad de 5-50 personas  

| Parámetro | Valor |
|---|---|
| **Precio** | €199/mes (anual: €1,990/año) |
| **Seats** | Hasta 50 usuarios |
| **Retención de logs** | 365 días |
| **Organizaciones** | Hasta 3 |
| **Soporte** | Email (48h respuesta) |

**Todo en Starter más:**
- ✅ Instancia managed (hosting incluido)
- ✅ Actualizaciones automáticas
- ✅ Backup automático diario
- ✅ SOAR avanzado (playbooks automáticos)
- ✅ AI Analysis avanzado
- ✅ Exportación de informes PDF/CSV
- ✅ SSO (SAML 2.0 / OAuth 2.0)
- ✅ Integraciones: Slack, email alertas
- ✅ SLA 99.5% uptime
- ❌ Integraciones EDR premium
- ❌ Multi-tenant para >3 orgs
- ❌ Soporte 24/7

---

### Enterprise — Precio bajo petición

**Para:** Empresas grandes, MSPs, proveedores de servicios  

| Parámetro | Valor |
|---|---|
| **Precio** | Bajo petición (desde ~€999/mes) |
| **Seats** | Ilimitados |
| **Retención de logs** | Configurable (hasta 7 años) |
| **Organizaciones** | Ilimitadas (multi-tenant) |
| **Soporte** | Prioritario 24/7 + CSM dedicado |

**Todo en Professional más:**
- ✅ Multi-tenant completo (MSP mode)
- ✅ Integraciones EDR (CrowdStrike, SentinelOne — roadmap)
- ✅ SIEM connectors premium (CEF, LEEF, syslog avanzado)
- ✅ Windows Event Collector
- ✅ Threat Intelligence feeds premium
- ✅ SLA 99.9% uptime con penalizaciones
- ✅ On-premise enterprise deployment
- ✅ White-label (marca propia)
- ✅ API rate limits custom
- ✅ Auditoría de seguridad anual incluida

---

## Comparativa de Planes

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| Precio/mes | Gratis | €199 | Bajo petición |
| Usuarios | 10 | 50 | Ilimitados |
| Retención logs | 90d | 365d | Configurable |
| Organizaciones | 1 | 3 | Ilimitadas |
| SOAR | Básico | Avanzado | Full |
| AI Analysis | Heurístico | Heurístico + | Full |
| Multi-tenancy | ❌ | Básico | ✅ |
| White-label | ❌ | ❌ | ✅ |
| SLA | ❌ | 99.5% | 99.9% |
| Soporte | Comunidad | Email 48h | 24/7 CSM |

---

## Modelo de Ingresos

### Self-hosted (Open-source)
- Producto gratuito que construye comunidad
- Conversión a Professional cuando escalan
- Ingresos adicionales: formación, consultoría, integración

### SaaS Cloud
- MRR (Monthly Recurring Revenue) predecible
- Upsell natural: Starter → Professional → Enterprise
- Baja fricción de adopción

### Enterprise
- Alto valor por cliente (ACV alto)
- Contratos anuales o plurianuales
- MSP program para revendedores

### Potencial de Expansión
- Marketplace de integraciones (comisión por conector)
- Formación certificada SOC con la plataforma
- Bug Bounty para mantener seguridad con comunidad

---

## Implementación de Multi-Tenancy en el Código

Los planes están implementados en la tabla `organizations`:

```sql
-- db-sql/migrations/012_organizations.sql
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',  -- 'starter', 'professional', 'enterprise'
    seats_limit INT NOT NULL DEFAULT 10,
    retention_days INT NOT NULL DEFAULT 90,
    max_organizations_per_user INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Todos los recursos (usuarios, incidentes, vulnerabilidades, logs, IPs baneadas) tienen `organization_id` FK, garantizando aislamiento completo entre tenants.
