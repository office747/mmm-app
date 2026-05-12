import { useState } from 'react'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js'

export default function CopyButton({ value, label }) {
  const { copy, copied } = useCopyToClipboard()
  const [hovered, setHovered] = useState(false)

  if (!value) return null

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={e => { e.stopPropagation(); copy(value) }}
        className="btn btn-ghost btn-sm"
        style={{
          padding: '2px 5px',
          fontSize: 'var(--text-xs)',
          color: copied ? 'var(--green)' : 'var(--text-muted)',
          minWidth: 24,
          transition: 'color 150ms',
        }}
      >
        ⎘
      </button>

      {/* hover label / copied feedback */}
      {(hovered || copied) && (
        <span style={{
          position: 'absolute',
          left: 'calc(100% + 4px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: copied ? 'var(--green)' : 'var(--text)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 7px',
          borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {copied ? 'Copied!' : label || 'Copy to clipboard'}
        </span>
      )}
    </span>
  )
}
