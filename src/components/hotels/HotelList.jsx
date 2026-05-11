import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HotelList({ hotels = [], loading, onAdd, onEdit }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return hotels
    return hotels.filter(h =>
      h.name.toLowerCase().includes(q) ||
      (h.legal_name || '').toLowerCase().includes(q)
    )
  }, [hotels, search])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hotels</h1>
        <button className="btn btn-primary" onClick={onAdd}>+ Add hotel</button>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search hotels…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Legal name</th>
              <th>Billing</th>
              <th>Season</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
                    <div className="spinner" /> Loading hotels…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {search ? `No hotels matching "${search}"` : 'No hotels yet. Add your first one.'}
                </td>
              </tr>
            ) : filtered.map(hotel => (
              <tr
                key={hotel.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/hotels/detail?id=${hotel.id}`)}
              >
                <td style={{ fontWeight: 'var(--weight-medium)' }}>{hotel.name}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{hotel.legal_name || '—'}</td>
                <td>
                  <span className="badge badge-neutral">
                    {hotel.billing_cycle === 'daily' ? 'Daily' : 'Weekly'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {hotel.season_start && hotel.season_end
                    ? `${hotel.season_start} – ${hotel.season_end}`
                    : '—'}
                </td>
                <td>
                  <span className={`badge ${hotel.active ? 'badge-green' : 'badge-neutral'}`}>
                    {hotel.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(hotel)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hotels.length > 0 && (
        <div style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {filtered.length} of {hotels.length} hotels
        </div>
      )}
    </div>
  )
}
