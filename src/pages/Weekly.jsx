import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, SaveToast } from '../components/ui/index.jsx'
import { isoWeekStart, addDays, fmtWeekLabel } from '../lib/dates.js'
import HotelFilter from '../components/weekly/HotelFilter.jsx'
import ProgrammeGrid from '../components/weekly/ProgrammeGrid.jsx'
import GigModal from '../components/shared/GigModal.jsx'
import GigDetailModal from '../components/shared/GigDetailModal.jsx'

export default function Weekly() {
  const { params, setParam } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const weekStart = params.get('week') || isoWeekStart()
  const weekEnd   = addDays(weekStart, 6)

  // ── filter state ──────────────────────────────────────────
  const [hotelFilter,  setHotelFilter]  = useState('')
  const [showArtists,  setShowArtists]  = useState(false)

  // ── gig modal state ───────────────────────────────────────
  const [gigModalOpen,    setGigModalOpen]    = useState(false)
  const [gigModalHotelId, setGigModalHotelId] = useState(null)
  const [gigModalDate,    setGigModalDate]    = useState(null)
  const [editGig,         setEditGig]         = useState(null)
  const [editGigArtists,  setEditGigArtists]  = useState([])

  // ── detail modal state ────────────────────────────────────
  const [detailGig, setDetailGig] = useState(null)

  // ── data fetching ─────────────────────────────────────────
  const { data: hotels, loading: hotelsLoading } = useSupabase(
    () => supabase.from('hotels').select('id, name, billing_cycle').eq('active', true).order('name'),
    []
  )

  const { data: artists } = useSupabase(
    () => supabase.from('artists').select('id, full_name').order('full_name'),
    []
  )

  const { data: gigs, loading: gigsLoading, error: gigsError, refetch: refetchGigs } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .gte('gig_date', weekStart)
      .lte('gig_date', weekEnd)
      .order('gig_date'),
    [weekStart]
  )

  // fetch artist lines for all gigs this week (for detail modal)
  const { data: weekGigArtists, refetch: refetchArtists } = useSupabase(
    () => gigs?.length
      ? supabase.from('artist_gig_detail').select('*').in('gig_id', gigs.map(g => g.gig_id))
      : Promise.resolve({ data: [], error: null }),
    [gigs]
  )

  // artists for the currently selected detail gig
  const detailGigArtists = useMemo(() => {
    if (!detailGig || !weekGigArtists) return []
    return weekGigArtists.filter(a => a.gig_id === detailGig.gig_id)
  }, [detailGig, weekGigArtists])

  // ── filtered hotels ───────────────────────────────────────
  const filteredHotels = useMemo(() => {
    if (!hotels) return []
    const q = hotelFilter.toLowerCase().trim()
    if (!q) return hotels
    return hotels.filter(h => h.name.toLowerCase().includes(q))
  }, [hotels, hotelFilter])

  // ── save gig ──────────────────────────────────────────────
  const { save: saveGig, saving: savingGig, saveError: gigError, clearError: clearGigError } = useSave(
    async ({ gig, artistLines, recurrence }) => {
      const { id, ...fields } = gig
      const dates = [fields.gig_date]
      if (!id && recurrence) {
        const step = recurrence.type === 'weekly' ? 7 : 14
        const until = new Date(recurrence.until)
        const d = new Date(fields.gig_date)
        d.setDate(d.getDate() + step)
        while (d <= until) { dates.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + step) }
      }
      for (const date of dates) {
        const note = dates.length > 1
          ? `${recurrence.type === 'weekly' ? 'Weekly' : 'Bi-weekly'} series created ${new Date().toLocaleDateString('en-GB')}`
          : null
        const upsertData = { ...fields, gig_date: date, recurrence_note: note }
        let gigId = id
        if (id && dates.length === 1) {
          const { error } = await supabase.from('gigs').update(upsertData).eq('id', id)
          if (error) throw error
        } else {
          const { data: newGig, error } = await supabase.from('gigs').insert(upsertData).select().single()
          if (error) throw error
          gigId = newGig.id
        }
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
      }
      return { data: true, error: null }
    },
    {
      onSuccess: () => {
        setGigModalOpen(false)
        setEditGig(null)
        setEditGigArtists([])
        refetchGigs()
        showToast()
      }
    }
  )

  // ── save gig fields only (from detail modal) ─────────────
  const { save: saveGigFields, saving: savingFields, saveError: fieldsError, clearError: clearFieldsError } = useSave(
    async ({ gigFields, artistLines }) => {
      const { id, ...rest } = gigFields
      const { error } = await supabase.from('gigs').update(rest).eq('id', id)
      if (error) throw error
      if (artistLines) {
        await supabase.from('gig_artists').delete().eq('gig_id', id)
        if (artistLines.length) {
          const { error: aErr } = await supabase.from('gig_artists').insert(
            artistLines.map(l => ({
              gig_id:           id,
              artist_id:        l.artist_id,
              role:             l.role             || null,
              fee:              Number(l.fee)              || 0,
              transport_amount: Number(l.transport_amount) || 0,
              insurance_amount: Number(l.insurance_amount) || 0,
              insurance_issued: l.insurance_issued         || false,
            }))
          )
          if (aErr) throw aErr
        }
      }
      return { data: true, error: null }
    },
    { onSuccess: () => { refetchGigs(); refetchArtists(); showToast() } }
  )

  // ── toggle insurance ──────────────────────────────────────
  const { save: toggleInsurance, saving: toggling } = useSave(
    async ({ gigArtistId, value }) =>
      supabase.from('gig_artists').update({ insurance_issued: value }).eq('id', gigArtistId),
    { onSuccess: () => { refetchArtists(); showToast() } }
  )

  // ── open gig modal handlers ───────────────────────────────
  const openAddGig = (hotelId, date) => {
    setEditGig(null)
    setEditGigArtists([])
    setGigModalHotelId(hotelId)
    setGigModalDate(date)
    setGigModalOpen(true)
  }

  const openEditGig = (g) => {
    setDetailGig(null)
    setEditGig({
      id:               g.gig_id,
      hotel_id:         g.hotel_id,
      gig_date:         g.gig_date,
      performance_type: g.performance_type,
      hotel_price:      g.hotel_price,
      status:           g.status,
      source:           g.source,
      notes:            g.notes,
    })
    setEditGigArtists([])
    setGigModalHotelId(g.hotel_id)
    setGigModalDate(g.gig_date)
    setGigModalOpen(true)
  }

  // ── week summary ──────────────────────────────────────────
  const summary = useMemo(() => {
    const all     = gigs || []
    const artists = weekGigArtists || []
    return {
      total:      all.length,
      uninvoiced: all.filter(g => g.status === 'performed' && g.needs_invoicing).length,
      unassigned: all.filter(g => g.artist_count === 0).length,
      uninsured:  artists.filter(a => !a.insurance_issued).length,
    }
  }, [gigs, weekGigArtists])

  const loading = hotelsLoading || gigsLoading

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Programme</h1>
      </div>

      {/* week navigation */}
      <div className="week-nav" style={{ marginBottom: 'var(--sp-4)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, -7))}>← Prev</button>
        <span className="week-nav-label">{fmtWeekLabel(weekStart)}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, 7))}>Next →</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setParam('week', isoWeekStart())}>Today</button>
      </div>

      {/* summary pills */}
      {!loading && (
        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">{summary.total} gigs</span>
          {summary.uninvoiced > 0 && (
            <span className="badge badge-amber">€? {summary.uninvoiced} uninvoiced</span>
          )}
          {summary.uninsured > 0 && (
            <span className="badge badge-red">ins! {summary.uninsured} uninsured</span>
          )}
          {summary.unassigned > 0 && (
            <span className="badge badge-red">⚠ {summary.unassigned} no artist</span>
          )}
        </div>
      )}

      {/* filters + view options */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <HotelFilter
          value={hotelFilter}
          onChange={setHotelFilter}
          total={hotels?.length || 0}
          visible={filteredHotels.length}
        />
        {/* divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />
        {/* view options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={showArtists}
              onChange={e => setShowArtists(e.target.checked)}
              style={{ accentColor: 'var(--brand)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Show artist names</span>
          </label>
        </div>
      </div>

      {/* grid */}
      <ProgrammeGrid
        weekStart={weekStart}
        hotels={filteredHotels}
        gigs={gigs}
        gigArtists={weekGigArtists}
        showArtists={showArtists}
        loading={loading}
        error={gigsError}
        onRefetch={refetchGigs}
        onGigClick={setDetailGig}
        onAddGig={openAddGig}
      />

      {/* gig detail modal */}
      <GigDetailModal
        open={!!detailGig}
        gig={detailGig}
        gigArtists={detailGigArtists}
        allArtists={artists}
        onClose={() => { setDetailGig(null); clearFieldsError() }}
        onSave={saveGigFields}
        saving={savingFields}
        saveError={fieldsError}
        onClearError={clearFieldsError}
        onToggleInsurance={toggleInsurance}
        toggling={toggling}
        onEditGig={openEditGig}
      />

      {/* gig add/edit modal */}
      <GigModal
        open={gigModalOpen}
        gig={editGig ? { ...editGig } : { gig_date: gigModalDate, hotel_id: gigModalHotelId }}
        gigArtists={editGigArtists}
        hotelId={gigModalHotelId}
        hotels={hotels}
        artists={artists}
        onSave={saveGig}
        onClose={() => { setGigModalOpen(false); setEditGig(null); clearGigError() }}
        saving={savingGig}
        saveError={gigError}
        onClearError={clearGigError}
      />

      {toastVisible && <SaveToast message="Saved" />}
    </div>
  )
}
