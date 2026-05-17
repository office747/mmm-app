import { NavLink } from 'react-router-dom'
import { useN8nHealth } from '../hooks/useN8nHealth.js'

const links = [
  { to: '/weekly',    label: 'Programme' },
  { to: '/hotels',    label: 'Hotels' },
  { to: '/artists',   label: 'Artists' },
  { to: '/dashboard', label: 'Dashboard' },
]

const INDICATOR = {
  checking: { color: 'var(--text-muted)', dot: '#aaa',    label: 'Checking automation…' },
  online:   { color: 'var(--green)',      dot: '#22c55e', label: 'Automation online'     },
  offline:  { color: 'var(--red)',        dot: '#ef4444', label: 'Automation offline — N8n unreachable' },
}

function N8nStatus() {
  const status = useN8nHealth()
  const { color, dot, label } = INDICATOR[status]

  return (
    <div
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginLeft: 'auto',
        paddingRight: 'var(--sp-2)',
        cursor: 'default',
      }}
    >
      {/* pulsing dot when offline */}
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: dot,
        flexShrink: 0,
        boxShadow: status === 'offline' ? `0 0 0 2px ${dot}33` : 'none',
        animation: status === 'offline' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      <span style={{
        fontSize: 'var(--text-xs)',
        color,
        fontWeight: status === 'offline' ? 'var(--weight-semi)' : 'var(--weight-normal)',
        whiteSpace: 'nowrap',
      }}>
        {status === 'checking' ? 'Automation…' : status === 'online' ? 'Automation ✓' : 'Automation offline'}
      </span>
    </div>
  )
}

export default function Nav() {
  return (
    <nav className="nav">
      <span className="nav-brand">🎵 MMM</span>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
      <N8nStatus />
    </nav>
  )
}
