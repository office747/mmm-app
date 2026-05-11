import { fmtDateLong } from '../../lib/dates.js'
import { useNavigate } from 'react-router-dom'

export default function GigDetailModal({ open, gig, onClose, onToggleInsurance, toggling, onEditGig }) {
  const navigate = useNavigate()

  if (!open || !gig) return null

  const total = Number(gig.fee) + Number(gig.transport_amount) + Number(gig.insurance_amount)

  return (
    <div
      className="modal-overlay open"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">

        <div className="modal-header">
          <h2 className="modal-title">Gig Details</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* hotel link */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--sp-1)' }}>Hotel</div>
            <button
              className="btn btn-ghost"
              style={{ padding: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}
              onClick={() => { navigate(`/hotels/detail?id=${gig.hotel_id}`); onClose() }}
            >
              {gig.hotel_name} →
            </button>
          </div>

          {/* gig info */}
          <table style={{ width: '100%', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 'var(--sp-2)', width: 130 }}>Date</td>
                <td style={{ paddingBottom: 'var(--sp-2)' }}><strong>{fmtDateLong(gig.gig_date)}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 'var(--sp-2)' }}>Performance</td>
                <td style={{ paddingBottom: 'var(--sp-2)' }}>{gig.performance_type || '—'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 'var(--sp-2)' }}>Role</td>
                <td style={{ paddingBottom: 'var(--sp-2)' }}>{gig.role || '—'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', paddingBottom: 'var(--sp-2)' }}>Status</td>
                <td style={{ paddingBottom: 'var(--sp-2)' }}>
                  <span className={`badge ${
                    gig.gig_status === 'performed'  ? 'badge-brand'   :
                    gig.gig_status === 'confirmed'  ? 'badge-blue'    :
                    gig.gig_status === 'cancelled'  ? 'badge-red'     : 'badge-neutral'
                  }`}>{gig.gig_status}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* earnings breakdown */}
          <div className="section-label">Earnings</div>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--sp-3) var(--sp-4)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--sp-4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Artist fee</span>
              <span>€{Number(gig.fee).toFixed(2)}</span>
            </div>
            {Number(gig.transport_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transport</span>
                <span>€{Number(gig.transport_amount).toFixed(2)}</span>
              </div>
            )}
            {Number(gig.insurance_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Insurance</span>
                <span>€{Number(gig.insurance_amount).toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'var(--weight-semi)',
              borderTop: '1px solid var(--border)',
              paddingTop: 'var(--sp-2)',
              marginTop: 'var(--sp-1)',
              color: 'var(--brand)',
            }}>
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* insurance toggle */}
          <div style={{
            background: gig.insurance_issued ? 'var(--green-bg)' : 'var(--amber-bg)',
            border: `1px solid ${gig.insurance_issued ? 'var(--green-border)' : 'var(--amber-border)'}`,
            borderRadius: 'var(--radius)',
            padding: 'var(--sp-3) var(--sp-4)',
          }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!gig.insurance_issued}
                disabled={toggling}
                onChange={e => onToggleInsurance({ gigArtistId: gig.gig_artist_id, value: e.target.checked })}
              />
              <span style={{
                fontWeight: 'var(--weight-medium)',
                color: gig.insurance_issued ? 'var(--green)' : 'var(--amber)',
              }}>
                Insurance {gig.insurance_issued ? '✓ Issued' : '⚠ Pending'}
              </span>
            </label>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {onEditGig && (
            <button className="btn btn-ghost" onClick={() => { onEditGig(gig); onClose() }}>
              ✏ Edit gig
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => { navigate(`/hotels/detail?id=${gig.hotel_id}`); onClose() }}
          >
            View hotel →
          </button>
        </div>

      </div>
    </div>
  )
}
