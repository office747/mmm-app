import { useState, useEffect } from 'react'
import { SaveError } from '../ui/index.jsx'

const EMPTY_GIG = {
  hotel_id:         '',
  performance_type: '',
  gig_date:         '',
  hotel_price:      '',
  status:           'planned',
  source:           'contract',
  notes:            '',
}

const EMPTY_ARTIST_LINE = {
  artist_id:        '',
  role:             '',
  fee:              '',
  transport_amount: '',
  insurance_amount: '',
}

const RECURRENCE_OPTIONS = [
  { value: 'none',      label: 'No recurrence' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Bi-weekly' },
]

export default function GigModal({
  open,
  gig,              // null = add, object = edit
  gigArtists,       // existing artist lines when editing
  hotels,           // for hotel selector (weekly view needs this)
  hotelId,          // pre-selected hotel (when opened from hotel view)
  performanceTypes, // types for selected hotel
  artists,          // all active artists for selector
  onSave,
  onClose,
  saving,
  saveError,
  onClearError,
}) {
  const [form, setForm]           = useState(EMPTY_GIG)
  const [artistLines, setLines]   = useState([{ ...EMPTY_ARTIST_LINE }])
  const [recurrence, setRecur]    = useState('none')
  const [recurUntil, setUntil]    = useState('')
  const [preview, setPreview]     = useState(null) // recurrence preview count
  const isEdit                    = Boolean(gig?.id)

  useEffect(() => {
    if (open) {
      if (gig) {
        setForm({ ...EMPTY_GIG, ...gig })
        setLines(gigArtists?.length
          ? gigArtists.map(a => ({
              artist_id:        a.artist_id,
              role:             a.role             || '',
              fee:              a.fee              ?? '',
              transport_amount: a.transport_amount ?? '',
              insurance_amount: a.insurance_amount ?? '',
            }))
          : [{ ...EMPTY_ARTIST_LINE }]
        )
      } else {
        setForm({ ...EMPTY_GIG, hotel_id: hotelId || '', gig_date: new Date().toISOString().slice(0, 10) })
        setLines([{ ...EMPTY_ARTIST_LINE }])
      }
      setRecur('none')
      setUntil('')
      setPreview(null)
    }
  }, [open, gig, gigArtists, hotelId])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const setLine = (i, field, value) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))

  const addLine  = () => setLines(prev => [...prev, { ...EMPTY_ARTIST_LINE }])
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i))

  // calculate recurrence preview
  useEffect(() => {
    if (recurrence === 'none' || !form.gig_date || !recurUntil) { setPreview(null); return }
    const start = new Date(form.gig_date)
    const end   = new Date(recurUntil)
    const step  = recurrence === 'weekly' ? 7 : 14
    let count = 0
    const d = new Date(start)
    d.setDate(d.getDate() + step)
    while (d <= end) { count++; d.setDate(d.getDate() + step) }
    setPreview(count)
  }, [recurrence, form.gig_date, recurUntil])

  const handleSubmit = () => {
    if (!form.gig_date || !form.hotel_price) return
    const validLines = artistLines.filter(l => l.artist_id)
    // convert empty strings to null for nullable uuid/numeric fields
    const sanitisedGig = {
      ...form,
      hotel_id:         form.hotel_id         || null,
      performance_type: form.performance_type || null,
      hotel_price:      Number(form.hotel_price),
    }
    onSave({
      gig: sanitisedGig,
      artistLines: validLines,
      recurrence: recurrence !== 'none' ? { type: recurrence, until: recurUntil } : null,
    })
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 600 }}>

        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit gig' : 'Add gig'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={saveError} onDismiss={onClearError} />

          {/* hotel selector — only shown when not pre-selected (e.g. weekly view) */}
          {!hotelId && (
            <div className="form-row">
              <label>Hotel <span style={{ color: 'var(--red)' }}>*</span></label>
              <select value={form.hotel_id} onChange={e => set('hotel_id', e.target.value)}>
                <option value="">— select hotel —</option>
                {(hotels || []).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-grid">
            <div className="form-row">
              <label>Date <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="date" value={form.gig_date} onChange={e => set('gig_date', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Hotel price (€) <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.hotel_price}
                onChange={e => set('hotel_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Performance type</label>
              <input
                type="text"
                value={form.performance_type}
                onChange={e => set('performance_type', e.target.value)}
                placeholder="e.g. Evening Jazz, Pool DJ, Dinner Trio"
              />
            </div>
            <div className="form-row">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="planned">Planned</option>
                <option value="confirmed">Confirmed</option>
                <option value="performed">Performed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="contract">Contract</option>
                <option value="hotel_request">Hotel request (ad-hoc)</option>
                <option value="mmm_initiative">MMM initiative</option>
              </select>
            </div>
          </div>

          {/* recurrence — only on new gigs */}
          {!isEdit && (
            <>
              <div className="section-label">Recurrence</div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Repeats</label>
                  <select value={recurrence} onChange={e => setRecur(e.target.value)}>
                    {RECURRENCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {recurrence !== 'none' && (
                  <div className="form-row">
                    <label>Until</label>
                    <input
                      type="date"
                      value={recurUntil}
                      min={form.gig_date}
                      onChange={e => setUntil(e.target.value)}
                    />
                  </div>
                )}
              </div>
              {preview !== null && (
                <div className="banner banner-info" style={{ marginBottom: 'var(--sp-3)' }}>
                  This will create <strong>{preview + 1} gigs</strong> in total
                  ({preview} additional {recurrence === 'weekly' ? 'weekly' : 'bi-weekly'} copies).
                  Each can be edited individually after creation.
                </div>
              )}
            </>
          )}

          {/* artist lines */}
          <div className="section-label">Artists performing</div>
          {artistLines.map((line, i) => (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 80px 80px 80px auto',
              gap: 'var(--sp-2)',
              alignItems: 'end',
              marginBottom: 'var(--sp-2)',
              paddingBottom: 'var(--sp-2)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Artist</label>}
                <select value={line.artist_id} onChange={e => setLine(i, 'artist_id', e.target.value)}>
                  <option value="">— select —</option>
                  {(artists || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Role</label>}
                <input
                  type="text"
                  value={line.role}
                  onChange={e => setLine(i, 'role', e.target.value)}
                  placeholder="e.g. Lead"
                />
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Fee €</label>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.fee}
                  onChange={e => setLine(i, 'fee', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Transport €</label>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.transport_amount}
                  onChange={e => setLine(i, 'transport_amount', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {i === 0 && <label>Insurance €</label>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.insurance_amount}
                  onChange={e => setLine(i, 'insurance_amount', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeLine(i)}
                  disabled={artistLines.length === 1}
                  title="Remove artist"
                >✕</button>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addLine}>+ Add artist</button>

          {/* notes */}
          <div className="form-row" style={{ marginTop: 'var(--sp-4)' }}>
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. last-minute change, retroactive entry reason…"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.gig_date || !form.hotel_price}
          >
            {saving
              ? 'Saving…'
              : isEdit
                ? 'Save changes'
                : preview !== null
                  ? `Create ${preview + 1} gigs`
                  : 'Add gig'
            }
          </button>
        </div>

      </div>
    </div>
  )
}
