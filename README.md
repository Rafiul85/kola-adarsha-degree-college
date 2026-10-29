# কোলা আদর্শ ডিগ্রি কলেজ — Kola Adarsha Degree College website

A Bangla-first, bilingual (Bangla/English), accessible multi-page website and administration system for **Kola Adarsha Degree College**, Kola, Badalgachhi, Naogaon (EIIN **123139**).

The repository contains a complete React front end, an Express API, a role-based dashboard, a content-management system, a controlled results portal and a documented Supabase/PostgreSQL production schema.

> **Honesty and verification notice**
>
> - The running application in this repository uses a **local JSON data store** (`server/data/db.json`) and local cookie sessions. Supabase is supplied as a migration/RLS path in `supabase/migrations/` but is **not connected to the running app yet**.
> - The only seed records are clearly marked **নমুনা / sample** notices, events and calendar entries. There are **no invented teachers, students, results, fees, deadlines, pass rates or affiliations**.
> - Information that could not be confirmed from an official source is labelled **“তথ্য হালনাগাদ করা হচ্ছে” / “Verification pending”** instead of being guessed.
> - See [`docs/OFFICIAL-INFORMATION.md`](docs/OFFICIAL-INFORMATION.md) for the verification checklist.

---

## Quick start

Requirements: **Node.js 20.19+** (Node 22+ recommended) and npm.

```powershell
# Windows PowerShell
npm.cmd install
Copy-Item .env.example .env
# Edit .env and set ADMIN_EMAIL / ADMIN_PASSWORD before the first start.
npm.cmd run dev
```

Open <http://localhost:5173>. The API runs on <http://localhost:3001> and Vite proxies `/api` to it.

On the first server boot, the administrator from `.env` is provisioned **only if no administrator exists**. The password is hashed with `scrypt`; plaintext passwords are never stored in the data file. Delete `ADMIN_PASSWORD` from `.env` after the account exists if you prefer.

Production-style local run:

```powershell
npm.cmd run build
npm.cmd start
```

Open <http://localhost:3001>. The Express server serves `dist/` and the API, with SPA fallback for direct route refreshes.

---

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | API/production HTTP port. Default `3001`. |
| `ADMIN_EMAIL` | First administrator e-mail. Used only while no administrator exists. |
| `ADMIN_PASSWORD` | First administrator password (minimum 10 characters, at least one letter and one number). Delete after provisioning if desired. |
| `ADMIN_NAME` | Display name for the provisioned administrator. |
| `APP_ORIGIN` | Allowed browser origin for state-changing requests, e.g. `https://college.example.edu.bd`. |
| `COOKIE_SECURE` | Set `true` only when serving over HTTPS. |
| `DATA_DIR` | Optional data directory, relative to the project root. Defaults to `server/data`. Used by tests with `.test-data`. |
| `DATABASE_URL` | PostgreSQL connection string (Neon or any Postgres). When set, data, backups and uploaded documents are stored in PostgreSQL instead of local files. Required on Vercel. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Reserved for the documented Supabase integration; not used by the current local API. |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and Vite dev server together. |
| `npm run dev:api` | Runs only the Express API with file watching. |
| `npm run dev:web` | Runs only Vite. |
| `npm run typecheck` | Strict TypeScript check (`noUnusedLocals`, `noUnusedParameters`). |
| `npm run build` | Type-check and create the production bundle in `dist/`. |
| `npm start` | Serve the production bundle and API from Express. Requires `npm run build` first. |
| `npm run preview` | Build, then start the production server. |
| `npm run test:api` | Isolated end-to-end API smoke test against disposable `.test-data`. |
| `npm run test:prod` | Isolated production-build route, header and SPA-fallback check against `.prod-test-data`. |
| `npm run test:ui` | Headless Chrome smoke test of public and dashboard pages at desktop, tablet and mobile widths. |

