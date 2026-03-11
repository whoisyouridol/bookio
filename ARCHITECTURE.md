# Beauty Salon Booking System — Architecture

## 1. Solution Structure

```
BeautySalonBooking/
├── src/
│   ├── BeautySalonBooking.API/
│   ├── BeautySalonBooking.Application/
│   ├── BeautySalonBooking.Domain/
│   └── BeautySalonBooking.Infrastructure/
├── tests/
│   └── BeautySalonBooking.Tests/
├── ARCHITECTURE.md
├── README.md
└── BeautySalonBooking.sln
```

### Project Descriptions

| Project | Responsibility |
|---|---|
| **Domain** | Entities, Enums, Value Objects, Domain interfaces. No dependencies on other projects. |
| **Application** | Use cases, DTOs, Validators (FluentValidation), Service interfaces. Depends on Domain. |
| **Infrastructure** | EF Core DbContext, Migrations, Repository/service implementations, ASP.NET Core Identity, JWT/refresh token logic, MinIO storage, Seed data. Depends on Application + Domain. |
| **API** | Controllers, Middleware (exception handling, logging), Program.cs, Swagger config. Depends on Application + Infrastructure (for DI). |
| **Tests** | Unit and integration tests. Depends on Application + Infrastructure. |

### Dependency Graph

```
API → Application → Domain
API → Infrastructure
Infrastructure → Application → Domain
```

---

## 2. Database Schema (ER Diagram)

```mermaid
erDiagram
    AppUser {
        uuid Id PK
        string Email
        string? FirstName
        string? LastName
        string? Phone
        enum Role
        uuid? SalonId
        uuid? MasterId
        string? ExternalProvider
        string? ExternalProviderId
        timestamp CreatedAt
    }

    RefreshToken {
        uuid Id PK
        uuid UserId FK
        string Token
        timestamp ExpiresAt
        timestamp CreatedAt
        bool IsRevoked
        timestamp? RevokedAt
    }

    Salon {
        uuid Id PK
        string Name
        string Address
        string? GoogleMapsUrl
        string? YandexMapsUrl
        time WorkingHoursStart
        time WorkingHoursEnd
        jsonb WorkingDays
        jsonb Photos
        jsonb Videos
        bool IsActive
        timestamp CreatedAt
        timestamp UpdatedAt
    }

    Master {
        uuid Id PK
        string FirstName
        string LastName
        string Phone
        string? Photo
        string? Description
        bool AutoApproveBookings
        bool IsActive
        timestamp CreatedAt
        timestamp UpdatedAt
    }

    SalonMaster {
        uuid Id PK
        uuid SalonId FK
        uuid MasterId FK
        time WorkingHoursStart
        time WorkingHoursEnd
        jsonb WorkingDays
        bool IsActive
    }

    Service {
        uuid Id PK
        string Name
        string? Description
        string? Photo
        timestamp CreatedAt
        timestamp UpdatedAt
    }

    MasterService {
        uuid Id PK
        uuid MasterId FK
        uuid ServiceId FK
        string? Photo
        string? Description
        decimal Price
        int DurationMinutes
        bool IsActive
    }

    TimeSlot {
        uuid Id PK
        uuid SalonMasterId FK
        date Date
        time StartTime
        time EndTime
        enum Status
    }

    Booking {
        uuid Id PK
        uuid SalonId FK
        uuid MasterId FK
        uuid? UserId FK
        string ClientName
        string ClientPhone
        string? ClientEmail
        date BookingDate
        time StartTime
        time EndTime
        decimal TotalPrice
        int TotalDurationMinutes
        enum Status
        timestamp CreatedAt
        timestamp UpdatedAt
        timestamp? CompletedAt
        timestamp? CancelledAt
        string? CancellationReason
    }

    BookingService {
        uuid Id PK
        uuid BookingId FK
        uuid MasterServiceId FK
        decimal Price
        int DurationMinutes
    }

    MasterRating {
        uuid Id PK
        uuid MasterId FK
        uuid? BookingId FK
        string ClientName
        int Rating
        string? Comment
        timestamp CreatedAt
    }

    AppUser ||--o{ RefreshToken : "has"
    AppUser ||--o{ Booking : "made by"
    Salon ||--o{ SalonMaster : "has"
    Master ||--o{ SalonMaster : "works at"
    SalonMaster ||--o{ TimeSlot : "has slots"
    Master ||--o{ MasterService : "offers"
    Service ||--o{ MasterService : "offered as"
    Booking ||--o{ BookingService : "includes"
    MasterService ||--o{ BookingService : "booked as"
    Salon ||--o{ Booking : "hosts"
    Master ||--o{ Booking : "performs"
    Master ||--o{ MasterRating : "receives"
    Booking ||--o| MasterRating : "linked to"
```

