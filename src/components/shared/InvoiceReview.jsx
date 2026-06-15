import { useState, useEffect, useRef } from 'react'
import { fmtDateLong as fmtDate } from '../../lib/dates.js'

const VAT_RATE = 0.24

export default function InvoiceReview({
  open,
  hotel,
  gigs,
  preSelected,
  isPty,
  originalInvoice,
  onUpload,    // fn({ hotel, gigs, subtotal, vatAmount, total, file }) — creates record + uploads
  onConfirm,   // fn() — generate invoice, not implemented yet
  onClose,
  saving,
}) {
  const [selected,    setSelected]    = useState(new Set())
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open && gigs?.length) {
      setSelected(preSelected instanceof Set ? preSelected : new Set(gigs.map(g => g.gig_id)))
    }
    if (!open) { setUploadError(null); setUploading(false) }
  }, [open, gigs, preSelected])

  const toggleGig = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const selectedGigs = (gigs || []).filter(g => selected.has(g.gig_id))
  const subtotal     = selectedGigs.reduce((s, g) => s + Number(g.hotel_price), 0)
  const vat          = subtotal * VAT_RATE
  const total        = subtotal + vat

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      await onUpload({ hotel, gigs: selectedGigs, isPty, originalInvoice, subtotal, vatAmount: vat, total, file })
    } catch (err) {
      setUploadError(err.message || 'Upload failed — please try again')
      setUploading(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">

        <div className="modal-header">
          <h2 className="modal-title">{isPty ? 'Create correction (PTY)' : 'Invoice gigs'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={uploading}>✕</button>
        </div>

        <div className="modal-body">
          {isPty && (
            <div className="banner banner-warning" style={{ marginBottom: 'var(--sp-4)' }}>
              Creating a <strong>correction invoice (PTY)</strong> referencing <strong>{originalInvoice?.invoice_number}</strong>.
            </div>
          )}

          <div style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hotel: </span>
            <strong>{hotel?.name}</strong>
          </div>

          {/* gig selector */}
          <div className="section-label">Select gigs to include</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 'var(--sp-4)' }}>
            {!(gigs?.length) ? (
              <div style={{ padding: 'var(--sp-4)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                No uninvoiced gigs found for this hotel.
              </div>
            ) : gigs.map((g, i) => (
              <label
                key={g.gig_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
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
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 'var(--sp-3) var(--sp-4)',
            fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)',
            marginBottom: uploadError ? 'var(--sp-3)' : 0,
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

          {uploadError && (
            <div style={{ color: 'var(--red)', fontSize: 'var(--text-sm)', display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', marginTop: 'var(--sp-3)' }}>
              ⚠ {uploadError}
              <button className="btn btn-ghost btn-sm" onClick={() => setUploadError(null)}>✕</button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />

          <button
            className="btn btn-secondary"
            disabled={uploading || selectedGigs.length === 0}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? '⏳ Uploading…' : '⬆ Upload invoice PDF'}
          </button>

          <button
            className="btn btn-ghost"
            disabled={true}
            title="Generate invoice — coming soon"
            style={{ color: 'var(--text-muted)', cursor: 'not-allowed' }}
          >
            Generate invoice
          </button>
        </div>

      </div>
    </div>
  )
}
