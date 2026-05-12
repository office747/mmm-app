import { useState } from 'react'
import { notifyArtistSms, notifyArtistEmail } from '../../lib/n8n/index.js'
import ProgrammeCellGig from './ProgrammeCellGig.jsx'

export default function ProgrammeCell({ gigs, gigArtists, onGigClick, onAddGig, showArtists }) {
  const [expanded, setExpanded] = useState(new Set())
  const [sending,  setSending]  = useState({})
  const [status,   setStatus]   = useState({})

  const toggleArtists = (gigId) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(gigId) ? next.delete(gigId) : next.add(gigId)
      return next
    })

  const handleNotify = async (type, artist, gig, message) => {
    const key = `${artist.gig_artist_id}-${type}`
    setSending(prev => ({ ...prev, [key]: true }))
    try {
      type === 'sms'
        ? await notifyArtistSms(artist, gig, message)
        : await notifyArtistEmail(artist, gig, message)
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
        {gigs.map(g => (
          <ProgrammeCellGig
            key={g.gig_id}
            g={g}
            artists={artistsByGig[g.gig_id] || []}
            isOpen={showArtists || expanded.has(g.gig_id)}
            showArtists={showArtists}
            onGigClick={onGigClick}
            onToggleArtists={() => toggleArtists(g.gig_id)}
            sending={sending}
            status={status}
            onNotify={handleNotify}
          />
        ))}
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
