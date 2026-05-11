import { useMemo } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtDay(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

export default function ArtistWeekly({ weekStart, gigs, loading, error, onRefetch, onToggleInsurance, toggling }) {
  const weekEnd  = addDays(weekStart, 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const gigsByDay = useMemo(() => {
    const map = {}
    for (const g of gigs || []) {
      if (!map[g.gig_date]) map[g.gig_date] = []
      map[g.gig_date].push(g)
    }
    return map
  }, [gigs])

  const weekTotal = useMemo(() => (gigs || []).reduce((sum, g) => ({
    fees:      sum.fees + Number(g.fee),
    transport: sum.transport + Number(g.transport_amount),
    gross:     sum.gross + Number(g.total_earned),
  }), { fees: 0, transport: 0, gross: 0 }), [gigs])

  if (loading) return <LoadingSpinner message="Loading schedule…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  return (
    <div>
      {/* day columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 'var(--sp-2)',
        overflowX: 'auto',
      }}>
        {weekDays.map(day => {
          const dayGigs = gigsByDay[day] || []
          return (
            <div key={day}>
              <div style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semi)',
                color: 'var(--text-secondary)',
                padding: 'var(--sp-1) 0',
                borderBottom: '2px solid var(--border)',
                marginBottom: 'var(--sp-2)',
              }}>
                {fmtDay(day)}
              </div>

              {dayGigs.length === 0 ? (
                <div style={{ color: 'var(--border-strong)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--sp-3) 0' }}>—</div>
              ) : dayGigs.map(g => (
                <div key={g.gig_artist_id} style={{
                  background: g.gig_status === 'cancelled' ? 'var(--red-bg)' : 'var(--brand-subtle)',
                  border: `1px solid ${g.gig_status === 'cancelled' ? 'var(--red-border)' : 'var(--brand-subtle2)'}`,
                  borderRadius: 'var(--radius)',
                  padding: 'var(--sp-2) var(--sp-3)',
                  marginBottom: 'var(--sp-2)',
                  fontSize: 'var(--text-xs)',
                  opacity: g.gig_status === 'cancelled' ? 0.6 : 1,
                }}>
                  <div style={{ fontWeight: 'var(--weight-semi)', marginBottom: 2 }}>{g.hotel_name}</div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{g.performance_type || '—'}</div>
                  <div style={{ marginBottom: 2 }}>
                    Fee: <strong>€{Number(g.fee).toFixed(2)}</strong>
                  </div>
                  {Number(g.transport_amount) > 0 && (
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>
                      Transport: €{Number(g.transport_amount).toFixed(2)}
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}>
                    <label className="checkbox-label" style={{ fontSize: 'var(--text-xs)' }}>
                      <input
                        type="checkbox"
                        checked={g.insurance_issued}
                        disabled={toggling}
                        onChange={e => onToggleInsurance({ gigArtistId: g.gig_artist_id, value: e.target.checked })}
                      />
                      Insurance {g.insurance_issued
                        ? <span style={{ color: 'var(--green)' }}>✓</span>
                        : <span style={{ color: 'var(--amber)' }}>⚠</span>
                      }
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* week summary */}
      {(gigs || []).length > 0 && (
        <div style={{
          marginTop: 'var(--sp-4)',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 'var(--text-sm)',
          display: 'flex',
          gap: 'var(--sp-5)',
        }}>
          <span>Fees: <strong>€{weekTotal.fees.toFixed(2)}</strong></span>
          {weekTotal.transport > 0 && <span>Transport: <strong>€{weekTotal.transport.toFixed(2)}</strong></span>}
          <span style={{ marginLeft: 'auto', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}>
            Week total: €{weekTotal.gross.toFixed(2)}
          </span>
        </div>
      )}

      {(gigs || []).length === 0 && (
        <div className="empty-state">No gigs scheduled this week.</div>
      )}
    </div>
  )
}
