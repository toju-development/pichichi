# Home Screen Redesign — Design Spec

**Date:** 2026-04-05
**Mockup:** `docs/design-mobile.pen` (frame: "Propuesta 1 — Stats Card")

## Overview

Redesign of the Home (Inicio) screen to feel more premium, professional, and differentiated. The goal is to elevate the visual experience with better hierarchy, spacing, and polish while keeping the app's identity.

## Design Decisions

### Header — Dark Hero
- **Background:** Dark gradient `#062E22` to `#0B6E4F` (vertical)
- **Brand:** "PICHICHI" in uppercase, weight 900, white. "MUNDIAL 2026" smaller, muted white (#FFFFFF50)
- **Notification bell:** Inside a circular translucent container (`#FFFFFF15`), 40x40px, cornerRadius 20. Red badge (#E63946) for unread count
- **No stats in the header** — the header is purely brand + notification

### Stats Card — "Tus Estadísticas"
- **Position:** First section below header, inside scrollable content
- **Container:** White card, 14px padding, cornerRadius 14, subtle shadow
- **Title row:** Clock icon (#0B6E4F) + "Tus Estadísticas" (14px, bold)
- **4 metrics in a horizontal row** with vertical dividers (#E5E7EB):
  1. **Puntos** — Star icon (gold #FFD166), value in green (#0B6E4F)
  2. **Pronósticos** — Target icon (#0B6E4F)
  3. **Precisión** — Trophy icon (gold #FFD166)
  4. **Exactos** — Circle-check icon (#10B981)
- Each metric: icon (16px) + value (20px, weight 800) + label (10px, #6B7280)

### Match Cards — "Partidos del Día"
- **Section header:** Globe icon + "Partidos del Día" (18px, bold) + count badge (green pill)
- **Gap between title and cards:** 10px (tight coupling)
- **Card style:** White, cornerRadius 16, 1px border #E5E7EB, subtle shadow, 16px padding
- **Top row:** Live indicator (green dot + "EN VIVO") or time | Phase label ("Fase de Grupos") right-aligned
- **Teams row (single horizontal line):**
  - Layout: `[HomeAvatar] [HomeName] — [Score] — [AwayName] [AwayAvatar]`
  - Avatars on the outer edges (home left, away right), names towards center
  - **Avatars: 28px circles** (small — designed to hold team crests/flags)
  - Gradient fills on avatars, cornerRadius 14 (circular)
  - Home name: 11px, weight 600, text-align left, fixed-width 90px
  - Away name: 11px, weight 600, text-align right, fixed-width 90px
  - Score: 20px, weight 900, centered with 10px horizontal padding
- **Footer row** (padding-top 8px):
  - **Left column (stacked):**
    - Tournament name (10px, #9CA3AF) — e.g., "Liga Profesional Argentina"
    - Group name (10px, weight 600, #0B6E4F) — e.g., "Mundialeros 2026"
  - **Right:** Prediction badge (green bg #E8F5EE + check icon + score) or "Pronosticar" button (orange bg #FFF3E0, text #E65100)

### Mis Grupos
- **Section header:** Users icon + "Mis Grupos" (18px, bold) + "Ver todos" link (#0B6E4F)
- **Gap between title and cards:** 10px
- **Each group is a compact row card** (not a leaderboard):
  - cornerRadius 14, white bg, 1px border, subtle shadow, 14px/16px padding
  - **Left:** Group name (14px, bold) + member count (11px, #6B7280)
  - **Right:** User's points (18px, weight 800, #0B6E4F) + "pts" label (11px, #6B7280)
  - Gap between group rows: 10px
- Multiple groups stack vertically

### Tab Bar — Original Style (flat)
- **Style:** Flat white bar with top border (#E5E7EB, 1px)
- **Padding:** 14px top, 16px bottom (generous breathing room above icons)
- **5 tabs:** Inicio, Torneos, Grupos, Ranking, Perfil
- **Active state:** Green icon + green label + small green dot indicator below label
- **Inactive state:** Gray (#9CA3AF) icon + label
- **Icon size:** 22px
- **Label:** 10px

### Layout & Spacing
- **Section gap:** 24px between major sections (stats, matches, groups)
- **Internal gap:** 10px between section title and its content
- **Screen padding:** 20px horizontal, 16px vertical
- **Background:** #F0FAF4 (mint)

## Icon Library
- Using **Lucide** icons throughout:
  - `star` — Points
  - `target` — Predictions
  - `trophy` — Accuracy
  - `circle-check` — Exact predictions
  - `globe` — Matches section / Inicio tab
  - `users` — Groups section / Grupos tab
  - `bell` — Notifications
  - `check` — Prediction confirmed
  - `user` — Perfil tab
  - `chart-bar` — Ranking tab
  - `timer` — Stats section title

## Color Palette (unchanged from brand)

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #0B6E4F | Buttons, links, active states |
| primary.dark | #062E22 | Dark header background |
| gold | #FFD166 | Hero points, accents |
| background | #F0FAF4 | Screen background |
| surface | #FFFFFF | Cards |
| text.primary | #1A1A2E | Titles, body |
| text.secondary | #6B7280 | Subtitles, meta |
| text.muted | #9CA3AF | Placeholders, phase labels |
| error | #E63946 | Notification badge |
| success | #10B981 | Live dots, exact predictions |
| border | #E5E7EB | Card borders, dividers |

---

## Grupos Screen (List)

### Header — Dark Hero (same pattern as Home)
- **Background:** Dark gradient `#062E22` to `#0B6E4F`
- **Title:** "Mis Grupos" (22px, weight 900, white)
- **No subtitle** — just title + notification bell
- **Bell:** Same translucent circle style as Home

### Group Cards
- **Card style:** White, cornerRadius 16, 1px border #E5E7EB, subtle shadow, 16px padding
- **Layout:** Horizontal row — left content + right badge
- **Left side:**
  - Green accent bar (4px wide, 44px tall, cornerRadius 2, #0B6E4F)
  - Group name (15px, weight 700, #1A1A2E)
  - Member count with users icon (12px, #9CA3AF) + text (11px, #6B7280)
- **Right side — Role badge:**
  - **MIEMBRO:** Light green bg (#F0FAF4), green text (#0B6E4F), 10px weight 600
  - **ADMIN:** Dark bg (#062E22), gold text (#FFD166), 10px weight 600
- **Gap between cards:** 12px

### FABs (Floating Action Buttons)
- **2 circular FABs** stacked vertically, bottom-right corner
- **Top FAB — Crear grupo:**
  - 48x48px, cornerRadius 24, fill #0B6E4F
  - Plus icon (22px, white)
  - Shadow: #0B6E4F40, blur 12
- **Bottom FAB — Unirse con código:**
  - 48x48px, cornerRadius 24, fill #062E22
  - Hash icon (22px, gold #FFD166)
  - Shadow: #062E2240, blur 12
- **No text labels** on FABs — icons only

### Tab Bar
- Same original flat style as Home
- **Grupos tab active** (green icon + label + dot)

---

## Crear Grupo Modal

### Modal Chrome
- **Drag bar:** Green gradient (#062E22 → #0B6E4F), centered pill handle (40x4px, #FFFFFF40, cornerRadius 2)
- **Header row:** "Crear grupo" (20px, weight 800, #1A1A2E) + "Cancelar" (15px, weight 600, #0B6E4F), separated by bottom border (#E5E7EB)

### Form Fields
- **Input style:** Background #F3F4F6, 1px border #E5E7EB, cornerRadius 12, height 48px (single line) or 100px (textarea), padding 16px horizontal
- **Placeholder text:** 14px, #9CA3AF
- **Labels:** 14px, weight 700, #1A1A2E
- **Character counters:** 11px, #9CA3AF
- **Gap between fields:** 24px

### Tournament Selection
- **Cards:** cornerRadius 14, fill #F3F4F6, padding 14px/16px
- **Left:** Trophy icon in green circle (40x40px, fill #E8F5EE, icon #0B6E4F) + tournament name (14px, weight 600) + subtitle (11px, #6B7280)
- **Right:** Unchecked circle (24px, 2px stroke #E5E7EB) / Checked: filled green circle with check icon
- **Gap between tournament cards:** 10px

### Stepper (Max Members)
- **Buttons:** 40x40px, cornerRadius 12, 1px border #E5E7EB, icon 18px #1A1A2E
- **Value:** 24px, weight 800, #1A1A2E
- **Gap between elements:** 16px
- **Helper text:** 11px, #9CA3AF

### CTA Button
- **Container:** Full width, padding 16px top, 32px bottom (safe area)
- **Button:** Height 52px, cornerRadius 14, green gradient (#0B6E4F → #0a5e43), shadow #0B6E4F30 blur 12
- **Text:** 16px, weight 700, white
- **Top border:** 1px #E5E7EB separating from content

---

## Unirse a Grupo Modal

### Modal Chrome
- Same drag bar + header pattern as Crear Grupo modal
- **Title:** "Unirme a un grupo" (20px, weight 800)

### Content (centered layout)
- **Hero icon:** 72x72px circle, fill #E8F5EE, hash icon 32px #0B6E4F
- **Instruction text:** "Pedile el código de invitación / al admin del grupo" (16px, weight 600, #1A1A2E, centered)
- **Code input:**
  - Label: "Código de invitación" (14px, weight 700, #1A1A2E)
  - Input: Height 64px, cornerRadius 16, fill #F3F4F6, 1px border #E5E7EB
  - Placeholder: "ABCD1234" (28px, weight 800, #9CA3AF, letterSpacing 4)
  - Helper: "8 caracteres, letras y números" (11px, #9CA3AF)
- **Gap between sections:** 32px
- **Vertical padding top:** 40px

### CTA Button
- Same style as Crear Grupo: full width, 52px height, green gradient, "Unirme al grupo"

---

## Group Detail Screen

### Header — Dark Hero (same pattern as Home/Grupos)
- **Background:** Dark gradient `#062E22` to `#0B6E4F`
- **Left:** Back arrow (chevron-left, white, 24px)
- **Center-left:** Group name (22px, weight 700, white) + subtitle "Mundial EEUU 2026" (14px, rgba(255,255,255,0.7))
- **Right:** "Editar" pill button — translucent bg (#FFFFFF20), cornerRadius 10, padding 0/14px, height 34
  - Text: "Editar" (13px, weight 600, white)

### Torneos Section
- **Section header:** Trophy icon (#0B6E4F) + "Torneos" (18px, bold) — grouped left
  - **Right side:** Count badge (green pill, "2") + "Agregar" link (13px, weight 600, #0B6E4F)
- **Gap between title and cards:** 10px
- **Tournament cards:** White, cornerRadius 14, 1px border #E5E7EB, subtle shadow, padding 14px/16px
  - **Left:** Trophy icon in green circle (40x40, fill #E8F5EE) + tournament name (14px, weight 600) + tag pills
  - **Right:** Trash-2 icon (16px, #E63946) — removes tournament from group
  - **Tags:** Small pills (cornerRadius 8, padding 2/8, fontSize 9, weight 600)
    - Type tag: "Personalizado" (#0B6E4F on #E8F5EE) or "Copa del Mundo" (#E65100 on #FFF3E0)
    - Status tag: "En curso" (#0B6E4F on #F0FAF4) or "Próximamente" (#6B7280 on #F3F4F6)
- **Gap between tournament cards:** 10px

### Miembros Section
- **Section header:** Users icon (#0B6E4F) + "Miembros" (18px, bold) — grouped left (gap 8)
  - **Right side:** Count badge (green pill, "12") + "Ver todos" link (13px, weight 600, #0B6E4F)
- **Shows top 5 members** sorted by points; "Ver todos" navigates to full list
- **Gap between title and rows:** 10px
- **Member rows:** White card, cornerRadius 14, 1px border #E5E7EB, subtle shadow, padding 12px/16px
  - **Left:** Avatar circle (36px, gradient fill) with initials (13px, weight 700, white) + name (14px, weight 600) + role badge
  - **Right:** Points value (18px, weight 800, #0B6E4F) + "pts" label (11px, #6B7280)
  - **Role badges** (cornerRadius 4, padding 2/8, fontSize 9, weight 700):
    - ADMIN: Dark bg (#062E22), gold text (#FFD166)
    - MIEMBRO: Light green bg (#F0FAF4), green text (#0B6E4F)
- **Gap between member rows:** 10px

### FAB — Invitar Miembro
- **Single circular FAB**, bottom-right corner, above tab bar
- 52x52px, cornerRadius 26, fill #0B6E4F
- User-plus icon (22px, white)
- Shadow: #0B6E4F40, blur 12, offset y:4
- **No text label** — icon only

### Danger Zone
- **"Salir del grupo" button:** Full width, cornerRadius 14, fill #FEF2F2, 1px border #E63946
  - Log-out icon (18px, #E63946) + text "Salir del grupo" (14px, weight 600, #E63946)
  - Centered content, padding 14px/16px

### Tab Bar
- Same original flat style as Home
- **Grupos tab active** (green icon + label + dot)

---

## Editar Grupo Modal

### Modal Chrome
- Same drag bar + header pattern as Crear Grupo modal
- **Title:** "Editar grupo" (20px, weight 800)

### Form Fields (same styling as Crear Grupo)
- **Nombre del grupo \*:** Pre-filled with current name, character counter (e.g. "16/100")
- **Descripción (opcional):** Pre-filled with current description, textarea 100px height, counter (e.g. "17/500")
- **Máximo de miembros:** Same stepper (- / value / +), helper "Mínimo 2, máximo 10 (según tu plan)"
- **No tournament selection** — tournaments are managed from the Group Detail screen

### CTA Button
- Same style as Crear Grupo: full width, 52px height, green gradient, **"Guardar cambios"**

---

## Agregar Torneo Modal

### Modal Chrome
- Same drag bar + header pattern as other modals
- **Title:** "Agregar torneo" (20px, weight 800)
- **Background:** #F0FAF4 (mint)

### Content
- **Padding:** 24px top, 20px horizontal
- Lists only tournaments **not already in the group**
- **Tournament cards:** White, cornerRadius 14, 1px border #E5E7EB, subtle shadow, padding 14px/16px
  - **Left:** Trophy icon in green circle (40x40, fill #E8F5EE, icon #0B6E4F) + name (14px, weight 600) + subtitle (11px, #6B7280, format: "Type · Status")
  - **Right:** "Agregar" button — cornerRadius 12, 1px border #0B6E4F, padding 10/20, text (14px, weight 600, #0B6E4F)
- **Gap between cards:** 10px

---

## Torneos List Screen

### Header — Dark Hero
- Same gradient pattern (#062E22 → #0B6E4F)
- **Title:** "Torneos" (28px, weight 800, white)
- **Subtitle:** "Competiciones disponibles" (14px, weight 500, rgba(255,255,255,0.6))
- **Right:** Notification bell (22px, white) with red badge (16px circle, #E63946, count in white 9px bold)

### Tournament Cards
- **Layout:** Horizontal — accent bar + body content
- **Container:** White, cornerRadius 14, 1px border #E5E7EB, subtle shadow, clip: true
- **Accent bar:** 4px wide, full height, left edge
  - Personalizado: #0B6E4F (green)
  - Copa del Mundo: #E65100 (orange)
- **Body:** Vertical layout, padding 14/16/14/12, gap 8
  - **Row 1:** Trophy icon in colored circle (36px, cornerRadius 18) + name (15px, weight 700) + chevron-right (#9CA3AF) right-aligned
    - Personalizado: icon circle #E8F5EE, icon #0B6E4F
    - Copa del Mundo: icon circle #FFF3E0, icon #E65100
  - **Row 2:** Tag pills (cornerRadius 8, padding 3/8, fontSize 10, weight 600)
    - Type: "Personalizado" (#0B6E4F on #E8F5EE) or "Copa del Mundo" (#E65100 on #FFF3E0)
    - Status: "En curso" (#16A34A on #DCFCE7) or "Próximamente" (#6B7280 on #F3F4F6)
  - **Row 3 (meta):** space_between, full width
    - Left: Calendar icon (13px, #9CA3AF) + date range (11px, #6B7280)
    - Right: Shield icon (13px, #9CA3AF) + team count (11px, #6B7280)
- **Gap between cards:** 12px

### Tab Bar
- Same flat style, **Torneos tab active** (green + dot)

---

## Tournament Detail Screen

### Header — Dark Hero
- Same gradient pattern (#062E22 → #0B6E4F)
- **Back row:** Chevron-left (20px, white) + "Volver" (14px, weight 500, rgba(255,255,255,0.6))
- **Title:** Tournament name (26px, weight 800, white)
- **Subtitle:** Tournament type (14px, weight 500, rgba(255,255,255,0.6))

### Mis Grupos Section
- **Title:** "Mis Grupos" (16px, weight 700)
- **Group chips:** Compact horizontal — cornerRadius 12, white fill, 1px border #E5E7EB, padding 8/14
  - Avatar circle (26px, dark green gradient) with users icon (13px, white)
  - Group name (12px, weight 600) + member count (10px, #6B7280)
  - No chevron — chip is compact
- Multiple chips can sit side-by-side (horizontal scroll if needed)
- **Divider** below section: 1px #E5E7EB

### Phase Tabs (horizontal scroll)
- **Pills:** cornerRadius 20, padding 8/16
  - **Active:** fill #0B6E4F, text white (13px, weight 600)
  - **Inactive:** fill white, 1px border #E5E7EB, text #6B7280 (13px, weight 500)
- Values: "Próximos", "Grupos", "8vos", "4tos", "Semi", "Final"
- **Gap:** 8px

### Zone Filter (horizontal scroll, only for "Grupos" phase)
- **Active pill:** cornerRadius 16, padding 6/14, fill #E8F5EE, 1px border #0B6E4F, text #0B6E4F (12px, weight 600)
- **Inactive:** no fill/border, text #6B7280 (12px, weight 500), padding 6/12
- Values: "Todos", "A", "B", "C", "D", "E", "F", "G", "H"
- **Divider** below: 1px #E5E7EB

### Match Cards (grouped by date)
- **Date header:** Day + date (15px, weight 700, #1A1A2E)
- **Card:** White, cornerRadius 14, 1px border #E5E7EB, subtle shadow, padding 12/16, gap 10
  - **Row 1:** "GRUPO X · FASE DE GRUPOS" label (10px, weight 600, #9CA3AF)
  - **Row 2 (teams):** space_between, full width
    - Home: Avatar circle (32px, team color) with initial + name (14px, weight 600)
    - Center: "vs" (13px, #9CA3AF) for upcoming, or score for played
    - Away: name + avatar circle (mirrored)
  - **Score format (played matches):** Winner score (22px, weight 800, #0B6E4F) + dash (18px, #9CA3AF) + loser score (22px, weight 800, #6B7280)
  - **Row 3 (meta):** space_between — date/time left (11px, #6B7280) + venue right (11px, #9CA3AF)
- **Gap between cards:** 10px, **gap between date groups:** 16px

### Tab Bar
- Same flat style, **Torneos tab active**

---

## Tournament-in-Group Screen (4 tabs)

Accessed by tapping a tournament from within a group. Shows tournament data scoped to that group.

### Header
- Same dark hero as Tournament Detail
- **Subtitle includes group name:** "Copa del Mundo · Mundialeros 2026"

### Icon Tabs (below header, white bg, bottom border #E5E7EB)
- 4 circular icon buttons (40x40, cornerRadius 20), gap 12, padding 12/20
- **Active:** fill #0B6E4F, icon white
- **Inactive:** transparent bg, icon #9CA3AF
- Icons: circle-dot (matches), circle-check (results), star (bonus), chart-bar (ranking)

### Tab 1 — Partidos (Matches to predict)
- Same match card layout as Tournament Detail (date groups + cards)
- **Prediction states (centered row at bottom of each card):**
  - **Predicted:** Green pill (fill #E8F5EE, cornerRadius 12, padding 6/14) — "Tu pronóstico" (11px, #0B6E4F) + score (13px, weight 700, #0B6E4F)
  - **Not predicted:** Orange outline button (1px border #E65100, cornerRadius 12, padding 6/14) — "+ Pronosticar" (12px, weight 600, #E65100)

### Tab 2 — Resultados (Played matches)
- Same match card layout but with scores instead of "vs"
- **Score format:** Winner (22px, weight 800, #0B6E4F) - dash - loser (22px, weight 800, #6B7280)
- **Draw:** Both scores in #6B7280
- **Prediction status:** Gray pill (fill #F3F4F6, cornerRadius 12) — "Sin pronóstico" (12px, #9CA3AF)

### Tab 3 — Pronósticos Bonus
- **Section header:** "Pronósticos Bonus" (18px, bold) + gold badge "10 pts c/u" (fill #FFD166, cornerRadius 12, text #1A1A2E, 12px bold)
- **Bonus cards:** White, cornerRadius 14, 1px border #E5E7EB, padding 16, full width, space_between
  - **Left:** Icon (24px, colored) + name (15px, weight 600) + "10 pts" (11px, #6B7280)
  - **Right:** Lock icon (14px, #9CA3AF) + "Sin pronóstico" (12px, #9CA3AF)
  - **Icons per bonus:** trophy (#FFD166) for Campeón, circle-dot (#9CA3AF) for Goleador, star (#FFD166) for MVP, sparkles (#E65100) for Revelación
- **Gap between cards:** 12px

### Tab 4 — Ranking
- **Title:** "Ranking" (18px, weight 700)
- **Ranking rows:** Full width, padding 14/0, bottom border 1px #E5E7EB
  - Position number (16px, weight 800) — gold (#FFD166) for 1st, silver (#C0C0C0) for 2nd
  - Avatar circle (40px, gradient) with initials
  - Name (14px, weight 600) + exacto count (11px, #6B7280)
  - Points right-aligned: value (20px, weight 800, #0B6E4F) + "pts" (11px, #6B7280)

---

## Scope
- **This spec covers:** Home, Grupos list, Crear Grupo modal, Unirse a Grupo modal, Group Detail, Editar Grupo modal, Agregar Torneo modal, Torneos list, Tournament Detail, Tournament-in-Group (4 tabs)
- **Future work:** Apply consistent patterns to Ranking, Perfil screens
