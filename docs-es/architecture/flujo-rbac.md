# Flujo RBAC — Control de Acceso Basado en Roles

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Modelo de Roles

```mermaid
graph TD
    ADMIN[admin\nNivel 4\nAcceso total] -->|hereda| ANALYST
    ANALYST[analyst\nNivel 3\nAnálisis completo] -->|hereda| RESPONDER
    RESPONDER[responder\nNivel 2\nGestión incidentes] -->|hereda| VIEWER
    VIEWER[viewer\nNivel 1\nLectura SOC]
```

| Rol | Nivel | Casos de Uso |
|---|---|---|
| `admin` | 4 | Gestión de usuarios, organizaciones, configuración global |
| `analyst` | 3 | Análisis de amenazas, threat hunting, gestión de alertas |
| `responder` | 2 | Respuesta a incidentes, cierre de alertas |
| `viewer` | 1 | Monitorización pasiva del SOC, informes |

---

## Arquitectura RBAC — Dos Capas

### Capa 1: Backend (autorización real)

```mermaid
flowchart LR
    REQ[Request HTTP] --> AUTH[authenticate.js\nVerifica JWT]
    AUTH --> |JWT inválido| REJECT_401[401 Unauthorized]
    AUTH --> |JWT válido| AUTHZ[authorize.js\nVerifica rol]
    AUTHZ --> |Rol insuficiente| REJECT_403[403 Forbidden]
    AUTHZ --> |Rol suficiente| HANDLER[Route Handler]
```

**`authorize.js` — Implementación:**
```javascript
const ROLES = { admin: 4, analyst: 3, responder: 2, viewer: 1 }

// minRole('analyst') — requiere analyst o superior
function minRole(requiredRole) {
  return (req, res, next) => {
    if (ROLES[req.user.role] >= ROLES[requiredRole]) next()
    else res.status(403).json({ error: 'Insufficient permissions' })
  }
}

// readOnly() — permite GET para viewer, bloquea escritura
function readOnly() {
  return (req, res, next) => {
    if (req.method === 'GET') return next()
    if (req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Read-only access' })
    }
    next()
  }
}
```

### Capa 2: Frontend (UX, no seguridad)

La capa frontend de RBAC solo controla la **experiencia de usuario** — qué botones se muestran, qué páginas son accesibles. La seguridad real está en el backend.

```mermaid
flowchart TD
    ROUTE[Navegación a ruta] --> PR[ProtectedRoute\nJWT válido?]
    PR --> |No JWT| LOGIN[Redirect /login]
    PR --> |JWT válido| ROLE_CHECK[meetsMinRole(minRole)]
    ROLE_CHECK --> |Rol insuficiente| DENIED[AccessDenied /403]
    ROLE_CHECK --> |Rol suficiente| PAGE[Renderizar página]
    PAGE --> PG[PermissionGate\npor elemento UI]
    PG --> |Sin permiso| READONLY[ReadOnlyBadge o null]
    PG --> |Con permiso| ELEMENT[Renderizar elemento]
```

---

## Mapa Completo de Permisos

### Por Módulo

| Módulo / Ruta | viewer | responder | analyst | admin |
|---|---|---|---|---|
| `GET /dashboard` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/stats` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/logs` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/alerts` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/alerts/:id/status` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/incidents` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/incidents` | ❌ | ✅ | ✅ | ✅ |
| `PATCH /api/incidents/:id/status` | ❌ | ✅ | ✅ | ✅ |
| `GET /api/vulnerabilities` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/vulnerabilities` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/devices` | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/devices/:id` | ✅ (propio) | ✅ | ✅ | ✅ |
| `GET /api/sessions` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/threats` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/threats` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/honeypot/events` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/audit` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/users` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/users` | ❌ | ❌ | ❌ | ✅ |
| `PATCH /api/users/:id/role` | ❌ | ❌ | ❌ | ✅ |
| `GET /api/organizations` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/organizations` | ❌ | ❌ | ❌ | ✅ |
| `GET /api/playbooks` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/playbooks` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/attack-map` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/ai/analysis` | ✅ | ✅ | ✅ | ✅ |

---

## Flujo de Verificación de Permisos — Frontend

```mermaid
sequenceDiagram
    participant U as Usuario (analyst)
    participant FE as Frontend
    participant PR as ProtectedRoute
    participant PG as PermissionGate
    participant BE as Backend

    U->>FE: Navega a /users
    FE->>PR: ProtectedRoute minRole="analyst"
    PR->>PR: useAuth() → user.role = "analyst"
    PR->>PR: meetsMinRole("analyst", "analyst") = true ✅
    PR->>FE: Renderizar UserList.jsx

    FE->>BE: GET /api/users
    BE->>BE: minRole('analyst') → analyst >= analyst ✅
    BE-->>FE: 200 Lista de usuarios

    Note over FE: Mostrar usuarios. ¿Puede eliminar?
    FE->>PG: PermissionGate permission="users:delete"
    PG->>PG: hasPermission("analyst", "users:delete") = false ❌
    PG->>FE: No renderizar botón "Eliminar"

    Note over FE: ¿Puede cambiar rol?
    FE->>PG: PermissionGate minRole="admin"
    PG->>PG: meetsMinRole("analyst", "admin") = false ❌
    PG->>FE: No renderizar dropdown de roles
```

---

## Viewer "Read-Only" Mode

Un `viewer` tiene acceso completo de **lectura** al SOC pero no puede escribir:

### En el Backend
```javascript
// routes/logs.js
router.get('/', authenticate, minRole('viewer'), logController.getAll)
// viewer puede leer logs ✅

// routes/incidents.js
router.post('/', authenticate, readOnly(), incidentController.create)
// viewer recibe 403 en POST ❌
```

### En el Frontend
```jsx
// El viewer ve el botón pero con badge "Solo lectura"
<PermissionGate permission="incidents:write" fallback={<ReadOnlyBadge />}>
  <button onClick={closeIncident}>Cerrar Incidente</button>
</PermissionGate>

// El viewer no ve el botón en absoluto
<PermissionGate minRole="admin">
  <button onClick={deleteUser}>Eliminar Usuario</button>
</PermissionGate>
```

### Indicadores Visuales para Viewers
- Badge "View Only" en el header de la navegación
- `ReadOnlyBadge` en elementos de UI no accesibles
- Tooltips explicativos en elementos deshabilitados
