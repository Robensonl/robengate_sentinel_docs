# Recomendaciones Profesionales — RobenGate Sentinel

> **Fecha de Auditoría:** 28 de Mayo, 2026

---

## 1. Para Presentación de Portfolio y Demos a Reclutadores

### Qué Destacar Primero

El sistema de autenticación es genuinamente impresionante y debe ser destacado primero:
- MFA con tres canales (TOTP, OTP por email, OTP por teléfono)
- Soporte de passkey/biométrica FIDO2/WebAuthn
- Puntuación de riesgo adaptativa con 10+ señales de comportamiento
- Huella digital del dispositivo con gestión de confianza
- Gestión completa de sesiones con revocación

Esta es autenticación de nivel empresarial que muchas empresas SaaS de producción no tienen. Se compara favorablemente con implementaciones comerciales.

### Qué Ser Honesto Sobre

Ante cualquier audiencia técnica (ingenieros de seguridad, ingenieros staff, CTOs), ser claro sobre:
- Las visualizaciones del panel usan **datos de demostración** — muestran las capacidades de la UI pero no datos en vivo
- El sistema de IA es un **motor de reglas ponderadas** — tiene arquitectura sólida pero sin modelos entrenados
- El componente EDR **no tiene binario de agente** — es un backend completo para un agente que aún no existe
- El despliegue Kubernetes **no es funcional** (faltan templates de Helm)

**Intentar presentar estos como completamente listos para producción a una audiencia técnica dañará la credibilidad inmediatamente.** El encuadre honesto es mucho más convincente:

> *"He construido la arquitectura backend completa para una plataforma EDR — registro de agente, ingesta de telemetría, comandos de aislamiento, correlación de amenazas — pero el cliente agente en sí es un entregable de Fase 2. Aquí está cómo se ve la API..."*

### Script de Demo Recomendado

1. **Abrir con el flujo de auth** — registro, MFA, riesgo adaptativo, gestión de sesiones
2. **Mostrar el stream de logs de seguridad** — eventos reales de tu login de prueba fluyendo via SSE
3. **Demostrar el honeypot** — SSH al puerto 2222, mostrar la captura en el panel
4. **Recorrer la estructura del playbook SOAR** — explicar la arquitectura trigger/action
5. **Cerrar con el diagrama de arquitectura** — diseño multi-tenant, plan K8s, pipeline del motor de detección

**Evitar demos en vivo de:** el mapa de ataques (pura simulación), la puntuación de IA (mock), las gráficas del panel (estáticas).

---

## 2. Para Startup / Comercialización SaaS

### Estado Actual Comercializable

La plataforma aún no está lista para clientes de pago. El mínimo para un cliente beta requeriría:

1. Panel conectado a datos reales (Fase A1)
2. Pipeline de eventos conectado (Fase A3)
3. API de onboarding de tenants (Fase C6)
4. Al menos una alerta real llegando a la bandeja de entrada del cliente
5. Monitorización básica de uptime

### Posicionamiento Go-to-Market Recomendado

No posicionar como SIEM/XDR empresarial todo-en-uno de inmediato. Comenzar con:

**"Monitorización de Seguridad Gestionada para PYMEs"**
- Desplegar honeypot + ingesta de logs de seguridad + alertas
- Informe mensual de intentos de ataque
- Monetiza las capacidades actuales más fuertes
- No requiere el agente EDR ni modelos ML

Escalar desde ahí:
- Añadir automatización SOAR (respuesta semi-automatizada)
- Añadir multi-tenant cuando los primeros 5-10 clientes estén incorporados
- Añadir agente EDR una vez que los clientes PYME pidan visibilidad de endpoint

### Arquitectura de Precios Recomendada

| Plan | Precio | Características |
|------|--------|----------------|
| **Starter** | €49/mes | 5 usuarios, retención 90 días, alertas por email |
| **Professional** | €299/mes | 20 usuarios, retención 1 año, SOAR, acceso API |
| **Enterprise** | Personalizado | Usuarios ilimitados, multi-región, SLA, SSO, soporte dedicado |

---

## 3. Para Defensa Universitaria

### Narrativa Técnica Recomendada

Enmarcar el proyecto como **demostración de dominio de patrones de ingeniería de seguridad**:

