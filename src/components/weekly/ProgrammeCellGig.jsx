import ProgrammeCellArtists from './ProgrammeCellArtists.jsx'

const BADGE = (text, color, bg, border, title) => (
  <span
    title={title}
    style={{
      color, fontSize: 9, fontWeight: 600,
      background: bg, padding: '1px 3px',
      borderRadius: 2, border: `1px solid ${border}`,
    }}
  >
    {text}
  </span>
)

export default function ProgrammeCellGig({
  g,
  artists,
  isOpen,
  showArtists,
  onGigClick,
  onToggleArtists,
  sending,
  status,
  onNotify,
}) {
  const cancelled    = g.status === 'cancelled'
  const uninvoiced   = g.needs_invoicing && g.status === 'performed'
  const anyPending   = artists.some(a => !a.insurance_issued)

  return (
    <div
      onClick={() => onGigClick(g)}
      style={{
        background: cancelled ? 'var(--red-bg)' : uninvoiced ? 'var(--amber-bg)' : 'var(--brand-subtle)',
        border: `1px solid ${cancelled ? 'var(--red-border)' : uninvoiced ? 'var(--amber-border)' : 'var(--brand-subtle2)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '4px 6px',
        fontSize: 'var(--text-xs)',
        cursor: 'pointer',
        opacity: cancelled ? 0.6 : 1,
        lineHeight: 1.4,
      }}
    >
      {/* performance + time */}
      <div style={{
        fontWeight: 'var(--weight-semi)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
      }}>
        {g.performance_type || 'Performance'}
        {g.start_time && (
          <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {g.start_time}
          </span>
        )}
      </div>

      {/* price + badges + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 1 }}>
        <span style={{ color: 'var(--text-secondary)' }}>€{Number(g.hotel_price).toFixed(0)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {g.status === 'performed' && uninvoiced  && BADGE('€?',   'var(--amber)', 'var(--amber-bg)', 'var(--amber-border)', 'Not invoiced')}
          {g.status === 'performed' && !uninvoiced && BADGE('€✓',   'var(--green)', 'var(--green-bg)', 'var(--green-border)', 'Invoiced')}
          {artists.length > 0 && anyPending        && BADGE('ins!', 'var(--red)',   'var(--red-bg)',   'var(--red-border)',   'Insurance pending')}
          {artists.length > 0 && !anyPending       && BADGE('ins✓', 'var(--green)', 'var(--green-bg)', 'var(--green-border)', 'Insurance OK')}
          {!showArtists && (
            <button
              onClick={e => { e.stopPropagation(); onToggleArtists() }}
              title={isOpen ? 'Hide artists' : 'Show artists'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}
            >
              {isOpen ? '▾' : '▸'} {artists.length}
            </button>
          )}
        </div>
      </div>

      {/* artist list */}
      {isOpen && (
        <div
          style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          <ProgrammeCellArtists
            artists={artists}
            gig={g}
            sending={sending}
            status={status}
            onNotify={onNotify}
          />
        </div>
      )}
    </div>
  )
}
