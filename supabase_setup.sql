-- =============================================
-- Ünye Amatör Voleybol Topluluğu
-- Supabase Kurulum SQL
-- Supabase → SQL Editor'e yapıştırıp çalıştırın
-- =============================================

-- Tablolar
create table if not exists public.news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  content text,
  category text default 'Genel',
  image_url text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sliders (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  image_url text,
  published boolean default false,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gallery (
  id uuid default gen_random_uuid() primary key,
  title text,
  url text not null,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text default 'Antrenman',
  date date,
  time text,
  location text,
  capacity integer,
  image_url text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.polls (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  options jsonb default '[]'::jsonb,
  votes jsonb default '{}'::jsonb,
  published boolean default false,
  visibility text default 'public',
  event_id bigint,
  event_title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.match_requests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  type text default 'oyuncu',
  status text default 'bekliyor',
  event_id bigint,
  event_title text,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  id text primary key,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Varsayılan settings satırı
insert into public.settings (id, data) values ('siteConfig', '{}') on conflict do nothing;

-- =============================================
-- Row Level Security (RLS)
-- =============================================
alter table public.news enable row level security;
alter table public.sliders enable row level security;
alter table public.gallery enable row level security;
alter table public.events enable row level security;
alter table public.polls enable row level security;
alter table public.match_requests enable row level security;
alter table public.settings enable row level security;

-- Herkes yayımdaki içerikleri okuyabilir
create policy "public_read_news" on public.news for select using (published = true);
create policy "public_read_sliders" on public.sliders for select using (published = true);
create policy "public_read_gallery" on public.gallery for select using (published = true);
create policy "public_read_events" on public.events for select using (published = true);
create policy "public_read_polls" on public.polls for select using (published = true);
create policy "public_read_settings" on public.settings for select using (true);

-- Herkes anket oyu verebilir
create policy "public_vote_polls" on public.polls for update using (true) with check (true);

-- Giriş yapan admin her şeyi yapabilir
create policy "admin_all_news" on public.news for all using (auth.role() = 'authenticated');
create policy "admin_all_sliders" on public.sliders for all using (auth.role() = 'authenticated');
create policy "admin_all_gallery" on public.gallery for all using (auth.role() = 'authenticated');
create policy "admin_all_events" on public.events for all using (auth.role() = 'authenticated');
create policy "admin_all_polls" on public.polls for all using (auth.role() = 'authenticated');
create policy "public_insert_match_requests" on public.match_requests for insert with check (true);
create policy "admin_all_match_requests" on public.match_requests for all using (auth.role() = 'authenticated');
create policy "admin_all_settings" on public.settings for all using (auth.role() = 'authenticated');

-- =============================================
-- Realtime (gerçek zamanlı güncellemeler)
-- =============================================
alter publication supabase_realtime add table public.news;
alter publication supabase_realtime add table public.sliders;
alter publication supabase_realtime add table public.gallery;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.settings;
