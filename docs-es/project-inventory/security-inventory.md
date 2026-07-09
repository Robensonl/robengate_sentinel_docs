# Inventario del Proyecto — Seguridad

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026

---

## Resumen del Modelo de Seguridad

RobenGate Sentinel implementa un modelo de seguridad **Zero-Trust multi-capa** con las siguientes capas de defensa:

```
┌─────────────────────────────────────────────┐
│  Capa 1: Red y TLS (Nginx)                   │
│  TLS 1.2/1.3, HSTS, CORS estricto            │
├─────────────────────────────────────────────┤
│  Capa 2: Rate Limiting y Auto-Ban             │
│  Redis-backed, por IP, por endpoint           │
├─────────────────────────────────────────────┤
│  Capa 3: Autenticación                        │
│  JWT + WebAuthn + MFA (OTP/TOTP) + bcrypt     │
├─────────────────────────────────────────────┤
│  Capa 4: Autorización RBAC                    │
│  4 roles, permisos granulares, readOnly()     │
├─────────────────────────────────────────────┤
│  Capa 5: Validación y Sanitización            │
│  HPP, NoSQL injection, null-byte, Joi/Zod     │
├─────────────────────────────────────────────┤
│  Capa 6: Detección y Correlación              │
│  Risk engine, detection engine, AI            │
├─────────────────────────────────────────────┤
│  Capa 7: Auditoría y Monitorización           │
│  Audit log MongoDB, SSE alerts, Prometheus    │
└─────────────────────────────────────────────┘
```

---

## 1. Autenticación

### JWT (JSON Web Tokens)
| Parámetro | Valor |
|---|---|
| Access Token TTL | 15 minutos |
| Refresh Token TTL | 7 días |
| Algoritmo | HS256 |
| Blacklist | Redis por JTI |
| Rotación | Sí — nuevo refresh token en cada renovación |
| Almacenamiento cliente | Memoria (NO localStorage) + httpOnly cookie |

**Archivos:**
- `backend/src/config/jwt.js`
- `backend/src/middleware/authenticate.js`
- `frontend/src/shared/services/tokenManager.js`

### bcrypt
| Parámetro | Valor |
|---|---|
| Work Factor | 12 |
| Algoritmo | bcrypt |
| Rehash automático | Sí (si work factor cambia) |

### WebAuthn / FIDO2
| Parámetro | Valor |
|---|---|
| Librería | `@simplewebauthn/server` (backend) + `@simplewebauthn/browser` (frontend) |
| Tipo | Resident key (passkey) |
| Algoritmos soportados | ECDSA P-256, RSA PKCS#1 v1.5 |
| Verificación | Verificación de origen, challenge único |

### MFA
| Canal | Implementación | Estado |
|---|---|---|
| Email OTP | Nodemailer + Redis TTL 5min | ✅ Real |
| TOTP (Google Authenticator) | `otpauth` + shared secret cifrado | ✅ Real |
| SMS | Twilio (no configurado en dev) | ⚠️ Parcial |
| Backup Codes | 8 códigos de 8 chars, bcrypt hasheados | ✅ Real |

**Modelo Zero-Trust para MFA:**
```
1. Login con contraseña → Token "pending" (corto TTL)
2. Envío de OTP al canal configurado
3. Verificación OTP → Token de acceso completo
4. Token pending no tiene acceso a recursos protegidos
```

---

## 2. Autorización RBAC

### Jerarquía de Roles
| Rol | Nivel | Descripción |
|---|---|---|
| `admin` | 4 | Administración total del sistema |
| `analyst` | 3 | Análisis completo de seguridad |
| `responder` | 2 | Gestión de incidentes y respuesta |
| `viewer` | 1 | Solo lectura — acceso SOC completo |

### Mapa de Permisos por Módulo

