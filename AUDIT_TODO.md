# BookVisit — Audit TODO Plan

Actionable plan derived from [AUDIT_ISSUES.md](./AUDIT_ISSUES.md).
Date: 2026-04-21 · Branch: `develop`

Legend: **S** = small (≤ ½ day), **M** = medium (1–2 days), **L** = large (3+ days).
Each task lists: effort · touched layers · related issue IDs.

---

## Phase 0 — Quick Wins (< 1 day total)

Low-risk, isolated fixes. Ship in a single PR.

- [ ] **Q0.1** Externalize `ForgotPasswordPage` strings to `i18n/locales/{en,ka,ru}.json` under `auth.forgot.*`. — **S** · FE · CI-2
- [ ] **Q0.2** Rename the inner `t` variable shadowing in `AvailabilityPage.tsx:407` (e.g. `timeoff` or `entry`). — **S** · FE · M-2
- [ ] **Q0.3** Delete the dead `registerSalonAdmin` variant from `frontend/src/api/auth.ts` (keep the one RegisterPage uses). — **S** · FE · API-W4
- [ ] **Q0.4** Add "Back to salon" CTA to `BookingConfirmationPage`. — **S** · FE · G-3
- [ ] **Q0.5** Explain reason copy on `ForceChangePasswordPage` (first-login vs admin-reset). — **S** · FE · M-4

**Exit**: PR green, all three locales verified, regression smoke on booking flow.

---

## Phase 1 — Foundation: `ConfirmDialog` primitive

Blocks most other HIGH fixes. Do first.

- [ ] **P1.1** Create `frontend/src/components/ui/ConfirmDialog.tsx`:
  - Headless component; renders via portal
  - Props: `open, title, description, confirmLabel, cancelLabel, tone ('danger' | 'primary'), onConfirm, onCancel`
  - Theme-variable styled (reuse `--color-primary`, `--color-danger`)
  - Keyboard: Esc cancels, Enter confirms; focus trap; autofocus cancel on `tone='danger'`
  - i18n: fallback labels `t('common.confirm')`, `t('common.cancel')`
  - **M** · FE · CI-1
- [ ] **P1.2** Add hook `useConfirm()` returning `confirm(options) => Promise<boolean>`. — **S** · FE · CI-1
- [ ] **P1.3** Add i18n keys `common.confirm`, `common.cancel`, `common.delete`, `common.unlink`. — **S** · FE · CI-1
- [ ] **P1.4** Replace `window.confirm` calls in **client-facing** pages:
  - `ViewBookingPage.tsx:83` — cancel booking (+ add optional reason textarea). — C-1
  - **S** · FE
- [ ] **P1.5** Replace `window.confirm` calls in **admin** pages:
  - `SalonsPage.tsx:29`
  - `MastersPage.tsx:41`
  - `ServicesPage.tsx:72`
  - `UsersPage.tsx:106` and `:209`
  - `BookingDetailAdminPage.tsx:132`
  - `SalonAdminBookingsPage.tsx:92` (single cancel)
  - `SalonAdminBookingsPage.tsx:199` (bulk cancel — show count + first few client names)
  - `SalonAdminMastersPage.tsx:117` (unlink master — warn if pending bookings exist)
  - **M** · FE · SA-1, S-1, S-2, C-1
- [ ] **P1.6** Add frontend tests for `ConfirmDialog` (open/close, Enter/Esc, onConfirm callback). — **S** · FE tests

**Exit**: Zero `window.confirm` in `frontend/src/` (grep check in CI), all affected flows manually verified in browser.

---

## Phase 2 — Guest Booking UX

Improves conversion funnel.

- [ ] **P2.1** Extract the step indicator from `MasterRegisterPage.tsx:217-234` into `components/ui/StepIndicator.tsx`. — **S** · FE · CI-3
- [ ] **P2.2** Integrate `StepIndicator` into `BookingFlowPage.tsx`; show "1. Time → 2. Services → 3. Confirm". — **S** · FE · G-2, CI-3
- [ ] **P2.3** Preserve booking selection on auth redirect:
  - Persist `{ salonId, masterId, date, serviceIds }` into `sessionStorage` before redirecting to `/login`
  - On post-login restore, hydrate `BookingContext` and land back at step 3
  - **M** · FE · G-4
- [ ] **P2.4** Add search + category filter to `HomePage`:
  - Text search (salon name, city)
  - Category dropdown (services, etc.)
  - Debounced client-side filter (MVP); server-side filter only if list grows past ~50
  - **M** · FE · G-1

**Exit**: Playwright E2E: guest books → gets redirected to login → logs in → lands at confirm with prior selections intact.

---

## Phase 3 — Self-Service Client Settings

