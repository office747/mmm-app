import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fmtDate, fmtDateLong } from '../../lib/dates.js'
import { triggerWebhook } from '../../lib/n8n/base.js'

const STATUS_BADGE = {
  draft:     'badge-neutral',
  uploaded:  'badge-blue',
  sent:      'badge-amber',
  paid:      'badge-green',
  cancelled: 'badge-red',
}

const STATUS_LABEL = {
  draft:    'Draft',
  uploaded: 'Uploaded',
  sent:     'Sent',
  paid:     'Paid',
  cancelled:'Cancelled',
}

// ── Send Invoice Popup ────────────────────────────────────────
function SendInvoicePopup({ inv, triggerRef, onSend, onClose, sending }) {
  const [message, setMessage] = useState('')
  const popupRef = useRef(null)
  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current) {
      setMessage(`Dear team,\n\nPlease find attached invoice${inv.invoice_number ? ` #${inv.invoice_number}` : ''} for the period ${fmtDate(inv.period_start)} – ${fmtDate(inv.period_end)}.\n\nTotal: €${Number(inv.total).toFixed(2)}\n\nBest regards,\nMakeMusicMemories`)
      initialised.current = true
    }
  })

  // position from trigger
  const getPos = () => {
    if (!triggerRef?.current) return { top: 100, left: 100 }
    const r = triggerRef.current.getBoundingClientRect()
    const POPUP_H = 380
    const POPUP_W = 320
    const openUp  = (window.innerHeight - r.bottom) < POPUP_H && r.top > POPUP_H
    return {
      top:  openUp ? r.top - POPUP_H - 4 : r.bottom + 4,
      left: Math.max(8, Math.min(r.left, window.innerWidth - POPUP_W - 8)),
    }
  }
  const pos = getPos()

  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, triggerRef])

  return createPortal(
    <div
      ref={popupRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top, left: pos.left,
        width: 320,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1000,
        padding: 'var(--sp-3)',
        fontSize: 'var(--text-xs)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
        <div>
          <div style={{ fontWeight: 'var(--weight-semi)', color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
            @ Send invoice email
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            To: {inv.sent_to_email || 'no email set'}
            {inv.drive_url && (
              <span style={{ marginLeft: 8, color: 'var(--green)' }}>📎 file attached</span>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 12, padding: 2 }}>✕</button>
      </div>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        style={{ width: '100%', minHeight: 160, fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-loose)', resize: 'vertical', marginBottom: 'var(--sp-2)' }}
      />

      <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary btn-sm"
          disabled={sending || !message.trim() || !inv.sent_to_email}
          onClick={() => onSend(message)}
        >
          {sending ? 'Sending…' : 'Send email'}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Main component ────────────────────────────────────────────
export default function InvoiceDetail({ inv, gigs, onUpdate, onDelete, onViewGig }) {
  const [driveInput,     setDriveInput]     = useState('')
  const [showDriveInput, setShowDriveInput] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [showSendPopup,  setShowSendPopup]  = useState(false)
  const [sendingSend,    setSendingSend]    = useState(false)
  const sendBtnRef = useRef(null)

  const handleUploadLink = async () => {
    if (!driveInput.trim()) return
    setSaving(true)
    await onUpdate(inv.id, {
      drive_url:   driveInput.trim(),
      drive_filename: driveInput.trim().split('/').pop()?.split('?')[0] || 'Invoice',
      uploaded_at: new Date().toISOString(),
      status:      'uploaded',
    })
    setDriveInput('')
    setShowDriveInput(false)
    setSaving(false)
  }

  const handleRemoveFile = async () => {
    if (!window.confirm('Remove the file link? Invoice will return to Draft status.')) return
    await onUpdate(inv.id, {
      drive_url:      null,
      drive_filename: null,
      uploaded_at:    null,
      status:         'draft',
    })
  }

  const handleMarkSent = async () => {
    if (!window.confirm('Mark this invoice as sent? This confirms it was delivered to the hotel by other means.')) return
    await onUpdate(inv.id, { status: 'sent', sent_at: new Date().toISOString() })
  }

  const handleSendEmail = async (message) => {
    setSendingSend(true)
    try {
      await triggerWebhook('g1g5/send-invoice', {
        invoice: {
          id:             inv.id,
          invoice_number: inv.invoice_number,
          period_start:   inv.period_start,
          period_end:     inv.period_end,
          total:          inv.total,
          drive_url:      inv.drive_url || null,
          drive_filename: inv.drive_filename || null,
          sent_to_email:  inv.sent_to_email,
        },
        message,
        triggered_at: new Date().toISOString(),
      })
      // mark as sent after successful webhook
      await onUpdate(inv.id, { status: 'sent', sent_at: new Date().toISOString() })
      setShowSendPopup(false)
    } catch (err) {
      console.warn('Send invoice failed:', err.message)
    } finally {
      setSendingSend(false)
    }
  }

  const handleMarkPaid = async () => {
    await onUpdate(inv.id, { status: 'paid', paid_at: new Date().toISOString() })
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice permanently?')) return
    await onDelete(inv.id)
  }

  return (
    <tr>
      <td colSpan={10} style={{ padding: 0, borderBottom: '2px solid var(--border)' }}>
        <div className="row-detail-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)' }}>

          {/* LEFT — gigs on this invoice */}
          <div>
            <div className="section-label" style={{ marginBottom: 'var(--sp-2)' }}>Gigs on this invoice</div>
            {!gigs?.length ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No gigs linked.</div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '2px 8px 6px 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '2px 8px 6px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase' }}>Performance</th>
                    <th style={{ textAlign: 'right', padding: '2px 0 6px 8px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {gigs.map(g => (
                    <tr
                      key={g.id}
                      onClick={e => { e.stopPropagation(); onViewGig?.(g) }}
                      style={{ cursor: onViewGig ? 'pointer' : 'default' }}
                    >
                      <td style={{ padding: '4px 8px 4px 0', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--brand)', fontWeight: 'var(--weight-medium)' }}>
                          {fmtDate(g.gig_date)} →
                        </span>
                      </td>
                      <td style={{ padding: '4px 8px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        {g.description || g.performance_type || '—'}
                      </td>
                      <td style={{ padding: '4px 0 4px 8px', borderTop: '1px solid var(--border)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                        €{Number(g.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ padding: '8px 8px 0 0', borderTop: '2px solid var(--border)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Subtotal</td>
                    <td style={{ padding: '8px 0 0 8px', borderTop: '2px solid var(--border)', textAlign: 'right' }}>€{Number(inv.subtotal).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '4px 8px 0 0', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>VAT {inv.vat_rate}%</td>
                    <td style={{ padding: '4px 0 0 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>€{Number(inv.vat_amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '4px 8px 0 0', textAlign: 'right', fontWeight: 'var(--weight-semi)' }}>Total</td>
                    <td style={{ padding: '4px 0 0 8px', textAlign: 'right', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}>€{Number(inv.total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* RIGHT — file, metadata, actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

            {/* status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span className={`badge ${STATUS_BADGE[inv.status] || 'badge-neutral'}`}>
                {STATUS_LABEL[inv.status] || inv.status}
              </span>
              {inv.sent_to_email && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  → {inv.sent_to_email}
                </span>
              )}
            </div>

            {/* file section */}
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--sp-2)' }}>Invoice file</div>

              {inv.drive_url ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-2) var(--sp-3)',
                  background: 'var(--green-bg)',
                  border: '1px solid var(--green-border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 'var(--text-sm)',
                }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {inv.drive_filename || 'Invoice file'}
                  </span>
                  <a
                    href={inv.drive_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    onClick={e => e.stopPropagation()}
                  >
                    Open ↗
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)' }}
                    onClick={e => { e.stopPropagation(); handleRemoveFile() }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  {showDriveInput ? (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                      <input
                        type="url"
                        value={driveInput}
                        onChange={e => setDriveInput(e.target.value)}
                        placeholder="Paste Google Drive link…"
                        style={{ flex: 1 }}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleUploadLink()}
                      />
                      <button className="btn btn-primary btn-sm" disabled={saving || !driveInput.trim()} onClick={handleUploadLink}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowDriveInput(false); setDriveInput('') }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); setShowDriveInput(true) }}
                    >
                      + Add Google Drive link
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* metadata */}
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {inv.invoice_number && <div>Invoice #: <strong>{inv.invoice_number}</strong></div>}
              {inv.uploaded_at && <div>Uploaded: {fmtDateLong(inv.uploaded_at)}</div>}
              {inv.sent_at && <div>Sent: {fmtDateLong(inv.sent_at)}</div>}
              {inv.paid_at && <div>Paid: {fmtDateLong(inv.paid_at)}</div>}
              {inv.entersoft_invoice_id && <div>Entersoft: <code>{inv.entersoft_invoice_id}</code></div>}
            </div>

            {/* actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', position: 'relative' }}>
              {(inv.status === 'uploaded' || inv.status === 'draft') && (
                <>
                  <button
                    ref={sendBtnRef}
                    className="btn btn-primary btn-sm"
                    disabled={!inv.drive_url}
                    title={!inv.drive_url ? 'Add a file link first' : 'Send invoice by email'}
                    onClick={e => { e.stopPropagation(); setShowSendPopup(p => !p) }}
                  >
                    @ Send email
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={e => { e.stopPropagation(); handleMarkSent() }}
                  >
                    ✓ Mark as sent
                  </button>
                </>
              )}
              {inv.status === 'sent' && (
                <>
                  <button
                    ref={sendBtnRef}
                    className="btn btn-ghost btn-sm"
                    onClick={e => { e.stopPropagation(); setShowSendPopup(p => !p) }}
                  >
                    ↩ Resend email
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleMarkPaid() }}>
                    ✓ Mark as paid
                  </button>
                </>
              )}
              {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete() }}>
                  🗑 Delete
                </button>
              )}
            </div>

            {showSendPopup && (
              <SendInvoicePopup
                inv={inv}
                triggerRef={sendBtnRef}
                onSend={handleSendEmail}
                onClose={() => setShowSendPopup(false)}
                sending={sendingSend}
              />
            )}

          </div>
        </div>
      </td>
    </tr>
  )
}
