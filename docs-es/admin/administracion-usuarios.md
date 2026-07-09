# Guía de Administrador — Gestión de Usuarios

**Rol requerido:** `admin`  
**Módulo:** Users Management  

---

## Acceso al Módulo

Navegar a: **Dashboard → Users** (solo visible para admins)

---

## Crear Usuario

RobenGate Sentinel no tiene endpoint de creación directa de usuario por admin (los usuarios se auto-registran). Para el entorno de producción:

**Opción 1 — Script de gestión (CLI):**
```bash
docker compose exec backend node scripts/manage-admins.js create \
  --email admin@empresa.com \
  --name "Administrador Principal" \
  --password "SecurePass123!" \
  --role admin
```

**Opción 2 — Registro + asignación de rol:**
1. Crear cuenta en `/register`
2. Asignar rol via API:
```bash
curl -X PATCH "https://api.tudominio.com/api/users/42/role" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "analyst"}'
```

---

## Listar y Buscar Usuarios

**UI:** Users → lista paginada con filtros de rol y estado  
**API:**
```bash
# Todos los usuarios
GET /api/users

# Filtrar por rol
GET /api/users?role=analyst

# Buscar por email
GET /api/users?search=ana@empresa.com

# Solo activos
GET /api/users?active=true
```

---

## Cambiar Rol de Usuario

**Roles disponibles:** `admin` | `analyst` | `responder` | `viewer`

**Via UI:**
1. Users → Buscar usuario → Click en nombre
2. Dropdown "Role" → Seleccionar nuevo rol
3. Confirmar cambio

**Via API:**
```bash
curl -X PATCH "https://api.tudominio.com/api/users/42/role" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "analyst"}'
```

**Restricciones:**
- Un admin no puede cambiar su propio rol
- Solo admin puede asignar rol `admin`
- El cambio de rol revoca sesiones activas del usuario (login forzado)

**Cuándo asignar cada rol:**

| Rol | Para quién |
|---|---|
| `admin` | Administradores de seguridad, IT leads |
| `analyst` | Analistas SOC, threat hunters |
| `responder` | Técnicos de respuesta a incidentes |
| `viewer` | Directivos, auditores, stakeholders |

---

## Bloquear / Desbloquear Cuenta

El bloqueo impide el login aunque la contraseña sea correcta. Útil cuando:
- Se detecta actividad sospechosa en la cuenta
- El usuario reporta compromiso de credenciales
- La cuenta debe ser suspendida temporalmente

**Via UI:**
1. Users → Buscar usuario → Click en nombre
2. Toggle "Lock Account" → Confirmar
3. La cuenta queda bloqueada inmediatamente

**Via API:**
```bash
# Bloquear
curl -X PATCH "https://api.tudominio.com/api/users/42/lock" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "reason": "Suspicious activity detected"}'

# Desbloquear
curl -X PATCH "https://api.tudominio.com/api/users/42/lock" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": false}'
```

**Efecto inmediato:** Al bloquear, todas las sesiones activas se revocan.

---

## Eliminar Usuario

> ⚠️ **Acción irreversible.** Confirmar antes de proceder.

**Efectos:**
- Cuenta eliminada permanentemente
- Sesiones activas revocadas
- Dispositivos eliminados
- Logs históricos preservados (user_id = NULL)

**Via API:**
```bash
curl -X DELETE "https://api.tudominio.com/api/users/42" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Alternativa recomendada:** Bloquear la cuenta en lugar de eliminar (preserva auditoría).

---

## Gestionar Sesiones de Usuario (Admin)

Para forzar el cierre de sesión de un usuario específico:

```bash
# Ver sesiones activas de un usuario
GET /api/users/42/sessions  # (requiere implementación admin)

# El usuario puede cerrar todas sus sesiones
DELETE /api/sessions/all
```

---

## Monitorizar Actividad de Usuario

En el módulo Audit Logs filtrar por usuario:
```
GET /api/audit?userId=42&category=AUTH
```

---

## Procedimientos de Seguridad

### Cuando un usuario reporta cuenta comprometida

1. **Bloquear cuenta inmediatamente:**
   ```
   PATCH /api/users/42/lock {"locked": true}
   ```

2. **Revisar últimas sesiones** (Audit Logs → filtrar userId)

3. **Revisar IPs de acceso** (Security Logs → filtrar user_id + fecha)

4. **Desbloquear y forzar reset de contraseña:**
   ```
   PATCH /api/users/42/lock {"locked": false}
   # Notificar al usuario para reset de contraseña
   ```

5. **Revocar WebAuthn credentials si las tiene:**
   ```
   DELETE /api/auth/webauthn/credentials/:id
   ```

### Política de contraseñas

El sistema valida mínimo 8 caracteres en registro. En producción se recomienda configurar política más estricta mediante el middleware de validación.

### Forzar MFA para la organización

```bash
curl -X PATCH "https://api.tudominio.com/api/organizations/1" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mfa_required": true}'
```

Con `mfa_required: true`, todos los usuarios deben configurar MFA antes de poder acceder.
