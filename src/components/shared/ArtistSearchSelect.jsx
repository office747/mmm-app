import { useState, useRef, useEffect } from 'react'

/**
 * ArtistSearchSelect
 * Searchable dropdown for large artist lists.
 * Renders a text input that filters artists, shows a dropdown list.
 */
export default function ArtistSearchSelect({ value, artists, onChange, placeholder = '— search artist —' }) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const wrapRef               = useRef(null)

  // sync display name when value changes externally
  const selected = (artists || []).find(a => a.id === value)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = (artists || []).filter(a =>
    !query || a.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50) // cap at 50 for performance

  const handleSelect = (artist) => {
    onChange(artist.id)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* trigger input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${open ? 'var(--brand)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius)',
          background: 'var(--bg-input)',
          boxShadow: open ? '0 0 0 3px var(--brand-subtle2)' : 'none',
          cursor: 'text',
          padding: '0 8px',
          gap: 4,
          transition: 'border-color var(--duration), box-shadow var(--duration)',
        }}
        onClick={() => setOpen(true)}
      >
        {open ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 'var(--text-sm)',
              padding: '7px 0',
              color: 'var(--text)',
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: 'var(--text-sm)',
            padding: '7px 0',
            color: selected ? 'var(--text)' : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {selected ? selected.full_name : placeholder}
          </span>
        )}
        {value && (
          <button
            onClick={handleClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1, fontSize: 14 }}
          >
            ✕
          </button>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </div>

      {/* dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 50,
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No artists found
            </div>
          ) : filtered.map(a => (
            <div
              key={a.id}
              onClick={() => handleSelect(a)}
              style={{
                padding: '8px 12px',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                background: a.id === value ? 'var(--brand-subtle)' : 'transparent',
                color: a.id === value ? 'var(--brand)' : 'var(--text)',
                fontWeight: a.id === value ? 'var(--weight-medium)' : 'var(--weight-normal)',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => { if (a.id !== value) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (a.id !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {a.full_name}
            </div>
          ))}
          {filtered.length === 50 && (
            <div style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', borderTop: '1px solid var(--border)' }}>
              Showing first 50 — type to narrow
            </div>
          )}
        </div>
      )}
    </div>
  )
}
