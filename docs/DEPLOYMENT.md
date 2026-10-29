# Deployment guide

> This guide describes how to deploy the code in this repository. It does not claim that a live deployment has already been performed. The only verified runs so far are local development, a local production build, and the isolated API test suite.

## 1. Choose the right host

The current backend is a long-running **Express** server with a **single-process JSON store**. Use:

- a Node host/container (VPS, Render, Railway, Fly.io, Azure App Service, etc.), or
- one Node process behind Nginx on a VPS.

Do **not** deploy only `dist/` to a static host and expect login, results, the CMS or the contact form to work. The `vercel.json` and `netlify.toml` files provide SPA fallback; they do not turn the Express API into serverless functions. A static deployment would show the public shell but all `/api` calls would fail.

## 2. Build

```bash
npm ci
npm run typecheck
npm run test:api
npm run build
```

`npm run build` types-checks and writes the production bundle to `dist/`.

## 3. Environment

Create `.env` on the server (never commit it):

```dotenv
PORT=3001
ADMIN_EMAIL=admin@your-college-domain.example
ADMIN_PASSWORD=<long unique bootstrap password>
ADMIN_NAME=College Administrator
APP_ORIGIN=https://www.your-college-domain.example
COOKIE_SECURE=true
# DATA_DIR=/var/lib/kadc
```

- `APP_ORIGIN` must exactly match the browser origin (scheme + host + port).
- `COOKIE_SECURE=true` requires HTTPS. Do not enable it on plain HTTP.
- After the first successful start, the bootstrap password is ignored while an administrator exists. Remove it from `.env` if your process manager keeps the environment readable by others.
- Set `DATA_DIR` to a persistent volume/directory outside the release folder so deploys do not delete data.

## 4. Start

```bash
npm start
```

Or with a process manager:

```bash
pm2 start server/index.mjs --name kadc -- --prod
pm2 save
```

The server refuses to start in production mode if `dist/index.html` is missing.

## 5. Reverse proxy and HTTPS

Example Nginx site:

```nginx
server {
    listen 80;
    server_name www.your-college-domain.example;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.your-college-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-college-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-college-domain.example/privkey.pem;

    client_max_body_size 9m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`trust proxy` is enabled in Express, so `req.secure` and `req.ip` use the forwarded headers. Keep the proxy as the only public entry point.

## 6. Data and backups

Local mode stores data in:

```text
$DATA_DIR/db.json
$DATA_DIR/backups/db-*.json
$DATA_DIR/uploads/
```

- Back up the whole data directory, not only `db.json`.
- The app keeps the **last 25** automatic/manual JSON backups.
- Take an off-server backup (object storage or encrypted backup service) on a schedule.
- Test a restore on a staging copy before relying on it.
- File uploads are not included in `db.json`; copy `uploads/` too.
- Never expose `server/data` or `$DATA_DIR` through the web server. Only the Express API should read it.

Restore outline:

```bash
# Stop the service first.
cp "$DATA_DIR/db.json" "$DATA_DIR/db.json.before-restore"
cp /secure/backup/db-YYYY-MM-DD....json "$DATA_DIR/db.json"
# Copy matching uploads if restoring documents.
npm start
```

## 7. Security settings

- Use a unique administrator password; change it after first sign-in.
- Enforce HTTPS and `COOKIE_SECURE=true`.
- Restrict filesystem permissions on `.env` and the data directory to the service account.
- Do not put `.env`, `server/data`, backups or uploads in a public web root.
- Put a WAF/reverse-proxy rate limit in front of `/api/auth/login`, `/api/auth/forgot-password`, `/api/public/contact` and `/api/public/results/search`. The app also has in-memory limits, but those reset on restart and are per process.
- If multiple app instances are needed, move to the Supabase/PostgreSQL path or another shared database **before** scaling. Two JSON-store processes will overwrite each other.
- Review [`SECURITY.md`](SECURITY.md) for the threat model and incident checklist.

## 8. Post-deploy checks

```bash
curl -fsS https://www.your-college-domain.example/api/health
curl -fsS https://www.your-college-domain.example/api/public/settings
curl -I  https://www.your-college-domain.example/about
curl -I  https://www.your-college-domain.example/teachers
curl -I  https://www.your-college-domain.example/login
```

Then in a browser:

- [ ] Direct refresh works on `/about`, `/teachers`, `/results`, `/login` and a dashboard route.
- [ ] Static assets load from `/assets/*` with long cache headers.
- [ ] `/api/health` reports `environment: production`.
- [ ] The session cookie is `HttpOnly`, `SameSite=Lax`, `Secure` and has no unexpected domain.
- [ ] A wrong password is rejected; no dashboard flash or fake success appears.
- [ ] Teacher/student accounts cannot open admin pages.
- [ ] A draft result is not searchable; a published one is.
- [ ] Contact form submission appears in the admin message list.
- [ ] A backup can be created and downloaded by an administrator.
- [ ] No console errors at 360 px, 768 px and 1280 px widths.
- [ ] Keyboard navigation, focus visibility, theme toggle and mobile drawer work.

## 9. Static-host fallback (not a full deployment)

If you only need the public shell for design review:

- Vercel: `vercel.json` rewrites non-API paths to `index.html`.
- Netlify: `netlify.toml` sets `publish = "dist"` and SPA fallback.

Both still need the API hosted elsewhere and a working reverse proxy from `/api/*`, or the site must be adapted to Supabase client calls. That adaptation is **not implemented**.

## 10. Updating

```bash
npm ci
npm run typecheck
npm run test:api
npm run build
pm2 restart kadc
```

Keep the data directory intact across releases. Verify `/api/health` and sign in after each deploy.
