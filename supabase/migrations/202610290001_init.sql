-- Kola Adarsha Degree College — production schema for Supabase / PostgreSQL.
--
-- IMPORTANT: the running application in this repository uses the local Express
-- JSON store. These migrations are the documented production path and are NOT
-- applied automatically by `npm run dev` or `npm start`. Read
-- docs/SUPABASE.md before applying them.
--
-- Apply with the Supabase CLI:
--   supabase db push
-- or paste both migration files into the Supabase SQL editor in order.

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- Enumerated values (kept in sync with server/schemas.mjs)
-- --------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'teacher', 'student');
create type public.account_status as enum ('active', 'inactive');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.result_status as enum ('draft', 'review', 'published', 'archived');
create type public.result_outcome as enum ('pass', 'fail', 'withheld', 'absent');
create type public.teacher_status as enum ('active', 'inactive', 'archived');
create type public.student_status as enum ('active', 'inactive', 'graduated', 'archived');
create type public.session_status as enum ('active', 'inactive');
create type public.employment_type as enum ('full_time', 'part_time', 'guest', 'other');
create type public.teacher_category as enum ('principal', 'vice_principal', 'lecturer', 'administrative', 'support');
create type public.program_level as enum ('HSC', 'DEGREE', 'OTHER');
create type public.routine_status as enum ('draft', 'published');
create type public.examination_status as enum ('draft', 'published', 'archived');
create type public.calendar_type as enum ('admission', 'academic', 'examination', 'holiday', 'result', 'other');
create type public.message_status as enum ('new', 'read', 'archived');

-- --------------------------------------------------------------------------
-- Shared trigger functions
-- --------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Site settings (singleton; mirrors Settings in src/lib/types.ts)
-- --------------------------------------------------------------------------