On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm.ps1`.

---

## Pages and routes

### Public

| Route | Purpose |
| --- | --- |
| `/` | Home page: welcome, quick links, published notices, events, sample-content disclosure. |
| `/about` | Institution introduction, history, mission/vision placeholders, principal message placeholder, objectives, facilities, achievements. |
| `/teachers` | Active teacher directory with search, designation/department filters and pagination. |
| `/teachers/:id` | Teacher profile; only active records are public. |
| `/students` | Student information and portal sign-in guidance. No student list is public. |
| `/results` | Published-result lookup using examination + roll + registration. |
| `/academics` | Sessions, programmes, subjects, routines, examinations, calendar and documents. |
| `/admission` | Admission information; uses verification-pending copy until an official notice exists. |
| `/notices` | Published notices with search, category/date filters and pagination. |
| `/notices/:id` | Published notice detail. |
| `/events` | Published events, past/upcoming grouping. |
| `/contact` | Contact form, office details and map placeholder. |
| `/faq` | Frequently asked questions and admission FAQs. |
| `/privacy` | Privacy notice. |
| `/terms` | Website terms. |
| `*` | Bilingual 404 page. |

### Authentication

| Route | Purpose |
| --- | --- |
| `/login` | Sign in; no simulated success. |
| `/forgot-password` | Requests a one-time reset link. In local development the link is logged to the server console; e-mail delivery is not configured. |
| `/reset-password` | Validates the one-time token and sets a new password. |

### Dashboard

Authenticated routes require a valid HttpOnly session cookie. Admin routes additionally require the `admin` role **on the server**.

| Route | Access | Purpose |
| --- | --- | --- |
| `/dashboard` | Any signed-in role | Role-specific overview. |
| `/dashboard/account` | Any signed-in role | Account details and password change. |
| `/dashboard/notices` | Admin | Notice CRUD, status changes, pinning, audience, session. |
| `/dashboard/events` | Admin | Event CRUD and publishing. |
| `/dashboard/teachers` | Admin | Teacher records and assigned sessions. |
| `/dashboard/students` | Admin | Student records, sessions, programmes and subjects. |
| `/dashboard/results` | Admin | Examinations, results, CSV validate/import, publish/archive. |
| `/dashboard/academics` | Admin | Sessions, programmes, subjects, routines, examinations, calendar. |
| `/dashboard/documents` | Admin | Upload, edit, publish/archive and download documents. |
| `/dashboard/messages` | Admin | Contact messages, read/archive/delete. |
| `/dashboard/users` | Admin | Create accounts, assign roles, link teacher/student records, reset links. |
| `/dashboard/settings` | Admin | Institution/content/admission settings, backups, sample-content removal. |
| `/dashboard/audit` | Admin | Read-only audit log with search and role filter. |

---

## What is implemented

- **Responsive public site** with sticky navigation, dropdowns, mobile drawer, breadcrumbs, skip link, focus styles, reduced-motion support and light/dark themes.
- **Bangla-first typography** using Noto Sans Bengali, with an English UI switch and Bangla/English content fields.
- **SEO metadata per page**, canonical paths, Open Graph basics, `robots.txt`, and `noindex` on dashboard pages.
- **Server-enforced roles** (`admin`, `teacher`, `student`), with no self-registration and no self-promotion.
- **scrypt password hashing**, HttpOnly + SameSite session cookies, session expiry/sliding renewal, password-change session revocation, one-time reset tokens, login/reset rate limits and origin checks for state-changing requests.
- **Audit logging** for sign-ins, content changes, result publication/imports, user changes, settings and backups.
- **CMS** for notices, events, teachers, students, academic sessions, programmes, subjects, routines, examinations, calendar items and documents.
- **CSV result workflow**: download template, parse locally, server-side validation, duplicate detection, error preview, `skip`/`overwrite` modes, overwrite confirmation, optional publish, automatic backup before overwrite and a refreshable result list.
- **Published-results-only portal** requiring examination + roll + registration; wrong credentials get a generic not-found response. Results are labelled unofficial.
- **Controlled document downloads** through API routes; the production schema uses a private storage bucket and signed URLs.
- **Backups**: manual admin backup plus automatic backups before destructive operations (last 25 local backups retained).
- **Sample-content controls**: demo records are badged and can be removed from the dashboard.

---

## Authentication and data model

Local mode:

```text
Browser ──fetch /api──► Express ──reads/writes──► server/data/db.json
                          │
                          ├─ scrypt password hashes
                          ├─ HttpOnly cookie sessions
                          ├─ server-side role checks
                          ├─ audit log
                          └─ JSON backups in server/data/backups
