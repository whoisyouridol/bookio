# BookVisit — Claude Code Root Config

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
- When a BE DTO/endpoint/field changes → update `frontend/src/types/index.ts`, `src/api/`, and UI components
- When a FE feature needs new data → verify BE returns it first, add to BE if not
- Never assume a change is isolated to one layer without checking the other

---

## Project Overview

Beauty salon booking platform. Masters, salons, services, bookings, ratings.

### Ports
| Service | Port |
|---|---|
| Frontend (Vite) | 5175 |
| Backend (dotnet run) | 5032 |
| PostgreSQL (host) | 5433 |
| MinIO | 9000 / 9001 |

### Git
- Remote: `https://github.com/whoisyouridol/bookio.git`
- Working branch: `develop`
- Gitignored: `appsettings.json`, `appsettings.*.json`, `frontend/.env`, `ui_sample/`, `.claude/`
- Templates: `appsettings.example.json`, `frontend/.env.example`

### Secrets (local only, never commit)
- `appsettings.json` — DB password, JWT secret, MinIO creds, OAuth keys
- `frontend/.env` — `VITE_GOOGLE_CLIENT_ID`

---

## Architecture Reference
See `ARCHITECTURE.md` for full ER diagram, all API endpoints, all DTOs, and business processes.
See `src/CLAUDE.md` for backend conventions.
See `frontend/CLAUDE.md` for frontend conventions.
