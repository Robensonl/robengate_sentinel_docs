# Aprendizajes — RobenGate Sentinel

**Reflexión honesta sobre lo aprendido durante el desarrollo**  

---

## Aprendizajes Técnicos

### 1. La Seguridad No Es Un Feature, Es Una Mentalidad

Antes de este proyecto, pensaba en la seguridad como algo que se añade al final. WebAuthn, TOTP, rate limiting, audit logs... la realidad es que estas cosas tienen que estar en el diseño inicial porque afectan a todo:

- El schema de la base de datos cambia (tabla `webauthn_credentials`, `mfa_codes`, `refresh_tokens`)
- Los middlewares afectan al orden de todos los endpoints
- El RBAC define la estructura de todo el frontend

**Lección:** La seguridad por diseño (Security by Design) no es marketing, es una necesidad técnica.

### 2. La Diferencia Entre JWT y Sesiones

Antes de este proyecto pensaba que JWT era simplemente "la forma moderna de hacer auth". Ahora entiendo los trade-offs reales:

**JWT ventajas:**
- Stateless — no necesita consultar BD en cada request
- Portable — funciona en microservicios sin coordinación central
- Estándar — herramientas en todos los lenguajes

**JWT desventajas (aprendidas a través del código):**
- No se puede revocar un token activo sin una lista negra
- Si el secret se filtra, todos los tokens son válidos para un atacante
- El payload se puede ver (solo se autentica la firma, no se cifra)

**Solución implementada:** Access token corto (15 min) + refresh token largo en BD con revocación.

### 3. WebAuthn Es Complejo Pero Vale la Pena

Implementar WebAuthn desde cero fue el mayor desafío técnico del proyecto. Requirió entender:

- Criptografía de clave pública (ECDSA, RS256)
- El concepto de "authenticator" vs. "credential" vs. "passkey"
- La diferencia entre attestation (registro) y assertion (auth)
- CBOR encoding para los datos del authenticator
- Por qué los challenges necesitan ser imprevisibles y de un solo uso

**Tiempo invertido:** ~2 semanas para entender y 1 semana para implementar correctamente.

**Resultado:** WebAuthn funcional con `@simplewebauthn/server`. Comprensión profunda del protocolo FIDO2.

### 4. PostgreSQL Es Más Poderoso De Lo Que Pensaba

Antes de este proyecto usaba PostgreSQL como "MySQL con mejor compliance". Ahora uso:

- `gen_random_uuid()` via pgcrypto — UUIDs únicos en la BD
- `SERIAL` vs. `BIGSERIAL` para keys con diferente escala esperada
- Índices parciales para queries frecuentes con condición
- `ON DELETE CASCADE` vs. `SET NULL` según el caso de negocio
- Migrations versionadas con `IF NOT EXISTS` para seguridad

### 5. La Importancia De Los Índices

MongoDB sin índices adecuados puede ser lento en queries analíticas. El aprendizaje fue que hay que pensar en los índices desde el diseño del schema, no cuando hay problemas de performance.

Para `security_logs`:
```javascript
// Sin este índice, filtrar por IP en millones de logs es un full scan
{ ipAddress: 1, createdAt: -1 }

// Sin este índice, el query de severity + tiempo para alertas sería lento
{ severity: 1, createdAt: -1 }

// TTL index — crucial para la retención automática
{ createdAt: 1 }, { expireAfterSeconds: 31536000 }
```

---

## Aprendizajes de Arquitectura

### 6. El Dual-Storage Pattern

Usar PostgreSQL + MongoDB para el mismo "log" parecía sobreingeniería al principio. Después de implementarlo, entiendo por qué:

- PostgreSQL para queries relacionales rápidas (JOIN con usuarios, organizaciones)
- MongoDB para immutabilidad garantizada y schema flexible para metadata variable

La clave es que no duplicas datos — almacenas cosas diferentes en cada base de datos según sus fortalezas.

### 7. RBAC Jerárquico vs. ABAC

La tentación inicial era implementar ABAC (Attribute-Based Access Control) con permisos atómicos. La realidad es que para 4 roles jerárquicos, RBAC simple es más mantenible y menos propenso a bugs.

Regla aprendida: **usa la abstracción más simple que cubra tus casos de uso**.

### 8. Multi-Tenancy Es Un Contrato

El aislamiento de datos entre tenants no es solo "añadir un campo `organization_id`". Es un contrato que tienes que mantener en:

- Todos los queries (siempre filtrar por `organization_id`)
- Todos los middlewares (nunca permitir acceso cruzado)
- Las validaciones de entrada (el `organization_id` viene del token, no del body)
- Los tests (verificar que tenant A no puede ver datos de tenant B)

El error más peligroso en multi-tenancy es un IDOR (Insecure Direct Object Reference) que permite a un tenant ver datos de otro.

---

## Aprendizajes de Proceso

### 9. Documentar Es Parte Del Código

Este proyecto tiene >80 archivos de documentación. Al principio parecía overhead. Al final, la documentación me obligó a:

- Ser honesto sobre qué es real vs. simulado
- Descubrir inconsistencias en el código al intentar documentarlas
- Tener una fuente de verdad para las decisiones de diseño
- Comunicar el valor del proyecto a personas no técnicas

**Lección:** La documentación es tan importante como el código. Un sistema sin documentar es un sistema que solo su creador puede mantener.

### 10. La Diferencia Entre "Funciona" y "Está Bien Hecho"

Hay muchas formas de hacer que algo funcione. Aprendí a distinguir entre:

- **Funciona:** El endpoint devuelve datos
- **Está bien hecho:** Validación de entrada, manejo de errores, logging, tests, documentación, seguridad

El segundo requiere 5x más tiempo. Pero es la diferencia entre código de toy project y código de producción.

---

## Lo Que No Sabía Antes y Sé Ahora

| Antes | Después |
|---|---|
| JWT = auth moderna | JWT tiene trade-offs específicos, no es siempre la mejor opción |
| MongoDB = base de datos flexible | MongoDB es óptimo para casos específicos (inmutabilidad, schema variable) |
| Docker = "para deployment" | Docker es esencial para reproducibilidad desde el día 1 |
| "La seguridad se añade al final" | La seguridad debe estar en el diseño inicial |
| RBAC = tabla de permisos compleja | RBAC puede ser una función de 5 líneas con un array ordenado |
| WebAuthn = "eso lo hacen Google y Apple" | WebAuthn es implementable con librerías maduras, el protocolo es entendible |
| Los índices se añaden cuando hay problemas | Los índices deben diseñarse junto al schema |
| Documentar = escribir comentarios | Documentar = escribir para el próximo developer (que puedes ser tú en 6 meses) |
