# Inventario del Proyecto — Frontend

**Proyecto:** RobenGate Sentinel  
**Versión:** 2.0  
**Fecha:** Junio 2026

---

## Stack Tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | Framework de UI |
| Vite | 5 | Build tool y dev server |
| React Router DOM | 7 | Enrutamiento SPA |
| Tailwind CSS | 4 | Framework de estilos utilitarios |
| Zustand | 5 | Gestión de estado global |
| Recharts | 3 | Gráficos y visualización |
| D3-Geo / react-simple-maps | 3 | Mapa de ataques geolocalizado |
| Lucide React | 1.x | Iconografía |
| React Hook Form | 7 | Formularios con validación |
| Zod | 4 | Validación de schemas |
| @simplewebauthn/browser | 13 | WebAuthn/FIDO2 en el navegador |
| Axios | 1.x | Cliente HTTP |
| Motion (Framer Motion) | 12 | Animaciones |
| Sonner | 2 | Notificaciones toast |
| crypto-js | 4 | Cifrado en cliente |

---

## Estructura de Directorios

```
frontend/src/
├── app/
│   ├── main.jsx           ← Punto de entrada
│   ├── App.jsx            ← Componente raíz con providers
│   └── routes.jsx         ← Definición de todas las rutas
├── assets/                ← Imágenes estáticas
├── features/              ← Módulos por funcionalidad
│   ├── ai/
│   ├── alerts/
│   ├── attackmap/
│   ├── auth/
│   ├── dashboard/
│   ├── incidents/
│   ├── landing/
│   ├── marketing/
│   ├── security/
│   ├── users/
│   └── vulnerabilities/
├── shared/                ← Componentes y utilidades compartidas
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   └── utils/
└── styles/                ← Estilos globales
```

---

## 1. Módulos de Features (`src/features/`)

### 1.1 Módulo `auth/` — Autenticación

| Página | Ruta | Descripción | Auth |
|---|---|---|---|
| `Login.jsx` | `/login` | Formulario de inicio de sesión | Pública |
| `Register.jsx` | `/register` | Registro de nuevos usuarios | Pública |
| `MfaVerify.jsx` | `/mfa-verify` | Verificación de código MFA | Pública (pending) |
| `ForgotPassword.jsx` | `/forgot-password` | Solicitud de reset de contraseña | Pública |
| `ResetPassword.jsx` | `/reset-password` | Reset de contraseña con token | Pública |
| `BiometricAuth.jsx` | `/biometric-auth` | Autenticación WebAuthn | Pública |

### 1.2 Módulo `dashboard/` — Panel Principal

| Componente | Descripción | Acceso Mínimo |
|---|---|---|
| `Dashboard.jsx` | Dashboard SOC principal con métricas | `viewer` |
| `BarChart.jsx` | Gráfico de barras reutilizable | Componente |
| `LineChart.jsx` | Gráfico de líneas reutilizable | Componente |
| `SecurityMetricCard.jsx` | Tarjeta de métrica de seguridad | Componente |

### 1.3 Módulo `security/` — Centro de Seguridad

| Página | Ruta | Descripción | Acceso Mínimo |
|---|---|---|---|
| `SecurityLogs.jsx` | `/security-logs` | Logs de seguridad con filtros | `viewer` |
| `AuditLogs.jsx` | `/audit-logs` | Logs de auditoría | `analyst` |
| `HoneypotPage.jsx` | `/honeypot` | Panel del honeypot | `analyst` |
| `ThreatIntelligence.jsx` | `/threat-intelligence` | Intelligence feeds, IOCs | `analyst` |
| `ThreatHunting.jsx` | `/threat-hunting` | Búsqueda proactiva de amenazas | `analyst` |
| `SecurityHeaders.jsx` | `/security-headers` | Demo de headers de seguridad | Pública |

**Componentes del módulo:**
| Componente | Descripción |
|---|---|
| `SIEMTerminal.jsx` | Terminal SIEM con stream de eventos |
| `TerminalWidget.jsx` | Widget de terminal genérico |
| `ThreatVisualization.jsx` | Visualización de amenazas |

### 1.4 Módulo `alerts/` — Alertas

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `Alerts.jsx` | `/alerts` | Lista y gestión de alertas de seguridad | `viewer` |

**Características:**
- Filtrado por severidad, tipo, estado
- Asignación a analistas (requiere `analyst`)
- `PermissionGate` bloquea acciones de escritura para viewers

### 1.5 Módulo `incidents/` — Incidentes

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `Incidents.jsx` | `/incidents` | Gestión de incidentes de seguridad | `viewer` |

**Características:**
- CRUD de incidentes (escribir requiere `responder`)
- Escalado y cierre de incidentes
- `PermissionGate` para acciones según rol

### 1.6 Módulo `attackmap/` — Mapa de Ataques

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `AttackMap.jsx` | `/attack-map` | Mapa mundial de ataques geolocalizados | `viewer` |

