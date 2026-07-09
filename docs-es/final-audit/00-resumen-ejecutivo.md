# RobenGate Sentinel — Resumen Ejecutivo de Auditoría Funcional

> **Fecha de auditoría:** 2026-06-16  
> **Rama auditada:** `develop`  
> **Auditado por:** Auditoría funcional automatizada — Principal Software Architect + QA Lead + DevSecOps Engineer

---

## VEREDICTO GLOBAL

| Categoría | Puntuación | Estado |
|-----------|-----------|--------|
| **Frontend** | **6.5 / 10** | 🟡 Funcional con datos simulados |
| **Backend** | **8.5 / 10** | 🟢 Sólido, real, orientado a producción |
| **Seguridad** | **8.0 / 10** | 🟢 Buena base, detalles menores |
| **SIEM** | **7.0 / 10** | 🟡 Estado en memoria, no persistente |
| **Observabilidad** | **7.0 / 10** | 🟡 Prometheus+Winston, logs sin visor centralizado |
| **Reportes** | **5.0 / 10** | 🔴 Mayoría de gráficas con datos hardcodeados |
| **Bases de Datos** | **7.0 / 10** | 🟡 Buen diseño, schema incompleto, modelos duplicados |
| **Experiencia de Usuario** | **6.5 / 10** | 🟡 Buen diseño visual, módulos no funcionales visibles |
| **Preparación para Producción** | **5.5 / 10** | 🔴 Demasiados fallbacks mock, email roto, estado volátil |

**Promedio global: 6.78 / 10**

---

## RESUMEN EN 30 SEGUNDOS

RobenGate Sentinel es una plataforma SIEM con **arquitectura sólida y backend genuinamente robusto**. El motor de detección, correlación, autenticación (JWT+MFA+WebAuthn) y la ingesta de logs son implementaciones reales y maduras. Sin embargo, el **frontend tiene una brecha significativa entre apariencia y realidad**: al menos **9 módulos prominentes muestran datos simulados, hardcodeados o generados por `Math.random()`** en lugar de datos reales de la base de datos, incluso cuando el backend dispone de endpoints reales para servir esos datos.

El mayor riesgo es de **confianza**: un analista de SOC que use el sistema hoy podría tomar decisiones basadas en datos falsos sin saberlo (silente fallback a mock).

---

## HALLAZGOS CRÍTICOS

### 🔴 CRÍTICO — Requiere acción inmediata

| # | Módulo | Problema | Impacto |
|---|--------|---------|---------|
| C-01 | **Threat Hunting** | 100% simulado. SEED_HUNTS + `Math.random()` para resultados de búsqueda. No hay backend real. | Decisiones falsas de un analista |
| C-02 | **TerminalWidget / SIEMTerminal** | 100% decorativo. Logs generados por `Math.random()` cada 2s sin ninguna conexión al backend. | Ilusión de monitoreo real |
| C-03 | **Dashboard — gráficas** | `threatData`, `activityData`, `severityData` son arrays hardcodeados. No reflejan la BD. | KPIs falsos en pantalla principal |
| C-04 | **Settings — API Keys** | `DEMO_KEYS` hardcodeados. La gestión real de claves API no está implementada en el frontend. | Función de seguridad inexistente |
| C-05 | **Silentes fallbacks** | AuditLogs, HoneypotPage, ThreatIntelligence, Alerts, Incidents, Vulnerabilities — cuando el backend falla, muestran datos falsos sin aviso al usuario | Incapaz de detectar servicios caídos |

### 🟡 IMPORTANTE — Debe corregirse antes de producción

| # | Módulo | Problema | Impacto |
|---|--------|---------|---------|
| I-01 | **PostgreSQL schema.sql** | Solo 5 tablas en el archivo base. Los 12 servicios adicionales requieren tablas que sólo existen en migraciones aisladas (incidents, playbooks, organizations, etc.) | Setup de BD puede fallar parcialmente |
| I-02 | **MongoDB — modelos duplicados** | `db-nosql/models/SecurityLog.js` y `db-nosql/security-log.model.js` definen la misma colección `security_logs` con esquemas distintos y TTL distintos (365 días vs 90 días) | Conflicto de índices, datos inconsistentes |
| I-03 | **Estado de detección en memoria** | `detectionEngine` y `correlationEngine` mantienen ventanas de tiempo en `Map` en memoria. Un restart del proceso pierde el contexto activo | Ataques en curso no detectados al reiniciar |
| I-04 | **Email de invitación** | `organizations.js` tiene un TODO explícito: las invitaciones a organizaciones no envían email real | Función multi-tenant rota |
| I-05 | **MFA codes en console.log** | `authService` imprime códigos MFA por consola (líneas 310-313). Sin gate de entorno (`NODE_ENV !== 'production'`) | Credenciales expuestas en logs de producción |
| I-06 | **ThreatIntelligence — MITRE/Actores** | `MITRE_TACTICS`, `THREAT_ACTORS`, `TREND_DATA` son arrays hardcodeados. No hay endpoint backend para ellos. | Inteligencia de amenazas falsa |

