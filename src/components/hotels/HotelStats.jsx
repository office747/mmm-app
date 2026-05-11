export default function HotelStats({ stats, periodLabel }) {
  return (
    <div className="stat-row">
      <div className="stat-card">
        <div className="stat-label">Gigs {periodLabel}</div>
        <div className="stat-value">{stats.gigs}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Uninvoiced gigs</div>
        <div className="stat-value amber">{stats.uninvoiced}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Outstanding amount</div>
        <div className="stat-value orange">€{stats.outstanding.toFixed(2)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Unpaid invoices</div>
        <div className="stat-value red">{stats.unpaid}</div>
      </div>
    </div>
  )
}
