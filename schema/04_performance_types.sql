-- ============================================================
-- 04_performance_types.sql
-- Performance type names per hotel — free form, no rate table
-- Staff create their own types per hotel (e.g. "Evening Jazz",
-- "Pool DJ", "Dinner Quartet") — rates are entered per gig
-- Depends on: 01_hotels.sql
-- ============================================================

create table performance_types (
  id         uuid primary key default gen_random_uuid(),
  hotel_id   uuid not null references hotels(id) on delete cascade,
  name       text not null,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- same name can exist across hotels but not twice for the same hotel
  unique (hotel_id, name)
);

create trigger performance_types_updated_at
  before update on performance_types
  for each row execute function set_updated_at();

create index idx_performance_types_hotel on performance_types(hotel_id);
