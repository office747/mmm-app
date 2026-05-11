-- ============================================================
-- 01_hotels.sql
-- Hotels, contacts, billing configuration
-- ============================================================

create table hotels (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  legal_name   text,                        -- e.g. ΑΡΙΩΝ ΑΞΤΕ 999273094
  billing_cycle text not null check (billing_cycle in ('daily', 'weekly')),
  vat_number   text,
  season_start date,
  season_end   date,
  notes        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- one primary billing contact per hotel, others are cc
create table hotel_contacts (
  id         uuid primary key default gen_random_uuid(),
  hotel_id   uuid not null references hotels(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  is_primary boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

-- updated_at trigger (reused across all domains)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger hotels_updated_at
  before update on hotels
  for each row execute function set_updated_at();

-- indexes
create index idx_hotels_active on hotels(active);
