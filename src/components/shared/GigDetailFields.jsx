const STATUS_OPTIONS = ['planned', 'confirmed', 'performed', 'cancelled']
const STATUS_BG     = { planned: 'var(--bg-hover)', confirmed: 'var(--blue-bg)', performed: 'var(--brand-subtle)', cancelled: 'var(--red-bg)' }
const STATUS_COLOR  = { planned: 'var(--text-secondary)', confirmed: 'var(--blue)', performed: 'var(--brand)', cancelled: 'var(--red)' }
const STATUS_BORDER = { planned: 'var(--border-strong)', confirmed: 'var(--blue-border)', performed: 'var(--brand-subtle2)', cancelled: 'var(--red-border)' }

export default function GigDetailFields({ form, onChange }) {
  const set = (field, value) => onChange({ ...form, [field]: value })

  return (
    <>
      <div className="form-grid">
        <div className="form-row">
          <label>Performance type</label>
          <input
            type="text"
            value={form.performance_type}
            onChange={e => set('performance_type', e.target.value)}
            placeholder="e.g. Evening Jazz"
          />
        </div>
        <div className="form-row">
          <label>Hotel price €</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.hotel_price}
            onChange={e => set('hotel_price', e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-row">
          <label>Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            style={{
              border: `1px solid ${STATUS_BORDER[form.status] || 'var(--border-strong)'}`,
              background: STATUS_BG[form.status] || 'var(--bg-card)',
              color: STATUS_COLOR[form.status] || 'var(--text)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Source</label>
          <select value={form.source} onChange={e => set('source', e.target.value)}>
            <option value="contract">Contract</option>
            <option value="hotel_request">Ad-hoc</option>
            <option value="mmm_initiative">MMM initiative</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any notes…"
          style={{ minHeight: 48 }}
        />
      </div>
    </>
  )
}
