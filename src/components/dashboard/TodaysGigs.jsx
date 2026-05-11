import { useNavigate } from 'react-router-dom'
import DashboardCard from './DashboardCard.jsx'

export default function TodaysGigs({ gigs, loading }) {
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <DashboardCard
      title={`Today — ${today}`}
      count={gigs?.length || 0}
      countColor="badge-brand"
      empty={!loading && (!gigs?.length) ? 'No gigs scheduled today.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {(gigs || []).map(g => (
            <div
              key={g.gig_id}
              onClick={() => navigate(`/hotels/detail?id=${g.hotel_id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-2) var(--sp-3)',
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                gap: 'var(--sp-3)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{g.hotel_name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {g.performance_type || '—'}
                  {g.artist_count > 0 && <> · {g.artist_count} artist{g.artist_count !== 1 ? 's' : ''}</>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexShrink: 0 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  €{Number(g.hotel_price).toFixed(0)}
                </span>
                <span className={`badge badge-${
                  g.status === 'performed' ? 'brand' :
                  g.status === 'confirmed' ? 'blue' :
                  g.status === 'cancelled' ? 'red' : 'neutral'
                }`}>{g.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}
