import { useState } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import { fmtDateLong as fmtDate } from '../../lib/dates.js'


const STATUS_BADGE = {
  draft:     'badge-neutral',
  sent:      'badge-blue',
  paid:      'badge-green',
  cancelled: 'badge-red',
}

export default function HotelInvoices({
  invoices,
  uninvoicedGigs,
  loading,
  error,
  onRefetch,
  onGenerate,
  onCreatePty,
  onMarkPaid,
}) {
  const [expandedInv, setExpanded] = useState(new Set())

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  if (loading) return <LoadingSpinner message="Loading invoices…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  return (
    <div>
      {/* uninvoiced gigs banner */}
      {uninvoicedGigs?.length > 0 && (
        <div className="banner banner-warning" style={{ justifyContent: 'space-between' }}>
          <span>
            ⚠ <strong>{uninvoicedGigs.length} performed gig{uninvoicedGigs.length !== 1 ? 's' : ''}</strong> not yet invoiced
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => onGenerate(uninvoicedGigs)}>
            Generate invoice
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 24 }}></th>
              <th>Invoice #</th>
              <th>Type</th>
              <th>Period</th>
              <th>Gigs</th>
              <th>Subtotal</th>
              <th>VAT 24%</th>
              <th>Total</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).length === 0 ? (
              <tr><td colSpan={12} className="empty-state">No invoices yet.</td></tr>
            ) : (invoices || []).map(inv => {
              const isOpen = expandedInv.has(inv.id)
              return (
                <>
                  <tr
                    key={inv.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggle(inv.id)}
                    className={inv.status === 'cancelled' ? 'row-cancelled' : ''}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {isOpen ? '▾' : '▸'}
                    </td>
                    <td style={{ fontWeight: 'var(--weight-medium)', fontFamily: 'monospace' }}>
                      {inv.invoice_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {inv.invoice_type === 'pty'
                        ? <span className="badge badge-amber">PTY</span>
                        : <span className="badge badge-neutral">Regular</span>
                      }
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.gig_count}</td>
                    <td>€{Number(inv.subtotal).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>€{Number(inv.vat_amount).toFixed(2)}</td>
                    <td style={{ fontWeight: 'var(--weight-semi)' }}>€{Number(inv.total).toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_BADGE[inv.status] || 'badge-neutral'}`}>{inv.status}</span></td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{fmtDate(inv.sent_at)}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{fmtDate(inv.paid_at)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        {inv.drive_url && (
                          <a href={inv.drive_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📄</a>
                        )}
                        {inv.status === 'sent' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => onMarkPaid(inv.id)}>Mark paid</button>
                        )}
                        {inv.status !== 'cancelled' && inv.status !== 'draft' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => onCreatePty(inv)}>PTY</button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* expanded invoice detail */}
                  {isOpen && (
                    <tr key={`${inv.id}-detail`}>
                      <td colSpan={12} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                        <div className="row-detail-inner">
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {inv.sent_to_email && <div>Sent to: <strong>{inv.sent_to_email}</strong></div>}
                            {inv.entersoft_invoice_id && <div>Entersoft ID: <code>{inv.entersoft_invoice_id}</code></div>}
                            {inv.invoice_type === 'pty' && inv.corrects_invoice_id && (
                              <div>Corrects invoice: <code>{inv.corrects_invoice_id}</code></div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
