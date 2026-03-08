# BookIO — Beauty Salon Booking System

A full-stack appointment booking platform for beauty salons. Clients browse salons, pick a master and services, choose a time slot, and confirm a booking. Admins manage salons, masters, services, and bookings through a built-in panel.

## Stack

| Layer | Technology |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API |
| Database | PostgreSQL 16 |
| ORM | Entity Framework Core 8 |
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
│   ├── BeautySalonBooking.Infrastructure/  # EF Core, Services, Seed data
│   └── BeautySalonBooking.API/             # Controllers, Middleware, Program.cs
├── tests/
│   └── BeautySalonBooking.Tests/           # Integration tests (151 tests)
├── frontend/                               # React + Vite SPA
│   └── src/
│       ├── api/                            # Axios API clients
│       ├── components/                     # Shared UI components
│       ├── context/                        # Booking flow & theme contexts
│       ├── pages/
│       │   ├── client/                     # Booking flow (Home → Salon → Master → Book)
│       │   └── admin/                      # Admin CRUD panel
│       └── types/                          # TypeScript interfaces
├── docker-compose.yml
└── BeautySalonBooking.sln
```

## Quick Start (Docker)

```bash
docker-compose up -d --build
```

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Database: `localhost:5433` (postgres / postgres)

The schema is created and seed data applied automatically on first run.

## Quick Start (Local Dev)

**Backend:**
```bash
cd src/BeautySalonBooking.API
dotnet run
# API at http://localhost:5000, Swagger at http://localhost:5000/swagger
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

Make sure `frontend/.env` points to the running API:
```
VITE_API_URL=http://localhost:8080/api
```

## Seed Data

On first run the following test data is inserted:

| Type | Count | Details |
|---|---|---|
| Salons | 2 | Bloom Beauty Studio, Charm Hair & Nails |
| Masters | 3 | Anna Petrova, Maria Sidorova, Olga Ivanova |
| Services | 5 | Haircut, Hair Coloring, Manicure, Pedicure, Eyebrow Shaping |
| SalonMaster links | 5 | Masters assigned to salons with individual schedules |
| MasterServices | 8 | Per-master price and duration |
| Time slots | ~14 days | 15-minute granularity per working schedule |
| Ratings | 7 | Sample reviews across all masters |

## Key Business Rules

- A master can work at multiple salons with different schedules per salon
- Services are a global catalog; masters set their own price and duration per service
- Time slots are generated at 15-minute granularity; booking locks all covered contiguous slots
- Cancellation releases the locked slots back to Available
- Booking completion requires the appointment end time to have passed

## Running Tests

```bash
dotnet test tests/BeautySalonBooking.Tests
```

151 integration tests covering all controllers.
