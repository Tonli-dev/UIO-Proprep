create table public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'lemon_squeezy' check (provider in ('lemon_squeezy')),
  provider_order_id text not null,
  provider_variant_id text not null,
  package_id text not null check (package_id in ('premium_30_days', 'premium_90_days', 'premium_lifetime')),
  status text not null check (status in ('paid', 'refunded', 'chargeback', 'cancelled')),
  amount integer not null check (amount >= 0),
  currency text not null default 'BAM',
  starts_at timestamptz,
  expires_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create index premium_purchases_user_id_idx on public.premium_purchases(user_id);
create index premium_purchases_status_idx on public.premium_purchases(status);
create index premium_purchases_expires_at_idx on public.premium_purchases(expires_at);

alter table public.premium_purchases enable row level security;

create policy "Users read own premium purchases" on public.premium_purchases
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.premium_purchases from anon, authenticated;