```

- Public pages may read only published content.
- Students may read only their own dashboard payload and published results.
- Teachers may read their own dashboard payload and students in assigned sessions.
- Admin endpoints require `role === 'admin'` from the **server-side user record**, not from client state.
- `GET /api/dashboard/*` returns role-specific payloads; the UI never receives all student or result data.
- Password hashes are never returned by the API.

The local store is suitable for development, evaluation and a small single-instance deployment. It is **not** a multi-instance production database. See [`docs/SECURITY.md`](docs/SECURITY.md) and [`docs/SUPABASE.md`](docs/SUPABASE.md).

---

## Result CSV format

Template columns:

```text
roll,registration,studentName,gpa,outcome,subjects
```

- `subjects` uses `subject:marks|subject:marks`, for example `বাংলা:80|ইংরেজি:75`.
- `outcome` must be `pass`, `fail`, `withheld` or `absent`.
- `gpa` must be between `0` and `5`, or blank.
- Rows are validated on the server before import.
- Duplicate roll/registration inside the same file or against the selected examination is reported.
- `skip` keeps existing results; `overwrite` requires explicit confirmation and creates a backup first.
- Publishing requires the examination itself to be published.

---

## Testing

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:api
npm.cmd run test:prod
npm.cmd run test:ui
```

The suites start isolated servers on disposable data directories and tear them down afterwards:

| Command | Environment | Result of last run |
| --- | --- | --- |
| `npm run typecheck` | strict TypeScript | Passed |
| `npm run build` | production bundle | Passed |
| `npm run test:api` | API on `3199`, `.test-data` | **73 passed, 0 failed** |
| `npm run test:prod` | built app on `3200`, `.prod-test-data` | **50 passed, 0 failed** |
| `npm run test:ui` | built app on `3201` + installed Chrome | **269 passed, 0 failed** |

The API test covers authentication, role enforcement, result privacy, import validation, contact messages, audit logs, backups and session teardown. The production test checks every public route, security headers, asset caching and SPA fallback refresh. The browser test checks public and dashboard routes at 1280×900, 768×1024 and 360×800 for rendering, Bangla content, console errors and horizontal overflow. See [`docs/TESTING.md`](docs/TESTING.md) for the full matrix and manual QA checklist.

---

## Production integration and deployment

- [`docs/SUPABASE.md`](docs/SUPABASE.md) — schema, RLS model, first-admin bootstrap, storage, and what an adapter still needs to implement.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local production, Node hosting, reverse proxy, HTTPS/cookies, static-host caveat, backups.
- [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) — day-to-day CMS, result import, user management and backup guidance.
- [`docs/OFFICIAL-INFORMATION.md`](docs/OFFICIAL-INFORMATION.md) — verified vs pending institution information.
- [`docs/SECURITY.md`](docs/SECURITY.md) — security model, limits and incident checklist.

There are two supported deployment shapes:

- **Node host** (VPS, container, Render, Railway): `npm run build && npm start`. The Express server serves `dist/` and the API from one origin, using the JSON file store or PostgreSQL when `DATABASE_URL` is set.
- **Vercel** + PostgreSQL: `vercel.json` builds `dist/`, the Express app runs as one Node function in `api/[...path].mjs`, and data, backups and uploaded documents are kept in Postgres. Without `DATABASE_URL` a Vercel deployment falls back to a non-persistent `/tmp` store. See [`docs/VERCEL.md`](docs/VERCEL.md).

`netlify.toml` provides SPA fallback only; a static-only host cannot run the API.

---

## Known limitations

1. Supabase (the normalised schema in `supabase/migrations/`) is **not wired** into the running app. A single `app_state` JSONB document in PostgreSQL is used for the Vercel deployment instead.
2. The file store assumes one Node process. In PostgreSQL mode each save rewrites the whole document, so two administrators saving at the same instant can overwrite each other.
3. E-mail delivery is not configured. Password reset links are logged server-side in development and shown to administrators via the user-management reset-link action.
4. No MFA, SSO, CAPTCHA or external WAF. Rate limiting is in-memory and resets on restart.
5. Uploaded files are size/type-checked but not malware-scanned.
6. The browser smoke test uses raw Chrome DevTools Protocol checks (rendering, text, console errors, overflow); it is not a full interaction/E2E suite. There is no Playwright/Cypress test suite and no automated accessibility audit.
7. Official institution details, teachers, students, notices, results and documents are intentionally absent until verified and supplied by the college.

---

## Project structure

```text
src/                     React + TypeScript front end
  components/            layout, SEO, UI primitives, admin ResourceManager
  context/               auth, theme, toast
  lib/                   API client, types, i18n, formatting
  pages/                 public pages, auth pages, dashboard pages
server/                  Express API
  routes/                auth, public, dashboard, admin
  schemas.mjs            Zod validation and entity configuration
  auth.mjs               sessions, hashing, roles, rate limits
  db.mjs                 JSON persistence, backups, audit
  seed.mjs               minimal sample data with explicit demo flags
scripts/api-test.mjs     isolated end-to-end API test
scripts/prod-smoke.mjs    production build, route and header smoke test
scripts/ui-smoke.mjs      headless Chrome page and responsive smoke test
supabase/migrations/     PostgreSQL schema + RLS (documented production path)
docs/                    deployment, security, testing, admin and verification docs
```
