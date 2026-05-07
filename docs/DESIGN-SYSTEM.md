# Bookio — Design System

## Fonts

| Role | Font | Source |
|------|------|--------|
| Headings | **Fraunces** (serif, optical size) | Google Fonts |
| Body | **Outfit** (sans-serif) | Google Fonts |

Loaded in `frontend/src/styles/fonts.css`.

CSS variables: `--font-heading`, `--font-body`.

## Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 0.75rem (12px) | Captions, tertiary labels |
| `--text-sm` | 0.875rem (14px) | Body small, badges, secondary text |
| `--text-base` | 1rem (16px) | Body text, buttons |
| `--text-lg` | 1.125rem (18px) | h4, section headings |
| `--text-xl` | 1.25rem (20px) | h3, card titles |
| `--text-2xl` | 1.5rem (24px) | h2, page titles |
| `--text-3xl` | 2rem (32px) | h1, hero headings |

## Color Tokens

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FAF8F5` | Page background |
| `--color-bg-subtle` | `#F3EFE9` | Subtle backgrounds, skeletons |
| `--color-surface` | `#FFFFFF` | Cards, modals, inputs |
| `--color-surface-raised` | `#FFFFFF` | Elevated surfaces |
| `--color-text` | `#1A1614` | Primary text |
| `--color-text-secondary` | `#6E6259` | Secondary text, descriptions |
| `--color-text-tertiary` | `#A69B90` | Placeholders, hints |
| `--color-text-inverse` | `#FAF8F5` | Text on dark backgrounds |
| `--color-border` | `#E8E2DA` | Default borders |
| `--color-border-strong` | `#D1C8BD` | Emphasized borders |
| `--color-divider` | `#F0EBE4` | Subtle dividers |
| `--color-primary` | `#B8623A` | Primary actions, links (terracotta) |
| `--color-primary-hover` | `#9E5230` | Primary hover state |
| `--color-primary-active` | `#874626` | Primary pressed state |
| `--color-primary-subtle` | `#FBF0E8` | Primary tint backgrounds |
| `--color-primary-text` | `#FFFFFF` | Text on primary color |
| `--color-accent` | `#2D6A5A` | Secondary accent (sage green) |
| `--color-accent-hover` | `#245748` | Accent hover |
| `--color-accent-subtle` | `#E8F3EF` | Accent tint background |
| `--color-success` | `#3B8C6E` | Success states |
| `--color-warning` | `#C4862E` | Warning states |
| `--color-error` | `#C44B3F` | Error states |
| `--color-info` | `#4A7FB5` | Informational states |

Each semantic color also has `-subtle` (background tint) and `-text` (high-contrast text) variants.

### Dark Theme

Applied via `data-theme="dark"` on `<html>`. Each token has a carefully chosen dark equivalent — not a simple inversion.

| Token | Value |
|-------|-------|
| `--color-bg` | `#111010` |
| `--color-surface` | `#1E1C19` |
| `--color-primary` | `#D88B5A` |
| `--color-accent` | `#4DB89A` |
| `--color-text` | `#EDEBE7` |

(Full dark palette in `frontend/src/styles/theme.css`)

## Spacing

Uses Tailwind's default spacing scale (0.25rem increments). CSS variables exposed for components:

`--space-1` through `--space-8` (0.25rem – 2rem).

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements, badges |
| `--radius-md` | 10px | Buttons, inputs, cards |
| `--radius-lg` | 14px | Cards, panels |
| `--radius-xl` | 20px | Modals, large cards |
| `--radius-full` | 9999px | Pills, avatars |

## Shadows

| Token | Usage |
|-------|-------|
| `--shadow-xs` | Subtle elevation |
| `--shadow-sm` | Cards at rest |
| `--shadow-md` | Cards on hover |
| `--shadow-lg` | Dropdowns, popovers |
| `--shadow-xl` | Modals |

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Hover states |
| `--duration-normal` | 250ms | Most transitions |
| `--duration-slow` | 400ms | Theme switch, page transitions |
| `--ease-out` | cubic-bezier(0.22, 1, 0.36, 1) | Default easing |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy animations |

## Dark Mode

- Controlled via `data-theme` attribute on `<html>`
- `ThemeProvider` in `contexts/ThemeContext.tsx` manages state
- Respects `prefers-color-scheme` by default (system mode)
- User preference stored in `localStorage` key `bookio-theme-mode`
- Three modes: `light`, `dark`, `system`
- `useTheme()` exposes `isDark`, `toggleDark()`, `setThemeMode()`

## Component Library (`src/components/ui/`)

| Component | Props | Notes |
|-----------|-------|-------|
| **Button** | `variant`: primary/secondary/outline/ghost/danger; `size`: sm/md/lg; `loading`, `fullWidth` | All variants theme-aware |
| **Badge** | `variant`: default/success/warning/error/info | Uses semantic color tokens |
| **FormField** | `label`, `value`, `onChange`, `type`, `error`, `disabled` | Unified styling (no admin/client split) |
| **Modal** | `open`, `onClose`, `title` | Backdrop blur, slide-up animation, bottom sheet on mobile |
| **Loader** | `className` | Also `PageLoader` for full-screen |
| **EmptyState** | `icon`, `title`, `description`, `action` | Theme-aware backgrounds |
| **InfoRow** | `icon`, `value`, `label` | Simple and detailed modes |
| **DragDropUpload** | `folder`, `accept`, `maxFiles`, `values`, `onChange` | Theme-aware drag state |

### Usage Rules

1. **Always use CSS variables** — never hardcode colors like `gray-500` or `purple-600`
2. **Use `var(--font-heading)` for headings** — apply via `style={{ fontFamily: 'var(--font-heading)' }}` or the `font-family` in `theme.css`
3. **Use semantic color tokens** — `--color-success`, `--color-error`, etc. instead of `green-*`, `red-*`
4. **Selection states** use `--color-selection` and `--color-selection-border`
5. **Hover backgrounds** use `--color-hover` (translucent overlay)
6. **Border radius** via tokens: `rounded-[var(--radius-md)]` etc.
7. **Shadows** via tokens: `shadow-[var(--shadow-sm)]` etc.
