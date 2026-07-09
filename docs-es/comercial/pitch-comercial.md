# Pitch Comercial — RobenGate Sentinel

**Guía de presentación comercial para ventas y demos**  
**Tiempo:** 5 minutos (elevator pitch) / 30 minutos (demo completa)  

---

## El Elevator Pitch (30 segundos)

> "RobenGate Sentinel es una plataforma de ciberseguridad open-source que da a equipos de seguridad de cualquier tamaño las mismas capacidades que antes solo tenían las grandes corporaciones: SIEM, SOAR, Honeypot y Threat Intelligence, todo integrado, desplegable en una hora, al coste de infraestructura."

---

## La Historia en 3 Actos

### Acto 1: El Problema (1 minuto)

*"¿Sabes cuánto tiempo tarda en promedio una organización en detectar un ataque? **204 días.** Y eso asumiendo que lo detectan."*

*"Las herramientas para detectar ataques rápidamente existen: Splunk, Microsoft Sentinel, IBM QRadar. Pero cuestan entre $100,000 y $500,000 al año. Las alternativas open-source como Wazuh o ELK Stack requieren semanas de configuración y un equipo especializado."*

*"El resultado: el 60% de las PYMEs operan prácticamente ciegas en términos de seguridad."*

### Acto 2: La Solución (2 minutos)

*"RobenGate Sentinel resuelve esto. Es una plataforma que integra todo lo que necesita un equipo de seguridad:"*

- **SIEM** — Monitorización en tiempo real de todos los eventos de seguridad
- **Honeypot** — Trampas que capturan atacantes antes de que lleguen a tus sistemas reales
- **Threat Intelligence** — Base de IOCs actualizable con inteligencia real
- **SOAR** — Playbooks que responden automáticamente sin intervención manual
- **AI Analysis** — Motor heurístico que calcula el Risk Score global de tu organización

*"Y todo esto, desplegado en menos de una hora con Docker Compose. O en Kubernetes para producción enterprise."*

### Acto 3: El Por Qué Ahora (1 minuto)

*"La amenaza está creciendo: ataques de ransomware +73% en 2023. Los reguladores exigen más: SOC 2, ISO 27001, DORA, NIS2. Y el talento de seguridad es escaso y caro."*

*"Las organizaciones necesitan herramientas que funcionen solas, que sean transparentes (open-source), y que no requieran un equipo de 10 personas para operar."*

*"RobenGate Sentinel es esa herramienta."*

---

## Respuestas a Objeciones Comunes

### "Ya tenemos Wazuh"

> *"Wazuh es excelente para endpoint detection. RobenGate lo complementa: añade SOAR, Honeypot activo, Threat Intelligence con IOCs, y un dashboard de SOC unificado. No es un reemplazo, es la capa de orquestación encima."*

### "Tenemos Splunk y estamos contentos"

> *"Perfecto. Splunk es la referencia del mercado. Para empresas con el presupuesto y el equipo para operarlo, es la mejor opción. Nosotros somos para el siguiente nivel de mercado: los que necesitan esas capacidades pero no tienen $150k anuales para Splunk."*

### "Somos demasiado pequeños para necesitar esto"

> *"Los atacantes no discriminan por tamaño. De hecho, las PYMEs son objetivo preferido precisamente porque tienen menos defensas. Un incidente de ransomware le cuesta a una PYME entre €20k y €200k. El coste de prevención es mínimo en comparación."*

### "¿Es realmente open-source? ¿Qué pasa con el soporte?"

> *"El código es completamente open-source y estará en GitHub. Para self-hosted, la comunidad y la documentación son tu soporte. Para managed cloud, ofrecemos planes de soporte. Enterprise incluye CSM dedicado."*

### "¿Cómo sé que es seguro?"

> *"El código es completamente auditable — es open-source. Alcanzamos OWASP SAMM Nivel 4 con puntuación de 85/100. Logs inmutables, WebAuthn/FIDO2, bcrypt(12), sin SQL injection posible en nuestros endpoints. La transparencia del open-source es la mayor garantía de seguridad."*

---

## Datos para Llamar la Atención

- **204 días** — tiempo promedio de detección de una brecha (IBM Cost of Data Breach 2023)
- **$4.45M** — coste medio global de una brecha de datos (IBM 2023)
- **73%** — aumento de ransomware en 2023
- **< 1 hora** — tiempo de instalación de RobenGate Sentinel
- **91+** — endpoints API documentados y funcionales
- **5 métodos de auth** — incluyendo WebAuthn sin contraseña
- **85/100** — puntuación OWASP SAMM
- **365 días** — retención de logs en plan Professional

---

## Call to Action

### Para un Prospecto Técnico

> *"¿Quieres verlo funcionando? Podemos hacer un PoC en tu infraestructura en 2 horas. El repo es público y la documentación completa está disponible."*

### Para un Decision Maker

> *"¿Cuándo fue la última vez que revisaste tus logs de seguridad? ¿Tienes visibilidad de quién accede a qué en tu plataforma en este momento? Déjame mostrarte lo que RobenGate Sentinel puede ver en 15 minutos."*

### Para un CISO

> *"¿Cuánto tiempo le lleva a tu equipo investigar una alerta de brute force hoy? Con nuestros playbooks SOAR, esa respuesta es automática. ¿Podemos revisar juntos cómo encaja en tu stack actual?"*

---

## Materiales de Apoyo

| Material | Dónde encontrarlo |
|---|---|
| Demo técnica 15 min | [demo-tecnica.md](../demo/demo-tecnica.md) |
| Demo ejecutiva 5 min | [demo-ejecutiva.md](../demo/demo-ejecutiva.md) |
| Comparativa vs. competencia | [ventajas-competitivas.md](ventajas-competitivas.md) |
| Planes y precios | [planes-saas.md](planes-saas.md) |
| Casos de uso | [casos-de-uso.md](casos-de-uso.md) |
| Documentación técnica | [docs-es/api/](../api/) |
