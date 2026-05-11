/**
 * HotelFilter
 * Simple search input that narrows the visible hotels in the programme grid.
 * All hotels shown by default — typing filters by name.
 */
export default function HotelFilter({ value, onChange, total, visible }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
      <input
        type="search"
        placeholder="Filter hotels…"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ maxWidth: 220 }}
      />
      {value && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {visible} of {total} hotels
        </span>
      )}
      {value && (
        <button className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
          Clear
        </button>
      )}
    </div>
  )
}
