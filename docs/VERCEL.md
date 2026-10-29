# Vercel deployment (single function + PostgreSQL)

The app can run on Vercel, but not as a static site: the React front end calls the
Express API for every notice, event, teacher, result and sign-in. On Vercel the API
runs as one Node.js Function (`api/[...path].mjs`), and the data lives in PostgreSQL
instead of `server/data/db.json`, because a serverless filesystem is read-only and
its `/tmp` contents disappear with the instance.

```
Browser ──► Vercel CDN ──► dist/ (React build)
                └───────► api/[...path].mjs ──► Express (server/app.mjs) ──► PostgreSQL
```

## What changed for this mode

| Concern | Local / Node host | Vercel |
| --- | --- | --- |
| App entry | `server/index.mjs` (`app.listen`) | `api/[...path].mjs` (exports a handler) |
| Data store | `server/data/db.json` | `app_state` row in PostgreSQL |
| Backups | JSON files in `server/data/backups` | `app_backups` rows (last 25 kept) |
| Uploaded documents | `server/data/uploads` | `app_uploads` rows (`bytea`, 8 MB limit) |
| Durability | Write on every change | Queued write flushed before the response ends |

The driver is chosen automatically: **`DATABASE_URL` set → PostgreSQL, otherwise the
JSON file store**. Local development and the existing test suites keep using the file
store, so nothing changes there.

`POSTGRES` tables are created on first request:

- `app_state (id, doc jsonb, version, updated_at)` — the whole data document, one row.
- `app_backups (name, reason, size, doc, created_at)`.
- `app_uploads (name, mime_type, size, data, created_at)`.

## Setup

1. **Create a database.** In the Vercel dashboard open **Storage → Create → Neon**
   (or create a project at <https://neon.tech> and copy its connection string).
   Use the **pooled** connection string; `?sslmode=require` is fine.
2. **Set environment variables** in the Vercel project (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Postgres connection string |
   | `ADMIN_EMAIL` | first administrator e-mail |
   | `ADMIN_PASSWORD` | at least 10 characters, one letter and one digit |
   | `ADMIN_NAME` | administrator display name |
   | `APP_ORIGIN` | `https://<your-project>.vercel.app` (or the custom domain) |
   | `COOKIE_SECURE` | `true` |

   `ADMIN_*` only matter while no administrator exists; the account is created on the
   first request and the password should be changed after signing in.
3. **Deploy** with the Vercel CLI (`vercel` / `vercel --prod`) or by importing the
   repository. Vercel runs `npm run build` (`tsc --noEmit && vite build`) and serves
   `dist/`; `vercel.json` sends every non-API path to `index.html`.

   `vercel.json` also rewrites every `/api/*` request to the single function with the
   rest of the path in `__proxyPath`. Without it Vercel's generated route for
   `api/[...path].mjs` matches only one path segment, so `/api/health` works while
   `/api/public/home` returns the platform's 404. `api/[...path].mjs` rebuilds the
   original URL from that parameter before handing the request to Express, so keep
   the two in sync.
4. **Check** `https://<your-project>.vercel.app/api/health` returns
   `{"ok":true, ..., "storage":"postgres"}`.

## Limits of this deployment

- **No static-only host can run this app.** Vercel needs the Node function; GitHub
  Pages, Netlify Drop or any static upload will show an empty site.
- **One document per write.** Every save serialises the whole data document and
  updates one row. That is fine for a single college site (hundreds of records), not
  for high-volume concurrent editing: two administrators saving at the same instant
  can overwrite each other's change.
- **Request size.** Vercel caps request bodies at 4.5 MB, below the app's own 8 MB
  upload limit. Large documents must be uploaded on a Node host instead.
- **Rate limiting and sessions** still use per-instance memory for rate limits, and
  sessions live in the data document, so they survive restarts but rely on the same
  single-writer assumption.
- `docs/SUPABASE.md` describes a normalised schema with RLS. This deployment does not
  use those migrations; it stores the document model in `app_state`.
