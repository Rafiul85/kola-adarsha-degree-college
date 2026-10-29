-- Kola Adarsha Degree College — Row Level Security policies.
-- Apply after 202610290001_init.sql.
--
-- Principles:
--   * The browser never receives a password hash, student list or draft result.
--   * Roles are read from public.profiles, never trusted from JWT user metadata.
--   * Public result lookup is a SECURITY DEFINER function requiring exam + roll
--     + registration; the results table is not directly readable by anon.
--   * Only active administrators can change content, roles or settings.
--   * Audit logs are readable by administrators and written by trusted server
--     code / SECURITY DEFINER functions only.

-- --------------------------------------------------------------------------
-- Role helpers
-- --------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'teacher'
      and status = 'active'
  );
$$;

create or replace function public.my_linked_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select linked_id
  from public.profiles
  where id = auth.uid()
    and status = 'active';
$$;

create or replace function public.is_assigned_teacher(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    join public.teachers t on t.id = p.linked_id
    where p.id = auth.uid()
      and p.role = 'teacher'
      and p.status = 'active'
      and t.status <> 'archived'
      and p_session_id = any (t.assigned_sessions)
  );
$$;

-- --------------------------------------------------------------------------
-- Protect against role self-promotion and removing the last administrator
-- --------------------------------------------------------------------------

create or replace function public.protect_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- auth.uid() is null for the service role, migrations and SQL editor work.
  if auth.uid() is not null then
    if not public.is_admin() then
      if new.role is distinct from old.role
         or new.status is distinct from old.status
         or new.linked_id is distinct from old.linked_id then
        raise exception 'Only an active administrator can change roles, status or linked records.'
          using errcode = '42501';
      end if;
    end if;

    if auth.uid() = old.id and new.role is distinct from old.role then
      raise exception 'Administrators cannot change their own role.'
        using errcode = '42501';
    end if;

    if auth.uid() = old.id and new.status is distinct from old.status then
      raise exception 'Administrators cannot change their own account status.'
        using errcode = '42501';
    end if;
  end if;

  if old.role = 'admin'
     and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active') then
    if not exists (
      select 1
      from public.profiles
      where id <> old.id
        and role = 'admin'
        and status = 'active'
    ) then
      raise exception 'At least one active administrator must remain.'
        using errcode = '23514';
    end if;
  end if;

  if new.role is distinct from old.role then
    insert into public.audit_logs (actor_id, actor_name, actor_role, action, entity, entity_id, details)
    values (
      auth.uid(),
      coalesce(new.display_name, 'System'),
      'system',
      'profile.role_change',
      'profiles',
      new.id::text,
      old.role::text || ' → ' || new.role::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_changes on public.profiles;
create trigger profiles_protect_changes
before update on public.profiles
for each row execute function public.protect_profile_changes();

-- --------------------------------------------------------------------------
-- Enable RLS on every table
-- --------------------------------------------------------------------------

alter table public.site_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.academic_sessions enable row level security;
alter table public.programs enable row level security;
alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.routines enable row level security;
alter table public.examinations enable row level security;
alter table public.results enable row level security;
alter table public.result_subjects enable row level security;
alter table public.notices enable row level security;
alter table public.events enable row level security;
alter table public.calendar_items enable row level security;
alter table public.documents enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- --------------------------------------------------------------------------
-- Site settings
-- --------------------------------------------------------------------------

create policy site_settings_public_read
on public.site_settings for select
to anon, authenticated
using (true);

create policy site_settings_admin_write
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Profiles
-- --------------------------------------------------------------------------

create policy profiles_self_read
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy profiles_admin_read
on public.profiles for select
to authenticated
using (public.is_admin());

create policy profiles_admin_write
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- No insert policy: profiles are created by handle_new_user() or server code.
-- No delete policy: deactivate accounts instead of deleting audit identity.

-- --------------------------------------------------------------------------
-- Academic structure
-- --------------------------------------------------------------------------

create policy academic_sessions_public_read
on public.academic_sessions for select
to anon, authenticated
using (status = 'active');

create policy academic_sessions_admin_all
on public.academic_sessions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy programs_public_read
on public.programs for select
to anon, authenticated
using (status = 'active');

create policy programs_admin_all
on public.programs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy subjects_public_read
on public.subjects for select
to anon, authenticated
using (status = 'active');

create policy subjects_admin_all
on public.subjects for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Teachers and students
-- --------------------------------------------------------------------------

create policy teachers_public_read
on public.teachers for select
to anon, authenticated
using (status = 'active');

create policy teachers_self_read
on public.teachers for select
to authenticated
using (id = public.my_linked_id() and public.is_teacher());

create policy teachers_admin_all
on public.teachers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy students_admin_all
on public.students for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy students_self_read
on public.students for select
to authenticated
using (id = public.my_linked_id());

create policy students_assigned_teacher_read
on public.students for select
to authenticated
using (public.is_assigned_teacher(session_id));

-- Students can keep their own contact details current, but cannot alter roll,
-- registration, session, programme, results or account status.
create policy students_self_contact_update
on public.students for update
to authenticated
using (id = public.my_linked_id())
with check (id = public.my_linked_id());

create or replace function public.restrict_student_self_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id <> old.id
       or new.student_id is distinct from old.student_id
       or new.roll is distinct from old.roll
       or new.registration is distinct from old.registration
       or new.session_id is distinct from old.session_id
       or new.program_id is distinct from old.program_id
       or new.group_name is distinct from old.group_name
       or new.status is distinct from old.status then
      raise exception 'Students may only update their own contact details.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists students_restrict_self_update on public.students;
create trigger students_restrict_self_update
before update on public.students
for each row execute function public.restrict_student_self_update();

-- --------------------------------------------------------------------------
-- Routines, examinations and results
-- --------------------------------------------------------------------------

create policy routines_public_read
on public.routines for select
to anon, authenticated
using (status = 'published');

create policy routines_admin_all
on public.routines for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy examinations_public_read
on public.examinations for select
to anon, authenticated
using (status = 'published');

create policy examinations_admin_all
on public.examinations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy results_admin_all
on public.results for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy results_student_own_published
on public.results for select
to authenticated
using (
  student_id = public.my_linked_id()
  and status = 'published'
  and exists (
    select 1 from public.examinations e
    where e.id = examination_id and e.status = 'published'
  )
);

create policy result_subjects_admin_all
on public.result_subjects for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy result_subjects_student_own
on public.result_subjects for select
to authenticated
using (
  exists (
    select 1
    from public.results r
    where r.id = result_id
      and r.student_id = public.my_linked_id()
      and r.status = 'published'
  )
);

-- --------------------------------------------------------------------------
-- Public content
-- --------------------------------------------------------------------------

create policy notices_public_read
on public.notices for select
to anon, authenticated
using (status = 'published');

create policy notices_admin_all
on public.notices for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy events_public_read
on public.events for select
to anon, authenticated
using (status = 'published');

create policy events_admin_all
on public.events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy calendar_public_read
on public.calendar_items for select
to anon, authenticated
using (status = 'published');

create policy calendar_admin_all
on public.calendar_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy documents_public_read
on public.documents for select
to anon, authenticated
using (status = 'published');

create policy documents_admin_all
on public.documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Contact messages and audit logs
-- --------------------------------------------------------------------------

create policy contact_messages_public_insert
on public.contact_messages for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(name) between 2 and 120
  and char_length(subject) between 3 and 160
  and char_length(message) between 10 and 5000
);

