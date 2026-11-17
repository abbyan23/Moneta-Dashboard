-- Aman dijalankan ulang. Supabase: SQL Editor > New query > Run
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data add column if not exists rev integer not null default 0;
alter table public.user_data enable row level security;
drop policy if exists "baca data sendiri"   on public.user_data;
drop policy if exists "tambah data sendiri" on public.user_data;
drop policy if exists "ubah data sendiri"   on public.user_data;
drop policy if exists "hapus data sendiri"  on public.user_data;
create policy "baca data sendiri"   on public.user_data for select using (auth.uid() = user_id);
create policy "tambah data sendiri" on public.user_data for insert with check (auth.uid() = user_id);
create policy "ubah data sendiri"   on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hapus data sendiri"  on public.user_data for delete using (auth.uid() = user_id);
-- Realtime: perubahan di satu perangkat langsung muncul di perangkat lain
do $$ begin
  alter publication supabase_realtime add table public.user_data;
exception when duplicate_object then null; end $$;