- [ ] **P3.1** Create `/settings` route in `App.tsx` (authenticated, any role). — **S** · FE · CI-4
- [ ] **P3.2** Extract reusable `AccountForm` + `PasswordForm` from `UserDetailPage.tsx` (currently admin-only) into `components/user/`. — **M** · FE · CI-4
- [ ] **P3.3** `SettingsPage.tsx` with tabs: Account, Password, Notifications (stub). Uses current `useAuth().user`. — **M** · FE · CI-4
- [ ] **P3.4** Add "Settings" link in the client user menu (header dropdown / mobile drawer). — **S** · FE
- [ ] **P3.5** Verify BE endpoints used by settings page (`GET /api/auth/me`, `POST /api/auth/change-password`, `PATCH /api/admin/users/:id` — or scope a self-update endpoint if needed). — **S** · BE verification

**Exit**: Client logs in, edits profile, changes password, logs back in — no admin path used.

---

## Phase 4 — Master Dashboard Split

- [ ] **P4.1** Audit `AdminDashboardSwitch` role branches. Document current behaviour. — **S** · FE · M-1
- [ ] **P4.2** Create `MasterDashboardPage.tsx`:
  - Today's bookings (from `GET /api/masters/:id/bookings?date=today`)
  - Upcoming bookings (next 7 days)
  - Availability shortcut → `/admin/availability`
  - Latest ratings (from `GET /api/masters/:id/ratings`)
  - **M** · FE · M-1, CI-5
- [ ] **P4.3** Filter admin sidebar items by role in `AdminLayout` so Masters see only: Dashboard, My Availability, My Bookings, My Services, Settings. — **M** · FE · M-1
- [ ] **P4.4** Pending-activation status page for masters awaiting SuperAdmin approval (post social registration). — **S** · FE · M-3
- [ ] **P4.5** BE: SuperAdmin activation endpoint for pending masters (if not present). — **M** · BE · M-3
  - Add unit + integration tests per project rule

**Exit**: Master logs in → lands on master dashboard, no salon-admin nav visible.

---

## Phase 5 — SuperAdmin Hardening

- [ ] **P5.1** Self-demotion guard on `UserDetailPage` role dropdown:
  - If target user === current user AND new role !== `SuperAdmin`, require double-confirm with typed username
  - **S** · FE · SA-3
- [ ] **P5.2** BE: reject self-demotion server-side as defence-in-depth in `AdminUsersController`. — **S** · BE · SA-3
  - Add tests covering self-demotion rejection
- [ ] **P5.3** Split create-account modal in `UsersPage` into two entry points ("Create Master" and "Create Salon Admin") with separate, non-conditional forms. — **M** · FE · SA-2
- [ ] **P5.4** Hydrate `BookingsAdminPage` filters from query params on mount + back navigation. — **S** · FE · SA-4

**Exit**: Integration tests for self-demotion, manual QA of create-account flows for both roles.

---

## Phase 6 — Polish

- [ ] **P6.1** Segment `MyBookingsPage` into Upcoming / Past tabs (or collapsed "Past" section). — **S** · FE · C-2
- [ ] **P6.2** Add "Leave a rating" CTA on completed bookings in `MyBookingsPage`. — **S** · FE · C-3
- [ ] **P6.3** Inline master ratings (avg + count) on `SalonDetailsPage` master cards. — **S** · FE · G-5
- [ ] **P6.4** Section headers in `SalonFormPage` + `MasterFormPage`; `useBeforeUnload` / router block for unsaved-changes warning. — **M** · FE · SA-5
- [ ] **P6.5** "Today's bookings" card on `SalonAdminDashboardPage`. — **S** · FE · S-3
- [ ] **P6.6** CSV export from `BookingsAdminPage` (client-side CSV build, no BE change). — **S** · FE · S-4

---

## Phase 7 — API Surface Cleanup (defer until product decides)

- [ ] **P7.1** Decide on `GET /api/salons/:id/services` — wire into `SalonDetailsPage` *or* remove endpoint + tests. — **S/M** · both · API-W1
- [ ] **P7.2** Decide OAuth flow (popup token vs redirect) — keep one, remove the other set of endpoints + update `LoginPage`. — **M** · both · API-W2
- [ ] **P7.3** Consolidate bookings list endpoints (admin vs salon-admin). — **M** · both · API-W3

**Exit**: No unused endpoints in `SalonsController` or `AuthController` redirect pair.

---

## Testing & Release Rules (from CLAUDE.md)

For every phase:
- Rerun **full test suite** after each change; confirm passes before PR.
- New backend functionality → unit + integration tests.
- Non-trivial frontend logic → frontend tests.
- Never skip / comment out failing tests.
- Stage only changed files (no `git add -A`).
- Push to `develop` only, one PR per phase.
- Ask before committing / pushing.

---

## Suggested PR order

1. Phase 0 (quick wins) — one PR
2. Phase 1 (ConfirmDialog + all migrations) — one PR, foundation
3. Phase 2 (booking UX) — one PR
4. Phase 3 (client settings) — one PR
5. Phase 4 (master dashboard) — one PR (may split FE/BE)
6. Phase 5 (superadmin hardening) — one PR
7. Phase 6 (polish) — batch small items into one PR
8. Phase 7 (API cleanup) — only after product sign-off

---

## Status Tracking

Update the checkboxes above as items complete.
On PR merge, move finished items to a collapsed "Done" section at the bottom with PR links, so this file stays current without losing history.
