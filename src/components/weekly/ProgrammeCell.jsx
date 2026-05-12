import { useState } from 'react'
import { notifyArtistSms, notifyArtistEmail } from '../../lib/n8n/index.js'

export default function ProgrammeCell({ gigs, gigArtists, onGigClick, onAddGig, showArtists }) {
  const [expanded, setExpanded] = useState(new Set())
  const [sending,  setSending]  = useState({}) // key → true while in flight
  const [status,   setStatus]   = useState({}) // key → { ok: bool, at: Date }

  const toggle = (gigId, e) => {
    e.stopPropagation()
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(gigId) ? next.delete(gigId) : next.add(gigId)
      return next
    })
  }

  const notify = async (type, artist, gig, e) => {
    e.stopPropagation()
    const key = `${artist.gig_artist_id}-${type}`
    setSending(prev => ({ ...prev, [key]: true }))
    try {
      type === 'sms'
        ? await notifyArtistSms(artist, gig)
        : await notifyArtistEmail(artist, gig)
      setStatus(prev => ({ ...prev, [key]: { ok: true, at: new Date() } }))
    } catch (err) {
      console.warn(`Failed to notify artist via ${type}:`, err.message)
      setStatus(prev => ({ ...prev, [key]: { ok: false, at: new Date() } }))
    } finally {
      setSending(prev => ({ ...prev, [key]: false }))
    }
  }

  const artistsByGig = (gigArtists || []).reduce((acc, a) => {
    if (!acc[a.gig_id]) acc[a.gig_id] = []
    acc[a.gig_id].push(a)
    return acc
  }, {})

  return (
    <td style={{ verticalAlign: 'top', padding: 'var(--sp-1)', minWidth: 130 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {gigs.map(g => {
          const artists = artistsByGig[g.gig_id] || []
          const isOpen  = showArtists || expanded.has(g.gig_id)

          return (
            <div
              key={g.gig_id}
              onClick={() => onGigClick(g)}
              style={{
                background: g.status === 'cancelled'
                  ? 'var(--red-bg)'
                  : g.needs_invoicing && g.status === 'performed'
                    ? 'var(--amber-bg)'
                    : 'var(--brand-subtle)',
                border: `1px solid ${
                  g.status === 'cancelled' ? 'var(--red-border)'
                  : g.needs_invoicing && g.status === 'performed' ? 'var(--amber-border)'
                  : 'var(--brand-subtle2)'
                }`,
                borderRadius: 'var(--radius-sm)',
                padding: '4px 6px',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                opacity: g.status === 'cancelled' ? 0.6 : 1,
                lineHeight: 1.4,
              }}
            >
              {/* performance name + time */}
              <div style={{ fontWeight: 'var(--weight-semi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {g.performance_type || 'Performance'}
                {g.start_time && (
                  <span style={{ fontWeight: 'var(--weight-normal)', color: 'var(--text-secondary)', marginLeft: 4 }}>
                    {g.start_time}
                  </span>
                )}
              </div>

              {/* price + indicators + toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ color: 'var(--text-secondary)' }}>€{Number(g.hotel_price).toFixed(0)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* invoice indicator — only for performed gigs */}
                  {g.status === 'performed' && g.needs_invoicing && (
                    <span style={{ color: 'var(--amber)', fontSize: 9, fontWeight: 'var(--weight-semi)', background: 'var(--amber-bg)', padding: '1px 3px', borderRadius: 2, border: '1px solid var(--amber-border)' }} title="Not invoiced">
                      €?
                    </span>
                  )}
                  {g.status === 'performed' && !g.needs_invoicing && (
                    <span style={{ color: 'var(--green)', fontSize: 9, fontWeight: 'var(--weight-semi)', background: 'var(--green-bg)', padding: '1px 3px', borderRadius: 2, border: '1px solid var(--green-border)' }} title="Invoiced">
                      €✓
                    </span>
                  )}
                  {/* insurance indicator — shown when any artist has insurance pending */}
                  {(() => {
                    const a = artistsByGig[g.gig_id] || []
                    if (a.length === 0) return null
                    const anyPending = a.some(x => !x.insurance_issued)
                    return anyPending ? (
                      <span style={{ color: 'var(--red)', fontSize: 9, fontWeight: 'var(--weight-semi)', background: 'var(--red-bg)', padding: '1px 3px', borderRadius: 2, border: '1px solid var(--red-border)' }} title="Insurance not issued">
                        ins!
                      </span>
                    ) : (
                      <span style={{ color: 'var(--green)', fontSize: 9, fontWeight: 'var(--weight-semi)', background: 'var(--green-bg)', padding: '1px 3px', borderRadius: 2, border: '1px solid var(--green-border)' }} title="Insurance issued">
                        ins✓
                      </span>
                    )
                  })()}
                  {/* per-card artist toggle */}
                  {!showArtists && (
                    <button
                      onClick={e => toggle(g.gig_id, e)}
                      title={expanded.has(g.gig_id) ? 'Hide artists' : 'Show artists'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}
                    >
                      {expanded.has(g.gig_id) ? '▾' : '▸'} {artists.length}
                    </button>
                  )}
                </div>
              </div>

              {/* artist list */}
              {isOpen && (
                <div
                  style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border)' }}
                  onClick={e => e.stopPropagation()}
                >
                  {artists.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No artists</div>
                  ) : artists.map(a => (
                    <div key={a.gig_artist_id} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 0' }}>
                      <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 'var(--text-xs)' }}>
                        {a.artist_name}
                      </span>
                      {!a.insurance_issued && (
                        <span style={{ color: 'var(--red)', fontSize: 9, flexShrink: 0, fontWeight: 'var(--weight-semi)' }}>ins!</span>
                      )}
                      {/* SMS button */}
                      {(() => {
                        const key = `${a.gig_artist_id}-sms`
                        const st  = status[key]
                        const isSending = sending[key]
                        const color = isSending ? 'var(--text-muted)'
                          : st?.ok === true  ? 'var(--green)'
                          : st?.ok === false ? 'var(--red)'
                          : a.artist_phone   ? 'var(--text-secondary)'
                          : 'var(--border-strong)'
                        const border = isSending ? 'var(--border)'
                          : st?.ok === true  ? 'var(--green-border)'
                          : st?.ok === false ? 'var(--red-border)'
                          : 'var(--border)'
                        const bg = st?.ok === true ? 'var(--green-bg)'
                          : st?.ok === false ? 'var(--red-bg)'
                          : 'none'
                        const title = isSending ? 'Sending…'
                          : st?.ok === true  ? `SMS sent at ${st.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                          : st?.ok === false ? `SMS failed at ${st.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} — click to retry`
                          : a.artist_phone   ? `SMS ${a.artist_phone}`
                          : 'No phone number'
                        return (
                          <button
                            title={title}
                            disabled={!a.artist_phone || isSending}
                            onClick={e => notify('sms', a, g, e)}
                            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 3, cursor: a.artist_phone ? 'pointer' : 'not-allowed', padding: '1px 4px', fontSize: 9, color, flexShrink: 0, lineHeight: 1.4 }}
                          >
                            {isSending ? '…' : '✉︎'}
                          </button>
                        )
                      })()}
                      {/* Email button */}
                      {(() => {
                        const key = `${a.gig_artist_id}-email`
                        const st  = status[key]
                        const isSending = sending[key]
                        const color = isSending ? 'var(--text-muted)'
                          : st?.ok === true  ? 'var(--green)'
                          : st?.ok === false ? 'var(--red)'
                          : a.artist_email   ? 'var(--text-secondary)'
                          : 'var(--border-strong)'
                        const border = isSending ? 'var(--border)'
                          : st?.ok === true  ? 'var(--green-border)'
                          : st?.ok === false ? 'var(--red-border)'
                          : 'var(--border)'
                        const bg = st?.ok === true ? 'var(--green-bg)'
                          : st?.ok === false ? 'var(--red-bg)'
                          : 'none'
                        const title = isSending ? 'Sending…'
                          : st?.ok === true  ? `Email sent at ${st.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                          : st?.ok === false ? `Email failed at ${st.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} — click to retry`
                          : a.artist_email   ? `Email ${a.artist_email}`
                          : 'No email'
                        return (
                          <button
                            title={title}
                            disabled={!a.artist_email || isSending}
                            onClick={e => notify('email', a, g, e)}
                            style={{ background: bg, border: `1px solid ${border}`, borderRadius: 3, cursor: a.artist_email ? 'pointer' : 'not-allowed', padding: '1px 4px', fontSize: 9, color, flexShrink: 0, lineHeight: 1.4 }}
                          >
                            {isSending ? '…' : '@'}
                          </button>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <button
          onClick={e => { e.stopPropagation(); onAddGig() }}
          style={{ background: 'none', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '2px 4px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', width: '100%', textAlign: 'center' }}
        >
          +
        </button>
      </div>
    </td>
  )
}
