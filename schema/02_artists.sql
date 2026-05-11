-- ============================================================
-- 02_artists.sql
-- Artists and their base configuration
-- Depends on: nothing
-- ============================================================

create table artists (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  -- greek law: two insurance rate tiers
  insurance_type text not null check (insurance_type in ('A', 'B')),
  phone          text,
  email          text,
  bank_name      text,
  bank_iban      text,
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger artists_updated_at
  before update on artists
  for each row execute function set_updated_at();

create index idx_artists_active on artists(active);
create index idx_artists_name   on artists(full_name);