create table public.site_settings (
  id boolean primary key default true check (id),
  institution jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  admission jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Accounts
-- --------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role public.user_role not null default 'student',
  status public.account_status not null default 'inactive',
  -- teachers.id or students.id, depending on role. Deliberately not a foreign
  -- key because the target table differs by role; validated by the application.
  linked_id uuid,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_key on public.profiles (lower(email));
create index profiles_role_status_idx on public.profiles (role, status);
create index profiles_linked_idx on public.profiles (linked_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create an inactive, unlinked profile for every new auth user. Public sign-up
-- should be disabled in Supabase Auth; administrators activate and link records.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    lower(coalesce(new.email, new.id::text)),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    'student',
    'inactive'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles
  set email = lower(coalesce(new.email, email)), updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.sync_profile_email();

-- --------------------------------------------------------------------------
-- Academic structure
-- --------------------------------------------------------------------------

create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  status public.session_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_sessions_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create unique index academic_sessions_name_key on public.academic_sessions (lower(name));
create trigger academic_sessions_set_updated_at
before update on public.academic_sessions
for each row execute function public.set_updated_at();

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name_bn text not null,
  name_en text not null default '',
  level public.program_level not null default 'HSC',
  groups text[] not null default '{}',
  verified boolean not null default false,
  status public.session_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger programs_set_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null default '',
  name_bn text not null,
  name_en text not null default '',
  program_id uuid references public.programs (id) on delete set null,
  group_name text not null default '',
  status public.session_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subjects_program_idx on public.subjects (program_id);
create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- People
-- --------------------------------------------------------------------------

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null default '',
  department text not null default '',
  qualification text not null default '',
  employment_type public.employment_type not null default 'full_time',
  email text not null default '',
  office_hours text not null default '',
  bio text not null default '',
  category public.teacher_category not null default 'lecturer',
  assigned_sessions uuid[] not null default '{}',
  status public.teacher_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teachers_status_idx on public.teachers (status);
create index teachers_assigned_sessions_idx on public.teachers using gin (assigned_sessions);
create trigger teachers_set_updated_at
before update on public.teachers
for each row execute function public.set_updated_at();

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  student_id text not null,
  roll text not null,
  registration text not null default '',
  session_id uuid references public.academic_sessions (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  group_name text not null default '',
  subjects text[] not null default '{}',
  guardian_phone text not null default '',
  phone text not null default '',
  dob date,
  address text not null default '',
  status public.student_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index students_student_id_lower_key on public.students (lower(student_id));
create unique index students_session_roll_key
  on public.students (session_id, upper(roll))
  where session_id is not null and btrim(roll) <> '';
create index students_session_idx on public.students (session_id);
create index students_program_idx on public.students (program_id);
create index students_status_idx on public.students (status);
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Teaching, examinations and results
-- --------------------------------------------------------------------------

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academic_sessions (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  group_name text not null default '',
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  subject text not null,
  room text not null default '',
  teacher_id uuid references public.teachers (id) on delete set null,
  status public.routine_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routines_day_check check (
    day_of_week in ('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday')
  ),
  constraint routines_time_check check (end_time > start_time)
);

create index routines_session_idx on public.routines (session_id);
create index routines_teacher_idx on public.routines (teacher_id);
create trigger routines_set_updated_at
before update on public.routines
for each row execute function public.set_updated_at();

create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session_id uuid references public.academic_sessions (id) on delete set null,
  program_id uuid references public.programs (id) on delete set null,
  start_date date,
  end_date date,
  status public.examination_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint examinations_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create index examinations_status_idx on public.examinations (status);
create trigger examinations_set_updated_at
before update on public.examinations
for each row execute function public.set_updated_at();

create table public.results (
  id uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations (id) on delete cascade,
  roll text not null,
  registration text not null default '',
  student_name text not null,
  gpa numeric(3,2),
  outcome public.result_outcome not null,
  status public.result_status not null default 'draft',
  published_at timestamptz,
  student_id uuid references public.students (id) on delete set null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint results_gpa_range check (gpa is null or (gpa >= 0 and gpa <= 5)),
  constraint results_published_requires_date check (status <> 'published' or published_at is not null)
);

create unique index results_exam_roll_key on public.results (examination_id, upper(roll));
create unique index results_exam_registration_key
  on public.results (examination_id, upper(registration))
  where btrim(registration) <> '';
create index results_student_idx on public.results (student_id);
create index results_status_idx on public.results (status);
create trigger results_set_updated_at
before update on public.results
for each row execute function public.set_updated_at();

create table public.result_subjects (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results (id) on delete cascade,
  name text not null,
  marks numeric(5,2) not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint result_subjects_marks_range check (marks >= 0 and marks <= 100)
);

create index result_subjects_result_idx on public.result_subjects (result_id);

-- --------------------------------------------------------------------------
-- Public content
-- --------------------------------------------------------------------------

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'সাধারণ',
  summary text not null default '',
  body text not null default '',
  published_at timestamptz,
  deadline date,
  pinned boolean not null default false,
  attachment_url text not null default '',
  audience text not null default 'all',
  session_id uuid references public.academic_sessions (id) on delete set null,
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_audience_check check (audience in ('all', 'student', 'teacher'))
);

create index notices_status_published_idx on public.notices (status, published_at desc);
create trigger notices_set_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  venue text not null default '',
  registration_info text not null default '',
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates check (end_date is null or end_date >= start_date)
);

create index events_status_date_idx on public.events (status, start_date);
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create table public.calendar_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  end_date date,
  type public.calendar_type not null default 'other',
  note text not null default '',
  provisional boolean not null default false,
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_items_dates check (end_date is null or end_date >= date)
);

create index calendar_items_status_date_idx on public.calendar_items (status, date);
create trigger calendar_items_set_updated_at
before update on public.calendar_items
for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'সাধারণ',
  filename text not null,
  stored_name text not null,
  mime_type text not null,
  size bigint not null default 0 check (size >= 0),
  uploaded_at timestamptz not null default now(),
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_status_idx on public.documents (status);
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null,
  message text not null,
  status public.message_status not null default 'new',
  ip text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null default 'System',
  actor_role text not null default 'system',
  action text not null,
  entity text not null,
  entity_id text not null default '',
  details text not null default '',
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
