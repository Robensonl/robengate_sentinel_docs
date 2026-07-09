# Design System Enterprise — RobenGate Sentinel
**Versión:** 1.0 | **Junio 2026**

---

## 1. Paleta de Colores

### Core Cybersecurity Palette
| Token | Valor | Uso |
|---|---|---|
| `--cyber-blue` | `#00D4FF` | Primary accent, CTAs, highlights |
| `--cyber-purple` | `#7C3AED` | Secondary accent, AI features |
| `--neon-green` | `#00FFA3` | Success, live, positive states |
| `--cyber-pink` | `#ec4899` | AI Analysis module, special features |

### Module Color Coding
| Módulo | Color | Hex |
|---|---|---|
| SIEM | Cyan | `#00D4FF` |
| Threat Intelligence | Purple | `#7C3AED` |
| Honeypot | Green | `#00FFA3` |
| AI Analysis | Pink | `#ec4899` |
| Threat Hunting | Orange | `#FFB020` |
| Attack Map | Red | `#FF3B5C` |
| Vulnerability Mgmt | Teal | `#00E676` |
| Audit Logs | Gray | `#94A3B8` |

### Severity Colors
| Nivel | Color |
|---|---|
| Critical | `#FF3B5C` |
| High | `#FF6B35` |
| Medium | `#FFB020` |
| Low | `#00D4FF` |
| Info | `#94A3B8` |

---

## 2. Tipografía

### Scale (8px base)
| Token | Tamaño | Uso |
|---|---|---|
| `text-xs` | 12px | Labels, captions, metadata |
| `text-sm` | 14px | Body secondary, badges |
| `text-base` | 16px | Body primary, descriptions |
| `text-lg` | 18px | Subtitles, card titles |
| `text-xl` | 20px | Section subtitles |
| `text-2xl` | 24px | Card headlines |
| `text-3xl` | 30px | Section headers mobile |
| `text-4xl` | 36px | Section headers desktop |
| `text-5xl` | 48px | Hero headline mobile |
| `text-6xl` | 60px | Hero headline tablet |
| `text-7xl` | 72px | Hero headline desktop |
| `text-8xl` | 96px | Hero headline xl |

### Font Weights
- **Regular (400):** body text
- **Medium (500):** emphasis text
- **Semibold (600):** card titles, labels
- **Bold (700):** headlines, CTAs
- **Extrabold (800):** hero headline

### WCAG Requirements
- Body text: minimum 16px
- Card titles: minimum 22px
- Section headers: minimum 32px
- Buttons: minimum 16px
- Contrast ratio: 4.5:1 minimum (AA)

---

## 3. Spacing System (8px grid)

| Token | Valor |
|---|---|
| `spacing-1` | 4px |
| `spacing-2` | 8px |
| `spacing-3` | 12px |
| `spacing-4` | 16px |
| `spacing-5` | 20px |
| `spacing-6` | 24px |
| `spacing-8` | 32px |
| `spacing-10` | 40px |
| `spacing-12` | 48px |
| `spacing-16` | 64px |
| `spacing-20` | 80px |
| `spacing-24` | 96px |
| `spacing-32` | 128px |

### Section Padding
- Mobile: `py-16 px-4` (64px vertical)
- Tablet: `py-24 px-6` (96px vertical)
- Desktop: `py-32 px-8` (128px vertical)

---

## 4. Componentes de Botón

### Primary CTA
```
bg: var(--cyber-blue)
text: #060816
font-weight: 700
padding: 14px 32px
border-radius: 12px
effect: cyber-glow (box-shadow: 0 0 20px rgba(0,212,255,0.4))
hover: opacity 90% + scale(1.01)
```

### Secondary / Ghost
```
bg: rgba(255,255,255,0.04)
border: 1px solid rgba(255,255,255,0.15)
text: white
backdrop-filter: blur(8px)
hover: border-color var(--cyber-blue) + glow
```

### Destructive / Alert
```
bg: rgba(255,59,92,0.1)
border: 1px solid rgba(255,59,92,0.3)
text: #FF3B5C
```

