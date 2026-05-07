# Bookio — Audit Issues

Combined findings from the API Compatibility Audit and UX Audit.
Date: 2026-04-21 · Branch: `develop`

---

## Part 1 — API Compatibility Audit

### Summary

| Metric | Count |
|---|---|
| Frontend API call sites (axios functions) | ~95 |
| Unique backend endpoints exercised | ~80 |
| ❌ Critical mismatches (404 / wrong method / missing required field) | 0 |
| ⚠️ Warnings (extra fields, partial usage, response-shape risks) | 4 |
| 🟦 Backend endpoints never called from frontend | 3 (+ dev-only) |

Overall parity is very high — `frontend/src/types/index.ts` is kept in lockstep with backend DTOs, and every axios module maps 1:1 to a controller.

### Warnings

#### API-W1 — No consumer for `GET /api/salons/{id}/services`
- **Backend**: `SalonsController` exposes `GET /api/salons/{id}/services` (aggregated service catalog for a salon).
- **Frontend**: Never called. `BookingFlowPage` resolves services per-master via `GET /api/masters/{masterId}/services`.
- **Action**: Either wire it into `SalonDetailsPage` (useful to preview a salon's full catalog to guests) or delete the endpoint.

#### API-W2 — OAuth redirect endpoints unused
- **Backend**: `GET /api/auth/google/start`, `/google/callback`, `/facebook/start`, `/facebook/callback`.
- **Frontend**: Not in any `src/api/*.ts`. `LoginPage` uses `GoogleLogin` (id_token flow) and `window.FB.login` (access_token flow).
- **Action**: Reachable only via `window.location = '/api/auth/google/start'`. Decide whether to keep both flows or drop the redirect variant.

#### API-W3 — Redundant bookings endpoints
- `GET /api/salons/{salonId}/bookings` and `/api/salon-admin/bookings` return similar data with slightly different DTOs.
- **Action**: Pick a single source of truth to reduce drift risk.

#### API-W4 — Dead `registerSalonAdmin` variant
- `auth.ts` exposes both `registerSalonAdminWithSalon` and `registerSalonAdmin`. Only one is wired into `RegisterPage.tsx`; the other is dead.
- **Action**: Delete the unused variant.

### Unused Backend Endpoints

| Method | Path | Status | Recommendation |
|---|---|---|---|
| GET | `/api/salons/{id}/services` | unused | Wire into salon landing or delete |
| GET | `/api/auth/google/start` + `/callback` | unused (token flow used instead) | Keep OR drop redirect flow |
| GET | `/api/auth/facebook/start` + `/callback` | unused | Keep OR drop |
| POST/DELETE | `/api/dev/seed` | dev-only, environment-gated | Expected — keep |

### Full Endpoint Map (condensed)

| Area | BE route | FE caller | Status |
|---|---|---|---|
| Auth | POST `/api/auth/login` | `auth.login` | ✅ |
| Auth | POST `/api/auth/register` | `auth.register` | ✅ |
| Auth | POST `/api/auth/google` | `auth.loginWithGoogle(credential)` | ✅ |
| Auth | POST `/api/auth/facebook` | `auth.loginWithFacebook` | ✅ |
| Auth | POST `/api/auth/refresh` | `client.ts` 401 interceptor + `auth.refreshSession` | ✅ |
| Auth | POST `/api/auth/logout` | `auth.logout` | ✅ |
| Auth | GET `/api/auth/me` | `auth.getMe` | ✅ |
| Auth | POST `/api/auth/change-password` | `auth.changePassword` | ✅ |
| Auth | POST `/api/auth/forgot-password` | `auth.forgotPassword` | ✅ |
| Auth | POST `/api/auth/reset-password` | `auth.resetPassword` | ✅ |
| Auth | POST `/api/auth/master/{google\|facebook\|email}` | `auth.registerMaster*` | ✅ |
| Auth | POST `/api/auth/salon-admin/*` | `auth.registerSalonAdmin*` | ⚠️ one variant unused |
| Admin users | GET/POST/PATCH/DELETE `/api/admin/users` | `auth.getAdminUsers/...` | ✅ |
| Salons | GET/POST/PUT/DELETE `/api/salons[/:id]` | `salons.*` | ✅ |
| Salons | GET `/api/salons/by-slug/{slug}` | `salons.getSalonBySlug` | ✅ |
| Salons | GET `/api/salons/:id/services` | — | 🟦 unused |
| Salons | GET/POST/DELETE `/api/salons/:id/masters` | `salons.getSalonMasters`, `linkMaster`, `unlinkMaster` | ✅ |
| Masters | GET/POST/PUT/DELETE `/api/masters[/:id]` | `masters.*` | ✅ |
| Masters | GET `/api/masters/:id/salons` | `masters.getMasterSalons` | ✅ |
| MasterServices | GET/POST/PUT/DELETE `/api/masters/:id/services` | `masters.*` | ✅ |
| Services | GET/POST/PUT/DELETE `/api/services[/:id]` | `services.*` | ✅ |
| Ratings | POST/GET `/api/masters/:id/ratings`, DELETE `/api/ratings/:id` | `ratings.*`, `masters.getMasterRatings` | ✅ |
| TimeSlots | GET `/api/salons/:sid/masters/:mid/slots` | `timeslots.getAvailableSlots` | ✅ |
| Availability | all routes in `AvailabilityController` | `availability.*` | ✅ |
| Bookings | POST/GET/confirm/complete/cancel `/api/bookings` | `bookings.*` | ✅ |
| Bookings | GET `/api/salons/:sid/bookings` + `/api/masters/:mid/bookings` | `bookings.getSalonBookings`, `getMasterBookings` | ✅ |
| Media | POST/GET/DELETE `/api/media` | `media.*` | ✅ |
| Salon admin | `/api/salon-admin/*` | `salonAdmin.*` | ✅ |

---

## Part 2 — UX Audit

### Executive Summary

**UX maturity**: Solid foundation (role-guarded routing, toast feedback, theming, i18n), but the app leans on browser-native `confirm()` dialogs and has a few hardcoded English strings that break the i18n contract. Guest booking flow lacks a progress indicator. Admin pages are dense and sometimes skip pre-deletion context.

**Top 3 critical issues**
1. Native `confirm()` used for all destructive actions across admin — inconsistent with the rest of the UI, unthemable, untranslatable.
2. Guest booking (`BookingFlowPage`) has a 3-step flow with no step indicator — users can't see where they are.
3. i18n leaks: `ForgotPasswordPage` has hardcoded English strings.

### Flow Analysis by Role

#### Guest
Flow: `HomePage` → `SalonDetailsPage` → `MasterProfilePage` → `BookingFlowPage` (3 steps) → `BookingConfirmationPage`.

| ID | Issue | Priority |
|---|---|---|
| G-1 | `HomePage` has no search/filter/category — flat grid of all salons. Scales poorly past ~20. | HIGH |
| G-2 | `BookingFlowPage` 3 steps lack a progress indicator. `MasterRegisterPage.tsx:217-234` already has the pattern. | HIGH |
| G-3 | `BookingConfirmationPage` has no "back to salon" CTA — only "my bookings". | MEDIUM |
| G-4 | Unauthenticated users at `BookingFlowPage` are redirected without a "save-intent" bookmark — slot is lost after login. | MEDIUM |
| G-5 | `SalonDetailsPage` does not surface master ratings inline — must click each master. | LOW |

#### Registered Client
Adds `MyBookingsPage` and `ViewBookingPage`.

| ID | Issue | Priority |
|---|---|---|
| C-1 | `ViewBookingPage.tsx:83` uses native `confirm()` to cancel. No reason field, no confirmation modal, no calendar export. | HIGH |
| C-2 | `MyBookingsPage` does not segment past vs upcoming — both in one list. | MEDIUM |
| C-3 | No "leave a rating" CTA on completed bookings in `MyBookingsPage`. | MEDIUM |
| C-4 | Password change and profile edit live under `/admin/*` (via `UserDetailPage`) — no client-facing settings page. | HIGH |

#### Master (MasterAdmin role)

| ID | Issue | Priority |
|---|---|---|
| M-1 | No dedicated master dashboard — existing layout is salon-admin-centric. Masters see nav items they cannot use. | HIGH |
| M-2 | Availability page: `AvailabilityPage.tsx:407` shadows the `t` translation function inside a map (future-edit risk). | LOW |
| M-3 | Master social registration tells users "pending activation" but gives no status page / email link. | MEDIUM |
| M-4 | `ForceChangePasswordPage` on first login does not explain why a change is required. | LOW |

#### Salon Admin
Pages: `SalonAdminDashboardPage`, `SalonAdminBookingsPage`, `SalonAdminMastersPage`.

| ID | Issue | Priority |
|---|---|---|
| S-1 | `SalonAdminBookingsPage.tsx:92,199` uses native `confirm()` for single + bulk cancel. Bulk cancel has no "affected customers" summary. | HIGH |
| S-2 | `SalonAdminMastersPage.tsx:117` — unlink-master uses native `confirm()`; no warning about pending bookings. | HIGH |
| S-3 | `SalonAdminDashboardPage` does not highlight today's bookings vs overall counters. | MEDIUM |
| S-4 | No CSV export from bookings list. | LOW |

#### Super Admin
Pages: `SalonsPage`, `MastersPage`, `ServicesPage`, `UsersPage`, `UserDetailPage`, `BookingsAdminPage`.

| ID | Issue | Priority |
|---|---|---|
| SA-1 | All delete/deactivate actions use `confirm()`: `SalonsPage.tsx:29`, `MastersPage.tsx:41`, `ServicesPage.tsx:72`, `UsersPage.tsx:106,209`, `BookingDetailAdminPage.tsx:132`. | HIGH |
| SA-2 | `UsersPage` create-account modal mixes "Create Master" and "Create SalonAdmin" with conditional fields — easy to submit wrong role. | MEDIUM |
| SA-3 | `UserDetailPage` role-change dropdown has no "are you sure" when demoting self — lockout risk. | HIGH |
| SA-4 | `BookingsAdminPage` filters URL-persisted via query params but state is not hydrated on back navigation. | MEDIUM |
| SA-5 | `SalonFormPage` / `MasterFormPage` — long single-column forms, no section headers, no "unsaved changes" guard. | MEDIUM |

### Critical Issues Detail

#### CI-1: Native `confirm()` everywhere — replace with themed modal
- **Where**: 10+ sites across admin + client (see S-1/S-2, C-1, SA-1).
- **Problem**: Breaks theming, not styleable, not translatable, blocks the main thread, bad mobile UX.
- **Fix**: Add `ConfirmDialog` primitive in `frontend/src/components/ui/` (headless, theme-variable styled). Replace every `window.confirm` call.
- **Priority**: HIGH

#### CI-2: i18n leaks in `ForgotPasswordPage`
- **Where**: `frontend/src/pages/auth/ForgotPasswordPage.tsx:69-76` — button labels and helper text in English only.
- **Problem**: KA/RU users see English. Other auth pages use `t('auth.forgot.*')`.
- **Fix**: Move strings into `i18n/locales/{en,ka,ru}.json` under `auth.forgot.*`.
- **Priority**: HIGH

#### CI-3: Missing step indicator in booking flow
- **Where**: `BookingFlowPage.tsx` (3 steps).
- **Problem**: No way to see progress or jump back a step; users hit browser-back and lose selections.
- **Fix**: Reuse the progress component from `MasterRegisterPage.tsx:217-234`. Add step headers.
- **Priority**: HIGH

#### CI-4: No self-service client settings
- **Where**: Profile edit, password change only reachable via `/admin/users/:id` (admin-only path).
- **Fix**: Add `/settings` route with the same tabbed layout as `UserDetailPage` but scoped to the current user.
- **Priority**: HIGH

#### CI-5: Master dashboard missing
- **Problem**: `MasterAdmin` role sees a dashboard designed for salon admins.
- **Fix**: Split dashboard templates by role in `AdminDashboardSwitch`. Master view shows today's bookings, availability shortcut, ratings.
- **Priority**: HIGH

### Improvement Suggestions Summary

| # | Area | Suggestion | Priority |
|---|---|---|---|
| 1 | Destructive actions | Replace all `confirm()` with themed `ConfirmDialog` | HIGH |
| 2 | i18n | Externalize ForgotPasswordPage strings | HIGH |
| 3 | Guest booking | Step indicator + remember-intent after login | HIGH |
| 4 | Client | Add `/settings` page | HIGH |
| 5 | Master | Dedicated master dashboard | HIGH |
| 6 | Home | Search / category filter | HIGH |
| 7 | SuperAdmin | Prevent self-demotion without double confirm | HIGH |
| 8 | Bookings | Segment past vs upcoming in `MyBookingsPage` | MEDIUM |
| 9 | Confirmation | "Back to salon" CTA on `BookingConfirmationPage` | MEDIUM |
| 10 | Admin forms | Section headers + unsaved-changes guard | MEDIUM |
| 11 | Dashboard | Today's bookings card on SalonAdmin dashboard | MEDIUM |
| 12 | Bulk cancel | Show affected-customer summary | MEDIUM |
| 13 | Unlink master | Warn about pending bookings | MEDIUM |
| 14 | Master onboarding | Pending-activation status page | MEDIUM |
| 15 | Availability page | Rename inner `t` variable to avoid i18n shadow | LOW |
| 16 | Bookings admin | CSV export | LOW |
| 17 | Salon detail | Show master ratings inline | LOW |
| 18 | Force password | Explain reason on `ForceChangePasswordPage` | LOW |
