import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, LoadingSpinner, ErrorBanner, SaveToast } from '../components/ui/index.jsx'
import ArtistWeekly from '../components/artists/ArtistWeekly.jsx'
import ArtistPayroll from '../components/artists/ArtistPayroll.jsx'
import GigModal from '../components/shared/GigModal.jsx'
import { isoWeekStart, addDays, currentMonth, monthOf, monthRange, fmtMonthLabel as fmtMonth, fmtWeekLabel } from '../lib/dates.js'


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
    () => {
      const { start, end } = monthRange(month)
      return supabase
        .from('artist_gig_detail')
        .select('*')
        .eq('artist_id', artistId)
        .gte('gig_date', start)
        .lte('gig_date', end)
        .order('gig_date')
    },
    [artistId, month]
  )

  // ── gig modal state ───────────────────────────────────────
  const [gigModalOpen,   setGigModalOpen]   = useState(false)
  const [editGig,        setEditGig]        = useState(null)
  const [editGigArtists, setEditGigArtists] = useState([])

  // ── all artists for selector ──────────────────────────────
  const { data: artists } = useSupabase(
    () => supabase.from('artists').select('id, full_name').order('full_name'),
    []
  )

  // ── all hotels for gig modal (no pre-selected hotel) ─────
  const { data: hotels } = useSupabase(
    () => supabase.from('hotels').select('id, name').eq('active', true).order('name'),
    []
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

  // ── save gig ─────────────────────────────────────────────
  const { save: saveGig, saving: savingGig, saveError: gigError, clearError: clearGigError } = useSave(
    async ({ gig, artistLines }) => {
      const { id, ...fields } = gig
      if (id) {
        const { error } = await supabase.from('gigs').update(fields).eq('id', id)
        if (error) throw error
      }
      // replace artist lines
      const gigId = id
      if (gigId) {
        await supabase.from('gig_artists').delete().eq('gig_id', gigId)
        const validLines = artistLines.filter(l => l.artist_id)
        if (validLines.length) {
          const { error } = await supabase.from('gig_artists').insert(
            validLines.map(l => ({
              gig_id:           gigId,
              artist_id:        l.artist_id,
              role:             l.role             || null,
              fee:              Number(l.fee)              || 0,
              transport_amount: Number(l.transport_amount) || 0,
              insurance_amount: Number(l.insurance_amount) || 0,
              insurance_issued: l.insurance_issued         || false,
            }))
          )
          if (error) throw error
        }
      }
      return { data: true, error: null }
    },
    {
      onSuccess: () => {
        setGigModalOpen(false)
        setEditGig(null)
        setEditGigArtists([])
        refetchWeek()
        refetchMonth()
        showToast()
      }
    }
  )

  // ── open gig modal ────────────────────────────────────────
  const openEditGig = (g) => {
    setEditGig({
      id:               g.gig_id,
      hotel_id:         g.hotel_id,
      gig_date:         g.gig_date,
      performance_type: g.performance_type,
      hotel_price:      g.hotel_price,
      start_time:       g.start_time || '',
      status:           g.gig_status,
      source:           g.source,
      notes:            g.gig_notes,
    })
    setEditGigArtists([{
      artist_id:        g.artist_id,
      role:             g.role,
      fee:              g.fee,
      transport_amount: g.transport_amount,
      insurance_amount: g.insurance_amount,
      insurance_issued: g.insurance_issued,
    }])
    setGigModalOpen(true)
  }

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
            artistId={artistId}
            weekStart={weekStart}
            gigs={weekGigs}
            loading={weekLoading}
            error={weekError}
            onRefetch={refetchWeek}
            onToggleInsurance={toggleInsurance}
            toggling={toggling}
            onEditGig={openEditGig}
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
            onEditGig={openEditGig}
          />
        </>
      )}

      {toastVisible && <SaveToast message="Saved" />}

      <GigModal
        open={gigModalOpen}
        gig={editGig}
        gigArtists={editGigArtists}
        hotels={hotels}
        artists={artists}
        onSave={saveGig}
        onClose={() => { setGigModalOpen(false); setEditGig(null); clearGigError() }}
        saving={savingGig}
        saveError={gigError}
        onClearError={clearGigError}
      />
    </div>
  )
}