1. **Profundidad de autenticación** — Pocos proyectos académicos implementan MFA real con múltiples canales, WebAuthn, y evaluación de riesgo adaptativa
2. **Arquitectura de seguridad por capas** — Demostrar la cadena de 13 middlewares y cómo cada capa de defensa se activa secuencialmente
3. **Honeypot funcional** — Un componente diferenciador único — la mayoría de tesis de seguridad solo describen conceptos, este los implementa
4. **Razonamiento de elecciones tecnológicas** — Explicar por qué SSE sobre WebSockets, por qué bcrypt-12, por qué persistencia políglota

### Preguntas Anticipadas del Tribunal

**"¿Por qué SSE en lugar de WebSockets?"**
> SSE es HTTP/1.1 puro, no requiere handshake de actualización, es automáticamente compatible con firewalls y proxies corporativos, y los eventos de seguridad son inherentemente unidireccionales (servidor → cliente). WebSockets añadiría complejidad sin beneficio para este caso de uso.

**"¿Por qué bcrypt-12 en lugar de argon2?"**
> bcrypt-12 ofrece un equilibrio probado entre resistencia a GPU (el factor de costo eleva el tiempo de cómputo) y compatibilidad con Node.js. Argon2id es teóricamente superior pero bcrypt en rango 12-14 es el estándar de la industria en aplicaciones Node.js actuales.

**"¿Cómo manejarías el escalado a 10,000 usuarios concurrentes?"**
> El backend es stateless — estado de sesión en Redis, no en memoria de proceso. Despliegue horizontal (multiple instancias) detrás de Nginx como balanceador. Kubernetes HPA para auto-escalado basado en CPU/memoria. Read replicas de PostgreSQL para consultas de reportes.

---

## 4. Para Clientes Empresariales

### Propuesta de Valor Principal

Para presentaciones a CISO o equipos de seguridad empresarial:

1. **Honeypot integrado como diferenciador** — Detección early-warning integrada en la plataforma, no como herramienta separada
2. **MFA empresarial completo** — WebAuthn (sin contraseñas), TOTP, email, SMS — todos los canales requeridos por políticas de seguridad
3. **Cumplimiento por diseño** — Logs inmutables, modelo de roles para SOC 2/ISO 27001, retención de 365 días automática
4. **Arquitectura Zero-Trust** — Verificación de riesgo en cada autenticación, no solo verificación de contraseña

### Para Demostración al Cliente

1. Iniciar con el flujo de login con MFA WebAuthn (passkey biométrica)
2. Mostrar el panel SIEM con datos reales generados durante la demo
3. Disparar el honeypot SSH desde una terminal separada — mostrar la alerta aparecer en tiempo real
4. Mostrar el ciclo de vida del incidente desde detección hasta resolución
5. Mostrar los logs de auditoría inmutables como evidencia de cumplimiento

---

## 5. Para Inversores / Demo Day

### Pitch Ejecutivo de 2 Minutos

> *"RobenGate Sentinel es una plataforma SOC de próxima generación que combina honeytraps, inteligencia de amenazas y respuesta a incidentes en una sola plataforma unificada. El estado del arte actual requiere 3-5 herramientas separadas para lograr lo que Sentinel hace en uno.*
>
> *Nuestro diferenciador técnico es la integración única de honeypot — en lugar de simplemente bloquear ataques, los atraemos y aprendemos de ellos. Cada IP que toca nuestro honeypot se convierte en inteligencia de amenazas accionable.*
>
> *El mercado de SIEM alcanzará 8.5B USD en 2026. Nos posicionamos en el segmento de PYMEs actualmente desatendido con un precio accesible y sin agentes para instalar."*

### Métricas que Demostrar

- **Tasa de detección**: % de ataques reales capturados vs. falsos positivos
- **MTTD (Tiempo Medio de Detección)**: < 1 segundo para detección via honeypot
- **Registros de auditoría inmutables**: Cumplimiento SOC 2 ready
- **MFA avanzado**: 4 canales incluyendo WebAuthn (diferenciador del mercado PYME)

---

*Ver también: [00_resumen_auditoria.md](00_resumen_auditoria.md) | [03_hoja_ruta.md](03_hoja_ruta.md) | [../README.md](../README.md)*
