-- OmniScreen: screening_history table setup
-- Run this in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run

-- 1. The table the app expects
create table if not exists public.screening_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  smiles text not null,
  prediction_probability real,
  confidence_score real,
  drug_likeness_pass text,
  created_at timestamptz not null default now()
);

-- 2. Row Level Security: users can only see/modify their own history
alter table public.screening_history enable row level security;

drop policy if exists "Users can view own history" on public.screening_history;
create policy "Users can view own history"
  on public.screening_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.screening_history;
create policy "Users can insert own history"
  on public.screening_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own history" on public.screening_history;
create policy "Users can delete own history"
  on public.screening_history for delete
  using (auth.uid() = user_id);

-- 3. Needed for real-time features if you ever use them (safe to include)
alter publication supabase_realtime add table public.screening_history;
