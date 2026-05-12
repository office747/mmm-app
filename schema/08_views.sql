-- ============================================================
-- 08_views.sql
-- Cross-domain views — run this LAST, after all tables exist
-- Depends on: all previous files
-- ============================================================


-- ============================================================
-- gig_summary
-- One row per gig with artist cost totals, margin, and flags
-- Used by: weekly view, hotel view
-- ============================================================

create view gig_summary as
select
  g.id                                              as gig_id,
  g.hotel_id,
  h.name                                            as hotel_name,
  g.gig_date,
  g.status,
  g.source,
  g.hotel_price,
  g.performance_type,
  g.start_time,
  g.recurrence_note,
  g.notes,
  count(ga.id)                                      as artist_count,
  coalesce(sum(ga.fee), 0)                          as total_artist_fees,
  coalesce(sum(ga.transport_amount), 0)             as total_transport,
  coalesce(sum(ga.insurance_amount), 0)             as total_insurance,
  coalesce(sum(ga.fee), 0)
    + coalesce(sum(ga.transport_amount), 0)
    + coalesce(sum(ga.insurance_amount), 0)         as total_artist_cost,
  g.hotel_price
    - (coalesce(sum(ga.fee), 0)
    + coalesce(sum(ga.transport_amount), 0)
    + coalesce(sum(ga.insurance_amount), 0))        as mmm_margin,
  bool_and(ga.insurance_issued)                     as all_insurance_issued,
  -- flag: performed but not yet on any active invoice
  g.status = 'performed' and not exists (
    select 1
    from invoice_gigs ig
    join invoices i on i.id = ig.invoice_id
    where ig.gig_id = g.id
      and i.status != 'cancelled'
  )                                                 as needs_invoicing
from gigs g
join hotels h on h.id = g.hotel_id
left join gig_artists ga on ga.gig_id = g.id
group by
  g.id, g.hotel_id, h.name, g.gig_date, g.status, g.source,
  g.hotel_price, g.performance_type, g.start_time, g.recurrence_note, g.notes;


-- ============================================================
-- uninvoiced_gigs
-- All performed gigs not on any active invoice
-- Used by: flag banners, hotel invoice tab
-- ============================================================

create view uninvoiced_gigs as
select g.*
from gigs g
where
  g.status = 'performed'
  and not exists (
    select 1
    from invoice_gigs ig
    join invoices i on i.id = ig.invoice_id
    where ig.gig_id = g.id
      and i.status != 'cancelled'
  );