### Enum Values

**TimeSlot.Status**: `Available`, `Booked`, `Blocked`

**Booking.Status**: `Pending`, `Confirmed`, `Completed`, `CancelledByClient`, `CancelledByMaster`

**AppRole**: `SuperAdmin`, `SalonAdmin`, `MasterAdmin`, `Client`

---

## 3. API Endpoints

### AuthController — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new client account (email + password) |
| POST | `/api/auth/login` | — | Login with email + password |
| POST | `/api/auth/google` | — | Login / register via Google ID token |
| POST | `/api/auth/facebook` | — | Login / register via Facebook access token |
| POST | `/api/auth/refresh` | cookie | Exchange HttpOnly refresh-token cookie for new access token (rotation) |
| POST | `/api/auth/logout` | cookie | Revoke refresh token and clear cookie |
| GET | `/api/auth/me` | JWT | Get current authenticated user's profile |
| POST | `/api/auth/change-password` | JWT | Change password (email accounts only) |
| POST | `/api/auth/forgot-password` | — | Request password-reset email |
| POST | `/api/auth/reset-password` | — | Reset password using emailed token |

### AdminUsersController — `/api/admin/users` *(SuperAdmin only)*

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create a SalonAdmin, MasterAdmin or Client account |
| PUT | `/api/admin/users/{id}/role` | Update a user's role and entity link |
| DELETE | `/api/admin/users/{id}` | Delete a user |

### MediaController — `/api/media`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/media/upload` | JWT | Upload an image or video (multipart/form-data). Returns `{ key }`. Max 100 MB. |
| GET | `/api/media/{**key}` | — | Redirect to a 24-hour presigned MinIO URL for the given object key |

### SalonsController — `/api/salons`

| Method | Route | Description |
|---|---|---|
| GET | `/api/salons` | List all active salons |
| GET | `/api/salons/{id}` | Salon details with associated masters |
| POST | `/api/salons` | Create a new salon |
| PUT | `/api/salons/{id}` | Update salon info |
| DELETE | `/api/salons/{id}` | Soft-delete salon (IsActive = false) |
| GET | `/api/salons/{id}/masters` | List masters linked to this salon |
| GET | `/api/salons/{id}/services` | All services available at this salon |
| GET | `/api/salons/{salonId}/bookings` | Bookings at this salon (filterable) |

### MastersController — `/api/masters`

| Method | Route | Description |
|---|---|---|
| GET | `/api/masters` | List all active masters |
| GET | `/api/masters/{id}` | Master details with average rating |
| POST | `/api/masters` | Create a new master |
| PUT | `/api/masters/{id}` | Update master info |
| DELETE | `/api/masters/{id}` | Soft-delete master (IsActive = false) |
| GET | `/api/masters/{id}/services` | Services offered by this master |
| GET | `/api/masters/{id}/ratings` | All ratings for this master |
| GET | `/api/masters/{id}/average-rating` | Master's average rating (1–5) |
| GET | `/api/masters/{masterId}/bookings` | Bookings for this master (filterable) |

### SalonMastersController — `/api/salons/{salonId}/masters`

| Method | Route | Description |
|---|---|---|
| POST | `/api/salons/{salonId}/masters` | Link an existing master to a salon with schedule |
| PUT | `/api/salons/{salonId}/masters/{masterId}` | Update master's schedule/hours at this salon |
| DELETE | `/api/salons/{salonId}/masters/{masterId}` | Unlink master from salon (soft delete) |

### ServicesController — `/api/services`

| Method | Route | Description |
|---|---|---|
| GET | `/api/services` | List all services (global catalog) |
| POST | `/api/services` | Create a new service |
| PUT | `/api/services/{id}` | Update service info |
| DELETE | `/api/services/{id}` | Delete service from catalog |

### MasterServicesController — `/api/masters/{masterId}/services`

| Method | Route | Description |
|---|---|---|
| POST | `/api/masters/{masterId}/services` | Add a catalog service to master with price, duration, and optional photo/description override |
| PUT | `/api/masters/{masterId}/services/{serviceId}` | Update price, duration, or photo override |
| DELETE | `/api/masters/{masterId}/services/{serviceId}` | Remove service from master's offerings |

