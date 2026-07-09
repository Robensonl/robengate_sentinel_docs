# API — Usuarios

**Base URL:** `/api/users`  
**Auth mínima:** `analyst` (lectura y escritura)  
**Auth admin:** `admin` para operaciones destructivas  

---

## Descripción General

El módulo de usuarios permite la gestión del ciclo de vida de las cuentas: listado, consulta, cambio de roles y bloqueo/desbloqueo. Solo usuarios con rol `analyst` o superior pueden acceder.

```mermaid
graph LR
    Admin[Admin] -->|CRUD completo| API
    Analyst[Analyst] -->|Lista + consulta| API
    API[/api/users] --> DB[(PostgreSQL\nusers)]
    style Admin fill:#dc2626,color:#fff
    style Analyst fill:#2563eb,color:#fff
```

---

## Endpoints

### GET /api/users

**Descripción:** Lista todos los usuarios del sistema.  
**Auth:** `analyst+`  
**Multi-tenancy:** Filtra por `organization_id` del usuario autenticado.

#### Query Parameters

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Registros por página (default: 20, max: 100) |
| `role` | string | Filtrar por rol: `admin\|analyst\|responder\|viewer` |
| `active` | boolean | Filtrar por estado activo |
| `search` | string | Buscar por nombre o email |

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Carlos Admin",
        "email": "carlos@empresa.com",
        "role": "admin",
        "mfa_enabled": true,
        "active": true,
        "is_locked": false,
        "last_login_at": "2026-06-01T08:30:00Z",
        "created_at": "2026-01-01T00:00:00Z",
        "organization_id": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 47,
      "pages": 3
    }
  }
}
```

---

### GET /api/users/:id

**Descripción:** Obtiene el detalle de un usuario específico.  
**Auth:** `analyst+`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Ana García",
    "email": "ana@empresa.com",
    "role": "analyst",
    "mfa_enabled": true,
    "mfa_type": "totp",
    "active": true,
    "is_locked": false,
    "failed_login_count": 0,
    "last_login_at": "2026-06-01T09:00:00Z",
    "created_at": "2026-01-15T08:00:00Z",
    "organization_id": 1,
    "company": "Empresa S.L."
  }
}
```

#### Errores

| Código | Error | Descripción |
|---|---|---|
| 403 | `FORBIDDEN` | Rol insuficiente |
| 404 | `USER_NOT_FOUND` | Usuario no existe |

---

### PATCH /api/users/:id/role

**Descripción:** Cambia el rol de un usuario.  
**Auth:** `admin` únicamente.

#### Request

```json
{
  "role": "analyst"
}
```

**Roles válidos:** `admin` | `analyst` | `responder` | `viewer`

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "id": 42,
    "role": "analyst",
    "updated_at": "2026-06-01T12:00:00Z"
  }
}
```

#### Errores

| Código | Error | Descripción |
|---|---|---|
| 400 | `INVALID_ROLE` | Rol no válido |
| 403 | `FORBIDDEN` | Solo admin puede cambiar roles |
| 403 | `CANNOT_CHANGE_OWN_ROLE` | Un admin no puede cambiar su propio rol |
| 404 | `USER_NOT_FOUND` | Usuario no existe |

---

### PATCH /api/users/:id/lock

**Descripción:** Bloquea o desbloquea una cuenta de usuario.  
**Auth:** `admin` únicamente.

#### Request

```json
{
  "locked": true,
  "reason": "Actividad sospechosa detectada"
}
```

#### Respuesta 200

```json
{
  "success": true,
  "data": {
    "id": 42,
    "is_locked": true,
    "message": "Cuenta bloqueada correctamente"
  }
}
```

> **Nota:** Al bloquear una cuenta, todas las sesiones activas del usuario son revocadas inmediatamente.

---

### DELETE /api/users/:id

**Descripción:** Elimina permanentemente un usuario del sistema.  
**Auth:** `admin` únicamente.

> ⚠️ **Acción irreversible.** Elimina el usuario y todos sus datos relacionados (sesiones, dispositivos, refresh tokens). Los logs de seguridad que referencian al usuario mantienen el `user_id` con `ON DELETE SET NULL`.

#### Respuesta 200

```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

#### Errores

| Código | Error | Descripción |
|---|---|---|
| 403 | `FORBIDDEN` | Solo admin puede eliminar usuarios |
| 403 | `CANNOT_DELETE_SELF` | Un admin no puede eliminarse a sí mismo |
| 404 | `USER_NOT_FOUND` | Usuario no existe |

---

## Modelo de Roles RBAC

```mermaid
graph TD
    A[admin] -->|Hereda todo| B[analyst]
    B -->|Hereda todo| C[responder]
    C -->|Hereda todo| D[viewer]
    
    A -->|Exclusivo admin| UA[Gestión usuarios\nBloqueo cuentas\nOrganizaciones\nPlaybooks]
    B -->|analyst+| AB[Threat Intel\nVulnerabilidades\nBúsqueda\nAgentes EDR]
    C -->|responder+| RC[Cambiar estado alertas\nActualizar incidentes]
    D -->|viewer - lectura| DV[Dashboard\nLogs\nAlertas\nMapa ataques\nAI Analysis]
    
    style A fill:#dc2626,color:#fff
    style B fill:#2563eb,color:#fff
    style C fill:#d97706,color:#fff
    style D fill:#16a34a,color:#fff
```

### Permisos por Rol

| Operación | viewer | responder | analyst | admin |
|---|---|---|---|---|
| Ver usuarios | ❌ | ❌ | ✅ | ✅ |
| Ver detalle usuario | ❌ | ❌ | ✅ | ✅ |
| Cambiar rol | ❌ | ❌ | ❌ | ✅ |
| Bloquear cuenta | ❌ | ❌ | ❌ | ✅ |
| Eliminar usuario | ❌ | ❌ | ❌ | ✅ |
| Ver logs propios | ✅ | ✅ | ✅ | ✅ |
| Ver todos los logs | ✅ | ✅ | ✅ | ✅ |

---

## Ejemplo Completo — cURL

```bash
# Listar usuarios (requiere rol analyst+)
curl -X GET "https://api.tudominio.com/api/users?role=analyst&page=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# Cambiar rol de usuario (requiere rol admin)
curl -X PATCH "https://api.tudominio.com/api/users/42/role" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"role": "analyst"}'

# Bloquear usuario (requiere rol admin)
curl -X PATCH "https://api.tudominio.com/api/users/42/lock" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "reason": "Acceso no autorizado detectado"}'
```
