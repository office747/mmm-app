import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, SaveToast } from '../components/ui/index.jsx'
import { isoWeekStart, addDays, fmtWeekLabel } from '../lib/dates.js'
import { triggerInvoiceGeneration } from '../lib/n8n/index.js'
import HotelFilter from '../components/weekly/HotelFilter.jsx'
import ProgrammeGrid from '../components/weekly/ProgrammeGrid.jsx'
import GigModal from '../components/shared/GigModal.jsx'
import GigDetailModal from '../components/shared/GigDetailModal.jsx'
import InvoiceReview from '../components/shared/InvoiceReview.jsx'

export default function Weekly() {
  const { params, setParam, setParams } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const weekStart = params.get('week') || isoWeekStart()
  const weekEnd   = addDays(weekStart, 6)

  // ── url param driven modal state ─────────────────────────
  const paramGigId     = params.get('gig')
  const paramInvoiceId = params.get('invoice')   // hotel_id for new invoice
  const paramPreselect = params.get('preselect') // gig_id to pre-select

  // ── filter state ──────────────────────────────────────────
  const [hotelFilter,  setHotelFilter]  = useState('')
  const [showArtists,  setShowArtists]  = useState(false)
  const [filterUninvoiced, setFilterUninvoiced] = useState(false)
  const [filterInvoiced,   setFilterInvoiced]   = useState(false)
  const [filterNoArtist,   setFilterNoArtist]   = useState(false)
  const [filterUninsured,  setFilterUninsured]  = useState(false)

  // ── gig modal state ───────────────────────────────────────
  const [gigModalOpen,    setGigModalOpen]    = useState(false)
  const [gigModalHotelId, setGigModalHotelId] = useState(null)
  const [gigModalDate,    setGigModalDate]    = useState(null)
  const [editGig,         setEditGig]         = useState(null)
  const [editGigArtists,  setEditGigArtists]  = useState([])

  // ── detail modal state ────────────────────────────────────
  const [detailGig,      setDetailGig]      = useState(null)

  // ── invoice modal state ───────────────────────────────────
  const [invoiceOpen,    setInvoiceOpen]    = useState(false)
  const [invoiceGigs,    setInvoiceGigs]    = useState([])
  const [invoiceHotel,   setInvoiceHotel]   = useState(null)
  const [preSelected,    setPreSelected]    = useState(null)

  // ── data fetching ─────────────────────────────────────────
  const { data: hotels, loading: hotelsLoading } = useSupabase(
    () => supabase.from('hotels').select('id, name, billing_cycle, billing_schedule, color').eq('active', true).order('name'),
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

  // uninvoiced gigs for the hotel of the currently open gig (for invoice modal)
  const { data: uninvoicedForHotel } = useSupabase(
    () => invoiceHotel
      ? supabase.from('uninvoiced_gigs').select('*').eq('hotel_id', invoiceHotel.id)
      : Promise.resolve({ data: [], error: null }),
    [invoiceHotel]
  )

  const { data: hotelForInvoice } = useSupabase(
    () => invoiceHotel?.id
      ? supabase.from('hotels').select('*, hotel_contacts(*)').eq('id', invoiceHotel.id).single()
      : Promise.resolve({ data: null, error: null }),
    [invoiceHotel?.id]
  )

  // ── open gig detail from ?gig=<id> ───────────────────────
  useEffect(() => {
    if (!paramGigId || !gigs?.length) return
    const found = gigs.find(g => g.gig_id === paramGigId)
    if (found && (!detailGig || detailGig.gig_id !== paramGigId)) {
      setDetailGig(found)
    }
  }, [paramGigId, gigs])

  // ── open invoice modal from ?invoice=<hotel_id>&preselect=<gig_id> ──
  useEffect(() => {
    if (!paramInvoiceId || !hotels?.length) return
    const hotel = hotels.find(h => h.id === paramInvoiceId)
    if (!hotel) return
    if (!invoiceOpen) {
      setInvoiceHotel(hotel)
      setPreSelected(paramPreselect ? new Set([paramPreselect]) : null)
      setInvoiceOpen(true)
    }
  }, [paramInvoiceId, hotels])

  // ── filtered hotels ───────────────────────────────────────
  const filteredHotels = useMemo(() => {
    if (!hotels) return []
    const q = hotelFilter.toLowerCase().trim()
    if (!q) return hotels
    return hotels.filter(h => h.name.toLowerCase().includes(q))
  }, [hotels, hotelFilter])

  // ── apply gig-level view filters ──────────────────────────
  const filteredGigs = useMemo(() => {
    if (!gigs) return gigs
    const anyFilterActive = filterUninvoiced || filterInvoiced || filterNoArtist || filterUninsured
    if (!anyFilterActive) return gigs

    const artistsByGig = (weekGigArtists || []).reduce((acc, a) => {
      if (!acc[a.gig_id]) acc[a.gig_id] = []
      acc[a.gig_id].push(a)
      return acc
    }, {})

    return gigs.filter(g => {
      const artists      = artistsByGig[g.gig_id] || []
      const isUninvoiced = g.status !== 'cancelled' && (g.status !== 'performed' || g.needs_invoicing)
      const isInvoiced   = g.status === 'performed' && !g.needs_invoicing
      const noArtist     = artists.length === 0
      const uninsured     = artists.some(a => !a.insurance_issued)

      if (filterUninvoiced && !isUninvoiced) return false
      if (filterInvoiced   && !isInvoiced)   return false
      if (filterNoArtist   && !noArtist)     return false
      if (filterUninsured  && !uninsured)    return false
      return true
    })
  }, [gigs, weekGigArtists, filterUninvoiced, filterInvoiced, filterNoArtist, filterUninsured])

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
      // update detailGig immediately so modal shows fresh values
      setDetailGig(prev => prev ? { ...prev, ...rest, gig_id: id } : prev)
      return { data: true, error: null }
    },
    { onSuccess: () => { refetchGigs(); refetchArtists(); showToast() } }
  )

  // ── invoice send ─────────────────────────────────────────
  const { save: sendInvoice, saving: sending, saveError: sendError, clearError: clearSendError } = useSave(
    async ({ hotel, gigs, emailSubject, emailBody, subtotal, vatAmount, total }) => {
      const primaryContact = hotel.hotel_contacts?.find(c => c.is_primary) || hotel.hotel_contacts?.[0]
      const { data: inv, error } = await supabase.from('invoices').insert({
        hotel_id: hotel.id, invoice_type: 'regular',
        period_start: gigs[gigs.length - 1]?.gig_date, period_end: gigs[0]?.gig_date,
        subtotal, vat_rate: 24, vat_amount: vatAmount, total, status: 'draft',
        sent_to_email: primaryContact?.email || null,
      }).select().single()
      if (error) throw error
      await supabase.from('invoice_gigs').insert(
        gigs.map(g => ({ invoice_id: inv.id, gig_id: g.gig_id, description: g.performance_type || 'Entertainment service', amount: Number(g.hotel_price), is_correction: false }))
      )
      await triggerInvoiceGeneration({
        invoice: inv,
        hotel: { ...hotel, primary_email: primaryContact?.email || null },
        lineItems: gigs.map(g => ({ date: g.gig_date, description: g.performance_type || 'Entertainment service', amount: Number(g.hotel_price) })),
        driveFolder: `${hotel.name}/Invoices/${new Date().getFullYear()}`,
        emailSubject, emailBody,
      })
      await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', inv.id)
      return { data: inv, error: null }
    },
    { onSuccess: () => { setInvoiceOpen(false); setInvoiceGigs([]); setInvoiceHotel(null); setPreSelected(null); setParams({ invoice: null, preselect: null }); refetchGigs(); showToast() } }
  )

  const openInvoiceFromGig = (gig) => {
    const hotel = hotels?.find(h => h.id === gig.hotel_id) || { id: gig.hotel_id, name: gig.hotel_name }
    setInvoiceHotel(hotel)
    setPreSelected(new Set([gig.gig_id]))
    setDetailGig(null)
    setInvoiceOpen(true)
    setParams({ invoice: gig.hotel_id, preselect: gig.gig_id, gig: null })
  }

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
      start_time:       g.start_time || '',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={showArtists}
              onChange={e => setShowArtists(e.target.checked)}
              style={{ accentColor: 'var(--brand)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Show artist names</span>
          </label>

          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={filterUninvoiced}
              onChange={e => { setFilterUninvoiced(e.target.checked); if (e.target.checked) setFilterInvoiced(false) }}
              style={{ accentColor: 'var(--amber)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>€? Not invoiced (incl. not performed)</span>
          </label>

          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={filterInvoiced}
              onChange={e => { setFilterInvoiced(e.target.checked); if (e.target.checked) setFilterUninvoiced(false) }}
              style={{ accentColor: 'var(--green)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>€✓ Invoiced only</span>
          </label>

          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={filterNoArtist}
              onChange={e => setFilterNoArtist(e.target.checked)}
              style={{ accentColor: 'var(--red)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>⚠ No artist</span>
          </label>

          <label className="checkbox-label" style={{ gap: 'var(--sp-2)' }}>
            <input
              type="checkbox"
              checked={filterUninsured}
              onChange={e => setFilterUninsured(e.target.checked)}
              style={{ accentColor: 'var(--red)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>ins! Uninsured</span>
          </label>

          {(filterUninvoiced || filterInvoiced || filterNoArtist || filterUninsured) && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => { setFilterUninvoiced(false); setFilterInvoiced(false); setFilterNoArtist(false); setFilterUninsured(false) }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* grid */}
      <ProgrammeGrid
        weekStart={weekStart}
        hotels={filteredHotels}
        gigs={filteredGigs}
        gigArtists={weekGigArtists}
        showArtists={showArtists}
        loading={loading}
        error={gigsError}
        onRefetch={refetchGigs}
        onGigClick={g => { setDetailGig(g); setParam('gig', g.gig_id) }}
        onAddGig={openAddGig}
      />

      {/* gig detail modal */}
      <GigDetailModal
        open={!!detailGig}
        gig={detailGig}
        gigArtists={detailGigArtists}
        allArtists={artists}
        onClose={() => { setDetailGig(null); setParam('gig', null); clearFieldsError() }}
        onSave={saveGigFields}
        saving={savingFields}
        saveError={fieldsError}
        onClearError={clearFieldsError}
        onToggleInsurance={toggleInsurance}
        toggling={toggling}
        onGenerateInvoice={detailGig?.status === 'performed' && detailGig?.needs_invoicing ? openInvoiceFromGig : null}
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

      <InvoiceReview
        open={invoiceOpen}
        hotel={hotelForInvoice || invoiceHotel}
        gigs={uninvoicedForHotel || (invoiceGigs.length ? invoiceGigs : [])}
        preSelected={preSelected}
        isPty={false}
        originalInvoice={null}
        onUpload={async (payload) => {
          try {
            const hotel = hotelForInvoice || invoiceHotel
            const primaryContact = hotel?.hotel_contacts?.find(c => c.is_primary) || hotel?.hotel_contacts?.[0]
            const { data: inv, error } = await supabase.from('invoices').insert({
              hotel_id: hotel.id, invoice_type: 'regular',
              period_start: payload.gigs[payload.gigs.length - 1]?.gig_date,
              period_end:   payload.gigs[0]?.gig_date,
              subtotal: payload.subtotal, vat_rate: 24, vat_amount: payload.vatAmount, total: payload.total,
              status: 'draft', sent_to_email: primaryContact?.email || null,
            }).select().single()
            if (error) throw error
            await supabase.from('invoice_gigs').insert(
              payload.gigs.map(g => ({ invoice_id: inv.id, gig_id: g.gig_id, description: g.performance_type || 'Entertainment service', amount: Number(g.hotel_price), is_correction: false }))
            )
            setInvoiceOpen(false)
            setInvoiceHotel(null)
            setPreSelected(null)
            setParams({ invoice: null, preselect: null })
            refetchGigs()
            showToast()
          } catch (err) { console.error('Failed to create invoice:', err) }
        }}
        onConfirm={() => {}}
        onClose={() => { setInvoiceOpen(false); setInvoiceHotel(null); setPreSelected(null); setParams({ invoice: null, preselect: null }) }}
        saving={false}
      />
    </div>
  )
}
