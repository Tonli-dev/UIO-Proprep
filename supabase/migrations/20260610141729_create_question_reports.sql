create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  category_id text,
  question_text text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  reported_answer text,
  suggested_answer text not null check (btrim(suggested_answer) <> ''),
  note text,
  source text,
  question_access text not null default 'free' check (question_access in ('free', 'premium')),
  content_version text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index question_reports_status_created_at_idx
  on public.question_reports(status, created_at desc);

create index question_reports_question_id_idx
  on public.question_reports(question_id);

create unique index question_reports_user_question_pending_idx
  on public.question_reports(user_id, question_id)
  where status = 'pending';

alter table public.question_reports enable row level security;

revoke all on table public.question_reports from anon;
revoke all on table public.question_reports from authenticated;
grant select, insert on table public.question_reports to authenticated;

create policy "Users read own question reports"
  on public.question_reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own question reports"
  on public.question_reports
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and resolution_note is null
  );