### TimeSlotsController

| Method | Route | Description |
|---|---|---|
| GET | `/api/salons/{salonId}/masters/{masterId}/slots` | Available slots for date and selected services (`?date=&serviceIds=`) |
| POST | `/api/salons/{salonId}/masters/{masterId}/slots` | Manually create slots (batch) |
| POST | `/api/salons/{salonId}/masters/{masterId}/slots/generate` | Auto-generate slots for a date range |
| PUT | `/api/slots/{id}` | Update slot status (Block/Unblock) |
| DELETE | `/api/slots/{id}` | Delete a slot |

### BookingsController — `/api/bookings`

| Method | Route | Description |
|---|---|---|
| GET | `/api/bookings` | All bookings with optional filters (date, salon, master, status) |
| GET | `/api/bookings/{id}` | Full booking details including services |
| POST | `/api/bookings` | Create a new booking (validates slots, calculates totals, auto-confirms) |
| PUT | `/api/bookings/{id}/confirm` | Confirm a pending booking |
| PUT | `/api/bookings/{id}/complete` | Mark booking as completed |
| PUT | `/api/bookings/{id}/cancel` | Cancel booking (body: side + reason) |

### RatingsController

| Method | Route | Description |
|---|---|---|
| POST | `/api/masters/{masterId}/ratings` | Submit a rating for a master |
| GET | `/api/masters/{masterId}/ratings` | List all ratings for a master |
| DELETE | `/api/ratings/{id}` | Delete a rating (admin action) |

---

## 4. Domain Models

### AppUser *(Identity layer — Infrastructure)*
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK (inherits from IdentityUser\<Guid\>) |
| Email | string | Unique, from Identity |
| FirstName | string? | Optional |
| LastName | string? | Optional |
| Phone | string? | Optional (PhoneNumber from Identity) |
| Role | AppRole | `SuperAdmin` / `SalonAdmin` / `MasterAdmin` / `Client` |
| SalonId | Guid? | For SalonAdmin: the salon they manage |
| MasterId | Guid? | For MasterAdmin: the master profile they own |
| ExternalProvider | string? | `"Google"` or `"Facebook"` — null for email/password accounts |
| ExternalProviderId | string? | Provider-issued user ID for external auth |
| CreatedAt | DateTime | UTC |

### RefreshToken *(Infrastructure)*
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK → AppUser |
| Token | string | Hashed token value |
| ExpiresAt | DateTime | UTC, 7-day lifetime |
| CreatedAt | DateTime | UTC |
| IsRevoked | bool | True if revoked before expiry |
| RevokedAt | DateTime? | Set when token is revoked |

> **Design note:** `IsRevoked` is redundant — `RevokedAt != null` carries the same information. Candidate for simplification in a future migration.

### Salon
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| Name | string | Required |
| Address | string | Required |
| GoogleMapsUrl | string? | Optional |
| YandexMapsUrl | string? | Optional |
| WorkingHoursStart | TimeOnly | e.g. 09:00 |
| WorkingHoursEnd | TimeOnly | e.g. 21:00 |
| WorkingDays | List\<DayOfWeek\> | Stored as JSONB array |
| Photos | List\<string\> | MinIO object keys, stored as JSONB |
| Videos | List\<string\> | MinIO object keys, stored as JSONB |
| IsActive | bool | Soft-delete flag |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |

### Master
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| FirstName | string | Required |
| LastName | string | Required |
| Phone | string | Required |
| Photo | string? | MinIO object key |
| Description | string? | Bio |
| AutoApproveBookings | bool | If true, new bookings are auto-confirmed; default true |
| IsActive | bool | Soft-delete flag |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |

### SalonMaster
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| SalonId | Guid | FK → Salon |
| MasterId | Guid | FK → Master |
| WorkingHoursStart | TimeOnly | At this specific salon |
| WorkingHoursEnd | TimeOnly | At this specific salon |
| WorkingDays | List\<DayOfWeek\> | JSONB array |
| IsActive | bool | Soft-delete flag |

> **Design note:** No `CreatedAt`/`UpdatedAt` — audit trail for link history is not available.

### Service
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| Name | string | e.g. "Hair Highlighting" |
| Description | string? | Optional |
| Photo | string? | MinIO object key |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |

