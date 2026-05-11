-- ============================================================
-- 05_gigs.sql
-- Gigs (central table) and per-gig artist assignments
-- Depends on: 01_hotels.sql, 02_artists.sql, 03_bands.sql,
--             04_performance_types.sql
-- ============================================================

create table gigs (
  id                  uuid primary key default gen_random_uuid(),

  hotel_id            uuid not null references hotels(id) on delete restrict,
  performance_type_id uuid references performance_types(id) on delete set null,
  band_id             uuid references bands(id) on delete set null,

  gig_date            date not null,

  -- what MMM charges the hotel for this gig
  -- entered manually per gig, no default lookup
  hotel_price         numeric(10,2) not null,

  status              text not null default 'planned'
                        check (status in ('planned', 'confirmed', 'performed', 'cancelled')),

  -- who initiated this gig
  source              text not null default 'contract'
                        check (source in ('contract', 'hotel_request', 'mmm_initiative')),

  -- set when gig was created via recurrence to help staff identify origin
  -- e.g. "Weekly every Monday — series created 01/05/2025"
  -- no hard link to a parent; each gig is fully independent
  recurrence_note     text,

  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger gigs_updated_at
  before update on gigs
  for each row execute function set_updated_at();

create index idx_gigs_hotel      on gigs(hotel_id);
create index idx_gigs_date       on gigs(gig_date);
create index idx_gigs_status     on gigs(status);
create index idx_gigs_hotel_date on gigs(hotel_id, gig_date);


-- ============================================================
-- who actually performed at each gig
-- one row per artist per gig
-- ============================================================

create table gig_artists (
  id          uuid primary key default gen_random_uuid(),
  gig_id      uuid not null references gigs(id) on delete cascade,
  artist_id   uuid not null references artists(id) on delete restrict,

  role        text,

  -- artist fee for this gig — entered manually, no lookup
  fee         numeric(10,2) not null default 0,

  -- transport reimbursement for this artist at this gig
  -- plain numeric, e.g. 10, 20, 35 — zero means no transport
  transport_amount  numeric(10,2) not null default 0,

  -- insurance: defaults to artist.insurance_type but overridable per gig
  insurance_type text not null check (insurance_type in ('A', 'B')),

  -- operational flags
  insurance_issued  boolean not null default false,
  sms_sent          boolean not null default false,   -- phase 2
  email_sent        boolean not null default false,   -- phase 2

  -- substitution tracking
  substituted_for   uuid references gig_artists(id) on delete set null,
  substitution_note text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (gig_id, artist_id)
);

create trigger gig_artists_updated_at
  before update on gig_artists
  for each row execute function set_updated_at();

create index idx_gig_artists_gig    on gig_artists(gig_id);
create index idx_gig_artists_artist on gig_artists(artist_id);
create index idx_gig_artists_flags  on gig_artists(insurance_issued, gig_id);


-- gig_summary view is defined in 08_views.sql
-- (after invoice tables exist — it references invoice_gigs)
