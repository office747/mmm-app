import { useMemo } from 'react'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import { addDays, fmtDate as fmtDay } from '../../lib/dates.js'


export default function MultiArtistGrid({ weekStart, artists, gigs, loading, error, onRefetch }) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // index: artistId → date → [gigs]
  const gigIndex = useMemo(() => {
    const idx = {}
    for (const g of gigs || []) {
      if (!idx[g.artist_id]) idx[g.artist_id] = {}
      if (!idx[g.artist_id][g.gig_date]) idx[g.artist_id][g.gig_date] = []
      idx[g.artist_id][g.gig_date].push(g)
    }
    return idx
  }, [gigs])

  if (loading) return <LoadingSpinner message="Loading schedules…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="table-wrap">
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Artist</th>
              {weekDays.map(day => (
                <th key={day} style={{ minWidth: 130, textAlign: 'center' }}>
                  {fmtDay(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {artists.map(artist => (
              <tr key={artist.id}>
                <td style={{ fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap' }}>
                  {artist.full_name}
                </td>
                {weekDays.map(day => {
                  const dayGigs = gigIndex[artist.id]?.[day] || []
                  return (
                    <td key={day} style={{ verticalAlign: 'top', padding: 'var(--sp-2)' }}>
                      {dayGigs.length === 0 ? (
                        <span style={{ color: 'var(--border-strong)', fontSize: 'var(--text-xs)', display: 'block', textAlign: 'center' }}>—</span>
                      ) : dayGigs.map(g => (
                        <div
                          key={g.gig_artist_id}
                          style={{
                            background: g.gig_status === 'cancelled' ? 'var(--red-bg)' : 'var(--brand-subtle)',
                            border: `1px solid ${g.gig_status === 'cancelled' ? 'var(--red-border)' : 'var(--brand-subtle2)'}`,
                            borderRadius: 'var(--radius)',
                            padding: 'var(--sp-1) var(--sp-2)',
                            marginBottom: 'var(--sp-1)',
                            fontSize: 'var(--text-xs)',
                            opacity: g.gig_status === 'cancelled' ? 0.6 : 1,
                          }}
                        >
                          <div style={{ fontWeight: 'var(--weight-semi)' }}>{g.hotel_name}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{g.performance_type || '—'}</div>
                          <div>€{Number(g.fee).toFixed(2)}</div>
                          {!g.insurance_issued && (
                            <div style={{ color: 'var(--amber)', fontSize: 10 }}>⚠ No insurance</div>
                          )}
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}

            {artists.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">No artists selected.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