### MasterService
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| MasterId | Guid | FK → Master |
| ServiceId | Guid | FK → Service |
| Photo | string? | Per-master photo override (overrides Service.Photo in UI) |
| Description | string? | Per-master description override |
| Price | decimal | Price set by master |
| DurationMinutes | int | Duration set by master |
| IsActive | bool | Can disable without deleting |

> **Design note:** No `CreatedAt`/`UpdatedAt` — inconsistent with other entities.

### TimeSlot
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| SalonMasterId | Guid | FK → SalonMaster |
| Date | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | |
| Status | TimeSlotStatus | `Available` / `Booked` / `Blocked` |

> **Design note:** No `CreatedAt` — can't distinguish manually created vs auto-generated slots.

### Booking
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| SalonId | Guid | FK → Salon |
| MasterId | Guid | FK → Master |
| UserId | Guid? | FK → AppUser — null for guest bookings |
| ClientName | string | Snapshot at booking time (required for guests; filled for auth users) |
| ClientPhone | string | Snapshot at booking time |
| ClientEmail | string? | Snapshot at booking time |
| BookingDate | DateOnly | |
| StartTime | TimeOnly | |
| EndTime | TimeOnly | Calculated from total duration |
| TotalPrice | decimal | Denormalized sum of BookingService prices |
| TotalDurationMinutes | int | Denormalized sum of BookingService durations |
| Status | BookingStatus | `Pending` / `Confirmed` / `Completed` / `CancelledByClient` / `CancelledByMaster` |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |
| CompletedAt | DateTime? | Set when status → Completed |
| CancelledAt | DateTime? | Set when status → Cancelled |
| CancellationReason | string? | Optional free text |

> **Design notes:**
> - `TotalPrice` and `TotalDurationMinutes` are intentional denormalization for fast reads and historical accuracy.
> - For authenticated users, `ClientName/Phone/Email` are currently taken from the request body — not enforced to match the user's account data.

### BookingService
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| BookingId | Guid | FK → Booking |
| MasterServiceId | Guid | FK → MasterService |
| Price | decimal | Snapshot at time of booking |
| DurationMinutes | int | Snapshot at time of booking |

> **Design note:** Service name is not snapshotted. If a service is renamed, historical booking detail views must join to `Service` for the display name — which will show the current name, not the name at booking time.

### MasterRating
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| MasterId | Guid | FK → Master |
| BookingId | Guid? | FK → Booking — optional link |
| ClientName | string | Free text (not linked to AppUser) |
| Rating | int | 1–5 stars |
| Comment | string? | |
| CreatedAt | DateTime | UTC |

> **Design note:** `ClientName` is free text and can be spoofed. With auth implemented, linking to `UserId` would enforce rating authenticity and prevent duplicate reviews.

---

## 5. Data Contracts (DTOs)

### Auth DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `RegisterRequest` | → API | `email`, `password`, `firstName?`, `lastName?`, `phone?`, `role?` |
| `LoginRequest` | → API | `email`, `password` |
| `GoogleAuthRequest` | → API | `credential` (Google ID token) |
| `FacebookAuthRequest` | → API | `accessToken` |
| `AuthResponse` | API → | `accessToken`, `user: UserDto` |
| `UserDto` | API → | `id`, `email`, `firstName?`, `lastName?`, `phone?`, `role`, `salonId?`, `masterId?` |
| `AdminUserDto` | API → | + `externalProvider?`, `createdAt` |
| `ChangePasswordRequest` | → API | `currentPassword`, `newPassword` |
| `ForgotPasswordRequest` | → API | `email` |
| `ResetPasswordRequest` | → API | `email`, `token`, `newPassword` |
| `CreateAdminUserRequest` | → API | `email`, `password`, `role`, `salonId?`, `masterId?` |
| `UpdateUserRoleRequest` | → API | `role`, `salonId?`, `masterId?` |

### Salon DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `SalonDto` | API → | `id`, `name`, `address`, `googleMapsUrl?`, `yandexMapsUrl?`, `workingHoursStart`, `workingHoursEnd`, `workingDays[]`, `photos[]`, `videos[]`, `isActive`, `createdAt` |
| `SalonDetailDto` | API → | All SalonDto fields + `masters: SalonMasterDto[]` |
| `CreateSalonRequest` | → API | `name`, `address`, `workingHoursStart`, `workingHoursEnd`, `workingDays[]`, `photos[]?`, `videos[]?` |
| `UpdateSalonRequest` | → API | Same as Create |

