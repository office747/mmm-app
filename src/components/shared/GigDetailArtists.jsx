import ArtistSearchSelect from './ArtistSearchSelect.jsx'

const EMPTY_LINE = { artist_id: '', role: '', fee: '', transport_amount: '', insurance_amount: '' }

export default function GigDetailArtists({ lines, onChange, allArtists, onToggleInsurance, toggling }) {
  const anyUninsured = lines.some(l => l.artist_id && !l.insurance_issued)

  const setLine = (i, field, value) =>
    onChange(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))

  const addLine    = () => onChange([...lines, { ...EMPTY_LINE }])
  const removeLine = (i) => onChange(lines.filter((_, idx) => idx !== i))

  return (
    <div style={{ marginTop: 'var(--sp-2)' }}>
      {/* header */}
      <div style={{
        padding: 'var(--sp-2) var(--sp-3)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--text)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>
          Artists ({lines.filter(l => l.artist_id).length})
          {anyUninsured && (
            <span style={{ color: 'var(--red)', marginLeft: 6, fontWeight: 'var(--weight-normal)' }}>
              ins! insurance pending
            </span>
          )}
        </span>
      </div>

      {/* lines */}
      <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: 'var(--sp-3)' }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 70px 70px 70px 30px',
              gap: 'var(--sp-2)',
              alignItems: 'end',
              marginBottom: 'var(--sp-2)',
              paddingBottom: 'var(--sp-2)',
              borderBottom: i < lines.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div className="form-row" style={{ marginBottom: 0 }}>
              {i === 0 && <label>Artist</label>}
              <ArtistSearchSelect
                value={line.artist_id}
                artists={allArtists}
                onChange={id => setLine(i, 'artist_id', id)}
              />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              {i === 0 && <label>Role</label>}
              <input
                type="text"
                value={line.role}
                onChange={e => setLine(i, 'role', e.target.value)}
                placeholder="Lead"
              />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              {i === 0 && <label>Fee €</label>}
              <input type="number" min="0" step="0.01" value={line.fee} onChange={e => setLine(i, 'fee', e.target.value)} placeholder="0" />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              {i === 0 && <label>Transp €</label>}
              <input type="number" min="0" step="0.01" value={line.transport_amount} onChange={e => setLine(i, 'transport_amount', e.target.value)} placeholder="0" />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              {i === 0 && <label>Ins €</label>}
              <input type="number" min="0" step="0.01" value={line.insurance_amount} onChange={e => setLine(i, 'insurance_amount', e.target.value)} placeholder="0" />
            </div>
            <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => removeLine(i)}
                disabled={lines.length === 1}
              >✕</button>
            </div>

            {/* insurance toggle — only for existing artists */}
            {line.gig_artist_id && (
              <div style={{ gridColumn: '1 / -1', paddingTop: 4 }}>
                <label className="checkbox-label" style={{ fontSize: 'var(--text-xs)' }}>
                  <input
                    type="checkbox"
                    checked={!!line.insurance_issued}
                    disabled={toggling}
                    onChange={e => {
                      setLine(i, 'insurance_issued', e.target.checked)
                      onToggleInsurance?.({ gigArtistId: line.gig_artist_id, value: e.target.checked })
                    }}
                  />
                  <span style={{ color: line.insurance_issued ? 'var(--green)' : 'var(--amber)' }}>
                    Insurance {line.insurance_issued ? '✓ Issued' : '⚠ Pending'}
                  </span>
                </label>
              </div>
            )}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addLine}>+ Add artist</button>
      </div>
    </div>
  )
}
