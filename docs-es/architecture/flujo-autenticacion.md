# Flujo de Autenticación — RobenGate Sentinel

**Versión:** 2.0 | **Fecha:** Junio 2026

---

## Diagrama de Secuencia — Login Completo

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 Usuario
    participant FE as 🖥️ Frontend React
    participant BE as ⚙️ Backend Express
    participant RE as 🤖 Risk Engine
    participant DB as 🗄️ PostgreSQL
    participant RD as ⚡ Redis
    participant EM as 📧 SMTP Email

    U->>FE: Introduce email + contraseña
    FE->>FE: Validación Zod (client-side)
    FE->>BE: POST /api/auth/login

    rect rgb(10, 25, 41)
        Note over BE: 🔒 Middleware Pipeline
        BE->>BE: Sanitizar HPP + NoSQL injection
        BE->>RD: Auto-ban check (IP en lista negra?)
        BE->>BE: Rate limit — 5 intentos / 15 min
        BE->>BE: Attack pattern detection
    end

    BE->>DB: SELECT usuario WHERE email = $1
    DB-->>BE: user_record + password_hash

    alt ❌ Usuario no existe
        BE-->>FE: 401 Credenciales inválidas
        BE->>DB: INSERT security_log LOGIN_FAILED
    else ✅ Usuario existe
        BE->>BE: bcrypt.compare(password, hash)

        alt ❌ Contraseña incorrecta
            BE->>RD: INCR fail_count:{ip}
            BE-->>FE: 401 Credenciales inválidas
            BE->>DB: INSERT security_log LOGIN_FAILED

            alt ⚠️ ≥ 5 fallos consecutivos
                BE->>DB: INSERT banned_ips
                BE->>RD: SET ban:{ip} TTL=86400
                BE->>DB: INSERT security_log IP_BANNED
                BE-->>FE: 429 IP bloqueada
            end

        else ✅ Contraseña correcta
            BE->>RE: evaluar 10 señales de riesgo
            Note over RE: IP nueva · País · Dispositivo<br/>Horario · Viaje imposible · Rol
            RE-->>BE: risk_score (0–100)

            alt 🔴 Score ≥ 81 (CRÍTICO)
                BE->>DB: INSERT banned_ips
                BE-->>FE: 403 Acceso bloqueado

            else 🟡 Score 31–60 — OTP Email
                BE->>RD: SET mfa:{userId} = OTP (TTL 5min)
                BE->>EM: Enviar código OTP 6 dígitos
                BE-->>FE: 200 requiresMfa: true · pendingToken

                FE->>U: Pantalla MFA — introducir código
                U->>FE: Código OTP 6 dígitos
                FE->>BE: POST /api/auth/mfa/verify {code, pendingToken}

                BE->>RD: GET mfa:{userId}
                alt ❌ Código incorrecto
                    BE-->>FE: 401 Código inválido
                else ✅ Código correcto
                    BE->>RD: DEL mfa:{userId}
                    BE->>DB: INSERT refresh_tokens (JTI · 7d)
                    BE->>DB: INSERT sessions (device · IP · UA)
                    BE->>DB: INSERT security_log LOGIN_SUCCESS
                    BE-->>FE: 200 accessToken (15min) + httpOnly cookie
                end

            else 🟢 Score ≤ 30 — Acceso Directo
                BE->>DB: INSERT refresh_tokens (JTI · 7d)
                BE->>DB: INSERT sessions
                BE->>DB: INSERT security_log LOGIN_SUCCESS
                BE-->>FE: 200 accessToken (15min) + httpOnly cookie
            end

            FE->>FE: tokenManager.set(accessToken) — EN MEMORIA
            FE->>FE: AuthContext.setUser(user)
            FE->>U: ✅ Redirigir a /dashboard
        end
    end
