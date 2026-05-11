import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Weekly from './pages/Weekly.jsx'
import Hotel from './pages/Hotel.jsx'
import Artists from './pages/Artists.jsx'
import ArtistDetail from './pages/ArtistDetail.jsx'
import ArtistSchedule from './pages/ArtistSchedule.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"                   element={<Navigate to="/weekly" replace />} />
        <Route path="/weekly"             element={<Weekly />} />
        <Route path="/hotels"             element={<Hotel />} />
        <Route path="/artists"            element={<Artists />} />
        <Route path="/artists/detail"     element={<ArtistDetail />} />
        <Route path="/artists/schedule"   element={<ArtistSchedule />} />
        <Route path="/dashboard"          element={<Dashboard />} />
      </Routes>
    </>
  )
}
