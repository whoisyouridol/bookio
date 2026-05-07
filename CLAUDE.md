# Bookio — Claude Code Root Config

## Rules (MUST follow, no exceptions)

### Commit & Push
- ALWAYS ask user before committing or pushing — never autonomously
- Stage only changed files — never `git add -A`
- Push to `develop` branch only
- Propose commit name + description before committing

### Testing
- New backend functionality MUST have unit + integration tests
- Non-trivial frontend logic MUST have frontend tests
- Always rerun full test suite after any change and confirm it passes
- Never skip or comment out failing tests — fix the root cause

### Cross-Layer Consistency
- When a BE DTO/endpoint/field changes → update `frontend/src/types/index.ts`, `frontend/src/api/`, and UI components
- When a FE feature needs new data → verify BE returns it first, add to BE if not
- Never assume a change is isolated to one layer without checking the other

---

## Project Overview

Beauty salon booking platform. Masters, salons, services, bookings, ratings.
Brand: **Bookio** (backend renamed; frontend rename pending).

### Repo Layout
```
.
├── backend/          # .NET 8 solution (Bookio.{Domain,Application,Infrastructure,API,Tests})
├── frontend/         # React + Vite SPA (still branded "BookVisit" in UI strings — pending rename)
├── infra/            # Loki, Tempo, Grafana provisioning
├── docs/             # ARCHITECTURE.md, DESIGN-SYSTEM.md, AUDIT_*.md, etc.
├── docker-compose.yml
└── .env / .env.example
```

### Ports
| Service | Port |
|---|---|
| Frontend (Vite dev) | 5175 |
| Backend (dotnet run) | 5032 |
| PostgreSQL (host) | 5433 |
| MinIO | 9000 / 9002 |

### Git
- Remote: `https://github.com/whoisyouridol/bookio.git`
- Working branch: `develop`
- Gitignored: `appsettings.json`, `appsettings.*.json`, `frontend/.env`, `ui_sample/`, `.claude/`
- Templates: `appsettings.example.json`, `frontend/.env.example`

### Secrets (local only, never commit)
- `backend/src/Bookio.API/appsettings.json` — DB password, JWT secret, MinIO creds, OAuth keys
- `frontend/.env` — `VITE_GOOGLE_CLIENT_ID`

### Timezone
The app runs in **Asia/Tbilisi (UTC+4, no DST)**. `Booking:TimezoneOffsetHours = 4` is the single source of truth — change it if redeploying elsewhere.

---

## Architecture Reference
- `docs/ARCHITECTURE.md` — full ER diagram, all API endpoints, all DTOs, business processes
- `backend/CLAUDE.md` — backend conventions
- `frontend/CLAUDE.md` — frontend conventions
