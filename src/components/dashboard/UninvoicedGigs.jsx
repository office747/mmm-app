import { useNavigate } from 'react-router-dom'
import { fmtDate } from '../../lib/dates.js'
import DashboardCard from './DashboardCard.jsx'

function daysSince(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function UninvoicedGigs({ gigs, loading }) {
  const navigate = useNavigate()

  return (
    <DashboardCard
      title="Uninvoiced performed gigs"
      count={gigs?.length || 0}
      countColor={gigs?.length ? 'badge-amber' : 'badge-green'}
      empty={!loading && (!gigs?.length) ? '✓ All performed gigs invoiced.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {(gigs || []).map((g, i) => {
            const days = daysSince(g.gig_date)
            return (
              <div
                key={g.gig_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--sp-2) 0',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  gap: 'var(--sp-3)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/hotels/detail?id=${g.hotel_id}&tab=invoices`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{g.hotel_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {fmtDate(g.gig_date)} · {g.performance_type || 'Performance'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>
                    €{Number(g.hotel_price).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: days > 7 ? 'var(--red)' : 'var(--text-muted)' }}>
                    {days === 0 ? 'today' : `${days}d ago`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardCard>
  )
}
