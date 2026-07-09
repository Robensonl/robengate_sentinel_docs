# Mobile Optimization — Landing Page RobenGate Sentinel
**Junio 2026**

---

## Breakpoints

| Breakpoint | Width | Cols | Behavior |
|---|---|---|---|
| Mobile | < 640px | 1 | Stack vertical, single column |
| Tablet | 640–1023px | 2 | 2-col grids |
| Desktop | ≥ 1024px | 3+ | Full layout |

---

## Hero (Mobile)

**Issues fixed:**
- `text-4xl` base → `text-7xl` desktop (scale suave)
- 2 CTAs stacked verticalmente en mobile (`flex-col`)
- Trust badges `flex-wrap` para evitar overflow
- Dashboard preview mantiene proporción en mobile

---

## Carousel (Mobile)

- `visibleCount = 1` en < 640px
- `visibleCount = 2` en 640–1023px  
- `visibleCount = 3` en ≥ 1024px
- Swipe support con pointer events
- Nav arrows visible en todos los breakpoints
- Pagination dots responsive

---

## Grids Responsive

| Sección | Mobile | Tablet | Desktop |
|---|---|---|---|
| Stats | 2-col | 2-col | 4-col |
| Tech achievements | 2-col | 3-col | 6-col |
| Industries | 1-col | 2-col | 3-col |
| Architecture sources | 2-col | 4-col | 4-col |
| Roadmap | 1-col | 2-col | 4-col |
| Contact | 1-col | 1-col | 5-col |
| Footer | 2-col | 3-col | 6-col |

---

## Typography Mobile

| Elemento | Mobile | Desktop |
|---|---|---|
| Hero H1 | 36px (4xl) | 80px |
| Section H2 | 30px (3xl) | 48px (5xl) |
| Card title | 22px | 24px |
| Body | 16px | 16-18px |
| Labels | 12px | 12px |

---

## Spacing Mobile

- Section padding: `py-16` mobile / `py-32` desktop
- Container: `px-4` mobile / `px-8` desktop
- Card gaps: `gap-4` mobile / `gap-6` desktop

---

## Navigation Mobile

- Hamburger menu con animación height
- Full-width menu items para touch targets
- Tap area ≥ 44×44px en todos los botones

---

## Product Showcase (Mobile)

- Layout split 2-col → 1-col stack
- Dashboard mock es `order-2 lg:order-1` para mostrar texto primero en mobile
- AI showcase: mismo patrón invertido

---

## How It Works (Mobile)

- 5-step grid: `grid-cols-1` mobile, `grid-cols-3` tablet, `grid-cols-5` desktop
- Arrow indicator `↓` visible en mobile entre steps
- Connector line horizontal oculto en mobile

---

## Contact (Mobile)

- Profile card: full width
- Action cards: `sm:grid-cols-2` → single col en mobile
- Tech stack badges: `flex-wrap`

---

## Footer (Mobile)

- Brand column: `col-span-2` en mobile (ocupa 2 columnas)
- Link columns: 2 por fila en mobile
- Bottom bar: stacked vertically en mobile
