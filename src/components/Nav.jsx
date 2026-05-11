import { NavLink } from 'react-router-dom'

export default function Nav() {
    return (
        <nav style={{ background: '#1a1a2e', padding: '0 20px', display: 'flex', gap: 0 }}>
            <span style={{ color: '#fff', padding: '12px 20px', fontWeight: 700 }}>🎵 MMM</span>
            {[
                { to: '/weekly', label: 'Weekly' },
                { to: '/hotels', label: 'Hotels' },
                { to: '/artists', label: 'Artists' },
                { to: '/dashboard', label: 'Dashboard' },
            ].map(({ to, label }) => (
                <NavLink
                    key={to} to={to}
                    style={({ isActive }) => ({
                        color: isActive ? '#fff' : '#aaa',
                        padding: '12px 18px',
                        textDecoration: 'none',
                        background: isActive ? '#16213e' : 'transparent',
                        fontSize: 13
                    })}
                >
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}