**Características:**
- Mapa SVG con `react-simple-maps` + `d3-geo`
- Origen y destino de ataques por IP
- Animaciones de conexión en tiempo real

### 1.7 Módulo `ai/` — Análisis de IA

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `AIAnalysis.jsx` | `/ai-analysis` | Análisis de IA, correlación, scoring | `viewer` |

### 1.8 Módulo `vulnerabilities/` — Vulnerabilidades

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `Vulnerabilities.jsx` | `/vulnerabilities` | Inventario de vulnerabilidades CVE | `viewer` |

### 1.9 Módulo `users/` — Gestión de Usuarios

| Página | Ruta | Acceso Mínimo |
|---|---|---|
| `UserList.jsx` | `/users` | Lista y gestión de usuarios | `analyst` |
| `DeviceList.jsx` | `/devices` | Dispositivos registrados | `viewer` |
| `SessionManagement.jsx` | `/sessions` | Sesiones activas | `viewer` |
| `Settings.jsx` | `/settings` | Configuración de cuenta | `viewer` |

### 1.10 Módulo `landing/` — Landing Page

| Página | Ruta |
|---|---|
| `LandingPage.jsx` | `/` |

**Características:** Marketing, demostración de features, CTA de registro

### 1.11 Módulo `marketing/` — Páginas de Marketing

| Página | Ruta | Descripción |
|---|---|---|
| `ArchitecturePage.jsx` | `/architecture` | Diagrama de arquitectura visual |
| `DatabaseArchitecture.jsx` | `/database-architecture` | Arquitectura de base de datos |
| `BusinessCard.jsx` | `/business-card` | Tarjeta de presentación del producto |
| `ComponentShowcase.jsx` | `/showcase` | Showcase de componentes del sistema |

---

## 2. Componentes Compartidos (`src/shared/components/`)

| Componente | Descripción |
|---|---|
| `BrandLogo.jsx` | Logo de RobenGate Sentinel |
| `Button.jsx` | Botón reutilizable con variantes |
| `CommandPalette.jsx` | Paleta de comandos (estilo VS Code / Linear) |
| `Logo.jsx` | Logo simplificado |
| `Navbar.jsx` | Barra de navegación principal |
| `NotificationCenter.jsx` | Centro de notificaciones |
| `PermissionGate.jsx` | Componente de control de acceso por rol |
| `QRCode.jsx` | Generación de QR codes (para TOTP) |
| `SecurityBadge.jsx` | Insignia de estado de seguridad |
| `SocialButtons.jsx` | Botones de OAuth social |
| `ThemeSwitcher.jsx` | Switcher dark/light mode |
| `Toast.jsx` | Notificaciones toast |

### Layout Components (`shared/components/layout/`)

| Componente | Descripción |
|---|---|
| `PageLayout.jsx` | Layout principal con navbar, sidebar, permisos |
| `ProtectedRoute.jsx` | Ruta protegida con redirección a login |
| `AccessDenied.jsx` | Página 403 de acceso denegado |
| `CyberBackground.jsx` | Fondo animado para páginas de auth |

---

## 3. Sistema de Permisos RBAC (Frontend)

### `src/shared/config/permissions.js` — Configuración Centralizada

```javascript
// Roles ordenados por nivel
ROLES = ['viewer', 'responder', 'analyst', 'admin']

// Mapa de permisos por acción
PERMISSIONS = {
  'users:read':     'analyst',
  'users:write':    'admin',
  'logs:read':      'viewer',
  'incidents:read': 'viewer',
  'incidents:write':'responder',
  // ... más de 30 permisos
}

// Verificación
hasPermission(role, action)  // true/false
meetsMinRole(role, minRole)  // true/false

// Mínimo de rol por ruta
ROUTE_MIN_ROLE = {
  '/attack-map':    'viewer',
  '/alerts':        'viewer',
  '/incidents':     'viewer',
  '/ai-analysis':   'viewer',
  '/users':         'analyst',
  // ...
}
```

### `src/shared/hooks/usePermission.js` — Hook React

```javascript
const { can, canRead, canWrite, isAtLeast, isViewer, isAdmin, isAnalyst } = usePermission()

// Uso en componente
if (can('incidents:write')) { /* mostrar botón */ }
if (isAtLeast('analyst')) { /* mostrar sección */ }
```

### `PermissionGate.jsx` — Componente Declarativo

```jsx
<PermissionGate permission="incidents:write">
  <button>Cerrar Incidente</button>
</PermissionGate>

<PermissionGate minRole="analyst" fallback={<ReadOnlyBadge />}>
  <EditForm />
</PermissionGate>
```

---

## 4. Contextos (`src/shared/contexts/`)

