-- ============================================================
-- 06_invoices.sql
-- Invoices, line items, PTY (correction) support
-- Depends on: 01_hotels.sql, 05_gigs.sql
-- ============================================================

create table invoices (
  id                   uuid primary key default gen_random_uuid(),
  hotel_id             uuid not null references hotels(id) on delete restrict,

  -- sequential human-readable number, e.g. INV-2025-045
  invoice_number       text unique,

  invoice_type         text not null default 'regular'
                         check (invoice_type in ('regular', 'pty')),

  -- for PTY: reference to the invoice being corrected
  corrects_invoice_id  uuid references invoices(id) on delete set null,

  period_start         date not null,
  period_end           date not null,

  -- financials
  subtotal             numeric(10,2) not null default 0,  -- excl. VAT
  vat_rate             numeric(5,2)  not null default 24, -- greek standard 24%
  vat_amount           numeric(10,2) not null default 0,
  total                numeric(10,2) not null default 0,

  status               text not null default 'draft'
                         check (status in ('draft', 'sent', 'paid', 'cancelled')),

  -- entersoft integration
  entersoft_invoice_id text,          -- ID returned by Entersoft API after creation
  entersoft_synced_at  timestamptz,

  -- google drive
  drive_url            text,          -- link to the PDF in Drive

  -- email
  sent_to_email        text,
  sent_at              timestamptz,
  paid_at              timestamptz,

  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();

create index idx_invoices_hotel   on invoices(hotel_id);
create index idx_invoices_status  on invoices(status);
create index idx_invoices_period  on invoices(period_start, period_end);
create index idx_invoices_type    on invoices(invoice_type);


-- ============================================================
-- which gigs are included in each invoice
-- one gig can only be on one non-cancelled invoice
-- ============================================================

create table invoice_gigs (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  gig_id       uuid not null references gigs(id) on delete restrict,

  -- line item description as it appears on the invoice
  -- defaults to performance_type name but can be customised
  description  text not null,

  -- the amount for this line item
  -- usually equals gig.hotel_price but can differ (e.g. partial, PTY correction)
  amount       numeric(10,2) not null,

  -- for PTY lines: negative amount correcting an original line
  is_correction boolean not null default false,

  created_at   timestamptz not null default now(),

  -- a gig should not appear twice on the same invoice
  unique (invoice_id, gig_id)
);

create index idx_invoice_gigs_invoice on invoice_gigs(invoice_id);
create index idx_invoice_gigs_gig     on invoice_gigs(gig_id);

-- uninvoiced_gigs view is defined in 08_views.sql

-- ============================================================
-- view: invoice summary with hotel name
-- ============================================================

create view invoice_summary as
select
  i.id,
  i.invoice_number,
  i.invoice_type,
  i.corrects_invoice_id,
  h.name                         as hotel_name,
  i.hotel_id,
  i.period_start,
  i.period_end,
  i.subtotal,
  i.vat_rate,
  i.vat_amount,
  i.total,
  i.status,
  i.entersoft_invoice_id,
  i.drive_url,
  i.sent_to_email,
  i.sent_at,
  i.paid_at,
  count(ig.id)                   as gig_count,
  i.created_at
from invoices i
join hotels h on h.id = i.hotel_id
left join invoice_gigs ig on ig.invoice_id = i.id
group by i.id, h.name;
