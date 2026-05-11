import { useNavigate } from 'react-router-dom'
import { fmtDate } from '../../lib/dates.js'
import DashboardCard from './DashboardCard.jsx'

export default function UninsuredArtists({ items, loading }) {
  const navigate = useNavigate()

  return (
    <DashboardCard
      title="Uninsured artists"
      count={items?.length || 0}
      countColor={items?.length ? 'badge-red' : 'badge-green'}
      empty={!loading && (!items?.length) ? '✓ All insurance issued.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {(items || []).map((a, i) => (
            <div
              key={`${a.gig_artist_id}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-2) 0',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                gap: 'var(--sp-3)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: 0, fontWeight: 'var(--weight-medium)', color: 'var(--brand)', fontSize: 'var(--text-sm)' }}
                  onClick={() => navigate(`/artists/detail?id=${a.artist_id}`)}
                >
                  {a.artist_name} →
                </button>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {a.hotel_name} · {fmtDate(a.gig_date)}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(`/hotels/detail?id=${a.hotel_id}`)}
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', flexShrink: 0 }}
              >
                {a.performance_type || 'Performance'} →
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}
