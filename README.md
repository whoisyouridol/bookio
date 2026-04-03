# BookVisit — Beauty Salon Booking System

A full-stack appointment booking platform for beauty salons. Clients browse salons, pick a master and services, choose a time slot, and confirm a booking. Admins manage salons, masters, services, and bookings through a built-in panel.

## Stack

| Layer | Technology |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API |
| Database | PostgreSQL 16 |
| ORM | Entity Framework Core 8 |
| Auth | ASP.NET Core Identity + JWT (15 min) + HttpOnly refresh cookie (7 days) |
| Email | MailKit / SMTP + Hangfire background jobs |
| Validation | FluentValidation |
| Logging | Serilog |
| API Docs | Swagger / Swashbuckle |
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Data Fetching | TanStack Query v5, Axios |
| Toasts | Sonner |
| Container | Docker, Docker Compose |

## Project Structure

```
BookVisit/
├── src/
│   ├── BeautySalonBooking.Domain/          # Entities, Enums
│   ├── BeautySalonBooking.Application/     # DTOs, Validators, Interfaces
│   ├── BeautySalonBooking.Infrastructure/  # EF Core, Services, Email, Hangfire
│   └── BeautySalonBooking.API/             # Controllers, Middleware, Program.cs
├── tests/
│   └── BeautySalonBooking.Tests/           # Integration tests (220 tests)
├── frontend/                               # React + Vite SPA
│   ├── src/
│   │   ├── api/                            # Axios API clients
│   │   ├── components/                     # Shared UI components
│   │   ├── contexts/                       # Auth, Theme, SalonSubdomain contexts
│   │   ├── pages/
│   │   │   ├── auth/                       # Login, Register, Password reset
│   │   │   ├── client/                     # Booking flow (Home → Salon → Master → Book)
│   │   │   └── admin/                      # Admin CRUD panel
│   │   └── types/                          # TypeScript interfaces
│   └── tests/e2e/                          # Playwright E2E tests
├── docker-compose.yml
└── BeautySalonBooking.sln
```

## Quick Start (Docker)

```bash
cp .env.example .env                   # fill in real values
cp src/BeautySalonBooking.API/appsettings.example.json \
   src/BeautySalonBooking.API/appsettings.json   # fill in secrets
docker compose up -d --build
```

| Service | URL |
|---|---|
| App (nginx) | http://localhost |
| Swagger | http://localhost/swagger |
| Hangfire dashboard | http://localhost/hangfire |
| MinIO console | http://localhost:9001 |
| pgAdmin | http://localhost:5050 |

The schema is created and seed data applied automatically on first run.

## Quick Start (Local Dev)

**Backend:**
```bash
cd src/BeautySalonBooking.API
dotnet run
# API at http://localhost:5032, Swagger at http://localhost:5032/swagger
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5175
```

Copy `frontend/.env.example` → `frontend/.env` and set `VITE_GOOGLE_CLIENT_ID`.

## Configuration

All secrets live in gitignored files. Copy the examples and fill in real values:

| File | Purpose |
|---|---|
| `src/BeautySalonBooking.API/appsettings.json` | DB, JWT, MinIO, SMTP, OAuth |
| `.env` | Docker Compose variables (mirrors appsettings + MinIO + pgAdmin) |
| `frontend/.env` | `VITE_GOOGLE_CLIENT_ID` |

### SMTP (email notifications)

The app sends transactional emails for booking events, reminders, and account creation. Configure SMTP in `appsettings.json` (or via `.env` for Docker):

```json
"Smtp": {
  "Host": "smtp.gmail.com",
  "Port": 587,
  "UseSsl": true,
  "Username": "your-email@gmail.com",
  "Password": "YOUR_GOOGLE_APP_PASSWORD",
  "FromAddress": "noreply@yourdomain.com",
  "FromName": "BookVisit"
}
```

For Gmail, generate an **App Password** (Google Account → Security → 2-Step Verification → App Passwords).

## Auth System

- **Login identifier**: email or phone number
- **Token strategy**: 15-minute JWT access token + 7-day rotating HttpOnly refresh cookie
- **Roles**: `SuperAdmin`, `SalonAdmin`, `MasterAdmin`, `Client`
- **Social login**: Google + Facebook
- Masters are created by admins; a temporary password is emailed and must be changed on first login

## Email Notifications

Bilingual (Georgian + English) branded HTML emails are sent via Hangfire background jobs for:

- Booking confirmed / cancelled / completed
- Appointment reminders (24 h and 3 h before)
- Password reset / password changed
- New master account credentials

All message strings are centralized in `src/BeautySalonBooking.Infrastructure/Resources/email-messages.json`.

## Seed Data

On first run the following test data is inserted:

| Type | Count | Details |
|---|---|---|
| Salons | 2 | Bloom Beauty Studio, Charm Hair & Nails |
| Masters | 3 | Anna Petrova, Maria Sidorova, Olga Ivanova |
| Services | 5 | Haircut, Hair Coloring, Manicure, Pedicure, Eyebrow Shaping |
| SalonMaster links | 5 | Masters assigned to salons with individual schedules |
| MasterServices | 8 | Per-master price and duration |
| Ratings | 7 | Sample reviews across all masters |

## Key Business Rules

- A master can work at multiple salons with different schedules per salon
- Services are a global catalog; masters set their own price and duration per service
- Slots are generated on demand; booking duration = sum of selected service durations
- Cancellation releases locked slots back to Available
- Booking completion requires the appointment end time to have passed
- Prices displayed in Georgian Lari (₾)

## Running Tests

```bash
dotnet test tests/BeautySalonBooking.Tests
```

220 integration tests covering all controllers and the auth flow.

**E2E (Playwright):**
```bash
cd frontend
npx playwright test
```
