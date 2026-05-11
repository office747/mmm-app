# MMM — Supabase Database Setup

## Prerequisites
- A Supabase project created at https://supabase.com
- Access to the SQL Editor (Dashboard → SQL Editor)

## Paste Order

Run each file **in order** in the Supabase SQL Editor.
Each file depends on the previous ones.

| File | Domain | What it creates |
|------|--------|-----------------|
| `01_hotels.sql` | Hotels | `hotels`, `hotel_contacts` |
| `02_artists.sql` | Artists | `artists` |
| `03_bands.sql` | Bands | `bands`, `band_members` |
| `04_performance_types.sql` | Performance Types | `performance_types` (free-form name per hotel, no rate table) |
| `05_gigs.sql` | Gigs | `gigs`, `gig_artists`, view `gig_summary` |
| `06_invoices.sql` | Invoices | `invoices`, `invoice_gigs`, views `uninvoiced_gigs`, `invoice_summary` |
| `07_payroll.sql` | Payroll | `payroll_periods`, views `artist_monthly_earnings`, `artist_gig_detail` |

## After Running SQL

### 1. Enable Row Level Security (RLS)
In Supabase Dashboard → Authentication → Policies, enable RLS on all tables.
For v1 with a single internal team, a simple policy works:

```sql
-- run this after all tables are created
-- allows all operations for authenticated users only
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "auth_only" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;
```

### 2. Get Your Keys
Dashboard → Settings → API:
- `Project URL` → your `VITE_SUPABASE_URL`
- `anon public` key → your `VITE_SUPABASE_ANON_KEY`

Add both to your `.env` file in the frontend root:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 3. N8n Webhook URL
```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/mmm-invoice
```

## Key Design Decisions

### Transport fees are plain numeric
`gig_artists.transport_amount` is a free numeric field (e.g. 10, 20, 35). Zero means no transport. No enum, no fixed tiers — staff type the actual amount per artist per gig.

### Performance types are free form per hotel
`performance_types` is just a name catalogue scoped to each hotel. Staff create types like "Evening Jazz" or "Pool DJ" as needed. No rates are stored on the type — all prices are entered directly on the gig and on each artist assignment.

### PTY invoices
A correction invoice sets `invoice_type = 'pty'` and `corrects_invoice_id` pointing to the original. Line items in `invoice_gigs` use `is_correction = true` with negative `amount` values for lines being reversed.

### Gig price is always manual
`gigs.hotel_price` is entered per gig — there is no rate lookup table. Always use `gigs.hotel_price` for invoicing. Artist fees are entered per `gig_artists.fee` row, also manual.

### Insurance flags
`gig_artists.insurance_issued` is the only flag active in v1.
`sms_sent` and `email_sent` columns exist in the schema but are hidden in the UI until phase 2.

### Payroll snapshot vs live view
- `artist_monthly_earnings` (view) = live calculation from gig_artists
- `payroll_periods` (table) = locked snapshot when you close/pay a month
- Compare them to detect if a month needs recalculating after a retroactive gig edit

## Resetting for Development
```sql
-- wipe everything and start fresh (dev only)
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
```
Then re-run all files in order.
