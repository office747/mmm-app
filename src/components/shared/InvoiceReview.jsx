import { useState, useEffect } from 'react'
import { SaveError } from '../ui/index.jsx'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const VAT_RATE = 0.24

export default function InvoiceReview({
  open,
  hotel,
  gigs,           // uninvoiced gigs to include — each is a gig_summary row
  isPty,          // boolean — correction invoice
  originalInvoice,// the invoice being corrected (if PTY)
  onConfirm,      // fires N8n webhook
  onClose,
  sending,
  sendError,
  onClearError,
}) {
  const [selected, setSelected]       = useState(new Set())
  const [emailSubject, setSubject]    = useState('')
  const [emailBody, setBody]          = useState('')

  useEffect(() => {
    if (open && gigs?.length) {
      setSelected(new Set(gigs.map(g => g.gig_id)))
    }
  }, [open, gigs])

  useEffect(() => {
    if (!open || !hotel) return
    const subject = isPty
      ? `Credit note — ${hotel.name}`
      : `Invoice — ${hotel.name}`
    setSubject(subject)
    setBody(
      isPty
        ? `Dear ${hotel.name} team,\n\nPlease find attached a credit note correcting a previous invoice.\n\nKind regards,\nMMM`
        : `Dear ${hotel.name} team,\n\nPlease find attached our invoice for entertainment services.\n\nKind regards,\nMMM`
    )
  }, [open, hotel, isPty])

  const toggleGig = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selectedGigs = (gigs || []).filter(g => selected.has(g.gig_id))
  const subtotal     = selectedGigs.reduce((s, g) => s + Number(g.hotel_price), 0)
  const vat          = subtotal * VAT_RATE
  const total        = subtotal + vat

  const handleConfirm = () => {
    if (!selectedGigs.length) return
    onConfirm({
      hotel,
      gigs:         selectedGigs,
      isPty,
      originalInvoice,
      emailSubject,
      emailBody,
      subtotal,
      vatAmount:    vat,
      total,
    })
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 620 }}>

        <div className="modal-header">
          <h2 className="modal-title">
            {isPty ? 'Create correction (PTY)' : 'Review & send invoice'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={sendError} onDismiss={onClearError} />

          {isPty && (
            <div className="banner banner-warning" style={{ marginBottom: 'var(--sp-4)' }}>
              This will create a <strong>correction invoice (PTY)</strong> referencing{' '}
              <strong>{originalInvoice?.invoice_number}</strong>.
            </div>
          )}

          {/* hotel info */}
          <div style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hotel: </span>
            <strong>{hotel?.name}</strong>
            {hotel?.primary_email && (
              <> &nbsp;·&nbsp; <span style={{ color: 'var(--text-secondary)' }}>{hotel.primary_email}</span></>
            )}
          </div>

          {/* gig selector */}
          <div className="section-label">Select gigs to include</div>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            marginBottom: 'var(--sp-4)',
          }}>
            {(gigs || []).map((g, i) => (
              <label
                key={g.gig_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-2) var(--sp-3)',
                  borderBottom: i < gigs.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  background: selected.has(g.gig_id) ? 'var(--brand-subtle)' : 'var(--bg-card)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(g.gig_id)}
                  onChange={() => toggleGig(g.gig_id)}
                  style={{ accentColor: 'var(--brand)', width: 14, height: 14 }}
                />
                <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>
                  {fmtDate(g.gig_date)} — {g.performance_type || 'Performance'}
                </span>
                <span style={{ fontWeight: 'var(--weight-semi)', fontSize: 'var(--text-sm)' }}>
                  €{Number(g.hotel_price).toFixed(2)}
                </span>
              </label>
            ))}
          </div>

          {/* totals */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--sp-3) var(--sp-4)',
            marginBottom: 'var(--sp-4)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal (excl. VAT)</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>VAT 24%</span>
              <span>€{vat.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--weight-semi)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-1)', marginTop: 'var(--sp-1)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--brand)' }}>€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* email */}
          <div className="section-label">Email to hotel</div>
          <div className="form-row">
            <label>Subject</label>
            <input type="text" value={emailSubject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Body</label>
            <textarea value={emailBody} onChange={e => setBody(e.target.value)} style={{ minHeight: 120 }} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={sending || selectedGigs.length === 0}
          >
            {sending ? 'Sending…' : isPty ? 'Create & send PTY' : 'Confirm & send invoice'}
          </button>
        </div>

      </div>
    </div>
  )
}
