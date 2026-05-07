# Bookio — Beauty Salon Booking Platform

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

## Repository Layout

```
.
├── backend/                            # .NET 8 solution
│   ├── src/
│   │   ├── Bookio.Domain/              # Entities, enums (no dependencies)
│   │   ├── Bookio.Application/         # DTOs, interfaces, validators
│   │   ├── Bookio.Infrastructure/      # EF Core, services, MinIO, Identity, email
│   │   └── Bookio.API/                 # Controllers, middleware, Program.cs (Dockerfile here)
│   ├── tests/
│   │   └── Bookio.Tests/               # Unit + Integration test folders
│   ├── Bookio.sln
│   └── CLAUDE.md                       # backend conventions
├── frontend/                           # React + Vite SPA
│   ├── src/
│   │   ├── api/                        # Axios API clients
│   │   ├── components/                 # Shared UI components
│   │   ├── contexts/                   # Auth, Booking, Language, SalonSubdomain, Theme
│   │   ├── hooks/                      # Reusable React hooks
│   │   ├── i18n/                       # Georgian + English translations
│   │   ├── lib/                        # Utilities, helpers
│   │   ├── pages/{auth,client,admin,subdomain}/
│   │   ├── router/                     # Route definitions
│   │   ├── styles/                     # Tailwind layers, design tokens
│   │   ├── types/                      # TypeScript interfaces
│   │   ├── App.tsx                     # Main app shell
│   │   └── SubdomainApp.tsx            # Per-salon subdomain shell
│   ├── tests/e2e/                      # Playwright E2E tests
│   ├── Dockerfile                      # Production frontend image (nginx)
│   ├── nginx.conf
│   └── CLAUDE.md                       # frontend conventions
├── infra/                              # Observability config
│   ├── grafana/                        # Provisioning (datasources, dashboards)
│   ├── loki-config.yaml
│   └── tempo-config.yaml
├── docs/                               # Cross-cutting docs
│   ├── ARCHITECTURE.md                 # ER diagram, endpoints, DTOs, processes
│   ├── ARCHITECTURE-UI.md              # Frontend architecture
│   ├── DESIGN-SYSTEM.md                # Tokens, components, patterns
│   ├── AUDIT_ISSUES.md / AUDIT_TODO.md
│   └── RULES.md
├── docker-compose.yml
├── .env / .env.example
└── CLAUDE.md                           # repo-wide conventions
```

## Quick Start (Docker)

```bash
cp .env.example .env                    # fill in real values
cp backend/src/Bookio.API/appsettings.example.json \
   backend/src/Bookio.API/appsettings.json    # fill in secrets
docker compose up -d --build
```

| Service | URL |
|---|---|
| App (nginx) | https://localhost |
| Swagger | https://localhost/swagger |
| Hangfire dashboard | https://localhost/hangfire |
| MinIO console | http://localhost:9002 |
| pgAdmin | http://localhost:5050 |
| Grafana | https://localhost/grafana |

The schema is created and seed data applied automatically on first run.

## Quick Start (Local Dev)

**Backend:**
```bash
cd backend/src/Bookio.API
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

Copy `frontend/.env.example` → `frontend/.env` and set:
- `VITE_API_URL` — leave empty in dev (Vite proxy handles `/api`); set to backend URL in prod
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `VITE_MAIN_DOMAINS` — comma-separated main domains; subdomains of these resolve to salon sites

## Configuration

All secrets live in gitignored files. Copy the examples and fill in real values:

| File | Purpose |
|---|---|
| `backend/src/Bookio.API/appsettings.json` | DB, JWT, MinIO, SMTP, OAuth, Booking timezone |
| `.env` | Docker Compose variables (DB / MinIO / pgAdmin creds) |
| `frontend/.env` | `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_MAIN_DOMAINS` |

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
  "FromName": "Bookio"
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

All message strings are centralized in `backend/src/Bookio.Infrastructure/Resources/email-messages.json`.

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
- Prices displayed in Georgian Lari (₾); deployment region: Asia/Tbilisi (UTC+4)

## Running Tests

**Backend (xUnit):**
```bash
dotnet test backend/tests/Bookio.Tests
```

200+ unit and integration tests in `tests/Bookio.Tests/{Unit,Integration}` covering services, controllers, and the auth flow.

**Frontend E2E (Playwright):**
```bash
cd frontend
npx playwright test
```

Specs live in `frontend/tests/e2e/` (auth login, registration, master approval, plus shared `fixtures/`, `pages/`, and `utils/`).
