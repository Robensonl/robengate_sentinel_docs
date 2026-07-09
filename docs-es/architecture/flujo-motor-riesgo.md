# Flujo del Motor de Riesgo — RobenGate Sentinel

**Módulo:** `backend/src/services/riskEngine.js`  
**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Descripción General

El **Risk Engine** es el núcleo analítico de la autenticación. Calcula un **puntaje de riesgo de 0 a 100** para cada intento de login evaluando 10+ señales de comportamiento simultáneamente. Un puntaje alto puede bloquear el acceso o forzar MFA adicional.

---

## Flujo Principal

```mermaid
flowchart TD
    START([Login Request\nIP + User + Device]) --> COLLECT[Recopilar contexto\nIP, User-Agent, Geoloc, Historia]
    
    COLLECT --> SIGNALS{Evaluar 10+\nseñales de riesgo}
    
    SIGNALS --> SIG1[Nueva IP\n+15 puntos]
    SIGNALS --> SIG2[Cambio de país\n+25 puntos]
    SIGNALS --> SIG3[Viaje imposible\n+40 puntos]
    SIGNALS --> SIG4[IP en blacklist\n+50 puntos]
    SIGNALS --> SIG5[VPN detectada\n+20 puntos]
    SIGNALS --> SIG6[Hora inusual\n+10 puntos]
    SIGNALS --> SIG7[Nuevo user-agent\n+15 puntos]
    SIGNALS --> SIG8[Intentos fallidos\n+5 por intento]
    SIGNALS --> SIG9[Tor network\n+50 puntos]
    SIGNALS --> SIG10[Data center ASN\n+20 puntos]
    
    SIG1 & SIG2 & SIG3 & SIG4 & SIG5 & SIG6 & SIG7 & SIG8 & SIG9 & SIG10 --> SUM[Sumar puntuaciones\ncon pesos]
    
    SUM --> NORMALIZE[Normalizar 0-100\nmin/max capping]
    
    NORMALIZE --> DECISION{Score total}
    
    DECISION -->|0-29 BAJO| ALLOW[✅ Permitir\nLogin normal]
    DECISION -->|30-59 MEDIO| MFA_FORCE[⚠️ Forzar MFA\nPending token]
    DECISION -->|60-79 ALTO| MFA_FORCE
    DECISION -->|80-100 CRÍTICO| BLOCK[🚫 Bloquear\nLog + Alerta]
    
    ALLOW --> AUDIT_LOG[Audit log\nrisk_score: bajo]
    MFA_FORCE --> PENDING_TOKEN[Emitir pending_token\nEsperar MFA]
    BLOCK --> AUDIT_LOG_BLOCK[Audit log\nrisk_score: crítico\nSSE alerta]
    
    PENDING_TOKEN --> MFA_VERIFY{MFA verificado?}
    MFA_VERIFY -->|Sí| FULL_LOGIN[✅ Login completo\nEmitir JWT]
    MFA_VERIFY -->|No| BLOCK_MFA[🚫 Bloquear\nIntentos registrados]
```

---

## Señales de Riesgo Detalladas

### Señal 1: Nueva IP Address (+15)
- **Condición:** IP no vista en las últimas 30 sesiones del usuario
- **Fuente:** Tabla `sessions` PostgreSQL
- **Justificación:** Dispositivo/red desconocida

### Señal 2: Cambio de País (+25)
- **Condición:** País de la IP actual ≠ país de las últimas 3 sesiones
- **Fuente:** MaxMind GeoIP2 → `geoService.js`
- **Justificación:** Acceso desde geografía diferente a la habitual

### Señal 3: Viaje Imposible (+40)
- **Condición:** Distancia entre sesiones / tiempo transcurrido > velocidad máxima realista (1000 km/h)
- **Fuente:** Cálculo geodésico entre coordenadas GPS de IPs
- **Justificación:** Físicamente imposible haber viajado tan rápido
- **Ejemplo:** Sesión en Madrid hace 2h, login desde Tokio ahora

### Señal 4: IP en Blacklist (+50)
- **Condición:** IP presente en tabla `banned_ips` o feeds de threat intelligence
- **Fuente:** PostgreSQL `banned_ips` + MongoDB `threat_indicators`
- **Justificación:** IP conocida como maliciosa

### Señal 5: VPN Detectada (+20)
- **Condición:** ASN corresponde a proveedor VPN conocido (lista curada)
- **Fuente:** Lookup ASN en base datos local
- **Justificación:** Evasión de controles geográficos

### Señal 6: Hora Inusual (+10)
- **Condición:** Login fuera del horario histórico del usuario (±2 horas del patrón)
- **Fuente:** Historial de sesiones en PostgreSQL
- **Justificación:** Comportamiento fuera del patrón normal

### Señal 7: Nuevo User-Agent (+15)
- **Condición:** User-Agent string no visto en historial del usuario
- **Fuente:** Tabla `devices` PostgreSQL
- **Justificación:** Nuevo dispositivo/navegador

### Señal 8: Intentos de Login Fallidos (+5 × intentos)
- **Condición:** > 2 intentos fallidos en última hora
- **Fuente:** Redis contadores de rate limiting
- **Justificación:** Posible brute force

### Señal 9: Red Tor (+50)
- **Condición:** IP pertenece a nodo Tor conocido (lista actualizada)
- **Fuente:** Lista pública de nodos Tor
- **Justificación:** Anonimización intencional

### Señal 10: ASN de Data Center (+20)
- **Condición:** IP no pertenece a ISP residencial/corporativo (es de AWS, GCP, Azure, etc.)
- **Fuente:** Lookup ASN
- **Justificación:** Automatización/scripting probable

---

## Thresholds y Acciones

| Rango de Score | Nivel | Acción | Logging |
|---|---|---|---|
| 0-29 | BAJO | Login normal, emitir JWT | INFO |
| 30-59 | MEDIO | Forzar MFA si no habitual | WARN |
| 60-79 | ALTO | Forzar MFA siempre | WARN |
| 80-100 | CRÍTICO | Bloquear login + alerta SOC | ERROR + SSE |

---

## Integración con MFA Zero-Trust

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant RiskEngine
    participant Redis

    Client->>Backend: POST /auth/login {email, password}
    Backend->>RiskEngine: calculateRisk(user, ip, ua)
    RiskEngine-->>Backend: {score: 45, signals: [...]}
    
    alt score >= 30
        Backend->>Redis: SET mfa_pending:<userId> {pending_token} TTL=10min
        Backend-->>Client: 202 {status: "mfa_required", pending_token}
        
        Client->>Backend: POST /auth/verify-mfa {pending_token, otp}
        Backend->>Redis: GET mfa_pending:<userId>
        Backend-->>Client: 200 {access_token, refresh_token}
    else score < 30
        Backend-->>Client: 200 {access_token, refresh_token}
    end
```

---

## Ejemplo de Respuesta del Risk Engine

```json
{
  "score": 65,
  "level": "HIGH",
  "signals": [
    { "name": "new_ip", "score": 15, "detail": "IP 1.2.3.4 not seen before" },
    { "name": "country_change", "score": 25, "detail": "ES → RU" },
    { "name": "new_user_agent", "score": 15, "detail": "Mozilla/5.0 (new device)" }
  ],
  "action": "require_mfa",
  "timestamp": "2026-06-15T09:30:00Z"
}
```

---

## Código Fuente

**Ubicación:** `backend/src/services/riskEngine.js`

El motor está implementado como una función pura que recibe el contexto del usuario (IP, historial, user-agent) y retorna el score calculado con todas las señales activadas. Es invocado desde `authController.js` → `login()`.
