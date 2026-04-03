# BookVisit — UI Architecture Audit

## 1. Component Inventory

### Reusable UI Primitives (`src/components/ui/`)

| Component | Props / Variants | Used In |
|-----------|-----------------|---------|
| **Button** | `variant`: primary / secondary / outline / ghost / danger; `size`: sm / md / lg; `loading`, `fullWidth` | All pages (20+ instances) |
| **Badge** | `variant`: default / success / warning / error / info; + `bookingStatusBadge()` helper | Booking pages, admin tables, master lists |
| **FormField** | `variant`: admin / client; + label, type, required, placeholder | Auth forms, booking flow, admin forms |
| **Modal** | `open`, `onClose`, `title` — mobile bottom sheet, desktop centered | ServiceCard detail (mobile only) |
| **Loader** | `Loader` (inline) + `PageLoader` (full screen) | 10+ pages |
| **EmptyState** | `icon`, `title`, `description`, `action` | 5+ pages |
| **InfoRow** | `icon`, `value`, `label` — simple or detailed mode | Booking detail, salon detail |
| **DragDropUpload** | `folder`, `accept`, `maxFiles`, `values`, `onChange` | SalonFormPage, MasterFormPage |

### Composite Components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| **Header** | Sticky top bar with back button, title, optional actions |
| **BottomNav** | Fixed bottom tab bar (Home, Search, Bookings, Profile) |
| **ImageWithFallback** | Image with SVG gradient fallback on error |
| **SalonCard** | Salon photo + name + rating + address + CTA |
| **MasterCard** | Avatar + name + specialization + rating |
| **ReviewCard** | Star rating + review text + author |
| **ServiceCard** | Name + price + duration + select toggle (mobile: bottom sheet) |
| **BookingSummary** | Selected services + date/time + total price |
| **TimeSlotGrid** | 4-column grid of available time slots |

### Layouts

| Layout | Scope |
|--------|-------|
| **ClientRoot** (`pages/client/Root.tsx`) | Header + BottomNav wrapper for all client pages |
| **AdminLayout** (`pages/admin/AdminLayout.tsx`) | Sidebar (desktop) + top/bottom nav (mobile) for admin |

---

## 2. Theming System — Current State

### CSS Variables (defined in `ThemeContext.tsx` + `theme.css`)

A CSS variable theme system exists and is applied to `document.documentElement`:

```
--color-primary: #8B5CF6     --color-primary-dark: #7C3AED
--color-primary-light: #A78BFA  --color-accent: #EC4899
--color-background: #FAFAFA   --color-surface: #FFFFFF
--color-text: #1F2937          --color-text-secondary: #6B7280
--color-border: #E5E7EB        --color-success/warning/error: ...
--font-family: "Inter", system-ui, sans-serif
--border-radius: 12px
```

### Fonts Loaded (Google Fonts)

- **Inter** — used everywhere (body + headings)
- **Playfair Display** — loaded but unused
- **Montserrat** — loaded but unused

### Who Uses the Theme System?

| Layer | CSS Variable Usage | Hardcoded Tailwind Colors |
|-------|--------------------|--------------------------|
| **Client pages** | ~60-70% (surfaces, text, borders) | ~30-40% (selection states, hover, gray shades) |
| **Admin pages** | 0% | 100% — all hardcoded `gray-*`, `purple-*` |
| **Auth pages** | 0% | 100% — all hardcoded |
| **UI components** | Mixed — Button uses vars, Badge does not | Badge, EmptyState icon, DragDropUpload all hardcoded |

---

## 3. Inconsistencies Found

### Critical

| Issue | Where | Impact |
|-------|-------|--------|
| **Admin pages ignore theme system entirely** | All admin pages, AdminLayout | Two separate color systems — impossible to re-theme |
| **Auth pages ignore theme system** | Login, Register, ForgotPassword, etc. | Brand inconsistency between auth and client experience |
| **Hardcoded `purple-50` in selection states** | ServiceCard, TimeSlotGrid, SalonFormPage day toggles, Button outline variant | Breaks if primary color changes |
| **FormField has dual variants** | `variant: 'admin' | 'client'` — different color systems | Maintenance burden, two sources of truth |
| **Many form buttons are inline Tailwind, not `<Button>`** | Auth pages, SalonFormPage, RegisterPage | Inconsistent styling, no single source of truth |

### Medium

