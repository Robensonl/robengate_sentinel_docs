# Guía de Administrador — RBAC

**Rol requerido:** `admin`  

---

## Modelo de Roles

Ver documentación técnica completa: [docs-es/api/roles-rbac.md](../api/roles-rbac.md)

### Resumen Ejecutivo

| Rol | Para Quién | Acceso |
|---|---|---|
| `admin` | IT Leads, Security Managers | Control total de la plataforma |
| `analyst` | Analistas SOC, Threat Hunters | SOC completo + escritura de datos de seguridad |
| `responder` | Técnicos de respuesta | SOC completo + respuesta activa |
| `viewer` | Directivos, Auditores | Solo lectura de todos los módulos SOC |

---

## Asignar Roles — Procedimiento

### Via UI (Admin Panel)

1. Ir a **Users** en el menú lateral
2. Buscar el usuario objetivo
3. Click en el usuario → Panel de detalle
4. Dropdown "Role" → Seleccionar rol
5. Confirmar cambio → El usuario recibe notificación

### Via API

```bash
# Promover a analyst
curl -X PATCH "https://api.tudominio.com/api/users/42/role" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"role": "analyst"}'

# Promover a admin
curl -X PATCH "https://api.tudominio.com/api/users/5/role" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"role": "admin"}'
```

---

## Principio de Mínimo Privilegio

Reglas para asignación de roles:

1. **Todos los usuarios nuevos** → `viewer` (por defecto)
2. **Acceso al dashboard SOC** → `viewer` es suficiente para lectura
3. **Analistas de seguridad activos** → `analyst`
4. **Técnicos de respuesta en guardia** → `responder`
5. **Administradores de la plataforma** → máximo 2-3 personas con `admin`
6. **Cuentas de servicio** → usar API Keys en lugar de cuentas de usuario

---

## Forzar MFA para Organización

Para forzar MFA en todos los usuarios de la organización:

```bash
curl -X PATCH "https://api.tudominio.com/api/organizations/1" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"mfa_required": true}'
```

Con `mfa_required: true`:
- Usuarios sin MFA configurado son redirigidos a configurarlo en el próximo login
- El login sin MFA es denegado hasta que lo configuren

---

## Auditoría de RBAC

Para auditar quién tiene qué rol:

```bash
# Listar todos los admins
GET /api/users?role=admin

# Listar todos los analistas
GET /api/users?role=analyst

# Ver historial de cambios de rol (en Audit Logs)
GET /api/audit?category=ADMIN&action=USER_ROLE_CHANGED
```

---

## Gestionar Dispositivos y Sesiones de Usuarios

Como admin, ver la actividad de un usuario específico:

```bash
# Ver sesiones activas (user debe autenticar y ver las propias)
# Para admin: revisar via Audit Logs
GET /api/audit?userId=42&category=AUTH&limit=50
```

---

## Configurar Plataforma

### Variables de Entorno Clave

| Variable | Descripción | Dónde configurar |
|---|---|---|
| `JWT_SECRET` | Secreto access tokens | `.env` + secreto K8s |
| `JWT_REFRESH_SECRET` | Secreto refresh tokens | `.env` + secreto K8s |
| `CLIENT_URL` | URL del frontend (CORS) | `.env` |
| `INTERNAL_API_SECRET` | Secreto honeypot→backend | `.env` + secreto K8s |
| `DB_PASSWORD` | PostgreSQL password | `.env` + secreto K8s |
| `MONGO_ROOT_PASSWORD` | MongoDB password | `.env` + secreto K8s |

### Actualizar Configuración de Organización

```bash
curl -X PATCH "https://api.tudominio.com/api/organizations/1" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "retention_days": 365,
    "mfa_required": true,
    "webhook_url": "https://hooks.empresa.com/security",
    "webhook_secret": "whsec_abc123xyz"
  }'
```

### Crear API Key para Integraciones

Las API Keys permiten integrar sistemas externos (SIEM, firewalls, etc.) para ingestar eventos:

```bash
# Crear API Key
# (endpoint de gestión de API Keys — ver docs-es/api/configuracion.md)
POST /api/organizations/1/api-keys
{
  "name": "Firewall Integration",
  "scopes": ["ingest:write", "logs:read"],
  "expires_at": "2027-06-01T00:00:00Z"
}

# Respuesta incluye el key completo (solo visible una vez)
{
  "key": "rg_sk_abc123...",  # Guardar de forma segura
  "prefix": "rg_sk_abc123"
}
```

---

## Gestión de IPs Baneadas

### Ver IPs baneadas activas

```bash
GET /internal/banned-ips
# Header: X-Internal-Secret: <secret>
```

### Banear IP manualmente

```bash
POST /internal/ban
X-Internal-Secret: <secret>
{
  "ip": "185.220.101.44",
  "reason": "Manual ban — confirmed attacker",
  "duration_hours": 720  # 30 días
}
```

### Desbanear IP

```bash
DELETE /internal/ban/185.220.101.44
X-Internal-Secret: <secret>
```

> **Nota:** Baneos permanentes (sin expires_at) solo se pueden remover via API directa.
