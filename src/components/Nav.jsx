import { NavLink } from 'react-router-dom'

const links = [
  { to: '/weekly',    label: 'Programme' },
  { to: '/hotels',    label: 'Hotels' },
  { to: '/artists',   label: 'Artists' },
  { to: '/dashboard', label: 'Dashboard' },
]

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
    </nav>
  )
}
