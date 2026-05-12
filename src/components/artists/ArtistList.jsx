import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifyArtistSms, notifyArtistEmail } from '../../lib/n8n/index.js'
import NotifyPopup from '../shared/NotifyPopup.jsx'
import CopyButton from '../ui/CopyButton.jsx'

export default function ArtistList({ artists = [], loading, onAdd, onEdit }) {
  const navigate = useNavigate()
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(new Set())
  const [popup,    setPopup]    = useState(null) // { artist, type, triggerRef }
  const [sending,  setSending]  = useState({})
  const [status,   setStatus]   = useState({})

  const handleNotify = async (type, artist, message) => {
    const key = `${artist.id}-${type}`
    setSending(prev => ({ ...prev, [key]: true }))
    try {
      const a = { artist_name: artist.full_name, artist_phone: artist.phone, artist_email: artist.email }
      type === 'sms'
        ? await notifyArtistSms(a, null, message)
        : await notifyArtistEmail(a, null, message)
      setStatus(prev => ({ ...prev, [key]: { ok: true, at: new Date() } }))
    } catch (err) {
      console.warn(`Notify failed:`, err.message)
      setStatus(prev => ({ ...prev, [key]: { ok: false, at: new Date() } }))
    } finally {
      setSending(prev => ({ ...prev, [key]: false }))
    }
  }

  // ── filter ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return artists
    return artists.filter(a =>
      a.full_name.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.phone || '').toLowerCase().includes(q)
    )
  }, [artists, search])

  // ── selection ────────────────────────────────────────────
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(a => a.id)))
    }
  }

  const viewSchedule = () => {
    const ids = [...selected].join(',')
    navigate(`/artists/schedule?ids=${ids}`)
  }

  return (
    <div>
      {/* ── toolbar ── */}
      <div className="page-header">
        <h1 className="page-title">Artists</h1>
        <button className="btn btn-primary" onClick={onAdd}>+ Add artist</button>
      </div>

      {/* ── search + bulk action ── */}
      <div className="filters">
        <input
          type="search"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        {selected.size > 0 && (
          <button className="btn btn-secondary" onClick={viewSchedule}>
            View schedule ({selected.size} selected)
          </button>
        )}
        {selected.size > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        )}
      </div>

      {/* ── table ── */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  style={{ width: 14, height: 14, accentColor: 'var(--brand)' }}
                />
              </th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
                    <div className="spinner" />
                    Loading artists…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {search ? `No artists matching "${search}"` : 'No artists yet. Add your first one.'}
                </td>
              </tr>
            ) : filtered.map(artist => (
              <tr
                key={artist.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/artists/detail?id=${artist.id}`)}
              >
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(artist.id)}
                    onChange={() => toggleOne(artist.id)}
                    style={{ width: 14, height: 14, accentColor: 'var(--brand)' }}
                  />
                </td>
                <td style={{ fontWeight: 'var(--weight-medium)' }}>{artist.full_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>{artist.phone || '—'}</span>
                    <CopyButton value={artist.phone} label="Copy phone" />
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>{artist.email || '—'}</span>
                    <CopyButton value={artist.email} label="Copy email" />
                  </div>
                </td>
                <td>
                  <span className={`badge ${artist.active ? 'badge-green' : 'badge-neutral'}`}>
                    {artist.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(artist)}>
                      Edit
                    </button>
                    <button
                      title={artist.phone ? `SMS ${artist.phone}` : 'No phone'}
                      disabled={!artist.phone || sending[`${artist.id}-sms`]}
                      className="btn btn-secondary"
                      style={{
                        color: status[`${artist.id}-sms`]?.ok === true ? 'var(--green)'
                          : status[`${artist.id}-sms`]?.ok === false ? 'var(--red)'
                          : !artist.phone ? 'var(--text-muted)' : undefined,
                        borderColor: status[`${artist.id}-sms`]?.ok === true ? 'var(--green-border)'
                          : status[`${artist.id}-sms`]?.ok === false ? 'var(--red-border)' : undefined,
                        opacity: !artist.phone ? 0.4 : 1,
                      }}
                      onClick={e => artist.phone && setPopup({ artist, type: 'sms', triggerRef: { current: e.currentTarget } })}
                    >
                      {sending[`${artist.id}-sms`] ? 'Sending…'
                        : status[`${artist.id}-sms`]?.ok === true ? '✓ SMS sent'
                        : status[`${artist.id}-sms`]?.ok === false ? '✕ SMS failed'
                        : '✉ SMS'}
                    </button>
                    <button
                      title={artist.email ? `Email ${artist.email}` : 'No email'}
                      disabled={!artist.email || sending[`${artist.id}-email`]}
                      className="btn btn-secondary"
                      style={{
                        color: status[`${artist.id}-email`]?.ok === true ? 'var(--green)'
                          : status[`${artist.id}-email`]?.ok === false ? 'var(--red)'
                          : !artist.email ? 'var(--text-muted)' : undefined,
                        borderColor: status[`${artist.id}-email`]?.ok === true ? 'var(--green-border)'
                          : status[`${artist.id}-email`]?.ok === false ? 'var(--red-border)' : undefined,
                        opacity: !artist.email ? 0.4 : 1,
                      }}
                      onClick={e => artist.email && setPopup({ artist, type: 'email', triggerRef: { current: e.currentTarget } })}
                    >
                      {sending[`${artist.id}-email`] ? 'Sending…'
                        : status[`${artist.id}-email`]?.ok === true ? '✓ Email sent'
                        : status[`${artist.id}-email`]?.ok === false ? '✕ Email failed'
                        : '@ Email'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {artists.length > 0 && (
        <div style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {filtered.length} of {artists.length} artists
        </div>
      )}

      {popup && (
        <NotifyPopup
          type={popup.type}
          artist={{ artist_name: popup.artist.full_name, artist_phone: popup.artist.phone, artist_email: popup.artist.email }}
          gig={null}
          triggerRef={popup.triggerRef}
          sending={sending[`${popup.artist.id}-${popup.type}`]}
          status={status[`${popup.artist.id}-${popup.type}`]}
          onSend={msg => handleNotify(popup.type, popup.artist, msg)}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
