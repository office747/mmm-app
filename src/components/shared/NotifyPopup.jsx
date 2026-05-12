import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function buildTemplate(type, artist, gig) {
  if (!gig) return ''
  const date = new Date(gig.gig_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const name = artist.artist_name?.split(' ')[0] || artist.artist_name

  if (type === 'sms') {
    const timePart = gig.start_time ? ` at ${gig.start_time}` : ''
    return `Hi ${name}, reminder: ${gig.hotel_name}${timePart} on ${date}. MakeMusicMemories`
  }
  return `Hi ${name},\n\nJust a reminder that you're scheduled to perform at ${gig.hotel_name}${gig.start_time ? ` at ${gig.start_time}` : ''} on ${date}.\n\nPerformance: ${gig.performance_type || 'TBC'}\n\nMakeMusicMemories`
}

/**
 * NotifyPopup
 * Renders via portal so it's never clipped by overflow:hidden parents.
 * Pass `triggerRef` — a ref on the button that opens this popup —
 * and the popup positions itself relative to it.
 */
export default function NotifyPopup({ type, artist, gig, triggerRef, onSend, onClose, sending, status }) {
  const [message, setMessage] = useState('')
  const popupRef              = useRef(null)

  const initialised = useRef(false)
  useEffect(() => {
    if (!initialised.current) {
      setMessage(buildTemplate(type, artist, gig))
      initialised.current = true
    }
  })

  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, triggerRef])

  // calculate position fresh on every render from the trigger element
  const getPos = () => {
    if (!triggerRef?.current) return { top: 100, left: 100 }
    const rect    = triggerRef.current.getBoundingClientRect()
    const POPUP_W = 280
    const POPUP_H = 340
    const openUp  = (window.innerHeight - rect.bottom) < POPUP_H && rect.top > POPUP_H
    // align left edge of popup with left edge of button, nudge left if overflows viewport
    const left    = Math.max(8, Math.min(rect.left, window.innerWidth - POPUP_W - 8))
    const top     = openUp ? rect.top - POPUP_H - 4 : rect.bottom + 4
    return { top, left }
  }

  const pos = getPos()

  const isSms   = type === 'sms'
  const contact = isSms ? artist.artist_phone : artist.artist_email

  return createPortal(
    <div
      ref={popupRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top:      pos.top,
        left:     pos.left,
        width:    280,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1000,
        padding: 'var(--sp-3)',
        fontSize: 'var(--text-xs)',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
        <div>
          <div style={{ fontWeight: 'var(--weight-semi)', color: 'var(--text)' }}>
            {isSms ? '✉︎ SMS' : '@ Email'} → {artist.artist_name}
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 1 }}>{contact}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 12, padding: 2 }}>✕</button>
      </div>

      {/* message editor */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        style={{
          width: '100%',
          minHeight: isSms ? 80 : 140,
          fontSize: 'var(--text-xs)',
          lineHeight: 'var(--leading-loose)',
          resize: 'vertical',
          marginBottom: 'var(--sp-2)',
        }}
      />

      {/* char count for SMS */}
      {isSms && (
        <div style={{ color: message.length > 160 ? 'var(--amber)' : 'var(--text-muted)', marginBottom: 'var(--sp-2)', textAlign: 'right' }}>
          {message.length} chars{message.length > 160 ? ` (${Math.ceil(message.length / 160)} SMS)` : ''}
        </div>
      )}

      {/* status feedback */}
      {status && (
        <div style={{
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          marginBottom: 'var(--sp-2)',
          background: status.ok ? 'var(--green-bg)' : 'var(--red-bg)',
          color: status.ok ? 'var(--green)' : 'var(--red)',
          border: `1px solid ${status.ok ? 'var(--green-border)' : 'var(--red-border)'}`,
        }}>
          {status.ok
            ? `✓ Sent at ${status.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
            : `✕ Failed at ${status.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} — try again`
          }
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary btn-sm"
          disabled={sending || !message.trim()}
          onClick={() => onSend(message)}
        >
          {sending ? 'Sending…' : isSms ? 'Send SMS' : 'Send email'}
        </button>
      </div>
    </div>,
    document.body
  )
}