| Módulo | viewer | responder | analyst | admin |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Security Logs | ✅ R | ✅ R | ✅ R | ✅ RW |
| Alerts | ✅ R | ✅ R | ✅ RW | ✅ RW |
| Incidents | ✅ R | ✅ RW | ✅ RW | ✅ RW |
| Attack Map | ✅ R | ✅ R | ✅ R | ✅ R |
| AI Analysis | ✅ R | ✅ R | ✅ R | ✅ R |
| Vulnerabilities | ✅ R | ✅ R | ✅ RW | ✅ RW |
| Devices | ✅ R | ✅ RW | ✅ RW | ✅ RW |
| Sessions | ✅ R | ✅ R | ✅ R | ✅ RW |
| Threat Intel | ❌ | ❌ | ✅ RW | ✅ RW |
| Threat Hunting | ❌ | ❌ | ✅ R | ✅ RW |
| Honeypot | ❌ | ❌ | ✅ R | ✅ R |
| Audit Logs | ❌ | ❌ | ✅ R | ✅ R |
| Users | ❌ | ❌ | ✅ R | ✅ RW |
| Organizations | ❌ | ❌ | ❌ | ✅ RW |
| Playbooks | ❌ | ❌ | ✅ RW | ✅ RW |

**R** = Read, **W** = Write

### Middleware de Autorización
```javascript
// authorize.js — Uso en rutas
router.get('/', authenticate, authorize.minRole('viewer'), handler)
router.post('/', authenticate, authorize.minRole('analyst'), handler)

// readOnly() — Bloquea escritura para viewers
router.post('/', authenticate, authorize.readOnly(), handler)
// Permite GET para viewers, bloquea POST/PUT/PATCH/DELETE
```

---

## 3. Protección de Red y Headers

### Headers de Seguridad (Helmet)
| Header | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `X-Powered-By` | Eliminado |

### CORS
```javascript
origin: [CORS_ORIGINS env]   // Lista blanca estricta
credentials: true
allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Secret']
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
```

### TLS / Nginx
| Parámetro | Valor |
|---|---|
| Protocolos | TLSv1.2, TLSv1.3 |
| Ciphers | Mozilla Modern Profile |
| HSTS | 63072000s, includeSubDomains, preload |
| OCSP Stapling | Habilitado |
| Session Tickets | Deshabilitados |
| HTTP→HTTPS | Redirect 301 |

---

## 4. Rate Limiting y Auto-Ban

### Rate Limiter
| Configuración | Valor |
|---|---|
| Backend global | 100 req/min por IP |
| Login | 5 intentos/15min |
| MFA | 3 intentos/5min |
| Almacenamiento | Redis |
| Headers de respuesta | `X-RateLimit-*` |

### Auto-Ban
| Parámetro | Valor |
|---|---|
| Umbral de ban | Configurable (default: 50 fallos/15min) |
| Tipo de ban | Temporal o permanente |
| Almacenamiento | PostgreSQL + Redis (caché rápida) |
| Bypass | Solo admins pueden desbanear |
| Middleware | `autoban.js` — verificación en cada request |

---

## 5. Sanitización de Entradas

### HPP (HTTP Parameter Pollution)
- Previene inyección de parámetros duplicados en query strings
- Middleware: `sanitize.js`

### NoSQL Injection
- Sanitización de caracteres especiales MongoDB (`$`, `.` como prefijo)
- Previene inyección en queries de Mongoose

### Null-Byte Injection
- Eliminación de caracteres nulos (`\0`) en todos los inputs
- Previene bypass de filtros en sistemas de archivos

### Validación de Schema
- `backend/src/middleware/validate.js` con Joi/Zod
- Validación estricta de tipos en todos los endpoints
- Rechazo de propiedades no esperadas (`stripUnknown: true`)

---

## 6. Motor de Riesgo Adaptativo

**Archivo:** `backend/src/services/riskEngine.js`  
**Estado:** ✅ Real implementado

### Señales Evaluadas (10+)

| Señal | Peso | Descripción |
|---|---|---|
| IP nueva/desconocida | Alto | IP nunca vista para este usuario |
| País diferente | Alto | Geolocalización distinta al habitual |
| Dispositivo no registrado | Alto | Fingerprint no en lista de dispositivos |
| Hora inusual | Medio | Login fuera del horario habitual |
| Velocidad imposible | Crítico | Dos logins desde países diferentes en < 1h |
| Intentos fallidos recientes | Alto | Múltiples fallos de login anteriores |
| VPN/Proxy detectada | Medio | IP clasificada como proxy/VPN/Tor |
| User-Agent anómalo | Medio | UA script-like o cambiado frecuentemente |
| IP en lista negra | Crítico | IP en threat intelligence feeds |
| Frecuencia de acciones | Medio | Actividad inusualmente alta |

