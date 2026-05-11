import { Routes, Route, Navigate } from 'react-router-dom'
import Weekly from './pages/Weekly.jsx'
import Hotel from './pages/Hotel.jsx'
import Artist from './pages/Artist.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Nav from './components/Nav.jsx'

export default function App() {
    return (
        <>
            <Nav />
            <Routes>
                <Route path="/" element={<Navigate to="/weekly" replace />} />
                <Route path="/weekly" element={<Weekly />} />
                <Route path="/hotels" element={<Hotel />} />
                <Route path="/artists" element={<Artist />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </>
    )
}