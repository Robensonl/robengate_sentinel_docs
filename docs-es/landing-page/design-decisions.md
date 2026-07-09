# Design Decisions — Landing Page RobenGate Sentinel
**Junio 2026**

---

## 1. Por qué Glassmorphism

**Decisión:** Usar glassmorphism como estilo de card base.

**Razón:** 
- Apropiado para el tema oscuro de ciberseguridad
- Crea profundidad sin sobrecarga visual
- Consistente con el estilo de dashboards de Microsoft Sentinel y CrowdStrike
- `background: rgba(255,255,255,0.025)` + `backdrop-filter: blur(12px)` es el sweet spot para readability

**Alternativas descartadas:**
- Cards sólidas oscuras: demasiado planas
- Cards con gradientes fuertes: demasiado ruido visual

---

## 2. Por qué 2 CTAs en Hero (no 3)

**Decisión:** Reducir de 3 CTAs a 2.

**Razón:**
- Research CRO: >2 CTAs en el mismo nivel visual reduce conversion rate
- "Hick's Law": más opciones = más tiempo de decisión = menos conversiones
- "Ver Documentación" movido a navbar (siempre accesible)

**Jerarquía:**
1. Primary: "Solicitar Demo" (revenue critical)
2. Secondary: "Lanzar Plataforma" (product-led growth)

---

## 3. Por qué Color-Coding por Módulo

**Decisión:** Cada módulo tiene un color único y consistente.

**Razón:**
- Cognición inmediata: SIEM = Cyan, AI = Pink
- Facilita escaneo visual en carousel
- Consistencia entre landing page y dashboard real
- Inspirado en Datadog (colores por servicio)

**Tabla de módulos:**
| Módulo | Color | Razón |
|---|---|---|
| SIEM | Cyan #00D4FF | Información primaria |
| Threat Intel | Purple #7C3AED | Inteligencia/AI |
| Honeypot | Green #00FFA3 | Captura/activo |
| AI Analysis | Pink #ec4899 | AI/ML |
| Threat Hunting | Orange #FFB020 | Investigación |
| Attack Map | Red #FF3B5C | Peligro/ataque |
| Vuln Mgmt | Teal #00E676 | Salud/reparación |
| Audit Logs | Gray #94A3B8 | Registro/neutral |

---

## 4. Por qué Carousel (no Grid 4-col)

**Decisión:** Reemplazar grid 4-col por carousel horizontal.

**Razón:**
- Grid 4-col: 8 cards visibles = sobrecarga cognitiva
- Carousel: 3 cards = foco + proceso progresivo
- Mobile-first: 1 card en mobile es ideal para depth de lectura
- Premium feel: comparar con CrowdStrike module showcase

**Trade-offs:**
- Pro: contenido más legible, mobile mejor
- Con: no todo el contenido visible de inmediato
- Mitigación: pagination dots muestran que hay más

---

## 5. Por qué Mini Previews en Cards de Módulo

**Decisión:** Cada card tiene un mini dashboard preview.

**Razón:**
- Muestra el producto, no solo lo describe
- "Show, don't tell" — principio UX fundamental
- Diferencia de competidores que solo listan features
- Aumenta la percepción de polish y completeness

---

## 6. Por qué Inline Styles en lugar de clases Tailwind puras

**Decisión:** Mix de Tailwind classes + inline styles para efectos avanzados.

**Razón:**
- Box-shadow complejos (múltiples capas) no disponibles en Tailwind sin config
- Gradientes con colores dinámicos (basados en `mod.color`) requieren inline
- `backdropFilter` para glassmorphism necesita inline en algunos navegadores
- El resto usa Tailwind para mantenibilidad

---

## 7. Por qué `onMouseEnter/Leave` en lugar de CSS hover

**Decisión:** Event handlers para hover states en algunos componentes.

**Razón:**
- Necesidad de cambiar múltiples propiedades (border + boxShadow) en hover
- Tailwind hover utilities no soportan valores dinámicos (basados en `mod.color`)
- Permite transiciones suaves con `transition: 'all 0.3s ease'` inline

**Trade-offs:**
- Con: menos limpio que CSS puro
- Pro: permite colores dinámicos por módulo
- Mitigación: solo usado donde es necesario

---

## 8. Por qué `once: true` en Scroll Animations

**Decisión:** `viewport={{ once: true }}` en todos los whileInView.

**Razón:**
- Performance: animaciones se ejecutan solo una vez al entrar viewport
- UX: re-animar en scroll reverso es distractivo
- Enterprise standard: Microsoft, Datadog siguen este patrón

---

## 9. Por qué Social Proof con Métricas Técnicas (no testimonios)

**Decisión:** Usar stats de arquitectura real en lugar de customer testimonials.

**Razón:**
- No hay clientes reales (plataforma en desarrollo)
- Inventar testimonios: dishonest y detectado por evaluadores técnicos
- Stats técnicas reales (18 routes, 8 módulos, 4 roles) son verificables
- Target audience técnico valora más métricas que quotes

---

## 10. Por qué "Live" Badge en Browser Chrome del Dashboard

**Decisión:** Añadir badge "Live" verde con pulse en el dashboard preview.

**Razón:**
- Comunica inmediatamente que la plataforma es funcional (no mockup)
- Increase trust: "esto es real"
- Consistent con el "● Plataforma Operativa" badge del hero
