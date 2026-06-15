-- ============================================================
-- 09_grants.sql
-- Explicit grants required for Supabase Data API access.
-- Run this after all other migrations.
-- Required for new projects after May 30 2026, good practice always.
-- ============================================================

-- schema usage
grant usage on schema public to anon, authenticated, service_role;

-- ── tables ────────────────────────────────────────────────────
grant all on public.hotels           to anon, authenticated, service_role;
grant all on public.hotel_contacts   to anon, authenticated, service_role;
grant all on public.artists          to anon, authenticated, service_role;
grant all on public.bands            to anon, authenticated, service_role;
grant all on public.band_members     to anon, authenticated, service_role;
grant all on public.performance_types to anon, authenticated, service_role;
grant all on public.gigs             to anon, authenticated, service_role;
grant all on public.gig_artists      to anon, authenticated, service_role;
grant all on public.invoices         to anon, authenticated, service_role;
grant all on public.invoice_gigs     to anon, authenticated, service_role;
grant all on public.payroll_periods  to anon, authenticated, service_role;

-- ── views ────────────────────────────────────────────────────
grant select on public.gig_summary          to anon, authenticated, service_role;
grant select on public.uninvoiced_gigs      to anon, authenticated, service_role;
grant select on public.invoice_summary      to anon, authenticated, service_role;
grant select on public.artist_gig_detail    to anon, authenticated, service_role;
grant select on public.artist_monthly_earnings to anon, authenticated, service_role;

-- ── sequences (for any serial/bigserial columns) ─────────────
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- future tables: run this to auto-grant new sequences
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