| Issue | Where |
|-------|-------|
| Badge colors hardcoded (not theme-aware) | Badge component |
| EmptyState icon container uses `bg-gray-100` | EmptyState component |
| DragDropUpload uses `border-purple-400`, `bg-purple-50`, `text-purple-500` | DragDropUpload component |
| Rating stars always `fill-yellow-400 text-yellow-400` | MasterCard, ReviewCard, all rating displays |
| No dark mode — zero `dark:` classes anywhere | Global |
| No ARIA attributes | Global — no `aria-label`, `role`, `aria-live` |

### Low

| Issue | Where |
|-------|-------|
| Two fonts loaded but unused (Playfair Display, Montserrat) | fonts.css |
| Service/time grids are fixed columns (not responsive) | ServiceCard 2-col, TimeSlotGrid 4-col |
| No tablet breakpoint — jumps from mobile to `md:` (768px) desktop | Global |
| Header uses inline `fontFamily` style as workaround | Header, Modal |

---

## 4. Mobile Responsiveness

### What Works

- Client pages are mobile-first (`max-w-md` container)
- AdminLayout has mobile top bar + bottom tab nav + desktop sidebar
- ServiceCard has mobile bottom sheet vs desktop inline toggle
- Modal renders as bottom sheet on mobile, centered dialog on desktop
- Tables have `overflow-x-auto` for horizontal scroll
- Dashboard stat grids: `grid-cols-2 md:grid-cols-4`

### What Doesn't

- Service card grid is always 2 columns (no `sm:` / `lg:` adaptation)
- TimeSlotGrid is always 4 columns (can be tight on small screens)
- No `lg:` or `xl:` breakpoints used — desktop experience is same as tablet
- Admin tables are functional but cramped on mobile (only horizontal scroll, no card view fallback)
- No responsive typography scaling

---

## 5. Dark / Light Theme State

**Current: Light only.** No dark mode implementation exists.

- Zero `dark:` Tailwind classes in the entire codebase
- ThemeContext only sets a single light palette
- No `prefers-color-scheme` detection
- No theme toggle UI anywhere

---

## 6. Typography

**Current scale (from `theme.css`):**

| Element | Size | Weight |
|---------|------|--------|
| h1 | 1.5rem (24px) | 600 |
| h2 | 1.25rem (20px) | 600 |
| h3 | 1.125rem (18px) | 500 |
| h4 | 1rem (16px) | 500 |

**In practice**, pages use Tailwind utility classes that don't match this scale:
- Page titles: `text-2xl font-bold` (32px) — larger than h1
- Section headings: `text-lg font-semibold` (18px) — matches h3
- Body text varies between `text-sm` (14px) and `text-base` (16px) inconsistently

**Font: Inter everywhere** — the only distinctive fonts (Playfair Display, Montserrat) are loaded but never used. The typography is generic and indistinguishable from any other SaaS app.

---

## 7. Animation & Motion

Minimal:
- `transition-colors` on hover (most common)
- `transition-shadow` on card hover
- `animate-spin` on loaders
- `animate-pulse` on skeleton placeholders
- `active:scale-95` on primary button only
- Bottom sheet slide via transform `translate-y`

**Missing:**
- No page transitions
- No stagger/reveal animations
- No scroll-triggered effects
- No entrance animations for modals (instant appear/disappear)
- No loading skeleton for most pages

---

## 8. Concrete Problems to Fix

1. **Unified theme system** — Admin + auth pages must use CSS variables, not hardcoded Tailwind colors
2. **Dark mode** — Add dark palette + `prefers-color-scheme` detection + toggle
3. **Typography identity** — Replace Inter with a distinctive font pair; enforce a real type scale
4. **Component gaps** — No Input component (everyone writes inline), no Select, no Tooltip, no Skeleton component
5. **Selection state colors** — Replace all hardcoded `purple-50`/`purple-600` with semantic tokens (`--color-selection-bg`, `--color-selection-text`)
6. **Form button inconsistency** — Many submit buttons are raw `<button>` with inline Tailwind instead of `<Button>`
7. **Badge not theme-aware** — Colors hardcoded, should use semantic variables
8. **No motion system** — Add entrance animations, modal transitions, page transitions
9. **Accessibility** — Add ARIA labels, focus management, keyboard navigation
10. **Dead font imports** — Remove unused Playfair Display and Montserrat, or actually use them
11. **Responsive gaps** — Service grid and time slot grid need responsive column counts

---

*This report covers Step 1 of the UI Design System prompt. Awaiting confirmation to proceed to Step 2: Build a UI Kit Test Page.*
