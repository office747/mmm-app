import { addDays, isoWeekStart, monthOf, currentMonth, fmtWeekLabel, fmtMonthLabel } from '../../lib/dates.js'

export default function HotelPeriodNav({ periodMode, weekStart, month, onSetParam }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>

      {/* week / month toggle */}
      <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {['week', 'month'].map(mode => (
          <button
            key={mode}
            onClick={() => onSetParam('period', mode)}
            style={{
              padding: '5px 14px',
              fontSize: 'var(--text-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: periodMode === mode ? 'var(--weight-semi)' : 'var(--weight-normal)',
              background: periodMode === mode ? 'var(--brand)' : 'var(--bg-card)',
              color: periodMode === mode ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* prev / label / next */}
      {periodMode === 'week' ? (
        <>
          <button className="btn btn-secondary btn-sm" onClick={() => onSetParam('week', addDays(weekStart, -7))}>← Prev</button>
          <span style={{ fontWeight: 'var(--weight-semi)', fontSize: 'var(--text-sm)', minWidth: 200 }}>
            {fmtWeekLabel(weekStart)}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => onSetParam('week', addDays(weekStart, 7))}>Next →</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onSetParam('week', isoWeekStart())}>Today</button>
        </>
      ) : (
        <>
          <button className="btn btn-secondary btn-sm" onClick={() => onSetParam('month', monthOf(month, -1))}>← Prev</button>
          <span style={{ fontWeight: 'var(--weight-semi)', fontSize: 'var(--text-sm)', minWidth: 160 }}>
            {fmtMonthLabel(month)}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => onSetParam('month', monthOf(month, 1))}>Next →</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onSetParam('month', currentMonth())}>This month</button>
        </>
      )}
    </div>
  )
}
