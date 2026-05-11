import { useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { isoWeekStart, addDays } from '../lib/dates.js'
import TodaysGigs      from '../components/dashboard/TodaysGigs.jsx'
import UpcomingGigs    from '../components/dashboard/UpcomingGigs.jsx'
import UninsuredArtists from '../components/dashboard/UninsuredArtists.jsx'
import UninvoicedGigs  from '../components/dashboard/UninvoicedGigs.jsx'
import UnpaidInvoices  from '../components/dashboard/UnpaidInvoices.jsx'
import UnassignedGigs  from '../components/dashboard/UnassignedGigs.jsx'

const today    = new Date().toISOString().slice(0, 10)
const weekEnd  = addDays(isoWeekStart(), 6)
const tomorrow = addDays(today, 1)

export default function Dashboard() {

  // ── today's gigs ────────────────────────────────────────
  const { data: todayGigs, loading: todayLoading } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .eq('gig_date', today)
      .neq('status', 'cancelled')
      .order('hotel_name'),
    []
  )

  // ── upcoming gigs (tomorrow → end of week) ───────────────
  const { data: upcomingGigs, loading: upcomingLoading } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .gte('gig_date', tomorrow)
      .lte('gig_date', weekEnd)
      .neq('status', 'cancelled')
      .order('gig_date')
      .order('hotel_name'),
    []
  )

  // ── uninsured — past performed gigs, latest first ────────
  const { data: uninsuredRaw, loading: uninsuredLoading } = useSupabase(
    () => supabase
      .from('artist_gig_detail')
      .select('*')
      .eq('insurance_issued', false)
      .eq('gig_status', 'performed')
      .lte('gig_date', today)
      .order('gig_date', { ascending: false })
      .limit(10),
    []
  )

  // ── uninvoiced performed gigs ────────────────────────────
  const { data: uninvoicedRaw, loading: uninvoicedLoading } = useSupabase(
    () => supabase
      .from('uninvoiced_gigs')
      .select('*, hotels(name)')
      .order('gig_date', { ascending: false })
      .limit(10),
    []
  )

  // normalise uninvoiced — attach hotel_name from join
  const uninvoicedGigs = useMemo(() =>
    (uninvoicedRaw || []).map(g => ({
      ...g,
      hotel_name: g.hotels?.name || g.hotel_id,
    })),
  [uninvoicedRaw])

  // ── unpaid invoices (status = sent) ─────────────────────
  const { data: unpaidInvoices, loading: unpaidLoading } = useSupabase(
    () => supabase
      .from('invoice_summary')
      .select('*')
      .eq('status', 'sent')
      .order('sent_at', { ascending: true })
      .limit(10),
    []
  )

  // ── upcoming gigs with no artists ───────────────────────
  const { data: unassignedRaw, loading: unassignedLoading } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .eq('artist_count', 0)
      .gte('gig_date', today)
      .neq('status', 'cancelled')
      .order('gig_date')
      .limit(10),
    []
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* two-column layout on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 'var(--sp-4)',
        alignItems: 'start',
      }}>

        {/* left column */}
        <div>
          <TodaysGigs    gigs={todayGigs}      loading={todayLoading} />
          <UpcomingGigs  gigs={upcomingGigs}   loading={upcomingLoading} />
          <UnassignedGigs gigs={unassignedRaw} loading={unassignedLoading} />
        </div>

        {/* right column */}
        <div>
          <UninvoicedGigs  gigs={uninvoicedGigs}    loading={uninvoicedLoading} />
          <UnpaidInvoices  invoices={unpaidInvoices} loading={unpaidLoading} />
          <UninsuredArtists items={uninsuredRaw}     loading={uninsuredLoading} />
        </div>

      </div>
    </div>
  )
}
