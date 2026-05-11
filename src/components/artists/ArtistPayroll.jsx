import { useMemo } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

export default function ArtistPayroll({ gigs, loading, error, onRefetch, onToggleInsurance, toggling, onExport }) {
  const totals = useMemo(() => (gigs || []).reduce((sum, g) => ({
    fees:      sum.fees + Number(g.fee),
    transport: sum.transport + Number(g.transport_amount),
    gross:     sum.gross + Number(g.total_earned),
  }), { fees: 0, transport: 0, gross: 0 }), [gigs])

  if (loading) return <LoadingSpinner message="Loading payroll…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  if (!gigs || gigs.length === 0) {
    return <div className="empty-state">No gigs recorded for this month.</div>
  }

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hotel</th>
              <th>Performance</th>
              <th>Role</th>
              <th>Fee</th>
              <th>Transport</th>
              <th>Total</th>
              <th>Insurance</th>
            </tr>
          </thead>
          <tbody>
            {gigs.map(g => (
              <tr
                key={g.gig_artist_id}
                className={g.gig_status === 'cancelled' ? 'row-cancelled' : ''}
              >
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(g.gig_date)}</td>
                <td style={{ fontWeight: 'var(--weight-medium)' }}>{g.hotel_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{g.performance_type || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{g.role || '—'}</td>
                <td>€{Number(g.fee).toFixed(2)}</td>
                <td>
                  {Number(g.transport_amount) > 0
                    ? `€${Number(g.transport_amount).toFixed(2)}`
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  }
                </td>
                <td style={{ fontWeight: 'var(--weight-semi)' }}>
                  €{Number(g.total_earned).toFixed(2)}
                </td>
                <td>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={g.insurance_issued}
                      disabled={toggling}
                      onChange={e => onToggleInsurance({ gigArtistId: g.gig_artist_id, value: e.target.checked })}
                    />
                    {g.insurance_issued
                      ? <span style={{ color: 'var(--green)' }}>✓ Issued</span>
                      : <span style={{ color: 'var(--amber)' }}>⚠ Pending</span>
                    }
                  </label>
                </td>
              </tr>
            ))}

            {/* totals row */}
            <tr className="row-summary">
              <td colSpan={4}>
                <strong>{gigs.length} gig{gigs.length !== 1 ? 's' : ''}</strong>
              </td>
              <td><strong>€{totals.fees.toFixed(2)}</strong></td>
              <td><strong>€{totals.transport.toFixed(2)}</strong></td>
              <td><strong>€{totals.gross.toFixed(2)}</strong></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)' }}>
        <button className="btn btn-secondary" onClick={onExport}>
          Export CSV
        </button>
      </div>
    </div>
  )
}