### Niveles de Riesgo
| Score | Nivel | Acción |
|---|---|---|
| 0-25 | 🟢 Bajo | Acceso normal |
| 26-50 | 🟡 Medio | Log de advertencia |
| 51-75 | 🟠 Alto | MFA forzado / alerta analista |
| 76-100 | 🔴 Crítico | Bloqueo / ban automático |

---

## 7. Motor de Detección y Correlación

### Motor de Detección (`detectionEngine.js`)
- Detección en tiempo real de patrones de ataque
- Reglas configurables por tipo de evento
- Generación automática de alertas

### Motor de Correlación (`correlationEngine.js`)
- Correlación de múltiples eventos relacionados
- Ventana temporal configurable
- Generación de incidentes desde patrones correlacionados

### Motor de IA (`aiCorrelationEngine.js`)
- Correlación heurística basada en IA
- Scoring de anomalías
- Detección de comportamiento anómalo a lo largo del tiempo

---

## 8. Honeypot

**Estado:** ✅ Real implementado

| Servicio | Puerto | Descripción |
|---|---|---|
| SSH Honeypot | 2222 | Captura intentos de autenticación SSH |
| HTTP Honeypot | 8080 | Captura peticiones HTTP sospechosas |

**Flujo de captura:**
1. Atacante conecta al honeypot
2. `payloadCapture.js` sanitiza y estructura el evento
3. `api-integration.js` envía a `/internal/honeypot/events`
4. Backend procesa, enriquece con geolocalización
5. Genera alerta de seguridad + audit log
6. SSE notifica a analistas en tiempo real

---

## 9. Auditoría

**Almacenamiento:** MongoDB (auditoría) + PostgreSQL (`audit_logs`)

| Evento | Severidad | SSE |
|---|---|---|
| Login exitoso | LOW | No |
| Login fallido | MEDIUM | No |
| MFA configurado | MEDIUM | No |
| Cambio de rol | HIGH | Sí |
| Usuario creado | MEDIUM | No |
| Usuario desactivado | HIGH | Sí |
| Cambio de contraseña | HIGH | Sí |
| WebAuthn registrado | MEDIUM | No |
| IP baneada | HIGH | Sí |
| Incidente creado | HIGH | Sí |
| Incidente crítico | CRITICAL | Sí |
| Acceso denegado (403) | MEDIUM | No |

---

## 10. Módulo Independiente de Seguridad (`security/`)

El directorio `security/` contiene un módulo Express independiente con:

| Archivo | Descripción |
|---|---|
| `app.js` | App Express con políticas de seguridad aplicadas |
| `middleware/auth.js` | JWT auth middleware reutilizable |
| `middleware/rbac.js` | RBAC middleware reutilizable |
| `policies/cors.js` | Política CORS centralizada |
| `policies/csp.js` | Content Security Policy |
| `policies/helmet.js` | Headers de seguridad completos |

**Propósito:** Módulo de seguridad standalone, importable por otros servicios del ecosistema.

---

## 11. Score de Seguridad (Post-Auditoría)

| Dimensión | Score |
|---|---|
| Autenticación | 91/100 |
| Backend (API Security) | 91/100 |
| Frontend (Storage/XSS) | 87/100 |
| Infraestructura | 82/100 |
| Gestión de Secretos | 83/100 |
| Logging y Auditoría | 78/100 |
| **Score Global** | **85/100** |

**Estándar:** OWASP SAMM 2.0 Level 4  
**Pre-remediación:** 52/100 → **Post-remediación:** 85/100

---

## 12. Conformidad

| Estándar | Estado |
|---|---|
| OWASP Top 10 | Cubierto (post-remediación) |
| OWASP SAMM 2.0 | Level 4 |
| GDPR (principios) | Cumplimiento parcial |
| SOC 2 | En roadmap |
| ISO 27001 | En roadmap |
