# Motor de Riesgo — Documentación Técnica

**Módulo:** `backend/src/services/riskEngine.js`  
**Versión:** 2.0 | **Fecha:** Junio 2026

> Documentación técnica detallada del Risk Engine. Para el flujo visual con diagramas, ver [docs-es/architecture/flujo-motor-riesgo.md](../architecture/flujo-motor-riesgo.md).

---

## Función Principal

```javascript
// Interfaz pública del Risk Engine
async function calculateRisk(user, ip, userAgent, requestContext) {
  const signals = await evaluateAllSignals(user, ip, userAgent);
  const score = aggregateScore(signals);
  const level = classifyLevel(score);
  
  return {
    score,       // 0-100
    level,       // 'low' | 'medium' | 'high' | 'critical'
    signals,     // Array de señales activadas
    action,      // 'allow' | 'require_mfa' | 'block'
    timestamp: new Date().toISOString()
  };
}
```

---

## Señales y Pesos

| Signal ID | Peso | Fuente | Condición |
|---|---|---|---|
| `new_ip` | 15 | PostgreSQL sessions | IP no vista en 30 sesiones |
| `country_change` | 25 | GeoIP + sessions | País diferente al habitual |
| `impossible_travel` | 40 | GeoIP + sessions | Velocidad > 1000 km/h |
| `ip_blacklist` | 50 | threat_indicators | IP en blacklist activa |
| `vpn_detected` | 20 | ASN lookup | ASN es VPN conocida |
| `off_hours` | 10 | sessions history | Fuera de ±2h del patrón |
| `new_user_agent` | 15 | devices table | UA no registrado |
| `failed_attempts` | 5×n | Redis counters | >2 fallos en 1h |
| `tor_network` | 50 | Tor node list | IP es nodo Tor |
| `datacenter_asn` | 20 | ASN lookup | ASN tipo datacenter |

**Score máximo teórico:** 260 (todos activos) → normalizado a 100.

---

## Algoritmo de Normalización

```javascript
function normalizeScore(rawScore) {
  const MAX_THEORETICAL = 260;
  // Normalización lineal con cap en 100
  return Math.min(100, Math.round((rawScore / MAX_THEORETICAL) * 100));
}
```

---

## Integración con el Sistema

El Risk Engine es invocado en:

1. **Login (`/api/auth/login`)** — Evalúa antes de emitir JWT
2. **Refresh token (`/api/auth/refresh`)** — Re-evalúa en cada renovación
3. **Acciones sensibles** — Cambio de contraseña, añadir dispositivo

---

## Thresholds de Acción

```javascript
const RISK_THRESHOLDS = {
  LOW: 30,      // 0-29: allow
  MEDIUM: 60,   // 30-59: require_mfa
  HIGH: 80,     // 60-79: require_mfa (siempre, sin bypass)
  CRITICAL: 100 // 80+: block
};
```

---

## Logging y Métricas

Cada evaluación del Risk Engine genera:

1. **Audit log** — `RISK_SCORE_CALCULATED` con todos los signals
2. **Métrica Prometheus** — `sentinel_risk_scores_total{level="high"}`
3. **SSE alert** — Si score >= 80 (nivel crítico)

```promql
# Score promedio por nivel últimas 24h
avg by (level) (sentinel_risk_score_distribution)

# Tasa de evaluaciones que resultan en MFA
rate(sentinel_risk_mfa_required_total[1h]) / rate(sentinel_risk_evaluations_total[1h])
```