create policy contact_messages_admin_read
on public.contact_messages for select
to authenticated
using (public.is_admin());

create policy contact_messages_admin_update
on public.contact_messages for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy contact_messages_admin_delete
on public.contact_messages for delete
to authenticated
using (public.is_admin());

create policy audit_logs_admin_read
on public.audit_logs for select
to authenticated
using (public.is_admin());

-- No insert/update/delete policies for audit_logs. Trusted server code using the
-- service role (which bypasses RLS) and SECURITY DEFINER functions write here.

-- --------------------------------------------------------------------------
-- Public result lookup (exam + roll + registration)
-- --------------------------------------------------------------------------

create or replace function public.search_published_result(
  p_examination_id uuid,
  p_roll text,
  p_registration text
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id,
    'studentName', r.student_name,
    'roll', r.roll,
    'registration', r.registration,
    'gpa', r.gpa,
    'outcome', r.outcome,
    'publishedAt', r.published_at,
    'sessionName', s.name,
    'programName', p.name_bn,
    'group', st.group_name,
    'unofficial', true,
    'generatedAt', now(),
    'examination', jsonb_build_object(
      'id', e.id,
      'name', e.name,
      'sessionId', e.session_id,
      'programId', e.program_id,
      'startDate', e.start_date,
      'endDate', e.end_date,
      'status', e.status
    ),
    'subjects', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('name', rs.name, 'marks', rs.marks)
          order by rs.position, rs.name
        )
        from public.result_subjects rs
        where rs.result_id = r.id
      ),
      '[]'::jsonb
    )
  )
  from public.results r
  join public.examinations e on e.id = r.examination_id
  left join public.academic_sessions s on s.id = e.session_id
  left join public.programs p on p.id = e.program_id
  left join public.students st on st.id = r.student_id
  where r.examination_id = p_examination_id
    and e.status = 'published'
    and r.status = 'published'
    and upper(btrim(r.roll)) = upper(btrim(p_roll))
    and upper(btrim(r.registration)) = upper(btrim(p_registration))
  limit 1;
$$;

revoke all on function public.search_published_result(uuid, text, text) from public;
grant execute on function public.search_published_result(uuid, text, text) to anon, authenticated;

-- Convenience metadata for the public results page. Only counts published data.
create or replace function public.published_result_meta()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'examinations', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'sessionId', e.session_id,
            'programId', e.program_id,
            'startDate', e.start_date,
            'endDate', e.end_date,
            'status', e.status
          )
          order by e.start_date desc nulls last
        )
        from public.examinations e
        where e.status = 'published'
      ),
      '[]'::jsonb
    ),
    'latestPublishedAt', (
      select max(r.published_at)
      from public.results r
      where r.status = 'published'
    ),
    'totalPublishedResults', (
      select count(*)
      from public.results r
      where r.status = 'published'
    )
  );
$$;

revoke all on function public.published_result_meta() from public;
grant execute on function public.published_result_meta() to anon, authenticated;

-- --------------------------------------------------------------------------
-- Private document storage
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  8388608,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

drop policy if exists documents_storage_admin_all on storage.objects;
create policy documents_storage_admin_all
on storage.objects for all
to authenticated
using (bucket_id = 'documents' and public.is_admin())
with check (bucket_id = 'documents' and public.is_admin());

-- Public downloads should be issued as short-lived signed URLs by trusted
-- server code after checking documents.status = 'published'. Do not make the
-- bucket public.
