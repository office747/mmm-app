import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, LoadingSpinner, ErrorBanner, SaveToast } from '../components/ui/index.jsx'
import ArtistWeekly from '../components/artists/ArtistWeekly.jsx'
import ArtistPayroll from '../components/artists/ArtistPayroll.jsx'
import {
  isoWeekStart,
  addDays,
  currentMonth,
  monthOf,
  fmtMonthLabel as fmtMonth,
  fmtWeekLabel,
  monthStart
} from '../lib/dates.js'


export default function ArtistDetail() {
  const navigate = useNavigate()
  const { params, setParam } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const artistId  = params.get('id')
  const activeTab = params.get('tab') || 'week'
  const weekStart = params.get('week') || isoWeekStart()
  const month     = params.get('month') || monthStart()
  const weekEnd   = addDays(weekStart, 6)

  // ── artist detail ────────────────────────────────────────
  const { data: artist, loading: artistLoading, error: artistError } = useSupabase(
    () => supabase.from('artists').select('*').eq('id', artistId).single(),
    [artistId]
  )

  // ── weekly gigs ──────────────────────────────────────────
  const { data: weekGigs, loading: weekLoading, error: weekError, refetch: refetchWeek } = useSupabase(
    () => supabase
      .from('artist_gig_detail')
      .select('*')
      .eq('artist_id', artistId)
      .gte('gig_date', weekStart)
      .lte('gig_date', weekEnd)
      .order('gig_date'),
    [artistId, weekStart]
  )

  // ── monthly gigs ─────────────────────────────────────────
  const { data: monthGigs, loading: monthLoading, error: monthError, refetch: refetchMonth } = useSupabase(
    () => supabase
      .from('artist_gig_detail')
      .select('*')
      .eq('artist_id', artistId)
      .gte('gig_date', month + '-01')
      .lte('gig_date', month + '-31')
      .order('gig_date'),
    [artistId, month]
  )

  // ── toggle insurance ─────────────────────────────────────
  const { save: toggleInsurance, saving: toggling } = useSave(
    async ({ gigArtistId, value }) =>
      supabase.from('gig_artists').update({ insurance_issued: value }).eq('id', gigArtistId),
    {
      onSuccess: () => {
        refetchWeek()
        refetchMonth()
        showToast()
      }
    }
  )

  // ── export CSV ───────────────────────────────────────────
  const exportCSV = () => {
    if (!monthGigs?.length) return
    const header = 'Date,Hotel,Performance,Role,Fee,Transport,Total,Insurance'
    const rows = monthGigs.map(g =>
      [g.gig_date, g.hotel_name, g.performance_type, g.role,
       g.fee, g.transport_amount, g.total_earned,
       g.insurance_issued ? 'Yes' : 'No'].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artist?.full_name}-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!artistId) return null

  if (artistLoading) return (
    <div className="page"><LoadingSpinner /></div>
  )

  if (artistError) return (
    <div className="page"><ErrorBanner message={artistError} /></div>
  )

  return (
    <div className="page">

      {/* ── back + header ── */}
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/artists')}>
          ← All artists
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{artist?.full_name}</h1>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>
            {artist?.phone && <>{artist.phone}</>}
            {artist?.phone && artist?.email && <> &nbsp;·&nbsp; </>}
            {artist?.email && <>{artist.email}</>}
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="tabs">
        <button className={`tab${activeTab === 'week' ? ' active' : ''}`} onClick={() => setParam('tab', 'week')}>
          Weekly Schedule
        </button>
        <button className={`tab${activeTab === 'payroll' ? ' active' : ''}`} onClick={() => setParam('tab', 'payroll')}>
          Monthly Payroll
        </button>
      </div>

      {/* ── weekly tab ── */}
      {activeTab === 'week' && (
        <>
          <div className="week-nav">
            <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, -7))}>← Prev</button>
            <span className="week-nav-label">
              {new Date(weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(weekEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, 7))}>Next →</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setParam('week', isoWeekStart())}>Today</button>
          </div>
          <ArtistWeekly
            weekStart={weekStart}
            gigs={weekGigs}
            loading={weekLoading}
            error={weekError}
            onRefetch={refetchWeek}
            onToggleInsurance={toggleInsurance}
            toggling={toggling}
          />
        </>
      )}

      {/* ── payroll tab ── */}
      {activeTab === 'payroll' && (
        <>
          <div className="week-nav">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const d = new Date(month + '-01')
              d.setMonth(d.getMonth() - 1)
              setParam('month', d.toISOString().slice(0, 7))
            }}>← Prev</button>
            <span className="week-nav-label">{fmtMonth(month)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const d = new Date(month + '-01')
              d.setMonth(d.getMonth() + 1)
              setParam('month', d.toISOString().slice(0, 7))
            }}>Next →</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setParam('month', monthStart())}>This month</button>
          </div>
          <ArtistPayroll
            gigs={monthGigs}
            loading={monthLoading}
            error={monthError}
            onRefetch={refetchMonth}
            onToggleInsurance={toggleInsurance}
            toggling={toggling}
            onExport={exportCSV}
          />
        </>
      )}

      {toastVisible && <SaveToast message="Saved" />}
    </div>
  )
}
