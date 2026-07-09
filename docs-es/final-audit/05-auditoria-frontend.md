# 05 — Auditoría Frontend: Componentes, Rutas y Estado

> **Auditoría:** RobenGate Sentinel — Junio 2026

---

## INVENTARIO DE PÁGINAS Y ESTADO

### Módulo: Landing & Marketing

| Página | Ruta | Estado | Observación |
|--------|------|--------|------------|
| `LandingPage.jsx` | `/` | 🟢 Funcional | Contenido hardcodeado (esperado para landing) |
| `LandingPage_temp.jsx` | (ninguna) | 🔴 CÓDIGO MUERTO | Archivo de respaldo nunca importado en routes.jsx |
| `ArchitecturePage.jsx` | `/architecture` | 🟢 Funcional | Estático, esperado |
| `DatabaseArchitecture.jsx` | `/database` | 🟢 Funcional | Estático, esperado |
| `SecurityHeadersPage.jsx` | `/security-headers` | 🟡 Sin API | Contenido hardcodeado, sin análisis real de headers |
| `ComponentShowcase.jsx` | `/showcase` | 🟢 Funcional | Librería de componentes, estático |
| `BusinessCard.jsx` | `/contact` | 🟢 Funcional | Información estática |

### Módulo: Auth

| Página | Ruta | Estado | API Calls |
|--------|------|--------|-----------|
| `Login.jsx` | `/login` | 🟢 FUNCIONAL | `authApi.login()` |
| `Register.jsx` | `/register` | 🟢 FUNCIONAL | `authApi.register()` |
| `MfaVerify.jsx` | `/mfa-verify` | 🟢 FUNCIONAL | `authApi.verifyMfa()`, countdown real |
| `ForgotPassword.jsx` | `/forgot-password` | 🟢 FUNCIONAL | `authApi.forgotPassword()` |
| `ResetPassword.jsx` | `/reset-password` | 🟢 FUNCIONAL | `authApi.resetPassword()` |
| `BiometricAuth.jsx` | `/biometric` | 🟢 FUNCIONAL | WebAuthn API real |

### Módulo: Dashboard

| Componente | Estado | Datos | Problema |
|-----------|--------|-------|---------|
| `Dashboard.jsx` | 🟡 PARCIAL | KPIs reales, 3 charts fijos | threatData/activityData/severityData hardcodeados |
| `SecurityMetricCard.jsx` | 🟢 FUNCIONAL | Datos del padre | — |
| `LineChart.jsx` | 🟡 PARCIAL | seedData del padre | Recibe datos hardcodeados |
| `BarChart.jsx` | 🟡 PARCIAL | seedData del padre | Recibe datos hardcodeados |

### Módulo: Security

| Página | Ruta | Estado | Problema |
|--------|------|--------|---------|
| `SecurityLogs.jsx` | `/logs` | 🟢 FUNCIONAL | — |
| `AuditLogs.jsx` | `/audit` | 🟡 PARCIAL | DEMO_LOGS fallback silencioso |
| `HoneypotPage.jsx` | `/honeypot` | 🟡 PARCIAL | Trampas FTP/SMB falsas, charts hardcodeados |
| `ThreatIntelligence.jsx` | `/threats` | 🟡 PARCIAL | MITRE/Actores/Trend hardcodeados |
| `ThreatHunting.jsx` | `/threat-hunting` | 🔴 SIMULADO | 100% mock, sin backend |
| `TerminalWidget.jsx` | (componente) | 🔴 DECORATIVO | Math.random() cada 2s |
| `SIEMTerminal.jsx` | (componente) | 🔴 DECORATIVO | setInterval con eventos simulados |

### Módulo: SOC Operations

| Página | Ruta | Estado | Fallback |
|--------|------|--------|---------|
| `AttackMap.jsx` | `/attack-map` | 🟢 FUNCIONAL | Badge visual "DEMO" si SSE cae |
| `Alerts.jsx` | `/alerts` | 🟡 PARCIAL | SEED_ALERTS — silencioso |
| `Incidents.jsx` | `/incidents` | 🟡 PARCIAL | SEED_INCIDENTS — silencioso |
| `Vulnerabilities.jsx` | `/vulnerabilities` | 🟡 PARCIAL | VULNS[] — silencioso |
| `AIAnalysis.jsx` | `/ai-analysis` | 🟢 FUNCIONAL | — |

### Módulo: Users & Admin

| Página | Ruta | Estado | Observación |
|--------|------|--------|------------|
| `UserList.jsx` | `/users` | 🟢 FUNCIONAL | Admin only, RBAC correcto |
| `DeviceList.jsx` | `/devices` | 🟢 FUNCIONAL | — |
| `SessionManagement.jsx` | `/sessions` | 🟢 FUNCIONAL | — |
| `Settings.jsx` | `/settings` | 🟡 PARCIAL | DEMO_KEYS — API Keys no implementado |