### Master DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `MasterDto` | API → | `id`, `firstName`, `lastName`, `phone`, `photo?`, `description?`, `autoApproveBookings`, `isActive`, `createdAt`, `averageRating?`, `ratingCount` |
| `CreateMasterRequest` | → API | `firstName`, `lastName`, `phone`, `photo?`, `description?`, `autoApproveBookings` |
| `UpdateMasterRequest` | → API | Same as Create |

### SalonMaster DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `SalonMasterDto` | API → | `id`, `salonId`, `masterId`, `masterFirstName`, `masterLastName`, `workingHoursStart`, `workingHoursEnd`, `workingDays[]`, `isActive` |
| `LinkMasterToSalonRequest` | → API | `masterId`, `workingHoursStart`, `workingHoursEnd`, `workingDays[]` |
| `UpdateSalonMasterRequest` | → API | `workingHoursStart`, `workingHoursEnd`, `workingDays[]` |

### Service DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `ServiceDto` | API → | `id`, `name`, `description?`, `photo?`, `createdAt` |
| `CreateServiceRequest` | → API | `name`, `description?`, `photo?` |
| `UpdateServiceRequest` | → API | Same as Create |

### MasterService DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `MasterServiceDto` | API → | `id`, `masterId`, `serviceId`, `serviceName`, `servicePhoto?`, `photo?`, `description?`, `price`, `durationMinutes`, `isActive` |
| `AddMasterServiceRequest` | → API | `serviceId`, `price`, `durationMinutes`, `photo?`, `description?` |
| `UpdateMasterServiceRequest` | → API | `price`, `durationMinutes`, `photo?`, `clearPhoto`, `description?` |

### TimeSlot DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `TimeSlotDto` | API → | `id`, `salonMasterId`, `date`, `startTime`, `endTime`, `status` |
| `CreateTimeSlotsRequest` | → API | `date`, `slots: [{startTime, endTime}]` |
| `GenerateSlotsRequest` | → API | `startDate`, `endDate`, `slotDurationMinutes` |
| `UpdateSlotStatusRequest` | → API | `status` |

### Booking DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `BookingDto` | API → | `id`, `salonId`, `salonName`, `masterId`, `masterName`, `clientName`, `clientPhone`, `clientEmail?`, `bookingDate`, `startTime`, `endTime`, `totalPrice`, `totalDurationMinutes`, `status`, `createdAt`, `completedAt?`, `cancelledAt?`, `cancellationReason?`, `services: BookingServiceDto[]` |
| `BookingServiceDto` | API → | `id`, `serviceId`, `serviceName`, `price`, `durationMinutes` |
| `CreateBookingRequest` | → API | `salonId`, `masterId`, `clientName`, `clientPhone`, `clientEmail?`, `bookingDate`, `startTime`, `serviceIds[]` |
| `CancelBookingRequest` | → API | `side` (`"Client"` \| `"Master"`), `reason?` |
| `BookingFilterRequest` | → API | `salonId?`, `masterId?`, `status?`, `dateFrom?`, `dateTo?` |

### Rating DTOs
| DTO | Direction | Key Fields |
|---|---|---|
| `RatingDto` | API → | `id`, `masterId`, `bookingId?`, `clientName`, `rating`, `comment?`, `createdAt` |
| `CreateRatingRequest` | → API | `bookingId?`, `clientName`, `rating` (1–5), `comment?` |
| `AverageRatingDto` | API → | `average`, `count` |

---

## 6. Main Business Processes

### Available Slots Calculation
1. Accept: `salonId`, `masterId`, `date`, `serviceIds[]`
2. Sum durations of all selected `MasterService` records → `totalDuration`
3. Query `TimeSlot` where `SalonMasterId` matches salon+master, `Date = date`, `Status = Available`
4. Sort slots by `StartTime`; find contiguous runs where total span >= `totalDuration`
5. Return starting slots that can accommodate the full booking

### Booking Creation
1. Validate request (client info, serviceIds, startTime, salonId, masterId)
2. Load `MasterService` records for each serviceId → sum price + duration
3. Calculate `EndTime = StartTime + totalDuration`
4. Check that all required `TimeSlot` records in the range are `Available`
5. Mark covered `TimeSlot` records as `Booked`
6. Create `Booking` + `BookingService` records
7. Auto-confirm the booking immediately (calls `confirmBooking` after creation)
8. Call `INotificationService.SendBookingConfirmationAsync(bookingId)`