### 🟢 BAJO — Mejoras deseables

| # | Área | Observación |
|---|------|------------|
| B-01 | Attack Map | `SERVER_LAT/LNG` por defecto a New York (40.7128, -74.0060) aunque existe `.env` override |
| B-02 | `ipsBlocked` | Métrica calculada como `unique_ips_24h` (aproximación, no tabla real de bloqueos) |
| B-03 | `LandingPage_temp.jsx` | Archivo de respaldo nunca importado — código muerto |
| B-04 | HoneypotPage | Definición de trampas hardcodeada — no configurable desde UI |
| B-05 | Responsive | SecurityHeaders.jsx, ArchitecturePage.jsx y marketing pages sin testing responsivo |

---

## LO QUE FUNCIONA REALMENTE

✅ Autenticación completa (JWT, TOTP, WebAuthn, Backup Codes, MFA por email)  
✅ Gestión de usuarios, dispositivos y sesiones  
✅ Logs de seguridad (PostgreSQL `security_logs`)  
✅ Audit trail (MongoDB `SecurityLog`)  
✅ Motor de detección (9 reglas Sigma integradas + reglas desde BD)  
✅ Motor de correlación (brute-force, credential spray, honeypot sweep, multi-vector)  
✅ Motor de riesgo (0-100 score, impossible travel, geo-mismatch, device drift)  
✅ SOAR / Playbooks (8 tipos de acción, 4 tipos de trigger)  
✅ Motor IA de correlación (baselines por usuario, kill-chain, anomaly scoring)  
✅ Ingesta de logs (Syslog RFC3164/5424, Windows Event Log, CEF, JSON, webhook)  
✅ Honeypot SSH (puerto 2222) + HTTP (puerto 8080)  
✅ Attack Map con datos reales de GeoIP  
✅ Gestión de incidentes (CRUD + timeline)  
✅ Gestión de vulnerabilidades (CRUD + CVSS)  
✅ Multi-tenancy (organizaciones, miembros, aislamiento)  
✅ EDR agent management  
✅ Rate limiting (Redis-backed en producción)  
✅ Middleware de seguridad completo (Helmet, CORS, HPP, sanitización)  
✅ Prometheus metrics endpoint  
✅ SSE real-time stream  

---

## LO QUE ESTÁ ROTO O ES SIMULADO

❌ Threat Hunting — 100% simulado  
❌ TerminalWidget — decorativo, sin conexión real  
❌ SIEMTerminal — decorativo, sin conexión real  
❌ Dashboard charts (3 de 4 charts con datos hardcodeados)  
❌ Settings API Keys — mock, no funcional  
❌ ThreatIntelligence charts — datos estáticos  
❌ Honeypot trap definitions — hardcodeadas en UI  
❌ Email de invitaciones a organizaciones — no implementado  
❌ Gestión real de API Keys — sin endpoints backend  

---

## PRIORIDADES PARA PRODUCCIÓN

```
FASE 1 (Semana 1-2) — Integridad de datos:
  1. Eliminar fallbacks silenciosos → mostrar error real al usuario
  2. Corregir console.log de MFA en producción
  3. Resolver duplicación de modelos MongoDB
  4. Completar schema.sql con todas las tablas

FASE 2 (Semana 3-4) — Funcionalidad real:
  5. Implementar ThreatHunting con query real a security_logs
  6. Reemplazar charts hardcodeados del Dashboard con datos de /stats y /metrics
  7. Implementar gestión real de API Keys (backend + frontend)
  8. Conectar ThreatIntelligence charts a datos MongoDB reales

FASE 3 (Semana 5-6) — Robustez:
  9. Persistir estado de detección en Redis
  10. Implementar email de invitaciones
  11. Eliminar código muerto (LandingPage_temp.jsx)
  12. Limpiar TerminalWidget o conectarlo a SSE real
```
