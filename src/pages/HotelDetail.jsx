import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useSave } from '../hooks/useSave.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { useSaveToast, LoadingSpinner, ErrorBanner, SaveToast } from '../components/ui/index.jsx'
import { triggerInvoiceGeneration, triggerPtyGeneration } from '../lib/n8n/index.js'
import HotelGigs from '../components/hotels/HotelGigs.jsx'
import HotelInvoices from '../components/hotels/HotelInvoices.jsx'
import GigModal from '../components/shared/GigModal.jsx'
import InvoiceReview from '../components/shared/InvoiceReview.jsx'

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

export default function HotelDetail() {
  const navigate  = useNavigate()
  const { params, setParam } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const hotelId   = params.get('id')
  const activeTab = params.get('tab') || 'gigs'
  const { start: monthStart, end: monthEnd } = currentMonthRange()

  // modal state
  const [gigModalOpen, setGigModalOpen]         = useState(false)
  const [editGig, setEditGig]                   = useState(null)
  const [editGigArtists, setEditGigArtists]     = useState([])
  const [invoiceOpen, setInvoiceOpen]           = useState(false)
  const [invoiceGigs, setInvoiceGigs]           = useState([])
  const [isPty, setIsPty]                       = useState(false)
  const [originalInvoice, setOriginalInvoice]   = useState(null)

  // ── hotel ─────────────────────────────────────────────────
  const { data: hotel, loading: hotelLoading, error: hotelError } = useSupabase(
    () => supabase.from('hotels').select('*, hotel_contacts(*)').eq('id', hotelId).single(),
    [hotelId]
  )

  // ── all artists ───────────────────────────────────────────
  const { data: artists } = useSupabase(
    () => supabase.from('artists').select('id, full_name').order('full_name'),
    []
  )

  // ── gigs (via gig_summary view) ───────────────────────────
  const { data: gigs, loading: gigsLoading, error: gigsError, refetch: refetchGigs } = useSupabase(
    () => supabase
      .from('gig_summary')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('gig_date', monthStart)
      .lte('gig_date', monthEnd)
      .order('gig_date', { ascending: false }),
    [hotelId]
  )

  // ── artist lines for expanded gig rows ────────────────────
  const { data: gigArtists, refetch: refetchArtists } = useSupabase(
    () => gigs?.length
      ? supabase
          .from('artist_gig_detail')
          .select('*')
          .in('gig_id', gigs.map(g => g.gig_id))
      : Promise.resolve({ data: [], error: null }),
    [gigs]
  )

  // ── invoices ──────────────────────────────────────────────
  const { data: invoices, loading: invLoading, error: invError, refetch: refetchInvoices } = useSupabase(
    () => supabase
      .from('invoice_summary')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('period_start', { ascending: false }),
    [hotelId]
  )

  // ── uninvoiced gigs ───────────────────────────────────────
  const { data: uninvoiced } = useSupabase(
    () => supabase
      .from('uninvoiced_gigs')
      .select('*')
      .eq('hotel_id', hotelId),
    [hotelId]
  )

  // ── stats ─────────────────────────────────────────────────
  const stats = {
    gigs:        gigs?.length || 0,
    invoiced:    invoices?.filter(i => i.status !== 'cancelled').reduce((s, i) => s + Number(i.total), 0) || 0,
    outstanding: invoices?.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.total), 0) || 0,
    unpaid:      invoices?.filter(i => i.status === 'sent').length || 0,
  }

  // ── save gig ──────────────────────────────────────────────
  const { save: saveGig, saving: savingGig, saveError: gigError, clearError: clearGigError } = useSave(
    async ({ gig, artistLines, recurrence }) => {
      const { id, ...fields } = gig
      const gigFields = { ...fields, hotel_id: hotelId }

      // build dates to create
      const dates = [gigFields.gig_date]
      if (!id && recurrence) {
        const step = recurrence.type === 'weekly' ? 7 : 14
        const until = new Date(recurrence.until)
        const d = new Date(gigFields.gig_date)
        d.setDate(d.getDate() + step)
        while (d <= until) {
          dates.push(d.toISOString().slice(0, 10))
          d.setDate(d.getDate() + step)
        }
      }

      // create gig(s)
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

        // replace artist lines
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
                insurance_issued: l.insurance_issued || false,
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
        refetchArtists()
        showToast()
      }
    }
  )

  // ── cancel gig ────────────────────────────────────────────
  const cancelGig = async (gigId) => {
    await supabase.from('gigs').update({ status: 'cancelled' }).eq('id', gigId)
    refetchGigs()
  }

  const changeGigStatus = async (gigId, status) => {
    await supabase.from('gigs').update({ status }).eq('id', gigId)
    refetchGigs()
  }

  const deleteGig = async (gigId) => {
    await supabase.from('gigs').delete().eq('id', gigId)
    refetchGigs()
  }

  const { save: toggleInsurance, saving: toggling } = useSave(
    async ({ gigArtistId, value }) => {
      console.log('toggleInsurance called', { gigArtistId, value })
      return supabase.from('gig_artists').update({ insurance_issued: value }).eq('id', gigArtistId)
    },
    { onSuccess: () => { refetchArtists(); showToast() } }
  )

  // ── invoice send ─────────────────────────────────────────
  const { save: sendInvoice, saving: sending, saveError: sendError, clearError: clearSendError } = useSave(
    async ({ hotel, gigs, isPty, originalInvoice, emailSubject, emailBody, subtotal, vatAmount, total }) => {
      const primaryContact = hotel.hotel_contacts?.find(c => c.is_primary) || hotel.hotel_contacts?.[0]

      // create invoice record
      const { data: inv, error } = await supabase.from('invoices').insert({
        hotel_id:            hotel.id,
        invoice_type:        isPty ? 'pty' : 'regular',
        corrects_invoice_id: isPty ? originalInvoice?.id : null,
        period_start:        gigs[gigs.length - 1]?.gig_date,
        period_end:          gigs[0]?.gig_date,
        subtotal,
        vat_rate:    24,
        vat_amount:  vatAmount,
        total,
        status:      'draft',
        sent_to_email: primaryContact?.email || null,
      }).select().single()
      if (error) throw error

      // link gigs
      await supabase.from('invoice_gigs').insert(
        gigs.map(g => ({
          invoice_id:  inv.id,
          gig_id:      g.gig_id,
          description: g.performance_type || 'Entertainment service',
          amount:      Number(g.hotel_price),
          is_correction: isPty,
        }))
      )

      // fire N8n
      const payload = {
        invoice: inv,
        hotel: { ...hotel, primary_email: primaryContact?.email },
        lineItems: gigs.map(g => ({
          date:        g.gig_date,
          description: g.performance_type || 'Entertainment service',
          amount:      Number(g.hotel_price),
        })),
        driveFolder: `${hotel.name}/Invoices/${new Date().getFullYear()}`,
        emailSubject,
        emailBody,
      }

      if (isPty) {
        await triggerPtyGeneration({ ...payload, originalInvoice })
      } else {
        await triggerInvoiceGeneration(payload)
      }

      // mark invoice as sent
      await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', inv.id)

      return { data: inv, error: null }
    },
    {
      onSuccess: () => {
        setInvoiceOpen(false)
        setInvoiceGigs([])
        refetchInvoices()
        refetchGigs()
        showToast()
      }
    }
  )

  // ── open gig modal helpers ────────────────────────────────
  const openAddGig = () => { setEditGig(null); setEditGigArtists([]); setGigModalOpen(true) }

  // gig_summary uses gig_id — map to id for GigModal
  const summaryToGig = (g) => ({
    id:               g.gig_id,
    hotel_id:         g.hotel_id,
    gig_date:         g.gig_date,
    performance_type: g.performance_type,
    hotel_price:      g.hotel_price,
    status:           g.status,
    source:           g.source,
    notes:            g.notes,
    recurrence_note:  g.recurrence_note,
  })

  const openEditGig = (gig) => {
    setEditGig(summaryToGig(gig))
    const lines = (gigArtists || []).filter(a => a.gig_id === gig.gig_id)
    setEditGigArtists(lines)
    setGigModalOpen(true)
  }

  const openDuplicate = (gig) => {
    setEditGig({ ...summaryToGig(gig), id: null, gig_date: '' })
    const lines = (gigArtists || []).filter(a => a.gig_id === gig.gig_id)
    setEditGigArtists(lines)
    setGigModalOpen(true)
  }

  if (!hotelId) return null
  if (hotelLoading) return <div className="page"><LoadingSpinner /></div>
  if (hotelError)   return <div className="page"><ErrorBanner message={hotelError} /></div>

  const primaryContact = hotel?.hotel_contacts?.find(c => c.is_primary) || hotel?.hotel_contacts?.[0]

  return (
    <div className="page">

      {/* back */}
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hotels')}>← All hotels</button>
      </div>

      {/* header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{hotel?.name}</h1>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>
            {hotel?.legal_name && <>{hotel.legal_name} &nbsp;·&nbsp;</>}
            Billing: <strong>{hotel?.billing_cycle}</strong>
            {primaryContact?.email && <> &nbsp;·&nbsp; {primaryContact.email}</>}
            {hotel?.season_start && <> &nbsp;·&nbsp; Season: {hotel.season_start} – {hotel.season_end}</>}
          </div>
          {hotel?.notes && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--sp-1)' }}>
              {hotel.notes}
            </div>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="stat-row">
        <div className="stat-card"><div className="stat-label">Gigs this month</div><div className="stat-value">{stats.gigs}</div></div>
        <div className="stat-card"><div className="stat-label">Total invoiced</div><div className="stat-value green">€{stats.invoiced.toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value amber">€{stats.outstanding.toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Unpaid invoices</div><div className="stat-value red">{stats.unpaid}</div></div>
      </div>

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

      {/* gigs tab */}
      {activeTab === 'gigs' && (
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
          onGenerateInvoice={(gig) => { setInvoiceGigs([gig]); setIsPty(false); setOriginalInvoice(null); setInvoiceOpen(true) }}
          onToggleInsurance={toggleInsurance}
          toggling={toggling}
        />
      )}

      {/* invoices tab */}
      {activeTab === 'invoices' && (
        <HotelInvoices
          invoices={invoices}
          uninvoicedGigs={uninvoiced}
          loading={invLoading}
          error={invError}
          onRefetch={refetchInvoices}
          onGenerate={(gigs) => { setInvoiceGigs(gigs); setIsPty(false); setOriginalInvoice(null); setInvoiceOpen(true) }}
          onCreatePty={(inv) => { setInvoiceGigs(uninvoiced || []); setIsPty(true); setOriginalInvoice(inv); setInvoiceOpen(true) }}
          onMarkPaid={async (id) => {
            await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
            refetchInvoices()
            showToast()
          }}
        />
      )}

      {/* gig modal */}
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

      {/* invoice review modal */}
      <InvoiceReview
        open={invoiceOpen}
        hotel={{ ...hotel, primary_email: primaryContact?.email }}
        gigs={invoiceGigs}
        isPty={isPty}
        originalInvoice={originalInvoice}
        onConfirm={sendInvoice}
        onClose={() => { setInvoiceOpen(false); clearSendError() }}
        sending={sending}
        sendError={sendError}
        onClearError={clearSendError}
      />

      {toastVisible && <SaveToast message="Saved" />}
    </div>
  )
}
