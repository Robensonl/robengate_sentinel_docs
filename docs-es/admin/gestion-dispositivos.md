# Guía de Administrador — Gestión de Dispositivos

**Rol requerido:** `viewer` (dispositivos propios) / `admin` (todos los dispositivos)  

---

## Dispositivos de Confianza

Un dispositivo de confianza (trusted device) reduce la fricción de MFA para el usuario. Cuando el sistema reconoce un dispositivo de confianza, puede omitir el paso de verificación MFA en logins sucesivos.

---

## Ver Dispositivos Propios

Los usuarios pueden gestionar sus propios dispositivos:

**Via UI:** Settings → Security → Devices

**Via API:**
```bash
GET /api/devices
Authorization: Bearer USER_TOKEN
```

---

## Marcar Dispositivo como de Confianza

**Via UI:** Settings → Devices → Toggle "Trust"

**Via API:**
```bash
PATCH /api/devices/1/trust
{
  "trusted": true
}
```

---

## Revocar Dispositivo

Cuando un dispositivo se pierde o es comprometido:

**Via UI:** Settings → Devices → "Remove" 

**Via API:**
```bash
DELETE /api/devices/1
Authorization: Bearer USER_TOKEN
```

---

## Procedimiento de Seguridad — Dispositivo Perdido/Robado

1. **El usuario reporta** dispositivo perdido al administrador
2. **Revocar todas las sesiones** del usuario:
   ```bash
   DELETE /api/sessions/all
   # (usuario debe ejecutar esto desde otro dispositivo)
   ```
3. **Eliminar el dispositivo** de la lista de trusted:
   ```bash
   DELETE /api/devices/<id_dispositivo_perdido>
   ```
4. **Verificar accesos recientes** desde ese dispositivo:
   ```bash
   GET /api/audit?userId=42&category=AUTH
   ```
5. **Cambiar contraseña** de la cuenta
6. **Si era el único dispositivo MFA** → regenerar backup codes:
   ```bash
   POST /api/auth/backup-codes/generate
   ```

---

## Configuración de Plataforma

**Rol requerido:** `admin`  
Ver: [configuracion-plataforma.md](configuracion-plataforma.md)
