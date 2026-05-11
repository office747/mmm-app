-- ============================================================
-- 03_bands.sql
-- Bands and their members over time
-- Depends on: 02_artists.sql
-- ============================================================

create table bands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- membership is time-scoped: a person can leave and rejoin,
-- or be in multiple bands across the season
create table band_members (
  id         uuid primary key default gen_random_uuid(),
  band_id    uuid not null references bands(id) on delete cascade,
  artist_id  uuid not null references artists(id) on delete cascade,
  role       text,                   -- e.g. lead vocalist, guitarist
  valid_from date not null,
  valid_to   date,                   -- null = still active member
  created_at timestamptz not null default now(),

  -- an artist cannot be in the same band twice in overlapping periods
  -- enforced at application level (postgres lacks overlapping exclusion for dates easily without btree_gist)
  constraint band_member_unique unique (band_id, artist_id, valid_from)
);

create trigger bands_updated_at
  before update on bands
  for each row execute function set_updated_at();

create index idx_band_members_band   on band_members(band_id);
create index idx_band_members_artist on band_members(artist_id);
