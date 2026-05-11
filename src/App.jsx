import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Weekly from './pages/Weekly.jsx'
import Hotels from './pages/Hotels.jsx'
import HotelDetail from './pages/HotelDetail.jsx'
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
        <Route path="/hotels"             element={<Hotels />} />
        <Route path="/hotels/detail"      element={<HotelDetail />} />
        <Route path="/artists"            element={<Artists />} />
        <Route path="/artists/detail"     element={<ArtistDetail />} />
        <Route path="/artists/schedule"   element={<ArtistSchedule />} />
        <Route path="/dashboard"          element={<Dashboard />} />
      </Routes>
    </>
  )
}
