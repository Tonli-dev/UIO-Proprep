create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress_baselines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary jsonb not null default '{"quizzesDone":0,"answersTotal":0,"answersCorrect":0,"categories":{}}'::jsonb,
  wrong_question_ids text[] not null default '{}',
  migrated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.answer_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  category_id text not null,
  is_correct boolean not null,
  answered_at timestamptz not null,
  content_version text
);

create table public.quiz_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  label text not null,
  total integer not null check (total >= 0),
  correct integer not null check (correct >= 0 and correct <= total),
  percent integer not null check (percent between 0 and 100),
  passed boolean not null,
  wrong_question_ids text[] not null default '{}',
  content_version text,
  completed_at timestamptz not null
);

create table public.premium_questions (
  id text primary key,
  category_id text not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer_index integer not null check (answer_index between 0 and 3),
  rationale text not null,
  source text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  keywords text[] not null default '{}',
  content_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index answer_events_user_id_idx on public.answer_events(user_id);
create index answer_events_answered_at_idx on public.answer_events(answered_at desc);
create index answer_events_category_id_idx on public.answer_events(category_id);
create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
create index quiz_attempts_completed_at_idx on public.quiz_attempts(completed_at desc);
create index premium_questions_category_id_idx on public.premium_questions(category_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.entitlements (user_id, tier) values (new.id, 'free');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.progress_baselines enable row level security;
alter table public.answer_events enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.premium_questions enable row level security;

create policy "Users read own profile" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users read own entitlement" on public.entitlements
  for select using ((select auth.uid()) = user_id);

create policy "Users read own baseline" on public.progress_baselines
  for select using ((select auth.uid()) = user_id);
create policy "Users insert own baseline" on public.progress_baselines
  for insert with check ((select auth.uid()) = user_id);
create policy "Users update own baseline" on public.progress_baselines
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own baseline" on public.progress_baselines
  for delete using ((select auth.uid()) = user_id);

create policy "Users read own answer events" on public.answer_events
  for select using ((select auth.uid()) = user_id);
create policy "Users insert own answer events" on public.answer_events
  for insert with check ((select auth.uid()) = user_id);
create policy "Users delete own answer events" on public.answer_events
  for delete using ((select auth.uid()) = user_id);

create policy "Users read own quiz attempts" on public.quiz_attempts
  for select using ((select auth.uid()) = user_id);
create policy "Users insert own quiz attempts" on public.quiz_attempts
  for insert with check ((select auth.uid()) = user_id);
create policy "Users update own quiz attempts" on public.quiz_attempts
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own quiz attempts" on public.quiz_attempts
  for delete using ((select auth.uid()) = user_id);

create policy "Active premium users read premium questions" on public.premium_questions
  for select using (
    exists (
      select 1
      from public.entitlements
      where entitlements.user_id = (select auth.uid())
        and entitlements.tier = 'premium'
        and (entitlements.expires_at is null or entitlements.expires_at > now())
    )
  );

insert into public.premium_questions
  (id, category_id, question, options, answer_index, rationale, source, difficulty, keywords, content_version)
values
  (
    'kanc-002',
    'kanc',
    'U omot koje boje se ulažu prvostepeni predmeti upravnog postupka po zahtjevu stranke?',
    '["Plave boje","Bijele boje","Zelene boje","Žute boje"]'::jsonb,
    2,
    'Predmeti pokrenuti po zahtjevu stranke ulažu se u zeleni omot.',
    'Interni ispitni materijal / provjeriti sa zvaničnim programom',
    'medium',
    array['omot','zelena boja','upravni postupak','stranka'],
    '2026.06.04-mvp'
  ),
  (
    'car-001',
    'carine',
    'Koliko iznosi jedinstvena stopa carine ad valorem prema carinskim propisima BiH?',
    '["17%","5%","10%","12%"]'::jsonb,
    2,
    'Jedinstvena carinska stopa u ovom kontekstu iznosi 10% ad valorem.',
    'Interni ispitni materijal / provjeriti sa zvaničnim programom',
    'medium',
    array['carina','ad valorem','10%','stopa'],
    '2026.06.04-mvp'
  ),
  (
    'car-003',
    'carine',
    'Šta označava skraćenica NCTS?',
    '["Nacionalni carinski tarifni sistem","Novi kompjuterizovani tranzitni sistem","Nadzor carinskih teretnih stanica","Nacrt carinske tehnološke saradnje"]'::jsonb,
    1,
    'NCTS je novi kompjuterizovani tranzitni sistem.',
    'Interni ispitni materijal / provjeriti sa zvaničnim programom',
    'hard',
    array['ncts','tranzit','kompjuterizovani sistem'],
    '2026.06.04-mvp'
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  question = excluded.question,
  options = excluded.options,
  answer_index = excluded.answer_index,
  rationale = excluded.rationale,
  source = excluded.source,
  difficulty = excluded.difficulty,
  keywords = excluded.keywords,
  content_version = excluded.content_version,
  updated_at = now();
