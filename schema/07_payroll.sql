-- ============================================================
-- 07_payroll.sql
-- Monthly artist payroll tracking
-- Depends on: 02_artists.sql, 05_gigs.sql
-- ============================================================

create table payroll_periods (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references artists(id) on delete restrict,

  -- always the 1st of the month, e.g. 2025-09-01
  period_month   date not null,

  -- totals computed when period is closed
  total_fees         numeric(10,2) not null default 0,
  total_transport    numeric(10,2) not null default 0,
  total_gross        numeric(10,2) not null default 0,

  status         text not null default 'open'
                   check (status in ('open', 'closed', 'paid')),

  paid_at        timestamptz,
  payment_ref    text,
  notes          text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (artist_id, period_month)
);

create trigger payroll_periods_updated_at
  before update on payroll_periods
  for each row execute function set_updated_at();

create index idx_payroll_artist on payroll_periods(artist_id);
create index idx_payroll_month  on payroll_periods(period_month);
create index idx_payroll_status on payroll_periods(status);


-- ============================================================
-- view: live per-artist per-month earnings from gig_artists
-- transport_amount is now a plain numeric — no case logic needed
-- ============================================================

create view artist_monthly_earnings as
select
  ga.artist_id,
  a.full_name                                   as artist_name,
  date_trunc('month', g.gig_date)::date         as period_month,
  count(ga.id)                                  as gig_count,
  sum(ga.fee)                                   as total_fees,
  sum(ga.transport_amount)                      as total_transport,
  sum(ga.fee) + sum(ga.transport_amount)        as total_gross
from gig_artists ga
join gigs g    on g.id = ga.gig_id
join artists a on a.id = ga.artist_id
where g.status = 'performed'
group by ga.artist_id, a.full_name,
         date_trunc('month', g.gig_date)::date;


-- ============================================================
-- view: full gig detail per artist — monthly payroll breakdown
-- one row per gig per artist, used in Artist > Monthly tab
-- ============================================================

create view artist_gig_detail as
select
  ga.id                         as gig_artist_id,
  ga.artist_id,
  a.full_name                   as artist_name,
  g.id                          as gig_id,
  g.gig_date,
  h.name                        as hotel_name,
  pt.name                       as performance_type,
  ga.role,
  ga.fee,
  ga.transport_amount,
  ga.fee + ga.transport_amount  as total_earned,
  ga.insurance_type,
  ga.insurance_issued,
  ga.sms_sent,
  ga.email_sent,
  ga.substituted_for,
  ga.substitution_note,
  g.status                      as gig_status,
  g.notes                       as gig_notes
from gig_artists ga
join gigs g            on g.id  = ga.gig_id
join artists a         on a.id  = ga.artist_id
join hotels h          on h.id  = g.hotel_id
left join performance_types pt on pt.id = g.performance_type_id;
