# Testing and QA

This document records how the site is tested, the result of the last verification run, and the manual checks that still need a human reviewer.

Every automated suite runs against a disposable data directory and an isolated port. None of them read or write `server/data/db.json`, so running tests cannot damage existing college content.

## Prerequisites

- Node.js `20.19` or newer (see `package.json` → `engines`).
- Dependencies installed with `npm install`.
- Windows PowerShell: use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.
- `npm run test:ui` also needs Google Chrome installed at `C:/Program Files/Google/Chrome/Application/chrome.exe`. The test drives Chrome through the DevTools Protocol and installs no extra browser package.

## Commands

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:api
npm.cmd run test:prod
npm.cmd run test:ui
```

| Command | Starts | Data directory | Default port |
| --- | --- | --- | --- |
| `npm run typecheck` | Strict `tsc --noEmit` | – | – |
| `npm run build` | Type check then Vite production build into `dist/` | – | – |
| `npm run test:api` | Express API only | `.test-data` | `3199` |
| `npm run test:prod` | Built app in production mode | `.prod-test-data` | `3200` |
| `npm run test:ui` | Built app in production mode + headless Chrome | `.ui-test-data` and `.ui-test-profile` | `3201` (app), `9333` (Chrome) |

Ports can be overridden with `TEST_PORT`, `TEST_PROD_PORT`, `TEST_UI_PORT` and `TEST_UI_DEBUG_PORT`.

All four disposable directories are created on demand, removed when the suite finishes, and are listed in `.gitignore`.

## Last verified run

Run on the local Windows development machine, against the current working tree.

| Suite | Result |
| --- | --- |
| `npm run typecheck` | Passed, no diagnostics |
| `npm run build` | Passed, production bundle written to `dist/` |
| `npm run test:api` | **73 passed, 0 failed** |
| `npm run test:prod` | **50 passed, 0 failed** |
| `npm run test:ui` | **269 passed, 0 failed** |

These counts describe the checks that exist in the scripts. They are not a claim of production readiness, security certification or official approval.

## What the API suite covers

`scripts/api-test.mjs` boots the API with a generated test administrator and exercises the real HTTP surface.

- Health check and public settings/home payloads.
- Public privacy boundaries: contact messages are not exposed publicly; only published results are searchable.
- Authentication: wrong password rejected without a cookie; administrator and teacher sign-in; role read from the server record; session lookup; `no-store` on authentication responses.
- Authorisation: teacher blocked from admin CMS endpoints, self-promotion and notice creation; administrator can create a teacher record, provision a linked teacher account and explicitly create another administrator.
- Academic sessions and programmes are publicly readable and non-empty.
- Results: draft result is not searchable; CSV validation reports duplicates and invalid rows; duplicate-only import can be skipped without changing data; publishing works; published result is searchable only with the correct examination, roll and registration; wrong registration gets a generic 404; result is labelled unofficial; personal result responses are not cacheable.
- Contact form submission, administrator message listing, and retention of IP metadata for administrators only.
- Audit log records sign-ins, result imports, result publication and user provisioning.
- Backups: creation, file name returned, administrator download, and confirmation that the backup does not contain the plaintext administrator password.
- Deletion policy: contact messages can be deleted; notices are archived rather than silently hard-deleted; hard delete returns `405`.
- Sign-out revokes the session, and unknown API routes return a JSON `404`.

## What the production suite covers

`scripts/prod-smoke.mjs` builds on the produced bundle and checks the server behaviour a real visitor would hit.

- Production server starts and `/api/health` reports the production environment.
- Content-Security-Policy present, framing blocked, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- Direct refresh returns the SPA shell for `/`, `/about`, `/teachers`, `/students`, `/results`, `/academics`, `/admission`, `/notices`, `/events`, `/contact`, `/faq`, `/privacy`, `/terms`, `/login`, `/dashboard` and `/dashboard/audit`.
- The SPA shell is not cached; hashed assets are served and cached immutably.
- `robots.txt` is served and disallows `/dashboard`; the favicon is served.
- Unknown API routes return JSON `404`; unknown client routes receive `index.html` and render the in-app not-found page.

## What the browser suite covers

`scripts/ui-smoke.mjs` launches headless Chrome against the production build and inspects the rendered DOM.

- Public routes at desktop `1280×900`: `/`, `/about`, `/teachers`, `/students`, `/results`, `/academics`, `/admission`, `/notices`, `/events`, `/contact`, `/faq`, `/privacy`, `/terms`, `/login`.
- Mobile `360×800` checks for `/`, `/teachers`, `/results`, `/academics`, `/contact`, `/login`.
- Tablet `768×1024` checks for `/`, `/teachers`, `/notices`.
- Dashboard routes at desktop: `/dashboard`, plus notices, events, teachers, students, results, academics, documents, messages, users, settings and audit.
- Dashboard mobile checks for `/dashboard`, `/dashboard/results`, `/dashboard/settings` and `/dashboard/audit`.
- For each page: React root renders, document title is set, the document declares Bangla, visible content exists, no horizontal overflow, no console errors, and expected Bangla text is present.
- Theme toggle applies a theme; the mobile menu button is present.

The suite is a smoke test, not a full interaction test. It does not submit every form, complete a CSV upload through the browser, test keyboard-only navigation, or run an automated accessibility auditor.

## Manual QA checklist

These checks need a human with real content and a real browser.

### Content and official information

- [ ] Confirm the institution name, EIIN `123139`, address and contact details against an official document.
- [ ] Replace every “তথ্য হালনাগাদ করা হচ্ছে” / verification-pending placeholder with verified copy.
- [ ] Delete the demo notices, events and calendar entries after real content is published (`DELETE /api/admin/demo-content` or the dashboard action).
- [ ] Verify Bangla spelling, punctuation and line breaks with a native reviewer.
- [ ] Confirm that no unverified teacher, student, result, fee, deadline, pass rate or affiliation claim appears anywhere.

### Public experience

- [ ] Visit every public route on a real phone, tablet and desktop.
- [ ] Check the sticky header, dropdowns and mobile drawer with touch and keyboard.
- [ ] Toggle dark/light theme on every page and confirm contrast and readability.
- [ ] Submit the contact form and confirm the message appears in the dashboard.
- [ ] Search a published result with correct and incorrect credentials and confirm the generic failure message.
- [ ] Download each published document and confirm the file opens.
- [ ] Confirm the 404 page and direct-link refresh behave correctly on the deployed host.

### Administration

- [ ] Sign in with the provisioned administrator account and change the initial password.
- [ ] Create, edit, publish and archive a notice and an event.
- [ ] Add a teacher record and provision its linked account; confirm the teacher sees only permitted pages.
- [ ] Import a small CSV with one valid row, one duplicate and one invalid row; inspect the preview before importing.
- [ ] Publish the examination, publish the result, then verify the public lookup.
- [ ] Upload a document, confirm download, then archive it and confirm the link stops working.
- [ ] Create a backup, download it, and store it outside the web root.
- [ ] Read the audit log and confirm the actions above are recorded.
- [ ] Try to reach an admin route as a teacher and confirm a `403` response and a friendly UI state.
- [ ] Confirm the last administrator cannot be deleted or demoted.

### Operations

- [ ] Run behind HTTPS with a trusted certificate; confirm cookies are `Secure` and `HttpOnly`.
- [ ] Confirm `.env` is not served, not committed and not present in any build artefact.
- [ ] Confirm database and backup files are outside the public directory.
- [ ] Configure a scheduled backup and test a restore on a copy.
- [ ] Configure log rotation and alerting for repeated `401`/`403` responses.
- [ ] Re-run `npm run test:api`, `npm run test:prod` and `npm run test:ui` against the release candidate.

## Not covered by automation

- Supabase/PostgreSQL migrations and RLS policies: supplied in `supabase/migrations/` but never executed against a live project, because no Supabase CLI or database was available.
- Email delivery, password-reset delivery, MFA, CAPTCHA and malware scanning: not implemented.
- Multi-process or horizontal-scaling behaviour: the JSON store is single-process only.
- Load, soak, penetration and disaster-recovery testing.
- Screen-reader testing and a formal WCAG audit.
- Real payment, SMS or government portal integrations: none exist.

## Reporting a failure

When a check fails, keep the console output, note the command, the port, the Node version and whether the failure reproduces against a clean `.test-data` / `.prod-test-data` / `.ui-test-data` directory. Do not “fix” a failing test by weakening the assertion unless the assertion itself is wrong; record the reason in the commit or change note.