### Booking Cancellation
1. Validate booking exists and is in a cancellable state (Pending or Confirmed)
2. Set `Status = CancelledByClient` or `CancelledByMaster`
3. Set `CancelledAt`, `CancellationReason`
4. Release covered `TimeSlot` records back to `Available`
5. Call `INotificationService.SendCancellationNotificationAsync(bookingId, side)`

### Booking Completion
1. Verify booking is `Confirmed`
2. Verify `BookingDate + EndTime` is in the past
3. Set `Status = Completed`, `CompletedAt = UtcNow`
4. (No slot action needed — slots already consumed)

### Slot Auto-Generation
1. Accept: `salonMasterId`, `startDate`, `endDate`, `slotDurationMinutes`
2. For each date in range that falls on a `SalonMaster.WorkingDay`:
   - Iterate from `WorkingHoursStart` to `WorkingHoursEnd` in `slotDurationMinutes` increments
   - Skip slots that already exist for that time
   - Insert `TimeSlot` with `Status = Available`

### Auth Flow
1. **Email/password register**: create `AppUser` → assign `Client` role → issue JWT + set HttpOnly refresh cookie
2. **Login**: verify password → issue JWT + set HttpOnly refresh cookie
3. **Social login (Google/Facebook)**: validate token with provider → find or create `AppUser` → issue JWT + cookie
4. **Token refresh**: read `refreshToken` HttpOnly cookie → validate + rotate → return new JWT
5. **Logout**: revoke refresh token → clear cookie
6. **Password reset**: generate Identity reset token → email link → user submits new password + token

---

## 7. Technology Decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | ASP.NET Core 8 Web API | Target platform, LTS |
| ORM | Entity Framework Core 8.0.11 | PostgreSQL support, migrations |
| Database | PostgreSQL (port 5433 host) | Robust JSONB for arrays (WorkingDays, Photos, Videos) |
| Auth | ASP.NET Core Identity + JWT | Role management, password hashing, token validation |
| JWT | 15-min access token + 7-day HttpOnly refresh cookie | Short-lived access, secure rotation |
| Social Auth | Google (`GoogleJsonWebSignature`) + Facebook (Graph API) | OAuth2 social login |
| Validation | FluentValidation | Declarative, testable, integrates with ASP.NET Core |
| Logging | Serilog | Structured logging, flexible sinks |
| Documentation | Swagger / Swashbuckle | Auto-generated OpenAPI spec |
| Architecture | Clean Architecture (Domain / Application / Infrastructure / API) | Separation of concerns, testability |
| JSON arrays | PostgreSQL JSONB columns | `WorkingDays`, `Photos`, `Videos` via EF Core value converters |
| File storage | MinIO (S3-compatible) | Object storage for images/videos; presigned URLs for access |
| Services location | `Infrastructure/ApplicationServices/` | Avoids circular dependency between Application ↔ Infrastructure |

---

## 8. Known Design Considerations

These are accepted trade-offs or candidates for future improvement:

| Issue | Description | Severity |
|---|---|---|
| `RefreshToken.IsRevoked` redundancy | `RevokedAt != null` already implies revocation; `IsRevoked` is a duplicate boolean | Low |
| Dual role storage | `AppUser.Role` (custom enum column) + ASP.NET Identity `AspNetUserRoles` table — two sources of truth that must stay in sync | Medium |
| `MasterRating.ClientName` spoofable | Free-text name not linked to `AppUser`; any caller can submit any name; link to `UserId` would enforce authenticity | Medium |
| `BookingService` missing name snapshot | Price and duration are snapshotted at booking time but service name is not — renamed services show current name in history | Low |
| `Booking` client fields vs `UserId` | For authenticated users, `ClientName/Phone/Email` are taken from the request, not enforced to match the user's account | Low |
| `SalonMaster` no audit fields | No `CreatedAt`/`UpdatedAt` — cannot audit when a master was linked to a salon | Low |
| `MasterService` no audit fields | No `CreatedAt`/`UpdatedAt` — inconsistent with Salon, Master, Service entities | Low |
| `TimeSlot` no `CreatedAt` | Cannot distinguish manually created vs auto-generated slots | Low |

---

## Architecture Checklist

- [x] ER diagram with all entities and relationships
- [x] Complete list of API endpoints (including Auth, Admin, Media)
- [x] Description of all entities with fields and types
- [x] Solution folder structure
- [x] Description of main business processes
- [x] Technology decisions and justifications
- [x] Data contracts (DTOs) for all controllers
- [x] Known design considerations and trade-offs
