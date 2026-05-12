import { useState, useRef } from 'react'
import NotifyPopup from '../shared/NotifyPopup.jsx'

function NotifyButton({ type, artist, gig, sending, status, onOpen, isOpen }) {
  const btnRef     = useRef(null)
  const hasContact = type === 'sms' ? !!artist.artist_phone : !!artist.artist_email
  const st         = status[`${artist.gig_artist_id}-${type}`]
  const isSending  = sending[`${artist.gig_artist_id}-${type}`]

  const color  = isSending         ? 'var(--text-muted)'
    : st?.ok === true               ? 'var(--green)'
    : st?.ok === false              ? 'var(--red)'
    : hasContact                    ? 'var(--text-secondary)'
    : 'var(--border-strong)'

  const border = st?.ok === true    ? 'var(--green-border)'
    : st?.ok === false              ? 'var(--red-border)'
    : isOpen                        ? 'var(--brand)'
    : 'var(--border)'

  const bg     = st?.ok === true    ? 'var(--green-bg)'
    : st?.ok === false              ? 'var(--red-bg)'
    : isOpen                        ? 'var(--brand-subtle)'
    : 'none'

  const title  = isSending          ? 'Sending…'
    : st?.ok === true               ? `${type === 'sms' ? 'SMS' : 'Email'} sent at ${st.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : st?.ok === false              ? `Failed — click to retry`
    : hasContact                    ? `${type === 'sms' ? 'SMS' : 'Email'} ${type === 'sms' ? artist.artist_phone : artist.artist_email}`
    : `No ${type === 'sms' ? 'phone' : 'email'}`

  return (
    <button
      ref={btnRef}
      title={title}
      disabled={!hasContact || isSending}
      onClick={e => { e.stopPropagation(); hasContact && onOpen(type, btnRef) }}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 3,
        cursor: hasContact ? 'pointer' : 'not-allowed',
        padding: '1px 4px',
        fontSize: 9,
        color,
        flexShrink: 0,
        lineHeight: 1.4,
        transition: 'all 120ms',
      }}
    >
      {isSending ? '…' : type === 'sms' ? '✉︎' : '@'}
    </button>
  )
}

export default function ProgrammeCellArtists({ artists, gig, sending, status, onNotify }) {
  const [popup, setPopup] = useState(null) // { artist, type, triggerRef }

  const openPopup  = (artist, type, triggerRef) => setPopup({ artist, type, triggerRef })
  const closePopup = () => setPopup(null)

  const handleSend = (message) => {
    if (!popup) return
    onNotify(popup.type, popup.artist, gig, message)
  }

  if (artists.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--text-xs)' }}>No artists</div>
  }

  return (
    <div>
      {artists.map(a => (
        <div
          key={a.gig_artist_id}
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 0' }}
        >
          <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 'var(--text-xs)' }}>
            {a.artist_name}
          </span>
          {!a.insurance_issued && (
            <span style={{ color: 'var(--red)', fontSize: 9, flexShrink: 0, fontWeight: 'var(--weight-semi)' }}>ins!</span>
          )}
          <NotifyButton
            type="sms"
            artist={a}
            gig={gig}
            sending={sending}
            status={status}
            isOpen={popup?.artist.gig_artist_id === a.gig_artist_id && popup?.type === 'sms'}
            onOpen={(type, ref) => openPopup(a, type, ref)}
          />
          <NotifyButton
            type="email"
            artist={a}
            gig={gig}
            sending={sending}
            status={status}
            isOpen={popup?.artist.gig_artist_id === a.gig_artist_id && popup?.type === 'email'}
            onOpen={(type, ref) => openPopup(a, type, ref)}
          />
        </div>
      ))}

      {popup && (
        <NotifyPopup
          type={popup.type}
          artist={popup.artist}
          gig={gig}
          triggerRef={popup.triggerRef}
          sending={sending[`${popup.artist.gig_artist_id}-${popup.type}`]}
          status={status[`${popup.artist.gig_artist_id}-${popup.type}`]}
          onSend={handleSend}
          onClose={closePopup}
        />
      )}
    </div>
  )
}
