import React, { useMemo } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import { fmtDate } from '../../lib/dates.js'
import { useQueryParams } from '../../hooks/useQueryParams.js'
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

const ALL_STATUSES = ['draft', 'uploaded', 'sent', 'paid', 'cancelled']

function thisMonthRange() {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  return {
    start: new Date(y, m, 1).toISOString().slice(0, 10),
    end:   new Date(y, m + 1, 0).toISOString().slice(0, 10),
  }
}

export default function HotelInvoices({
  invoices, uninvoicedGigs, loading, error, onRefetch,
  onGenerate, onCreatePty, onUpdate, onDelete, onViewGig,
}) {
  const [expanded,    setExpanded]    = React.useState(new Set())
  const [gigsByInv,   setGigsByInv]   = React.useState({})
  const [loadingGigs, setLoadingGigs] = React.useState(new Set())

  // ── filters via query params ──────────────────────────────
  const { params, setParam, setParams } = useQueryParams()

  // ?inv_status=sent,paid  ?inv_from=2026-01-01  ?inv_to=2026-01-31
  const statusParam = params.get('inv_status') || ''
  const dateFrom    = params.get('inv_from')   || ''
  const dateTo      = params.get('inv_to')     || ''

  const statusFilter = new Set(statusParam ? statusParam.split(',') : [])

  const toggleStatus = (s) => {
    const next = new Set(statusFilter)
    next.has(s) ? next.delete(s) : next.add(s)
    setParam('inv_status', next.size ? [...next].join(',') : null)
  }

  const setDateFrom = (v) => setParam('inv_from', v || null)
  const setDateTo   = (v) => setParam('inv_to',   v || null)

  const applyThisMonth = () => {
    const { start, end } = thisMonthRange()
    setParams({ inv_from: start, inv_to: end })
  }

  const clearFilters = () => setParams({ inv_status: null, inv_from: null, inv_to: null })

  const hasFilters = statusFilter.size > 0 || dateFrom || dateTo

  const filtered = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(inv => {
      if (statusFilter.size > 0 && !statusFilter.has(inv.status)) return false
      if (dateFrom && inv.period_end   < dateFrom) return false
      if (dateTo   && inv.period_start > dateTo)   return false
      return true
    })
  }, [invoices, statusFilter, dateFrom, dateTo])

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
          <span>⚠ <strong>{uninvoicedGigs.length} performed gig{uninvoicedGigs.length !== 1 ? 's' : ''}</strong> not yet invoiced</span>
          <button className="btn btn-primary btn-sm" onClick={() => onGenerate(uninvoicedGigs)}>Generate invoice</button>
        </div>
      )}

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-3)', flexWrap: 'wrap' }}>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`badge ${statusFilter.has(s) ? STATUS_BADGE[s] : 'badge-neutral'}`}
            style={{
              cursor: 'pointer', border: 'none',
              opacity: statusFilter.size > 0 && !statusFilter.has(s) ? 0.4 : 1,
              fontWeight: statusFilter.has(s) ? 'var(--weight-semi)' : 'var(--weight-normal)',
              padding: '4px 10px',
            }}
          >
            {s}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 130 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>–</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 130 }} />
        <button className="btn btn-ghost btn-sm" onClick={applyThisMonth}>This month</button>
        {hasFilters && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} onClick={clearFilters}>✕ Clear</button>}
        {hasFilters && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} of {invoices?.length || 0}</span>}
      </div>

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
            {!filtered?.length ? (
              <tr><td colSpan={11} className="empty-state">No invoices yet.</td></tr>
            ) : filtered.map(inv => {
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
      {/* summary */}
      {filtered.length > 0 && (() => {
        const totals = filtered.reduce((acc, inv) => ({
          gigs:    acc.gigs    + Number(inv.gig_count || 0),
          net:     acc.net     + Number(inv.subtotal  || 0),
          vat:     acc.vat     + Number(inv.vat_amount|| 0),
          total:   acc.total   + Number(inv.total     || 0),
        }), { gigs: 0, net: 0, vat: 0, total: 0 })

        return (
          <div style={{
            marginTop: 'var(--sp-3)',
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            gap: 'var(--sp-5)',
            flexWrap: 'wrap',
            fontSize: 'var(--text-sm)',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {totals.gigs} gig{totals.gigs !== 1 ? 's' : ''}
            </span>
            <span>Net <strong>€{totals.net.toFixed(2)}</strong></span>
            <span>VAT <strong>€{totals.vat.toFixed(2)}</strong></span>
            <span style={{ marginLeft: 'auto', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}>
              Total €{totals.total.toFixed(2)}
            </span>
          </div>
        )
      })()}
    </div>
  )
}
