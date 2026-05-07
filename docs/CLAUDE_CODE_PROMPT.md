# Claude Code Task: Full Codebase Analysis & Implementation Roadmap

## YOUR MISSION

You are analyzing a **multi-tenant beauty salon booking platform (Bookio/Bookio)** — a hybrid SaaS with subdomain routing per salon. Your job is to:

1. **Read the specification document** (below and attached)
2. **Deeply analyze the entire codebase** — both backend (.NET 8, Clean Architecture) and frontend (React 18, TypeScript, Tailwind)
3. **Cross-reference** what the spec requires vs what exists in code
4. **Produce a single output document** (`IMPLEMENTATION_ROADMAP.md`) with every feature needed, organized by phase, with code locations, complexity estimates, and priority ordering

---

## SOURCE OF TRUTH POLICY (READ THIS FIRST)

### ⚠️ CRITICAL: The code is the ONLY source of truth for what exists today.

**This specification document (everything below) is a PLAN — a desired future state. It is NOT a description of the current project.** Many things described in the spec may not exist in the code at all, may exist partially, or may be implemented differently than the spec suggests.

**You MUST determine the actual current state by reading the code, not by reading this document.**

### How to handle the two sources:

| Question | Where to look |
|----------|--------------|
| "Does feature X exist?" | **READ THE CODE.** Search for it. If it's not in the code, it doesn't exist — regardless of what the spec says. |
| "How is feature X currently implemented?" | **READ THE CODE.** The spec might describe a different approach than what was actually built. |
| "What entities/tables exist?" | **READ the DbContext, entity classes, and migrations.** The spec's entity list is aspirational. |
| "What endpoints are available?" | **READ the controllers.** The spec's API list includes both existing and planned endpoints mixed together. |
| "What should feature X look like when done?" | **READ THE SPEC.** This is where the spec is useful — as a target to aim for. |

### Mismatch Protocol

You WILL find discrepancies between spec and code. For every mismatch:

