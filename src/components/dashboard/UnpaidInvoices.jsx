import { useNavigate } from 'react-router-dom'
import { fmtDateLong } from '../../lib/dates.js'
import DashboardCard from './DashboardCard.jsx'

function daysSince(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export default function UnpaidInvoices({ invoices, loading }) {
  const navigate = useNavigate()

  const total = (invoices || []).reduce((s, i) => s + Number(i.total), 0)

  return (
    <DashboardCard
      title="Unpaid invoices"
      count={invoices?.length ? `${invoices.length} · €${total.toFixed(0)}` : 0}
      countColor={invoices?.length ? 'badge-red' : 'badge-green'}
      empty={!loading && (!invoices?.length) ? '✓ No outstanding invoices.' : null}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {(invoices || []).map((inv, i) => {
            const days = daysSince(inv.sent_at)
            return (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--sp-2) 0',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  gap: 'var(--sp-3)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/hotels/detail?id=${inv.hotel_id}&tab=invoices`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{inv.hotel_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {inv.invoice_number || 'Draft'} · sent {fmtDateLong(inv.sent_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 'var(--weight-semi)', fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
                    €{Number(inv.total).toFixed(0)}
                  </div>
                  {days !== null && (
                    <div style={{ fontSize: 'var(--text-xs)', color: days > 14 ? 'var(--red)' : days > 7 ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {days}d overdue
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardCard>
  )
}
