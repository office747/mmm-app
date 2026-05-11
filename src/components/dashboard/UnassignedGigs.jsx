import { useNavigate } from 'react-router-dom'
import { fmtDate } from '../../lib/dates.js'
import DashboardCard from './DashboardCard.jsx'

function daysUntil(iso) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function UnassignedGigs({ gigs, loading }) {
  const navigate = useNavigate()

  return (
    <DashboardCard
      title="No artists assigned"
      count={gigs?.length || 0}
      countColor={gigs?.length ? 'badge-red' : 'badge-green'}
      empty={!loading && (!gigs?.length) ? '✓ All upcoming gigs have artists.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {(gigs || []).map((g, i) => {
            const days = daysUntil(g.gig_date)
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
                onClick={() => navigate(`/hotels/detail?id=${g.hotel_id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{g.hotel_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {fmtDate(g.gig_date)} · {g.performance_type || 'Performance'}
                  </div>
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semi)',
                  color: days <= 1 ? 'var(--red)' : days <= 3 ? 'var(--amber)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardCard>
  )
}