---

## RUTAS — ANÁLISIS DE PROTECCIÓN

| Ruta | Protección | Mínimo Rol | Estado |
|------|-----------|-----------|--------|
| `/` | ❌ Pública | — | ✅ OK |
| `/login` | ❌ Pública | — | ✅ OK |
| `/register` | ❌ Pública | — | ✅ OK |
| `/dashboard` | ✅ Auth requerida | any | ✅ OK |
| `/logs` | ✅ Auth requerida | viewer | ✅ OK |
| `/audit` | ✅ Auth requerida | viewer | ✅ OK |
| `/attack-map` | ✅ Auth requerida | viewer | ✅ OK |
| `/alerts` | ✅ Auth requerida | viewer | ✅ OK |
| `/incidents` | ✅ Auth requerida | viewer | ✅ OK |
| `/ai-analysis` | ✅ Auth requerida | viewer | ✅ OK |
| `/vulnerabilities` | ✅ Auth requerida | viewer | ✅ OK |
| `/threats` | ✅ Auth requerida | viewer | ✅ OK |
| `/honeypot` | ✅ Auth requerida | viewer | ✅ OK |
| `/threat-hunting` | ✅ Auth requerida | viewer | ✅ OK |
| `/users` | ✅ Auth requerida | admin | ✅ OK |
| `/settings` | ✅ Auth requerida | any | ✅ OK |
| `/showcase` | ❌ Pública | — | 🟡 Expone UI interna |

**Observación:** `/showcase` (ComponentShowcase) es público y expone el sistema de diseño interno. No es un riesgo de seguridad, pero puede revelar información sobre la plataforma a usuarios no autenticados.

---

## ESTADO DE IMPORTACIONES

### Importaciones rotas detectadas

Ninguna importación rota detectada. Todos los componentes referenciados en `routes.jsx` existen en el sistema de archivos.

### Archivo no importado (código muerto)

| Archivo | Problema |
|---------|---------|
| `frontend/src/features/landing/pages/LandingPage_temp.jsx` | No importado en ningún archivo. Es una versión anterior en inglés de la landing page. |

---

## ESTADO DE SISTEMAS EN TIEMPO REAL

### SSE Connection (`realTimeService.js`)

**Flujo:**
1. Al iniciar, intenta conectar a `GET /api/events?token={JWT}`
2. Si conecta: modo SSE real, eventos de backend
3. Si falla (timeout 5s): activa `attackSimulator.js` (mock mode)
4. Badge visual "DEMO — Datos Simulados" cuando en modo mock

**Eventos SSE del backend:**
- `threat` → `RT_EVENTS.ATTACK` (nuevos ataques)
- `metric` → `RT_EVENTS.METRICS` (KPIs actualizados)
- `incident` → `RT_EVENTS.SIEM` (incidentes)
- `alert` → `RT_EVENTS.ATTACK` (alertas críticas)

**Problema detectado:** Cuando el SSE falla, el `realTimeService` no intenta reconectarse automáticamente. Una vez en mock mode, permanece en mock mode hasta el próximo refresh de página.

### Mock Mode Generators

| Generador | Intervalo | Datos generados |
|-----------|----------|----------------|
| Attack events | 1500-4000ms aleatorio | IPs falsas, coordenadas falsas, severidad aleatoria |
| SIEM events | 800-3200ms aleatorio | Mensajes de infraestructura inventados |
| Anomaly score | 2000ms fijo | Drift con `Math.random() - 0.5` |
| Session count | 10000ms fijo | Counter con drift aleatorio |
| Brute force | 8000ms fijo | Sesiones de brute force falsas |
| XSS events | 5000ms fijo | Eventos XSS inventados |

**Todos estos generadores corren en el navegador del cliente** usando `window.dispatchEvent`. No hay comunicación real con el backend en modo mock.

---

## ESTADO DE GESTIÓN DE ESTADO

### AuthContext

| Estado | Fuente | Persistencia | Estado |
|--------|--------|-------------|--------|
| `user` | `GET /auth/me` | `localStorage['rg_user']` (metadata solo) | 🟢 OK |
| `accessToken` | `POST /auth/login` | Memoria JS (no persiste en storage) | 🟢 OK (correcto por seguridad) |
| `refreshToken` | HttpOnly cookie | Cookie segura | 🟢 OK |
| `isAuthenticated` | Derivado de user | Derivado | 🟢 OK |
| `role` | user.role | Via localStorage | 🟢 OK |
| `permissions` | `permissions.js` config | Calculado en runtime | 🟢 OK |

### Problema de expiración de sesión

