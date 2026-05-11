import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, LoadingSpinner, ErrorBanner, SaveToast } from '../components/ui/index.jsx'
import { triggerInvoiceGeneration, triggerPtyGeneration } from '../lib/n8n/index.js'
import HotelHeader from '../components/hotels/HotelHeader.jsx'
import HotelStats from '../components/hotels/HotelStats.jsx'
import HotelPeriodNav from '../components/hotels/HotelPeriodNav.jsx'
import HotelGigs from '../components/hotels/HotelGigs.jsx'
import HotelInvoices from '../components/hotels/HotelInvoices.jsx'
import GigModal from '../components/shared/GigModal.jsx'
import InvoiceReview from '../components/shared/InvoiceReview.jsx'

import { isoWeekStart, addDays, monthRange, currentMonth } from '../lib/dates.js'



export default function HotelDetail() {
  const { params, setParam } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const hotelId    = params.get('id')
  const activeTab  = params.get('tab')    || 'gigs'
  const periodMode = params.get('period') || 'week'
  const weekStart  = params.get('week')   || isoWeekStart()
  const month      = params.get('month')  || currentMonth()

  const weekEnd             = addDays(weekStart, 6)
  const { start: mStart, end: mEnd } = monthRange(month)
  const dateStart           = periodMode === 'week' ? weekStart : mStart
  const dateEnd             = periodMode === 'week' ? weekEnd   : mEnd
  const periodLabel         = periodMode === 'week' ? 'this week' : 'this month'

  // ── modal state ───────────────────────────────────────────
  const [gigModalOpen,    setGigModalOpen]    = useState(false)
  const [editGig,         setEditGig]         = useState(null)
  const [editGigArtists,  setEditGigArtists]  = useState([])
  const [invoiceOpen,     setInvoiceOpen]     = useState(false)
  const [invoiceGigs,     setInvoiceGigs]     = useState([])
  const [invoicePreSelected, setPreSelected]  = useState(null)
  const [isPty,           setIsPty]           = useState(false)
  const [originalInvoice, setOriginalInvoice] = useState(null)

  // ── data ──────────────────────────────────────────────────
  const { data: hotel, loading: hotelLoading, error: hotelError } = useSupabase(
    () => supabase.from('hotels').select('*, hotel_contacts(*)').eq('id', hotelId).single(),
    [hotelId]
  )

  const { data: artists } = useSupabase(
    () => supabase.from('artists').select('id, full_name').order('full_name'),
    []
  )

  const { data: gigs, loading: gigsLoading, error: gigsError, refetch: refetchGigs } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('gig_date', dateStart)
      .lte('gig_date', dateEnd)
      .order('gig_date', { ascending: true }),
    [hotelId, dateStart, dateEnd]
  )

  const { data: gigArtists, refetch: refetchArtists } = useSupabase(
    () => gigs?.length
      ? supabase.from('artist_gig_detail').select('*').in('gig_id', gigs.map(g => g.gig_id))
      : Promise.resolve({ data: [], error: null }),
    [gigs]
  )

  const { data: invoices, loading: invLoading, error: invError, refetch: refetchInvoices } = useSupabase(
    () => supabase.from('invoice_summary').select('*').eq('hotel_id', hotelId).order('period_start', { ascending: false }),
    [hotelId]
  )

  const { data: uninvoiced } = useSupabase(
    () => supabase.from('uninvoiced_gigs').select('*').eq('hotel_id', hotelId),
    [hotelId]
  )

  // ── stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    gigs:        gigs?.length || 0,
    uninvoiced:  uninvoiced?.length || 0,
    outstanding: invoices?.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.total), 0) || 0,
    unpaid:      invoices?.filter(i => i.status === 'sent').length || 0,
  }), [gigs, uninvoiced, invoices])

  // ── gig handlers ──────────────────────────────────────────
  const { save: saveGig, saving: savingGig, saveError: gigError, clearError: clearGigError } = useSave(
    async ({ gig, artistLines, recurrence }) => {
      const { id, ...fields } = gig
      const gigFields = { ...fields, hotel_id: hotelId }
      const dates = [gigFields.gig_date]
      if (!id && recurrence) {
        const step = recurrence.type === 'weekly' ? 7 : 14
        const until = new Date(recurrence.until)
        const d = new Date(gigFields.gig_date)
        d.setDate(d.getDate() + step)
        while (d <= until) { dates.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + step) }
      }
      for (const date of dates) {
        const note = dates.length > 1
          ? `${recurrence.type === 'weekly' ? 'Weekly' : 'Bi-weekly'} series created ${new Date().toLocaleDateString('en-GB')}`
          : null
        const upsertData = { ...gigFields, gig_date: date, recurrence_note: note }
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
    { onSuccess: () => { setGigModalOpen(false); setEditGig(null); setEditGigArtists([]); refetchGigs(); refetchArtists(); showToast() } }
  )

  const cancelGig      = async (gigId) => { await supabase.from('gigs').update({ status: 'cancelled' }).eq('id', gigId); refetchGigs() }
  const deleteGig      = async (gigId) => { await supabase.from('gigs').delete().eq('id', gigId); refetchGigs() }
  const changeGigStatus = async (gigId, status) => { await supabase.from('gigs').update({ status }).eq('id', gigId); refetchGigs() }

  const { save: toggleInsurance, saving: toggling } = useSave(
    async ({ gigArtistId, value }) =>
      supabase.from('gig_artists').update({ insurance_issued: value }).eq('id', gigArtistId),
    { onSuccess: () => { refetchArtists(); showToast() } }
  )

  // ── gig modal helpers ─────────────────────────────────────
  const summaryToGig = (g) => ({
    id: g.gig_id, hotel_id: g.hotel_id, gig_date: g.gig_date,
    performance_type: g.performance_type, hotel_price: g.hotel_price,
    status: g.status, source: g.source, notes: g.notes, recurrence_note: g.recurrence_note,
  })

  const openAddGig    = () => { setEditGig(null); setEditGigArtists([]); setGigModalOpen(true) }
  const openEditGig   = (g) => { setEditGig(summaryToGig(g)); setEditGigArtists((gigArtists || []).filter(a => a.gig_id === g.gig_id)); setGigModalOpen(true) }
  const openDuplicate = (g) => { setEditGig({ ...summaryToGig(g), id: null, gig_date: '' }); setEditGigArtists((gigArtists || []).filter(a => a.gig_id === g.gig_id)); setGigModalOpen(true) }

  // ── invoice handlers ──────────────────────────────────────
  const { save: sendInvoice, saving: sending, saveError: sendError, clearError: clearSendError } = useSave(
    async ({ hotel, gigs, isPty, originalInvoice, emailSubject, emailBody, subtotal, vatAmount, total }) => {
      const primaryContact = hotel.hotel_contacts?.find(c => c.is_primary) || hotel.hotel_contacts?.[0]
      const { data: inv, error } = await supabase.from('invoices').insert({
        hotel_id: hotel.id, invoice_type: isPty ? 'pty' : 'regular',
        corrects_invoice_id: isPty ? originalInvoice?.id : null,
        period_start: gigs[gigs.length - 1]?.gig_date, period_end: gigs[0]?.gig_date,
        subtotal, vat_rate: 24, vat_amount: vatAmount, total, status: 'draft',
        sent_to_email: primaryContact?.email || null,
      }).select().single()
      if (error) throw error
      await supabase.from('invoice_gigs').insert(
        gigs.map(g => ({ invoice_id: inv.id, gig_id: g.gig_id, description: g.performance_type || 'Entertainment service', amount: Number(g.hotel_price), is_correction: isPty }))
      )
      const payload = {
        invoice: inv,
        hotel: { ...hotel, primary_email: primaryContact?.email || null },
        lineItems: gigs.map(g => ({ date: g.gig_date, description: g.performance_type || 'Entertainment service', amount: Number(g.hotel_price) })),
        driveFolder: `${hotel.name}/Invoices/${new Date().getFullYear()}`,
        emailSubject, emailBody,
      }
      isPty ? await triggerPtyGeneration({ ...payload, originalInvoice }) : await triggerInvoiceGeneration(payload)
      await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', inv.id)
      return { data: inv, error: null }
    },
    { onSuccess: () => { setInvoiceOpen(false); setInvoiceGigs([]); setPreSelected(null); refetchInvoices(); refetchGigs(); showToast() } }
  )

  const openInvoiceFromGig = (gig) => {
    const all = uninvoiced || []
    let preSelected
    if (hotel?.billing_cycle === 'weekly') {
      const gigDate = new Date(gig.gig_date)
      const day = gigDate.getDay() || 7
      const wStart = new Date(gigDate); wStart.setDate(gigDate.getDate() - day + 1)
      const wEnd   = new Date(wStart);  wEnd.setDate(wStart.getDate() + 6)
      preSelected = new Set(all.filter(g => { const d = new Date(g.gig_date); return d >= wStart && d <= wEnd }).map(g => g.gig_id))
    } else {
      preSelected = new Set([gig.gig_id])
    }
    setInvoiceGigs(all.length ? all : [gig])
    setPreSelected(preSelected)
    setIsPty(false)
    setOriginalInvoice(null)
    setInvoiceOpen(true)
  }

  // ── render ────────────────────────────────────────────────
  if (!hotelId) return null
  if (hotelLoading) return <div className="page"><LoadingSpinner /></div>
  if (hotelError)   return <div className="page"><ErrorBanner message={hotelError} /></div>

  const primaryContact = hotel?.hotel_contacts?.find(c => c.is_primary) || hotel?.hotel_contacts?.[0]

  return (
    <div className="page">
      <HotelHeader hotel={hotel} />
      <HotelStats stats={stats} periodLabel={periodLabel} />

      {/* tabs */}
      <div className="tabs">
        <button className={`tab${activeTab === 'gigs' ? ' active' : ''}`} onClick={() => setParam('tab', 'gigs')}>
          Gigs & Acts
        </button>
        <button className={`tab${activeTab === 'invoices' ? ' active' : ''}`} onClick={() => setParam('tab', 'invoices')}>
          Invoices
          {uninvoiced?.length > 0 && (
            <span className="badge badge-amber" style={{ marginLeft: 'var(--sp-2)' }}>{uninvoiced.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'gigs' && (
        <>
          <HotelPeriodNav
            periodMode={periodMode}
            weekStart={weekStart}
            month={month}
            onSetParam={setParam}
          />
          <HotelGigs
            gigs={gigs}
            gigArtists={gigArtists}
            loading={gigsLoading}
            error={gigsError}
            onRefetch={refetchGigs}
            onAdd={openAddGig}
            onEdit={openEditGig}
            onDuplicate={openDuplicate}
            onCancel={cancelGig}
            onDelete={deleteGig}
            onStatusChange={changeGigStatus}
            onGenerateInvoice={openInvoiceFromGig}
            onToggleInsurance={toggleInsurance}
            toggling={toggling}
          />
        </>
      )}

      {activeTab === 'invoices' && (
        <HotelInvoices
          invoices={invoices}
          uninvoicedGigs={uninvoiced}
          loading={invLoading}
          error={invError}
          onRefetch={refetchInvoices}
          onGenerate={(gigs) => { setInvoiceGigs(gigs); setPreSelected(null); setIsPty(false); setOriginalInvoice(null); setInvoiceOpen(true) }}
          onCreatePty={(inv) => { setInvoiceGigs(uninvoiced || []); setPreSelected(null); setIsPty(true); setOriginalInvoice(inv); setInvoiceOpen(true) }}
          onMarkPaid={async (id) => { await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id); refetchInvoices(); showToast() }}
        />
      )}

      <GigModal
        open={gigModalOpen}
        gig={editGig}
        gigArtists={editGigArtists}
        hotelId={hotelId}
        artists={artists}
        onSave={saveGig}
        onClose={() => { setGigModalOpen(false); setEditGig(null); clearGigError() }}
        saving={savingGig}
        saveError={gigError}
        onClearError={clearGigError}
      />

      <InvoiceReview
        open={invoiceOpen}
        hotel={{ ...hotel, primary_email: primaryContact?.email }}
        gigs={invoiceGigs}
        preSelected={invoicePreSelected}
        isPty={isPty}
        originalInvoice={originalInvoice}
        onConfirm={sendInvoice}
        onClose={() => { setInvoiceOpen(false); setPreSelected(null); clearSendError() }}
        sending={sending}
        sendError={sendError}
        onClearError={clearSendError}
      />

      {toastVisible && <SaveToast message="Saved" />}
    </div>
  )
}
