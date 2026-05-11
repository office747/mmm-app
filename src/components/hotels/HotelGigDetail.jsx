import { useNavigate } from 'react-router-dom'

export default function HotelGigDetail({ g, lines, onEdit, onDuplicate, onCancel, onDelete, onToggleInsurance, toggling, onGenerateInvoice }) {
  const navigate = useNavigate()
  return (
    <tr>
      <td colSpan={10} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
        <div className="row-detail-inner">

          {/* artist lines table */}
          {lines.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No artists assigned yet.
            </span>
          ) : (
            <table style={{ width: 'auto' }}>
              <thead>
                <tr>
                  <th>Artist</th>
                  <th>Role</th>
                  <th>Fee</th>
                  <th>Transport</th>
                  <th>Insurance €</th>
                  <th>Total</th>
                  <th>Insurance issued</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(a => (
                  <tr key={a.gig_artist_id}>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--brand)' }}
                        onClick={() => navigate(`/artists/detail?id=${a.artist_id}`)}
                      >
                        {a.artist_name} →
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.role || '—'}</td>
                    <td>€{Number(a.fee).toFixed(2)}</td>
                    <td>
                      {Number(a.transport_amount) > 0
                        ? `€${Number(a.transport_amount).toFixed(2)}`
                        : '—'}
                    </td>
                    <td>
                      {Number(a.insurance_amount) > 0
                        ? `€${Number(a.insurance_amount).toFixed(2)}`
                        : '—'}
                    </td>
                    <td><strong>€{Number(a.total_earned).toFixed(2)}</strong></td>
                    <td onClick={e => e.stopPropagation()}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={!!a.insurance_issued}
                          disabled={toggling}
                          onChange={e => {
                            e.stopPropagation()
                            onToggleInsurance({ gigArtistId: a.gig_artist_id, value: e.target.checked })
                          }}
                        />
                        {a.insurance_issued
                          ? <span style={{ color: 'var(--green)' }}>✓ Issued</span>
                          : <span style={{ color: 'var(--amber)' }}>⚠ Pending</span>
                        }
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* action buttons */}
          <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(g)}>✏ Edit gig</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDuplicate(g)}>⧉ Duplicate</button>
            {g.status === 'performed' && g.needs_invoicing && (
              <button className="btn btn-primary btn-sm" onClick={() => onGenerateInvoice(g)}>
                Generate invoice
              </button>
            )}
            {g.status !== 'cancelled' && (
              <button className="btn btn-danger btn-sm" onClick={() => onCancel(g.gig_id)}>
                ✕ Cancel
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Delete this gig permanently? This cannot be undone.')) {
                  onDelete(g.gig_id)
                }
              }}
            >
              🗑 Delete
            </button>
          </div>

        </div>
      </td>
    </tr>
  )
}
