# Supabase / PostgreSQL production path

> **Status: not connected.** The application currently runs on the local Express JSON store. The SQL in `supabase/migrations/` is a production schema and RLS design, not code that the running app calls. No claim is made that these migrations have been executed against a live Supabase project in this environment (no PostgreSQL/Supabase CLI was available).

## Files

| File | Contents |
| --- | --- |
| `supabase/migrations/202610290001_init.sql` | Extensions, enums, tables, indexes, constraints, updated-at triggers, auth-user profile trigger. |
| `supabase/migrations/202610290002_rls.sql` | Role helpers, RLS policies, role-escalation protection, result-search RPC, private document bucket policies. |

## Apply

With the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Or paste the two files, in order, into the Supabase SQL editor. The schema assumes the standard Supabase `auth` schema and `storage` schema.

Before exposing the project publicly:

1. **Disable public sign-up** in Authentication → Providers → Email if accounts are only issued by the college. The trigger creates an `inactive` profile, so even a stray sign-up cannot read student data.
2. Keep the `service_role` key on the server only. Never ship it to Vite (`VITE_*` variables are public).
3. Configure the site URL and allowed redirect URLs for password recovery and e-mail confirmation.
4. Apply both migrations to a staging project first and run the RLS test checklist below.

## First administrator

Create the auth user through the Supabase dashboard (or Admin API), then promote the matching profile in the SQL editor. SQL editor/service-role work bypasses RLS by design.

```sql
-- Replace with the real administrator e-mail and display name.
update public.profiles
set role = 'admin',
    status = 'active',
    display_name = 'College Administrator',
    must_change_password = true,
    updated_at = now()
where lower(email) = lower('admin@example.edu.bd');
```

Do **not** promote users by editing `raw_user_meta_data` in the browser or by trusting a client-supplied role. The app and the RLS helpers read `public.profiles.role`.

To link a teacher or student account:

```sql
-- Teacher
update public.profiles p
set role = 'teacher',
    status = 'active',
    linked_id = t.id
from public.teachers t
where lower(p.email) = lower('teacher@example.edu.bd')
  and t.id = '<teacher-uuid>';

-- Student
update public.profiles p
set role = 'student',
    status = 'active',
    linked_id = s.id
from public.students s
where lower(p.email) = lower('student@example.edu.bd')
  and s.id = '<student-uuid>';
```

`linked_id` is intentionally not a foreign key because it points at either `teachers` or `students` depending on the role. Validate it in server code.

## RLS model

| Data | Anonymous | Student | Teacher | Admin |
| --- | --- | --- | --- | --- |
| Site settings | Read | Read | Read | Read/write |
| Notices, events, calendar, published exams/routines/documents | Published only | Published only | Published only | Full |
| Teachers | Active only | Active only | Active + own record | Full |
| Students | None | Own record; contact fields editable | Assigned sessions only | Full |
| Results | None | Own published only | None | Full |
| Public result search | RPC with exam + roll + registration | Same | Same | Same |
| Contact messages | Insert only | Insert only | Insert only | Full |
| Profiles | None | Own | Own | Full |
| Audit log | None | None | None | Read |
| Document storage bucket | None | None | None | Full (private bucket) |

Public result lookup deliberately does **not** grant table `SELECT` to `anon`. It calls:

```sql
select public.search_published_result(
  '<examination-uuid>'::uuid,
  'ROLL-123',
  'REG-456'
);
```

The function returns `null` when any condition fails: examination not published, result not published, or roll/registration mismatch. Apply a rate limit at the edge/API layer; the database function is not a rate limiter.

## Storage

- Bucket `documents` is private, 8 MB limit, with an allowed MIME list matching the Express uploader.
- Only active administrators can read/write objects directly.
- Public downloads must be issued as short-lived signed URLs **after** checking `documents.status = 'published'` in trusted server code.
- The current Express app stores uploads under `server/data/uploads` and serves them through controlled API routes.

## What still has to be built for a real Supabase deployment

The migrations are only one layer. A complete integration requires:

1. **Auth adapter** — replace the local `kadc_session` cookie flow with Supabase Auth, server-side session verification, password recovery e-mail, and linking of `auth.users.id` to `profiles`.
2. **Data adapter** — replace `server/db.mjs` reads/writes with Supabase queries or a server-side BFF using the service role. Keep the same API contracts so the React app does not need a rewrite.
3. **Server authorization** — continue checking roles server-side; RLS is defence in depth, not a substitute for endpoint checks.
4. **Result search** — call `search_published_result()` from the API and keep the generic not-found response.
5. **CSV import** — perform validation and duplicate checks in a transaction; current local implementation loops in memory.
6. **Audit writes** — write audit rows with the service role (no public insert policy exists).
7. **Storage** — move uploads to the private bucket and use signed URLs.
8. **Backups** — use Supabase PITR/database backups; the JSON backup screen is local-mode only.
9. **Rate limiting** — move login, contact, reset and result-search limits to the edge or a shared store. The current limiter is in-memory.
10. **RLS tests** — run the checklist below against staging with anon, student, teacher and admin JWTs.

## RLS test checklist

Run with real JWTs for each role (Supabase SQL editor runs as a privileged role and will not prove RLS):

- [ ] Anon can read published notices/events/calendar only; drafts and archived rows are invisible.
- [ ] Anon cannot select `students`, `results`, `contact_messages`, `profiles` or `audit_logs`.
- [ ] Anon `search_published_result` returns data only for a published exam + matching roll + matching registration.
- [ ] A draft result is never returned by the RPC, even with correct roll/registration.
- [ ] Student A cannot read Student B's profile, results or contact details.
- [ ] Student cannot change their own roll, registration, session, programme or status.
- [ ] Teacher can read only students in assigned sessions and cannot read admin tables.
- [ ] Teacher cannot change roles, content, settings or results.
- [ ] A non-admin update to `profiles.role` fails with `42501`.
- [ ] An admin cannot demote or deactivate their own account.
- [ ] The last active administrator cannot be demoted or deactivated.
- [ ] Admin can manage content and users; audit rows are written but not editable.
- [ ] `documents` bucket is private; anon object reads fail and signed URLs expire.
- [ ] Contact message insert works; anonymous select/update/delete fails.
