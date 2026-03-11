# BookVisit — Backend Conventions

## Stack
- .NET 8 / ASP.NET Core / EF Core **8.0.11** (all EF packages pinned to this version)
- PostgreSQL via Npgsql
- ASP.NET Core Identity + JWT auth
- FluentValidation, Serilog, Swashbuckle

## Solution Structure
```
src/
├── BeautySalonBooking.API/            # Controllers, middleware, Program.cs
├── BeautySalonBooking.Application/    # DTOs, interfaces, validators
├── BeautySalonBooking.Domain/         # Entities, enums — zero dependencies
└── BeautySalonBooking.Infrastructure/ # EF Core, migrations, services, MinIO, Identity
tests/
└── BeautySalonBooking.Tests/          # Unit + integration tests
```

- Services live in `Infrastructure/ApplicationServices/` — NOT Application (avoids circular deps)
- `public partial class Program {}` in `ProgramAccessor.cs` — required for WebApplicationFactory in tests

## Key Files
| File | Purpose |
|---|---|
| `BeautySalonBooking.Infrastructure/Persistence/AppDbContext.cs` | EF DbContext |
| `BeautySalonBooking.Infrastructure/Entities/AppUser.cs` | Identity user + custom fields |
| `BeautySalonBooking.Infrastructure/Entities/RefreshToken.cs` | 7-day rotating refresh tokens |
| `BeautySalonBooking.Infrastructure/ApplicationServices/AuthService.cs` | All auth logic |
| `BeautySalonBooking.API/Controllers/AuthController.cs` | Auth endpoints |
| `BeautySalonBooking.API/Controllers/AdminUsersController.cs` | SuperAdmin user management |
| `BeautySalonBooking.API/Controllers/MediaController.cs` | File upload/download via MinIO |

## Database Conventions

### Soft-delete naming — IMPORTANT
Different entities use different patterns — do not mix them:

| Entity | Field | Active condition |
|---|---|---|
| `Master` | `IsDeleted` (bool, default false) | `!m.IsDeleted` |
| `Salon` | `IsActive` (bool, default true) | `s.IsActive` |
| `SalonMaster` | `IsActive` (bool, default true) | `sm.IsActive` |
| `MasterService` | `IsActive` (bool, default true) | `ms.IsActive` |
| `AppUser` | `IsActive` (bool, default true) | account activation gate — false = pending SuperAdmin approval |

> `Master.IsDeleted` exists because `IsActive` would conflict semantically with `AppUser.IsActive` (activation). They are different concepts.

### Migrations
- **Stop the running API first** — it locks DLLs and migrations will fail
- Add: `dotnet ef migrations add <Name> --project src/BeautySalonBooking.Infrastructure --startup-project src/BeautySalonBooking.API`
- Apply: `dotnet ef database update --project src/BeautySalonBooking.Infrastructure --startup-project src/BeautySalonBooking.API`

## Auth System
- JWT access token: 15 min lifetime
- Refresh token: 7-day HttpOnly cookie, rotated on every use, path `/api/auth/refresh`
- Roles: `SuperAdmin`, `SalonAdmin`, `MasterAdmin`, `Client`
- Social login: Google + Facebook — token validated against provider, then `FindOrCreateExternalUserAsync`
- `AppUser.IsActive = false` blocks login on ALL paths (email, Google, Facebook) with message "pending activation"

### Master Social Registration Flow
- `POST /api/auth/master/google` + `POST /api/auth/master/facebook`
- Validates social token → checks salon exists → creates `Master` + `AppUser`
- `AppUser.IsActive = false`, `Master.IsDeleted = false`
- Returns pending message — NO tokens issued
- SuperAdmin activation flow: not yet implemented

### Google OAuth
- Backend validates `id_token` via `https://oauth2.googleapis.com/tokeninfo?id_token=...`
- Checks `aud` claim matches configured `OAuth:Google:ClientId` in `appsettings.json`
- Client ID: `1034062076072-g5rmh56mftvd8jv3cm4mbbs0uaehjf9b.apps.googleusercontent.com`

## API Endpoint Groups
| Controller | Route prefix | Auth |
|---|---|---|
| AuthController | `/api/auth` | mixed |
| AdminUsersController | `/api/admin/users` | SuperAdmin only |
| MediaController | `/api/media` | upload=JWT, get=anonymous |
| SalonsController | `/api/salons` | mixed |
| MastersController | `/api/masters` | mixed |
| SalonMastersController | `/api/salons/{salonId}/masters` | admin |
| ServicesController | `/api/services` | mixed |
| MasterServicesController | `/api/masters/{masterId}/services` | admin |
| TimeSlotsController | `/api/salons/{salonId}/masters/{masterId}/slots` | mixed |
| BookingsController | `/api/bookings` | mixed |
| RatingsController | `/api/masters/{masterId}/ratings` | mixed |

## Business Rules
1. Bookings auto-confirmed after creation (`Pending` → `Confirmed` immediately)
2. `BookingService` snapshots `Price` + `DurationMinutes` at booking time (not service name)
3. `Booking.TotalPrice` and `TotalDurationMinutes` are intentional denormalization
4. Slot duration = sum of selected service durations
5. `MasterRating.ClientName` is free text (not linked to AppUser) — known design gap