```

---

## Diagrama de Secuencia — Renovación de Token

```mermaid
sequenceDiagram
    autonumber
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant RD as ⚡ Redis
    participant DB as 🗄️ PostgreSQL

    Note over FE: ⏱️ Access Token expira (15 min)
    FE->>FE: useTokenRefresh hook — detecta expiración
    FE->>BE: POST /api/auth/refresh (httpOnly cookie)

    BE->>DB: SELECT refresh_tokens WHERE jti = $1
    DB-->>BE: token_record

    alt ❌ Token inválido o expirado
        BE-->>FE: 401 Token inválido
        FE->>FE: logout() — limpiar estado
        FE->>FE: Redirigir a /login
    else ✅ Token válido
        BE->>RD: Verificar JTI no está en blacklist
        BE->>DB: UPDATE refresh_tokens SET revoked=true (token antiguo)
        Note over BE: 🔄 Rotación — el token usado se invalida
        BE->>BE: Generar nuevo Access Token (15min)
        BE->>BE: Generar nuevo Refresh Token (7d)
        BE->>DB: INSERT refresh_tokens (nuevo JTI)
        BE-->>FE: 200 newAccessToken + nuevo httpOnly cookie
        FE->>FE: tokenManager.set(newAccessToken)
    end
```

---

## Diagrama — Autenticación WebAuthn/FIDO2

```mermaid
sequenceDiagram
    participant U as Usuario (navegador con biometría)
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    Note over U,BE: Registro de credential biométrica
    U->>FE: Click "Registrar biometría"
    FE->>BE: GET /api/auth/webauthn/register/options
    BE->>BE: Generar challenge aleatorio + options
    BE->>RD: Store challenge (TTL 5min)
    BE-->>FE: {challenge, rp, user, pubKeyCredParams}

    FE->>U: navigator.credentials.create(options)
    U->>U: Autenticar con biometría (TouchID/FaceID/Windows Hello)
    U-->>FE: Credential {id, response, type}

    FE->>BE: POST /api/auth/webauthn/register/verify {credential}
    BE->>RD: Verificar challenge original
    BE->>BE: @simplewebauthn/server verifyRegistrationResponse()
    BE->>DB: INSERT webauthn_credentials {credentialId, publicKey, counter}
    BE-->>FE: 200 {success: true}

    Note over U,BE: Autenticación con biometría
    U->>FE: Click "Acceder con biometría"
    FE->>BE: GET /api/auth/webauthn/login/options?email=...
    BE->>DB: SELECT credentialId WHERE userId = $1
    BE->>BE: Generar challenge nuevo
    BE->>RD: Store challenge
    BE-->>FE: {challenge, allowCredentials}

    FE->>U: navigator.credentials.get(options)
    U->>U: Biometría → firma el challenge
    U-->>FE: Assertion {id, response}

    FE->>BE: POST /api/auth/webauthn/login/verify {assertion}
    BE->>RD: Verificar challenge
    BE->>DB: SELECT public_key WHERE credentialId = $1
    BE->>BE: verifyAuthenticationResponse() → verificar firma
    BE->>DB: UPDATE counter (previene replay)
    BE->>BE: Generar JWT tokens
    BE-->>FE: 200 {accessToken, user}
```

---

## Diagrama — Logout y Revocación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant BE as Backend
    participant RD as Redis
    participant DB as PostgreSQL

    U->>FE: Click Logout
    FE->>BE: POST /api/auth/logout {Authorization: Bearer token}

    BE->>BE: Extraer JTI del access token
    BE->>RD: SET jwt:blacklist:{jti} (TTL = tiempo restante del token)
    Note over RD: Access token invalidado

    BE->>DB: UPDATE refresh_tokens SET revoked = true WHERE userId = $1
    Note over DB: Todos los refresh tokens revocados

    BE->>DB: UPDATE sessions SET revoked = true WHERE userId = $1
    Note over DB: Todas las sesiones cerradas

    BE->>DB: INSERT security_log (LOGOUT)
    BE-->>FE: 200 {success: true}
    BE->>BE: clearCookie(refreshToken)

    FE->>FE: tokenManager.clear()
    FE->>FE: AuthContext.logout()
    FE->>U: Redirigir a /login
```

---

## Modelo Zero-Trust para MFA

El modelo de autenticación implementa Zero-Trust en la fase MFA:

```
Estado 1: No autenticado
  → Sin acceso a recursos

Estado 2: Contraseña verificada + MFA pendiente  
  → pendingToken: acceso SOLO a POST /api/auth/mfa/verify
  → Cualquier otro endpoint devuelve 401

Estado 3: MFA verificado
  → accessToken: acceso completo según rol RBAC
  → Expira en 15 minutos

Estado 4: Access Token expirado
  → refreshToken (httpOnly cookie): permite renovación silenciosa
  → Rotación automática en cada uso
  → Expira en 7 días
```
