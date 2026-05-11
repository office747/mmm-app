import React, { useState, useMemo } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import HotelGigRow from './HotelGigRow.jsx'
import HotelGigDetail from './HotelGigDetail.jsx'

export default function HotelGigs({
  gigs,
  gigArtists,
  loading,
  error,
  onRefetch,
  onAdd,
  onEdit,
  onDuplicate,
  onCancel,
  onDelete,
  onStatusChange,
  onToggleInsurance = () => {},
  toggling = false,
  onGenerateInvoice,
}) {
  const [expanded, setExpanded] = useState(new Set())

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const artistsByGig = useMemo(() => (gigArtists || []).reduce((acc, a) => {
    if (!acc[a.gig_id]) acc[a.gig_id] = []
    acc[a.gig_id].push(a)
    return acc
  }, {}), [gigArtists])

  if (loading) return <LoadingSpinner message="Loading gigs…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-3)' }}>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add gig</button>
      </div>

      <div className="weekly-scroll-wrap">
        <div className="table-wrap">
          <table>
          <thead>
            <tr>
              <th style={{ width: 24 }} />
              <th>Date</th>
              <th>Performance</th>
              <th>Source</th>
              <th>Hotel price</th>
              <th>Artist cost</th>
              {/* <th>Margin</th> */}
              <th>Status</th>
              <th>Invoice</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(gigs || []).length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">No gigs recorded for this period.</td>
              </tr>
            ) : (gigs || []).map(g => (
              <React.Fragment key={g.gig_id}>
                <HotelGigRow
                  g={g}
                  isOpen={expanded.has(g.gig_id)}
                  onToggle={toggle}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onStatusChange={onStatusChange}
                  onGenerateInvoice={onGenerateInvoice}
                />
                {expanded.has(g.gig_id) && (
                  <HotelGigDetail
                    g={g}
                    lines={artistsByGig[g.gig_id] || []}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onToggleInsurance={onToggleInsurance}
                    toggling={toggling}
                    onGenerateInvoice={onGenerateInvoice}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
