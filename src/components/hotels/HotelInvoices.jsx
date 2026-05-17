import React, { useState } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import { fmtDate } from '../../lib/dates.js'
import { supabase } from '../../lib/supabase.js'
import InvoiceDetail from './InvoiceDetail.jsx'
import InvoiceDetailSkeleton from './InvoiceDetailSkeleton.jsx'

const STATUS_BADGE = {
  draft:     'badge-neutral',
  uploaded:  'badge-blue',
  sent:      'badge-amber',
  paid:      'badge-green',
  cancelled: 'badge-red',
}

export default function HotelInvoices({
  invoices, uninvoicedGigs, loading, error, onRefetch,
  onGenerate, onCreatePty, onUpdate, onDelete, onViewGig,
}) {
  const [expanded,    setExpanded]    = useState(new Set())
  const [gigsByInv,   setGigsByInv]   = useState({})
  const [loadingGigs, setLoadingGigs] = useState(new Set())

  const toggle = async (invId) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(invId)) {
        next.delete(invId)
        return next
      }
      next.add(invId)
      return next
    })

    // fetch gigs if not already loaded
    if (!gigsByInv[invId]) {
      setLoadingGigs(prev => new Set([...prev, invId]))
      const { data } = await supabase
        .from('invoice_gigs')
        .select('*, gigs(gig_date, performance_type)')
        .eq('invoice_id', invId)
        .order('created_at')
      setGigsByInv(prev => ({
        ...prev,
        [invId]: (data || []).map(g => ({
          ...g,
          gig_date:         g.gigs?.gig_date,
          performance_type: g.gigs?.performance_type,
        }))
      }))
      setLoadingGigs(prev => { const next = new Set(prev); next.delete(invId); return next })
    }
  }

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
              <th style={{ width: 24 }} />
              <th>Invoice #</th>
              <th>Type</th>
              <th>Period</th>
              <th>Gigs</th>
              <th>Net</th>
              <th>VAT</th>
              <th>Total</th>
              <th>Status</th>
              <th>File</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!(invoices?.length) ? (
              <tr><td colSpan={11} className="empty-state">No invoices yet.</td></tr>
            ) : invoices.map(inv => {
              const isOpen = expanded.has(inv.id)
              return (
                <React.Fragment key={inv.id}>
                  <tr
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
                    <td>
                      <span className={`badge ${STATUS_BADGE[inv.status] || 'badge-neutral'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      {inv.drive_url
                        ? <span style={{ color: 'var(--green)', fontSize: 'var(--text-xs)' }}>📄 {inv.drive_filename || 'File'}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                      }
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        {inv.status !== 'cancelled' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => onCreatePty(inv)}>PTY</button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isOpen && (
                    loadingGigs.has(inv.id)
                      ? <InvoiceDetailSkeleton />
                      : <InvoiceDetail
                          inv={inv}
                          gigs={gigsByInv[inv.id]}
                          onUpdate={async (id, fields) => { await onUpdate(id, fields); onRefetch() }}
                          onDelete={async (id) => { await onDelete(id); onRefetch(); setExpanded(prev => { const next = new Set(prev); next.delete(id); return next }) }}
                          onViewGig={onViewGig}
                        />
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