| Contexto | Estado Global | Hook |
|---|---|---|
| `AuthContext.jsx` | Usuario, token, roles, isViewer, isAdmin | `useAuth()` |
| `ThemeContext.jsx` | Tema dark/light | `useTheme()` |
| `ToastContext.jsx` | Notificaciones | `useToast()` |

### AuthContext — Estado Completo

```javascript
{
  user: { id, email, name, role },
  token: string,               // Access token (memoria, no localStorage)
  isAuthenticated: boolean,
  loading: boolean,
  isViewer: boolean,
  isResponder: boolean,
  isAnalyst: boolean,
  isAdmin: boolean,
  canPerform: (action) => boolean,
  login: async (credentials) => void,
  logout: () => void,
  refreshToken: () => Promise<void>
}
```

---

## 5. Hooks Personalizados (`src/shared/hooks/`)

| Hook | Descripción |
|---|---|
| `usePermission.js` | Acceso al sistema RBAC centralizado |
| `useLoginForm.js` | Lógica del formulario de login |
| `useRealTimeData.js` | Suscripción a eventos SSE en tiempo real |
| `useTokenRefresh.js` | Auto-renovación silenciosa de tokens JWT |
| `useWebAuthn.js` | Integración con WebAuthn browser API |

---

## 6. Servicios Frontend (`src/shared/services/`)

| Servicio | Descripción |
|---|---|
| `api.js` | Cliente Axios con interceptors de auth y refresh |
| `realTimeService.js` | Gestión de conexión SSE y distribución de eventos |
| `attackSimulator.js` | Simulador de ataques (fallback para demo sin datos reales) |
| `tokenManager.js` | Gestión segura de tokens (en memoria, no localStorage) |

### `api.js` — Interceptors

```javascript
// Request interceptor: añade Authorization: Bearer <token>
// Response interceptor: 
//   - 401 → intenta refresh silencioso
//   - Si falla refresh → logout automático
```

---

## 7. Utilidades (`src/shared/utils/`)

| Utilidad | Descripción |
|---|---|
| `deviceFingerprint.js` | Generación de fingerprint de dispositivo |
| `mask.js` | Enmascaramiento de datos sensibles en UI |
| `secureStorage.js` | Almacenamiento seguro (memoria, no localStorage) |

---

## 8. Configuración de Rutas (`src/app/routes.jsx`)

### Rutas Públicas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `LandingPage` | Página de inicio |
| `/login` | `Login` | Inicio de sesión |
| `/register` | `Register` | Registro |
| `/mfa-verify` | `MfaVerify` | Verificación MFA |
| `/forgot-password` | `ForgotPassword` | Reset contraseña |
| `/reset-password` | `ResetPassword` | Nueva contraseña |
| `/biometric-auth` | `BiometricAuth` | WebAuthn |
| `/architecture` | `ArchitecturePage` | Demo arquitectura |
| `/database-architecture` | `DatabaseArchitecture` | Demo DB |
| `/security-headers` | `SecurityHeadersPage` | Demo headers |
| `/business-card` | `BusinessCard` | Presentación |
| `/showcase` | `ComponentShowcase` | Showcase UI |

### Rutas Protegidas (requieren JWT)

| Ruta | Componente | Rol Mínimo |
|---|---|---|
| `/dashboard` | `Dashboard` | `viewer` |
| `/security-logs` | `SecurityLogs` | `viewer` |
| `/attack-map` | `AttackMap` | `viewer` |
| `/alerts` | `Alerts` | `viewer` |
| `/incidents` | `Incidents` | `viewer` |
| `/ai-analysis` | `AIAnalysis` | `viewer` |
| `/vulnerabilities` | `Vulnerabilities` | `viewer` |
| `/devices` | `DeviceList` | `viewer` |
| `/sessions` | `SessionManagement` | `viewer` |
| `/settings` | `Settings` | `viewer` |
| `/honeypot` | `HoneypotPage` | `analyst` |
| `/audit-logs` | `AuditLogs` | `analyst` |
| `/threat-intelligence` | `ThreatIntelligence` | `analyst` |
| `/threat-hunting` | `ThreatHunting` | `analyst` |
| `/users` | `UserList` | `analyst` |
| `/access-denied` | `AccessDenied` | Especial |

---

## 9. Build y Configuración

### `vite.config.js`
- Plugin `@vitejs/plugin-react`
- Plugin `@tailwindcss/vite`
- Proxy `/api` → `http://localhost:5000` (desarrollo)
- Code splitting automático con lazy imports

### `nginx.conf` (producción en contenedor)
- Serve static assets con cache headers
- `try_files` para SPA routing
- Gzip compression
- Security headers

---

## 10. Variables de Entorno del Frontend

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL del backend API | `https://api.ejemplo.com` |
| `VITE_WS_URL` | URL para WebSocket/SSE | `https://api.ejemplo.com` |
| `VITE_APP_NAME` | Nombre de la aplicación | `RobenGate Sentinel` |