1. **Document what the CODE actually has** (exact file paths, actual column names, actual behavior)
2. **Document what the SPEC wants** (the desired state)
3. **Classify the mismatch:**
   - **🟡 Spec ahead of code** — feature described in spec but not yet built (most common; becomes an implementation task)
   - **🔵 Code ahead of spec** — code has something the spec doesn't mention (spec needs updating; document it so the spec stays current)
   - **🔴 Approach conflict** — both exist but differ in design (e.g., spec says separate table, code uses JSON column; or spec says one FK structure, code uses another). For these: analyze BOTH approaches, state pros/cons, and recommend which to keep
   - **🟠 Partial implementation** — code has a half-built version of what spec describes (describe exactly what's done vs what remains)

4. **Write ALL mismatches into a dedicated `## Spec vs Code Mismatches` section** in the output document (structure defined below in Step 3).

### What counts as a mismatch (non-exhaustive):
- Entity/table structure differs (columns, relationships, types, nullability)
- Endpoint exists in spec but not in code, or vice versa
- Business logic differs (e.g., spec says "auto-approve if toggle on", code doesn't check the toggle)
- Authorization rules differ (e.g., spec says "salon-scoped", code allows cross-salon access)
- Enum values differ (e.g., spec lists 8 booking statuses, code only has 5)
- Frontend routes/pages exist in spec but not in code, or vice versa
- Naming differs (e.g., spec says `SalonMasterId`, code uses `SalonId` + `MasterId` separately)

---

## STEP 1: Read and understand the full project context

### Business Context

Bookio is a hybrid SaaS for beauty salon bookings. It supports 4 user types with completely different UIs and functionality:

**1. Unauthorized / Guest User:**
- Sees the marketplace (all salons) if no subdomain, or a single salon page if on `{slug}.bookio.ge`
- Can browse salons, masters, services, reviews, galleries
- Can make a booking WITHOUT registering (guest booking) — enters name, phone, email
- Guest booking anti-abuse: max 3 pending bookings per phone, reCAPTCHA v3, phone confirmation code, 15-min cooldown per phone
- Sees booking confirmation with reference number + CTA to register

**2. Registered Client:**
- Registers without admin approval (email/password or Google/Facebook)
- Sees everything guest sees, plus "My Bookings" page (Upcoming / Past tabs)
- Booking detail with cancel option (cancellation policy displayed)
- Profile page: edit name, phone, email, password, photo, notification preferences
- Can leave reviews on completed bookings (one per booking, editable within 48h)
- Booking flow same as guest but pre-filled from profile, linked to UserId

**3. Master (Мастер):**
- Registration: on login page selects "I'm a master" → registers → selects salon → fills profile → goes to **Pending** status → must be activated by salon admin or super admin
- **Strict isolation: Salon A cannot see Salon B's masters in any way**
- After activation, 3 main pages in personal cabinet:
  - **Page 1 — Profile & Settings:** main photo, short description (max 500 chars), portfolio gallery (up to 20 images with drag-drop reorder), services configuration (select from salon's catalog, set personal price + duration), auto-approve toggle, notification preferences
  - **Page 2 — Schedule:** weekly schedule grid (7 days, start/end per day, 30-min increments, "copy Monday to weekdays"), date overrides (calendar view — mark day off or custom hours like 09:00-14:00 instead of 09:00-18:00), time off / vacation (start date, end date, reason; warns if existing confirmed bookings conflict)
  - **Page 3 — Bookings:** tabs (Today, Upcoming, Past, Cancelled), table with client name, service, date, time, price, status. Filters: date range, status, service. Search by client name/phone. Detail page with actions: Pending→Approve/Reject, Confirmed→Complete/Cancel/NoShow. Alternative calendar view (weekly, hourly grid, colored blocks). Empty slot click → create manual booking for walk-in
- Schedule engine (time slots, overrides, exceptions) is already built and working well
- Must support master working in 2+ salons simultaneously

**4. Salon Admin (Administrator/Owner/Bookkeeper):**
- Registration: similar to master — selects "I'm a salon admin" → registers → selects salon → Pending → activated by super admin (or existing salon admin if salon already has one; first admin of new salon = super admin only)
- **Strict isolation: same as master — cannot see other salons' data**
- After activation, navigation: Dashboard, Bookings, Masters, Salon Settings
  - **Dashboard:** metrics cards (total masters active/pending, bookings today/week/month, revenue today/week/month, cancellation rate 30d, avg rating, pending actions count), quick actions (approve pending masters inline, view today's schedule)
  - **Masters page:** table (photo, name, services count, rating, status, reg date), actions: activate/deactivate/view profile, add master (invite by email or manual create), click row → master detail with their schedule and bookings (read-only). Salon admin can override master's schedule in emergency (with audit log)
  - **Bookings page:** same as master's but across ALL masters in salon. Additional column: master name. Additional filter: by master. Same actions as master. Bulk actions: select multiple → bulk cancel
  - **Salon Settings:** basic info (name, slug/subdomain, address, description), location (Google Maps embed, Yandex Maps URL, coordinates), schedule (per-day working hours — masters can only set hours within salon hours), payment configuration (payment model selector: Prepayment 100% / Pre-authorization hold / On-site only / Hybrid; BOG API credentials; cancellation policy: configurable tiers with free/partial/no-refund thresholds), branding (primary color picker, accent color picker, border radius slider, logo upload, photos/videos management with upload/reorder/delete/captions), services (manage which global services are offered at this salon — note: only super admin can create new service types globally)

**5. Super Admin:**
- Designed for maximum operational speed — every entity accessible within 2 clicks, inline editing, bulk actions, keyboard shortcuts
  - **Dashboard:** system health (total salons active/pending/deactivated, total masters, bookings today, revenue today, total users), pending actions queue (pending salon admins, pending masters, pending salon activations — each with 1-click approve/reject), recent activity feed (last 20 actions system-wide)
  - **Salons Management:** table (name, slug, location, masters count, bookings count, rating, status, created date), actions: activate/deactivate/edit/view-as-client (opens subdomain), add salon, click row → full salon detail (same as salon admin sees but editable by super admin), inline editing: double-click cell to edit
  - **Masters Management (Global):** cross-salon view of ALL masters, filter by salon/status/service, actions: activate/deactivate/assign-to-salon/view profile
  - **Bookings Management (Global):** cross-salon, additional filter by salon, for dispute resolution and monitoring
  - **Users Management:** all users, columns: name/email/phone/role(s)/status/created/last-login, actions: activate/deactivate/reset-password/change-role/view-activity, filter by role/salon/status
  - **Services Management (Global Catalog):** ONLY super admin can create new service types (name, description, default photo, category). Service categories management (Hair, Nails, Skin, Makeup, etc.). Services list shows how many salons/masters offer each. Edit propagates system-wide
  - **System Settings:** default cancellation policy, platform commission %, reCAPTCHA config, email templates, notification triggers config

### Payment Flow (Hybrid Model — salon chooses)

Salons choose their payment model:
- **Prepayment 100%:** client pays full amount online during booking via BOG API. If payment fails → booking not created
- **Pre-authorization (hold):** BOG holds the amount on client's card. Captured on completion. Released on free cancellation
- **On-site only:** no online payment, client pays at salon
- **Hybrid:** client chooses between online and on-site at booking time

Cancellation policy (configurable per salon):
- Free cancellation: more than X hours before appointment (default 24h)
- Partial charge: between Y and X hours before (default 12-24h, 50% charge)
- No refund: less than Y hours before (default <12h)

### Booking State Machine

```
Pending → Confirmed (approved by master/admin, or auto-approved)
Pending → Rejected (by master/admin, with reason)
Pending → Cancelled (by client)
Pending → Expired (24h timeout, background job)
Confirmed → InProgress (optional, master starts)
Confirmed → Completed (master/admin marks done)
Confirmed → Cancelled (with cancellation policy applied)
Confirmed → NoShow (by master/admin after appointment time)
InProgress → Completed
```

### Notification Events (MVP — push + email)

| Event | Recipients | Channel |
|-------|-----------|---------|
| Booking created | Master + Salon Admin + Client | Email + Push + InApp |
| Booking confirmed | Client | Email + Push |
| Booking rejected | Client | Email + Push |
| Booking cancelled by client | Master + Salon Admin | Email + Push |
| Booking cancelled by staff | Client | Email + Push |
| Booking completed | Client (+ review request) | Email |
| Reminder 24h before | Client + Master | Push |
| Reminder 1h before | Client + Master | Push |
| Master pending approval | Salon Admin + Super Admin | Email + InApp |
| Master approved/rejected | Master | Email + InApp |
| Salon admin pending | Super Admin | Email + InApp |
| Payment captured | Client | Email |
| Refund processed | Client | Email |

### Background Jobs

| Job | Schedule | Logic |
|-----|----------|-------|
| ExpirePendingBookings | Every 15 min | Pending > 24h → Expired, release pre-auth, notify client |
| SendBookingReminders | Every 15 min | Confirmed within 24h/1h → push if not yet sent |
| CleanupExpiredTokens | Daily 3 AM | Delete revoked/expired RefreshTokens > 30 days |
| RecalculateTimeSlots | Nightly (if pre-computed) | Regenerate for next 30 days |
| GeneratePayoutReports | Weekly | Sum completed booking amounts per master/salon |

### Key Technical Constraints

- Backend: .NET 8, Clean Architecture, CQRS via MediatR, PostgreSQL, EF Core, MinIO (media storage)
- Frontend: React 18, TypeScript, Tailwind CSS, Vite
- Auth: ASP.NET Core Identity + JWT + HttpOnly refresh cookies + Google/Facebook OAuth
- Subdomain routing: `{slug}.bookio.ge` per salon with dynamic theming
- Multi-tenancy: salon-scoped data isolation via SalonMasters junction table
- i18n: Georgian (ka) + Russian (ru)

---

## STEP 2: Analyze the codebase

Do the following **systematically**. Do NOT skip any step.

### 2.1 Backend Analysis

```
# Start with project structure
find . -name "*.csproj" -o -name "*.sln" | head -20
find . -path "*/Controllers/*.cs" | sort
find . -path "*/Entities/*.cs" -o -path "*/Models/*.cs" -o -path "*/Domain/*.cs" | sort
find . -path "*/Migrations/*.cs" | sort | tail -20

# Read DbContext to understand all entities and relationships
find . -name "*DbContext*.cs" | xargs cat

# Read all entity classes
find . -path "*/Entities/*.cs" -exec cat {} \;

# Read all controllers to understand existing endpoints
find . -path "*/Controllers/*.cs" -exec cat {} \;

# Read CQRS handlers if any
find . -path "*/Commands/*.cs" -o -path "*/Queries/*.cs" | head -30

# Read services/business logic
find . -path "*/Services/*.cs" -exec cat {} \;

# Read auth configuration
find . -name "Program.cs" -o -name "Startup.cs" | xargs cat

# Read existing middleware, filters, authorization
find . -name "*Authorization*" -o -name "*Middleware*" -o -name "*Filter*" | grep ".cs" | xargs cat

# Check for background jobs / hosted services
find . -name "*Job*" -o -name "*Worker*" -o -name "*HostedService*" -o -name "*BackgroundService*" | grep ".cs"

# Check existing enums
find . -name "*Enum*" -o -name "*Status*" | grep ".cs" | xargs cat
```

### 2.2 Frontend Analysis

```
# Project structure
find . -path "*/src/*" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | sort

# Read router / route definitions
find . -name "*route*" -o -name "*Router*" | grep -v node_modules | xargs cat

# Read API service / HTTP client layer
find . -path "*/api/*" -o -path "*/services/*" | grep -v node_modules | grep -E "\.(ts|tsx)$" | xargs cat

# Read auth context / hooks
find . -name "*auth*" -o -name "*Auth*" | grep -v node_modules | grep -E "\.(ts|tsx)$" | xargs cat

# Read all page components (top-level views)
find . -path "*/pages/*" -o -path "*/views/*" | grep -v node_modules | grep -E "\.(tsx)$" | sort

# Read store / state management
find . -name "*store*" -o -name "*context*" -o -name "*reducer*" | grep -v node_modules | grep -E "\.(ts|tsx)$" | xargs cat

# Check i18n setup
find . -name "*i18n*" -o -name "*locale*" -o -name "*translation*" | grep -v node_modules

# Check existing component library
find . -path "*/components/*" | grep -v node_modules | grep -E "\.(tsx)$" | sort
```

### 2.3 Cross-Reference Checklist

After reading the code, answer ALL of these questions (write answers into your analysis):

**Database:**
- [ ] Does SalonAdmins junction table exist?
- [ ] Does Payments table exist?
- [ ] Does SalonSchedule (per-day hours) exist?
- [ ] Does MasterGallery exist?
- [ ] Does SalonMedia exist?
- [ ] Does Notifications table exist?
- [ ] Does AuditLog exist?
- [ ] Does ServiceCategories exist?
- [ ] Is Bookings.UserId nullable (for guest bookings)?
- [ ] Is there a SalonMasterId FK on Bookings?
- [ ] Does BookingStatus enum include Rejected, NoShow, Expired?
- [ ] Does Salons have PaymentModel, cancellation policy fields?
- [ ] Is DeletedAt (soft delete) on all major entities?

**Backend Endpoints:**
- [ ] Does salon admin self-registration exist?
- [ ] Do booking reject and no-show endpoints exist?
- [ ] Is there a dedicated MasterPanelController (self-scoped)?
- [ ] Is there a dedicated SalonAdminController (salon-scoped)?
- [ ] Do payment endpoints exist (initiate, callback, capture, refund)?
- [ ] Do notification endpoints exist (list, read, unread-count)?
- [ ] Is there a booking state machine / transition validation?
- [ ] Are there background jobs (expire, remind, cleanup)?
- [ ] Is there salon-scoping middleware for salon admin?

**Frontend:**
- [ ] Does subdomain detection exist?
- [ ] Does dynamic theming from salon config exist?
- [ ] Does the booking flow exist (service → date → slot → form → confirm)?
- [ ] Is there a guest booking form?
- [ ] Is there a master panel with 3 pages (profile, schedule, bookings)?
- [ ] Is there a salon admin panel with dashboard?
- [ ] Is there a super admin panel?
- [ ] Is there i18n setup (ka, ru)?
- [ ] Are there notification bell / push notification components?
- [ ] Is there a payment form / BOG integration on frontend?

---

## STEP 3: Produce the output document

Create a file called `IMPLEMENTATION_ROADMAP.md` in the project root with the following EXACT structure:

```markdown
# Bookio Implementation Roadmap
Generated: {date}
Based on: Codebase analysis + Functional specification

## Executive Summary
{2-3 paragraphs: what % is done, what are the biggest gaps, what's the critical path}

## Codebase State
### Backend
- Project structure: {brief description}
- Entities: {list all entity classes found}
- Controllers: {list all controllers found}
- Missing infrastructure: {what's not there}

### Frontend
- Project structure: {brief description}
- Pages/routes: {list all existing pages}
- Components: {key shared components}
- Missing infrastructure: {what's not there}

## Cross-Reference Results
{Table with all checklist items from Step 2.3, marked ✅ or ❌ with file paths if exists}

---

## Spec vs Code Mismatches

This section lists EVERY discrepancy found between the specification document and the actual codebase.
The codebase is the source of truth for the current state. The spec is the source of truth for the desired state.

### 🔴 Approach Conflicts (code and spec both exist but disagree)

| # | Area | Code has (file path) | Spec wants | Analysis | Recommendation |
|---|------|---------------------|-----------|----------|----------------|
| AC-1 | {e.g. Booking FK} | {e.g. Separate SalonId+MasterId in `Entities/Booking.cs:L15-16`} | {e.g. Single SalonMasterId FK} | {Pros/cons of each} | {Which to keep and why} |

### 🟡 Spec Ahead of Code (feature planned but not yet built)

| # | Area | What spec describes | Closest code equivalent | Gap description |
|---|------|--------------------|-----------------------|-----------------|
| SA-1 | {e.g. Payments} | {e.g. Full BOG payment integration with Payments table} | {e.g. No payment code exists at all} | {What needs to be built} |

### 🔵 Code Ahead of Spec (code has things spec doesn't mention)

| # | Area | What code has (file path) | Not in spec? | Action needed |
|---|------|--------------------------|-------------|---------------|
| CA-1 | {e.g. DevSeed controller} | {e.g. `Controllers/DevSeedController.cs` — POST/DELETE /api/dev/seed} | {Spec doesn't mention seeding} | {Update spec / keep as-is} |

### 🟠 Partial Implementations (half-built features)

| # | Area | What's done (file paths) | What remains | % Complete |
|---|------|-------------------------|-------------|-----------|
| PI-1 | {e.g. Booking statuses} | {e.g. Confirm/Complete/Cancel exist in `BookingsController.cs`} | {Reject, NoShow, Expired missing} | {~60%} |

---

## Implementation Phases

### Phase 1: Database & Domain Foundation (Priority: CRITICAL)
{Features that everything else depends on}

#### Feature 1.1: {Feature Name}
- **What:** {1-2 sentence description}
- **Why now:** {dependency explanation}
- **Backend files to create/modify:**
  - `path/to/file.cs` — {what to change}
  - `path/to/new/file.cs` — {what to create}
- **Frontend files to create/modify:** N/A or list
- **Estimated complexity:** S / M / L / XL
  - S = < 2 hours, single file change
  - M = 2-8 hours, 2-5 files
  - L = 1-3 days, 5-15 files, new feature area
  - XL = 3-5 days, 15+ files, cross-cutting concern
- **Depends on:** nothing / Feature X.Y
- **Acceptance criteria:**
  - {Testable criterion 1}
  - {Testable criterion 2}

#### Feature 1.2: ...

### Phase 2: Core Business Logic (Priority: HIGH)
{State machine, payment integration, auth flows}

### Phase 3: Panel APIs (Priority: HIGH)
{Master panel, salon admin panel endpoints}

### Phase 4: Notifications & Background Jobs (Priority: MEDIUM)

### Phase 5: Frontend — Public & Client (Priority: HIGH)
{Marketplace, salon detail, booking flow, client dashboard}

### Phase 6: Frontend — Master Panel (Priority: HIGH)

### Phase 7: Frontend — Salon Admin Panel (Priority: MEDIUM)

### Phase 8: Frontend — Super Admin Panel (Priority: MEDIUM)

### Phase 9: Polish & Production Readiness (Priority: LOW)
{Audit log, service categories, advanced analytics, performance optimization}

---

## Priority Matrix (Quick Reference)

| # | Feature | Phase | Complexity | Depends On | Status |
|---|---------|-------|-----------|------------|--------|
| 1.1 | {name} | 1 | M | — | ❌ Not started |
| 1.2 | {name} | 1 | L | 1.1 | ❌ Not started |
| ... | ... | ... | ... | ... | ... |

## Dependency Graph

{Mermaid diagram or text description showing which features block which}

## Estimated Timeline

| Phase | Features | Est. Total | Can parallelize? |
|-------|----------|-----------|-----------------|
| 1 | X features | ~Y days | Backend only |
| 2 | X features | ~Y days | Backend only |
| ... | ... | ... | ... |
```

---

## CRITICAL RULES

1. **The codebase is the source of truth, NOT this document.** This spec describes a desired/future state. Never assume something exists because the spec mentions it. Always verify by reading the actual code. If the spec says "Payments table exists" but you don't find it in DbContext or migrations — it doesn't exist, period. Every claim about "what's built" in your output must reference an actual file path you read.

2. **Read ALL code first, then write.** Do not start writing IMPLEMENTATION_ROADMAP.md until you have read every entity, every controller, every page component, every route.

3. **Be specific about file paths.** Don't say "update the booking service" — say `src/Application/Bookings/Commands/CreateBookingCommand.cs` (use actual paths from the codebase).

4. **Don't invent code that might exist.** If you're unsure whether something exists, search for it before marking it as missing.

5. **Every feature must have acceptance criteria** that can be tested without reading the feature description.

6. **Complexity estimates must account for tests.** An "M" feature with tests might be "L" without them.

7. **The document must be self-contained** — someone reading only IMPLEMENTATION_ROADMAP.md should understand the full picture without needing to read this prompt.

8. **Include BOTH backend and frontend work** in each feature where applicable. A feature like "Master Panel Bookings" includes backend endpoint + frontend page.

9. **Group by phase, order by priority within phase.** Within each phase, features should be ordered so that dependencies come first.

10. **Mark features that are partially done.** If 60% of a feature exists, say so and describe only the remaining work.

11. **Write the document in English** — it will be used as technical reference for Claude Code implementation tasks.

12. **The Spec vs Code Mismatches section is MANDATORY.** Even if you find zero approach conflicts, explicitly state "No approach conflicts found." Do not skip this section. Every mismatch you discover during analysis MUST be logged here — this is how the developer tracks drift between plan and reality.
