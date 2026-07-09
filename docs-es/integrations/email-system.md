# Sistema de Email — Configuración y Operación

**Módulo:** `backend/src/utils/mailer.js`  
**Última actualización:** 2026-06-06 (Production Readiness Audit)  

---

## Estado Actual

| Componente | Estado |
|---|---|
| SMTP con proveedor real | ✅ Funcional cuando EMAIL_HOST está configurado |
| Email OTP (MFA) | ✅ Funcional con SMTP configurado |
| Password Reset | ✅ Funcional con SMTP configurado |
| Fallback silencioso (jsonTransport) | ❌ Eliminado en esta auditoría |
| Validación al arranque | ✅ Implementado — falla ruidosamente en producción |
| Health check en /ready | ✅ Implementado |
| Logging de entregas | ✅ Implementado (éxito y fallo) |

---

## Comportamiento por Entorno

### Producción (`NODE_ENV=production`)

Si `EMAIL_HOST` no está configurado:
```
[Mailer] FATAL: EMAIL_HOST is not configured. Email-based MFA and password reset
are non-functional. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.
```
→ El proceso **lanza una excepción** al arrancar. El servidor no inicia.

Si `EMAIL_HOST` está configurado pero la conexión falla:
→ `/ready` devuelve `503 Not Ready` con `checks.email.status = "error"`.

### Desarrollo/Test (`NODE_ENV=development` o no establecido)

Si `EMAIL_HOST` no está configurado:
```
[Mailer] ⚠️  EMAIL_HOST not set. Email delivery is DISABLED.
MFA codes and password reset emails will NOT be sent.
```
→ El servidor arranca. Los intentos de envío de email lanzan un error claro hacia el usuario.
→ **Nunca** se simula un envío exitoso.

---

## Variables de Entorno

```env
# ── Required para habilitar email ────────────────────────────────────────────
EMAIL_HOST=smtp.mailgun.org         # Hostname del servidor SMTP
EMAIL_PORT=587                      # 587 (STARTTLS) o 465 (SSL) o 25
EMAIL_SECURE=false                  # true si PORT=465 (SSL directo)
EMAIL_USER=postmaster@tudominio.com # Usuario SMTP
EMAIL_PASS=tu-clave-smtp            # Contraseña SMTP
EMAIL_FROM=noreply@tudominio.com    # Dirección From: del servidor

# ── SMS MFA (opcional) ────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_FROM=+15005550006
```

---

## Proveedores Soportados

### Gmail SMTP

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # App Password (no la contraseña normal)
EMAIL_FROM=tu@gmail.com
```

> ⚠️ Gmail requiere "App Passwords" — actívalas en myaccount.google.com → Seguridad → Contraseñas de aplicaciones.
> No funciona con la contraseña normal de Gmail si tienes 2FA activado.

### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@mg.tudominio.com
EMAIL_PASS=<Mailgun SMTP password>
EMAIL_FROM=noreply@tudominio.com
```

### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com
```

### Amazon SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<SMTP Access Key ID>
EMAIL_PASS=<SMTP Secret Key>
EMAIL_FROM=verified@tudominio.com
```

> ⚠️ Amazon SES requiere que el dominio o el email "From" estén verificados en la consola de AWS.

### Desarrollo con Mailhog (sin envío real)

Mailhog intercepta emails en desarrollo y los muestra en una UI web.

```yaml
# docker-compose.yml — añadir servicio:
mailhog:
  image: mailhog/mailhog:v1.0.1
  ports:
    - "1025:1025"  # SMTP
    - "8025:8025"  # Web UI
```

```env
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=dev@localhost
```

Abre http://localhost:8025 para ver todos los emails capturados.

---

## Health Check

El endpoint `GET /ready` incluye el estado del email:

```json
{
  "checks": {
    "email": {
      "status": "ok",
      "message": "SMTP connection verified"
    }
  }
}
```

Posibles valores de `status`:
- `ok` — SMTP conectado y verificado
- `unconfigured` — `EMAIL_HOST` no está en `.env`
- `error` — SMTP configurado pero la conexión falla (host inalcanzable, credenciales incorrectas)

---

## Logging

Todas las operaciones de email se registran en el logger del backend:

```
[Mailer] SMTP transport configured { host: "smtp.mailgun.org", port: 587, ... }
[Mailer] Email delivered { to: "user@example.com", subject: "...", messageId: "<...>", response: "250 OK" }
[Mailer] Delivery failed { to: "user@example.com", subject: "...", error: "Connection refused" }
```

---

## Flujos de Email

### MFA por Email (`sendMfaCode`)

1. Usuario activa "Email OTP" como segundo factor en su perfil
2. En cada login: `authService` genera un código de 6 dígitos, lo almacena en Redis con TTL de 5 minutos
3. `mailer.sendMfaCode(user.email, code)` envía el código
4. Si el envío falla: el login falla con error claro — el usuario nunca queda atrapado esperando un código que no llegó

### Recuperación de Contraseña (`sendPasswordReset`)

1. Usuario solicita reset en `/auth/forgot-password`
2. Se genera un token de 64 bytes, se almacena en Redis con TTL de 1 hora
3. `mailer.sendPasswordReset(email, url)` envía el enlace
4. Si el envío falla: el endpoint devuelve 500 con mensaje claro

---

## Seguridad

- Las credenciales SMTP **nunca** deben commitearse. Usar variables de entorno o secrets manager.
- En producción, `tls.rejectUnauthorized: true` — no se aceptan certificados auto-firmados.
- El campo `EMAIL_PASS` debe estar en el archivo `.env` fuera del repositorio o en un vault (AWS Secrets Manager, Vault, etc.).
- Los tokens de password reset son de un solo uso — se eliminan de Redis al usarse.
