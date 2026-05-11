/**
 * DashboardCard — titled card section for dashboard panels
 */
export default function DashboardCard({ title, count, countColor, children, empty }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="card-header" style={{ marginBottom: count !== undefined ? 'var(--sp-3)' : 'var(--sp-1)' }}>
        <div className="card-title">{title}</div>
        {count !== undefined && (
          <span className={`badge ${countColor || 'badge-neutral'}`}>{count}</span>
        )}
      </div>
      {empty ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--sp-2) 0' }}>
          {empty}
        </div>
      ) : children}
    </div>
  )
}
