# Caso de Estudio — RobenGate Sentinel

**Documentación del proceso de construcción de una plataforma de ciberseguridad enterprise**  

---

## El Reto

### Punto de Partida

El proyecto comenzó con un objetivo ambicioso: construir una plataforma de ciberseguridad que fuera genuinamente útil (no solo un toy project) pero accesible para una organización mediana sin presupuesto enterprise.

Las preguntas iniciales:
1. ¿Qué hace realmente una plataforma SIEM/SOC?
2. ¿Cómo se implementa autenticación multi-factor en producción?
3. ¿Cómo funciona WebAuthn a nivel de protocolo?
4. ¿Cómo se diseña un sistema multi-tenant desde cero?
5. ¿Cómo se hacen los logs verdaderamente inmutables?

### Restricciones

- **Sin equipo** — desarrollo individual
- **Sin presupuesto** — solo infraestructura propia
- **Sin atajos** — implementación real, no mockups

---

## Decisiones de Arquitectura Clave

### ¿Por qué PostgreSQL + MongoDB?

**Problema:** Los logs de seguridad tienen dos necesidades contradictorias:
1. Necesitan ser **inmutables** (no se pueden borrar ni modificar — evidencia forense)
2. Necesitan ser **consultables con queries complejas** (filtrando por IP, usuario, tipo, tiempo)

**Solución adoptada:** Dual-storage pattern

```
PostgreSQL (audit_logs) ← Fast, structured queries, foreign keys
MongoDB (security_logs)  ← Immutable, high-volume, flexible schema
```

MongoDB con un schema que no tiene métodos `update()` ni `delete()` garantiza la inmutabilidad a nivel de aplicación. Para garantías adicionales, el TTL de 365 días es el único mecanismo de eliminación.

**Alternativas consideradas y descartadas:**
- Solo PostgreSQL: pierde la inmutabilidad nativa y la flexibilidad del schema para metadata variada
- Solo MongoDB: pierde las foreign keys y las joins eficientes para consultas relacionales
- Elasticsearch: añade complejidad operacional significativa para un primer MVP (se incluye como opcional)

### ¿Por qué SSE en lugar de WebSockets?

**Problema:** El dashboard necesita actualizaciones en tiempo real (alertas, attack map, métricas).

**Server-Sent Events vs. WebSockets:**

| Aspecto | SSE | WebSockets |
|---|---|---|
| Dirección | Unidireccional (server → client) | Bidireccional |
| Protocolo | HTTP/1.1 compatible | Requiere upgrade |
| Proxy/Firewall | Transparente | Puede necesitar configuración |
| Reconexión | Automática (navegador nativo) | Manual |
| Complejidad | Muy baja | Media |

Para el caso de uso de RobenGate (server envía eventos al cliente, el cliente no necesita enviar streams al server), SSE es la opción más simple y correcta.

### ¿Por qué RBAC con `minRole()` en lugar de permisos atómicos?

**Problema:** Gestionar permisos granulares (30+ permisos posibles) en un sistema con 4 roles ordenados jerárquicamente.

**Jerarquía de roles:**
```
admin > analyst > responder > viewer
```

**Implementación:**
```javascript
// Un array ordenado jerárquicamente
const ROLE_HIERARCHY = ['viewer', 'responder', 'analyst', 'admin'];

// Middleware que compara posiciones en el array
function minRole(requiredRole) {
  return (req, res, next) => {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(req.user.role);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    if (userRoleIndex < requiredIndex) return res.status(403).json({error: 'Insufficient permissions'});
    next();
  };
}
```

**Ventaja:** Un endpoint con `minRole('analyst')` funciona para analyst y admin. Simple, predecible, sin tablas de permisos complejas para este caso de uso.

**Limitación:** No soporta permisos por recurso (ej: "puede ver los incidents de su organización pero no los de otras"). Solucionado con el filtro por `organization_id` en los queries.

---

## Desafíos Técnicos Resueltos

### Desafío 1: Implementar WebAuthn desde Cero

WebAuthn es un protocolo complejo con múltiples pasos criptográficos. El proceso de aprendizaje:

1. Leer la especificación W3C WebAuthn Level 2
2. Entender el flujo de registro vs. autenticación
3. Entender los conceptos: challenge, credential, authenticator, attestation
4. Usar `@simplewebauthn/server` y `@simplewebauthn/browser` para la implementación

**Lo más difícil:** La gestión de la sesión durante el flujo de registro (el challenge tiene que persistir entre el primer y segundo paso de la API). Solución: guardar el challenge en Redis con TTL de 5 minutos.

### Desafío 2: Schema Migrations en PostgreSQL

Gestionar la evolución del schema con 13 migraciones y garantizar que las migraciones son idempotentes y reversibles.

**Aprendizaje:** Usar `IF NOT EXISTS` y `IF EXISTS` en todas las alteraciones. Jamás destruir datos en una migración sin respaldo. Nombrar las migraciones con prefijo numérico para garantizar orden.

### Desafío 3: Multi-tenancy Sin Frameworks

Implementar aislamiento de datos entre organizaciones sin un framework de multi-tenancy dedicado.

**Solución:** Añadir `organization_id` FK a todas las tablas de datos. Añadir el middleware `requireOrganizationContext()` que extrae el `organization_id` del usuario autenticado y lo inyecta automáticamente en todos los queries.

**El reto:** Garantizar que NINGÚN endpoint filtra "todo" sin filtrar por organización. Solución: todos los controllers reciben `organization_id` del middleware, no del body del request (evitar IDOR).

### Desafío 4: Immutable Logs en MongoDB

Garantizar que los logs no se puedan modificar ni borrar a través de la API, incluso con un bug.

**Solución:** Schema de Mongoose sin métodos `update` ni `delete` expuestos. No hay route DELETE ni PUT en los endpoints de logs. El único "borrado" es el TTL de MongoDB de 365 días.

**Extra:** Marcar el schema con `{ versionKey: false }` para no tener el campo `__v` que podría confundir.

---

## Métricas de Calidad

| Aspecto | Valor |
|---|---|
| OWASP SAMM Score | 85/100 (Nivel 4) |
| Validación de entrada | Zod en todos los endpoints |
| Auth en endpoints protegidos | 100% middleware coverage |
| Logs de auditoría | 100% de operaciones críticas |
| SQL injection posible | 0 (queries parametrizadas) |
| Secrets en código | 0 (todos en env vars) |

---

## Lo Que Haría Diferente

Con el conocimiento adquirido, estas serían las decisiones revisadas:

1. **Testing desde el principio** — empezar con tests unitarios para los servicios core, especialmente el auth service
2. **OpenAPI spec** — generar la documentación API desde código (con swagger-jsdoc) en lugar de escribirla a mano
3. **Event sourcing** — para el audit trail, considerar un modelo de eventos más formal desde el inicio
4. **Monorepo** — gestionar backend/frontend en un solo monorepo con herramientas como Turborepo

Estas decisiones no invalidan el trabajo actual, sino que representan la madurez técnica adquirida durante el proyecto.
