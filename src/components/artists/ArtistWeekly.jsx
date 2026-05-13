import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, fmtDate as fmtDay } from '../../lib/dates.js'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import GigDetailModal from '../shared/GigDetailModal.jsx'

function isToday(iso) {
  return iso === new Date().toISOString().slice(0, 10)
}

export default function ArtistWeekly({ artistId, weekStart, gigs, loading, error, onRefetch, onToggleInsurance, toggling, onEditGig, onSaveGig, savingGig, gigSaveError, clearGigError, allArtists }) {
  const navigate = useNavigate()
  const todayRef = useRef(null)
  const [selectedGig, setSelectedGig] = useState(null)

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
    fees:      sum.fees      + Number(g.fee),
    transport: sum.transport + Number(g.transport_amount),
    insurance: sum.insurance + Number(g.insurance_amount),
    gross:     sum.gross     + Number(g.total_earned),
  }), { fees: 0, transport: 0, insurance: 0, gross: 0 }), [gigs])

  // scroll today into view on mount / week change
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }, [weekStart])

  const handleToggle = ({ gigArtistId, value }) => {
    if (selectedGig?.gig_artist_id === gigArtistId) {
      setSelectedGig(prev => ({ ...prev, insurance_issued: value }))
    }
    onToggleInsurance({ gigArtistId, value })
  }

  if (loading) return <LoadingSpinner message="Loading schedule…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  return (
    <div>
      <div className="weekly-scroll-wrap">
        <div className="weekly-grid-inner">
          {weekDays.map(day => {
            const dayGigs = gigsByDay[day] || []
            const today   = isToday(day)
            return (
              <div
                key={day}
                ref={today ? todayRef : null}
                className={`weekly-day-col${today ? ' is-today' : ''}`}
              >
                <div className="weekly-day-header">{fmtDay(day)}</div>

                {dayGigs.length === 0 ? (
                  <div style={{ color: 'var(--border-strong)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 'var(--sp-3) 0' }}>—</div>
                ) : dayGigs.map(g => {
                  const total = Number(g.fee) + Number(g.transport_amount) + Number(g.insurance_amount)
                  return (
                    <div
                      key={g.gig_artist_id}
                      onClick={() => setSelectedGig(g)}
                      style={{
                        background: g.gig_status === 'cancelled' ? 'var(--red-bg)' : 'var(--brand-subtle)',
                        border: `1px solid ${g.gig_status === 'cancelled' ? 'var(--red-border)' : 'var(--brand-subtle2)'}`,
                        borderRadius: 'var(--radius)',
                        padding: 'var(--sp-2) var(--sp-3)',
                        marginBottom: 'var(--sp-2)',
                        fontSize: 'var(--text-xs)',
                        opacity: g.gig_status === 'cancelled' ? 0.6 : 1,
                        cursor: 'pointer',
                      }}
                    >
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--brand)', marginBottom: 2, display: 'block' }}
                        onClick={e => { e.stopPropagation(); navigate(`/hotels/detail?id=${g.hotel_id}`) }}
                      >
                        {g.hotel_name} →
                      </button>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {g.performance_type || '—'}
                      </div>
                      <div style={{ marginBottom: 4, fontWeight: 'var(--weight-semi)' }}>
                        €{total.toFixed(2)}
                        <span style={{ fontWeight: 'var(--weight-normal)', color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({[
                            `fee €${Number(g.fee).toFixed(0)}`,
                            Number(g.transport_amount) > 0 && `+transport €${Number(g.transport_amount).toFixed(0)}`,
                            Number(g.insurance_amount) > 0 && `+ins €${Number(g.insurance_amount).toFixed(0)}`,
                          ].filter(Boolean).join(' ')})
                        </span>
                      </div>
                      <div
                        style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <label className="checkbox-label" style={{ fontSize: 'var(--text-xs)' }}>
                          <input
                            type="checkbox"
                            checked={!!g.insurance_issued}
                            disabled={toggling}
                            onChange={e => handleToggle({ gigArtistId: g.gig_artist_id, value: e.target.checked })}
                          />
                          Insurance {g.insurance_issued
                            ? <span style={{ color: 'var(--green)' }}>✓</span>
                            : <span style={{ color: 'var(--amber)' }}>⚠</span>
                          }
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

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
          flexWrap: 'wrap',
        }}>
          <span>Fees: <strong>€{weekTotal.fees.toFixed(2)}</strong></span>
          {weekTotal.transport > 0 && <span>Transport: <strong>€{weekTotal.transport.toFixed(2)}</strong></span>}
          {weekTotal.insurance > 0 && <span>Insurance: <strong>€{weekTotal.insurance.toFixed(2)}</strong></span>}
          <span style={{ marginLeft: 'auto', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}>
            Week total: €{weekTotal.gross.toFixed(2)}
          </span>
        </div>
      )}

      {(gigs || []).length === 0 && (
        <div className="empty-state">No gigs scheduled this week.</div>
      )}

      <GigDetailModal
        open={!!selectedGig}
        gig={selectedGig}
        gigArtists={selectedGig ? gigs?.filter(g => g.gig_id === selectedGig.gig_id) : []}
        allArtists={allArtists}
        onClose={() => setSelectedGig(null)}
        onSave={onSaveGig}
        saving={savingGig}
        saveError={gigSaveError}
        onClearError={clearGigError}
        onToggleInsurance={handleToggle}
        toggling={toggling}
      />
    </div>
  )
}