`AuthContext` tiene lógica de `sessionTimeout` pero depende de actividad del usuario (mouse/teclado events). Si el usuario abre la app y no interactúa, el `accessToken` expirado no se renueva automáticamente. Puede causar que las APIs fallen con 401 de manera inesperada.

**Verificar:** El interceptor de `api.js` debe tener manejo de 401 con auto-refresh del token.

---

## COMPONENTES CON Math.random() — INVENTARIO COMPLETO

| Archivo | Línea | Uso | Impacto |
|---------|-------|-----|---------|
| `realTimeService.js` | ~198 | `Math.round((Math.random() - 0.45) * 8)` — sessions drift | Contador de sesiones activas falso |
| `realTimeService.js` | ~219 | `Math.random() > 0.7` — probabilidad de alerta crítica | Alertas críticas inventadas |
| `realTimeService.js` | ~222 | `1500 + Math.random() * 2500` — timing de ataques | Frecuencia de ataques inventada |
| `realTimeService.js` | ~241 | `800 + Math.random() * 2400` — timing SIEM | Frecuencia SIEM inventada |
| `realTimeService.js` | ~246 | sessions drift | Duplicado del ~198 |
| `useRealTimeData.js` | ~53 | Anomaly drift | Puntaje de anomalía falso |
| `useRealTimeData.js` | ~56 | Anomaly fallback | Historial de anomalías falso |
| `TerminalWidget.jsx` | ~36-37 | Tipo y mensaje de log | Terminal completamente falso |
| `ThreatHunting.jsx` | ~120-121 | Count y timing de resultados | Resultados de búsqueda completamente falsos |
| `attackSimulator.js` | múltiples | Generador completo | Motor de simulación completo |

---

## PROBLEMAS DE RENDERIZADO

### Errores conocidos (sin error boundaries)

El frontend no tiene `ErrorBoundary` a nivel de módulo. Si un componente lanza un error en `render()`, **toda la aplicación se desmonta** sin mostrar un mensaje útil al usuario.

### Charts con datos vacíos

Los componentes `recharts` (LineChart, AreaChart, PieChart) no manejan el caso de `data = []`. En algunos casos muestran un chart vacío sin mensaje "sin datos". Verificar particularmente:
- `Dashboard` cuando stats API falla
- `AIAnalysis` anomaly stream con 0 eventos

### React-simple-maps y CDN externo

```javascript
// AttackMap.jsx
const WORLD_TOPOLOGY = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
```

El mapa del mundo se carga desde un CDN externo en cada visita. Si el CDN no está disponible, el Attack Map muestra un mapa en blanco sin error visible al usuario.

**Riesgo:** Dependencia de CDN externo en producción.

---

## PROBLEMAS RESPONSIVE

| Componente | Problema | Dispositivo |
|-----------|---------|------------|
| `AttackMap.jsx` | El SVG del mapa no es responsive en pantallas <768px | Mobile/tablet |
| `ThreatHunting.jsx` | Layout de dos columnas no colapsa correctamente en <1024px | Tablet |
| `Dashboard.jsx` | Grid de KPIs puede superponerse en <640px | Mobile |
| `AuditLogs.jsx` | Tabla con muchas columnas no tiene scroll horizontal explícito | Mobile |
| Marketing pages | No tienen media queries específicas | Mobile |

---

## LIBRERÍAS FRONTEND

| Librería | Versión | Uso | Riesgo |
|----------|---------|-----|--------|
| `react` | ~18.x | Framework principal | ✅ Estable |
| `vite` | ~5.x | Build tool | ✅ Estable |
| `recharts` | — | Gráficas | ✅ Estable |
| `react-simple-maps` | — | Attack Map | 🟡 CDN dependencia |
| `@simplewebauthn/browser` | ~13.x | WebAuthn | ✅ Estable |
| `sonner` | — | Toasts | ✅ Ligero |
| `lucide-react` | — | Iconos | ✅ Estable |
| `tailwindcss` | ~3.x | Estilos | ✅ Estable |

---

## RESUMEN DE HALLAZGOS FRONTEND

| Categoría | Conteo | Detalles |
|-----------|--------|---------|
| Páginas completamente funcionales | 19 | Auth, Dashboard KPIs, Logs, AI, Users, Devices, Sessions, RBAC |
| Páginas parcialmente funcionales | 9 | Con fallback silencioso a mock data |
| Páginas completamente simuladas | 1 | ThreatHunting |
| Páginas decorativas sin datos reales | 2 | TerminalWidget, SIEMTerminal |
| Rutas rotas | 0 | Todas las rutas existen |
| Importaciones rotas | 0 | Ninguna |
| Archivos código muerto | 1 | LandingPage_temp.jsx |
| Usos de Math.random() | 10+ | Ver tabla arriba |
| Dependencias CDN externas | 1 | world-atlas@2 para topología del mapa |
| Error boundaries | 0 | Sin manejo de errores de renderizado |
