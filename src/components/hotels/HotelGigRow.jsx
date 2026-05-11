import { fmtDate, STATUS_BG, STATUS_COLOR, STATUS_BORDER, SOURCE_BADGE, SOURCE_LABEL } from './gigConstants.js'

export default function HotelGigRow({ g, isOpen, onToggle, onEdit, onDuplicate, onStatusChange, onGenerateInvoice }) {
  const margin = Number(g.mmm_margin)

  return (
    <tr
      style={{ cursor: 'pointer' }}
      onClick={() => onToggle(g.gig_id)}
      className={g.status === 'cancelled' ? 'row-cancelled' : ''}
    >
      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
        {isOpen ? '▾' : '▸'}
      </td>

      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(g.gig_date)}</td>

      <td>{g.performance_type || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>

      <td>
        <span className={`badge ${SOURCE_BADGE[g.source] || 'badge-neutral'}`}>
          {SOURCE_LABEL[g.source] || g.source}
        </span>
      </td>

      <td>€{Number(g.hotel_price).toFixed(2)}</td>

      <td style={{ color: 'var(--text-secondary)' }}>
        €{Number(g.total_artist_cost).toFixed(2)}
      </td>

      {/* margin column — hidden for now
      <td style={{
        color: margin < 0 ? 'var(--red)' : margin === 0 ? 'var(--text-muted)' : 'var(--green)',
        fontWeight: 'var(--weight-medium)',
      }}>
        {margin < 0 ? '−' : '+'}€{Math.abs(margin).toFixed(2)}
      </td>
      */}

      {/* status select */}
      <td onClick={e => e.stopPropagation()}>
        <select
          value={g.status}
          onChange={e => onStatusChange(g.gig_id, e.target.value)}
          style={{
            fontSize: 'var(--text-xs)',
            padding: '3px 6px',
            border: `1px solid ${STATUS_BORDER[g.status] || 'var(--border-strong)'}`,
            borderRadius: 'var(--radius)',
            background: STATUS_BG[g.status] || 'var(--bg-card)',
            color: STATUS_COLOR[g.status] || 'var(--text)',
            cursor: 'pointer',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          <option value="planned">Planned</option>
          <option value="confirmed">Confirmed</option>
          <option value="performed">Performed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>

      {/* invoice status */}
      <td>
        {g.status !== 'performed'
          ? <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
          : g.needs_invoicing
            ? <span className="badge badge-amber">⚠ Uninvoiced</span>
            : <span className="badge badge-green">Invoiced</span>
        }
      </td>

      {/* row actions */}
      <td onClick={e => e.stopPropagation()}>
        <div className="table-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(g)}>Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDuplicate(g)}>Copy</button>
          {g.status === 'performed' && g.needs_invoicing && (
            <button className="btn btn-primary btn-sm" onClick={() => onGenerateInvoice(g)}>
              Invoice
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
