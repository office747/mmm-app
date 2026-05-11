import { useNavigate } from 'react-router-dom'
import { fmtDate } from '../../lib/dates.js'
import DashboardCard from './DashboardCard.jsx'

export default function UpcomingGigs({ gigs, loading }) {
  const navigate = useNavigate()

  return (
    <DashboardCard
      title="Upcoming this week"
      count={gigs?.length || 0}
      countColor="badge-neutral"
      empty={!loading && (!gigs?.length) ? 'No more gigs scheduled this week.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px 8px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '4px 8px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hotel</th>
              <th style={{ textAlign: 'left', padding: '4px 8px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</th>
              <th style={{ textAlign: 'right', padding: '4px 0 8px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '4px 0 8px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-semi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artists</th>
            </tr>
          </thead>
          <tbody>
            {(gigs || []).map(g => (
              <tr
                key={g.gig_id}
                onClick={() => navigate(`/hotels/detail?id=${g.hotel_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ padding: '6px 8px 6px 0', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {fmtDate(g.gig_date)}
                </td>
                <td style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', fontWeight: 'var(--weight-medium)' }}>
                  {g.hotel_name}
                </td>
                <td style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {g.performance_type || '—'}
                </td>
                <td style={{ padding: '6px 0 6px 8px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  €{Number(g.hotel_price).toFixed(0)}
                </td>
                <td style={{ padding: '6px 0 6px 8px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  {g.artist_count === 0
                    ? <span style={{ color: 'var(--red)', fontWeight: 'var(--weight-semi)' }}>⚠ none</span>
                    : <span style={{ color: 'var(--text-secondary)' }}>{g.artist_count}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardCard>
  )
}