---

## 5. Cards

### Glassmorphism Card (Standard)
```css
background: rgba(255,255,255,0.03)
border: 1px solid rgba(255,255,255,0.08)
backdrop-filter: blur(12px)
border-radius: 16px
box-shadow: 0 4px 24px rgba(0,0,0,0.3)
```

### Premium Module Card
```css
background: linear-gradient(145deg, [color]12 0%, rgba(6,8,22,0.85) 60%)
border: 1px solid [color]55 (active) / [color]1A (inactive)
box-shadow: 0 0 40px [color]15 + inset highlight
border-radius: 16px
```

### Active Card State
```css
border-color: [accent]55
box-shadow: 0 0 0 1px [accent]20, 0 20px 60px rgba(0,0,0,0.5), 0 0 40px [accent]15
```

### Hover State
```css
border-color: [accent]35
box-shadow: 0 8px 32px rgba(0,0,0,0.4)
transform: translateY(-2px)
transition: all 0.3s ease
```

---

## 6. Efectos Visuales

### Cyber Grid Background
```css
.cyber-grid-bg {
  background-image: linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px);
  background-size: 64px 64px;
}
```

### Glassmorphism Standard
```css
.glassmorphism {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
}
```

### Cyber Glow (Primary)
```css
.cyber-glow {
  box-shadow: 0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.15);
}
```

### Top Edge Glow (Cards)
```css
height: 1px;
background: linear-gradient(90deg, transparent 10%, [color]AA 50%, transparent 90%);
```

---

## 7. Animaciones

### Principios
- Duración base: 300ms
- Duración media: 480ms
- Duración larga: 800ms
- Easing estándar: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Scroll Reveal
```js
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ delay: i * 0.08 }}
```

### Fade In
```js
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Scale In
```js
initial={{ opacity: 0, scale: 0.85 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: 0.3 + i * 0.1 }}
```

### Carousel Slide
```css
transition: transform 0.48s cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

---

## 8. Responsive Breakpoints

| Nombre | Breakpoint | Uso |
|---|---|---|
| Mobile | < 640px | 1 columna |
| Tablet | 640–1023px | 2 columnas |
| Desktop | 1024–1279px | 3 columnas |
| Large | ≥ 1280px | 4 columnas (selectivo) |

### Grid System
```
Mobile:    1 col | gap-4 (16px)
Tablet:    2 col | gap-5 (20px)
Desktop:   3 col | gap-6 (24px)
Wide:      4 col | gap-5 (20px)
```

---

## 9. Iconografía

**Librería:** Lucide React

### Size Standards
| Contexto | Tamaño |
|---|---|
| Inline text | 14–16px |
| Card icon small | 16–18px |
| Card icon medium | 20–24px |
| Hero icon large | 28–32px |
| Feature icon xl | 40–48px |

### Colores de Icono
- Primary actions: `var(--cyber-blue)`
- Success/Live: `var(--neon-green)`
- Warning/Pending: `#FFB020`
- Danger/Critical: `#FF3B5C`
- Neutral: `var(--muted-foreground)`

---

## 10. Accesibilidad WCAG AA

| Criterio | Requerimiento | Estado |
|---|---|---|
| Color contrast text | ≥ 4.5:1 | ✅ |
| Color contrast large text | ≥ 3:1 | ✅ |
| Focus visible | outline visible | ✅ |
| Touch targets | ≥ 44×44px | ✅ |
| Keyboard navigation | full support | ✅ |
| Screen reader | aria-labels | ✅ |
| Motion preferences | prefers-reduced-motion | Pendiente |

---

## 11. Variables CSS Globales

```css
--cyber-blue: #00D4FF;
--cyber-purple: #7C3AED;
--neon-green: #00FFA3;
--cyber-pink: #ec4899;
--background: #060816;
--background-secondary: #0a0e1a;
--border: rgba(255,255,255,0.08);
--muted-foreground: rgba(255,255,255,0.55);
--destructive: #FF3B5C;
```
