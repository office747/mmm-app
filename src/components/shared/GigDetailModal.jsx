import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmtDateLong } from '../../lib/dates.js'
import { SaveError } from '../ui/index.jsx'

const STATUS_OPTIONS = ['planned', 'confirmed', 'performed', 'cancelled']
const STATUS_BG     = { planned: 'var(--bg-hover)', confirmed: 'var(--blue-bg)', performed: 'var(--brand-subtle)', cancelled: 'var(--red-bg)' }
const STATUS_COLOR  = { planned: 'var(--text-secondary)', confirmed: 'var(--blue)', performed: 'var(--brand)', cancelled: 'var(--red)' }
const STATUS_BORDER = { planned: 'var(--border-strong)', confirmed: 'var(--blue-border)', performed: 'var(--brand-subtle2)', cancelled: 'var(--red-border)' }

const EMPTY_LINE = { artist_id: '', role: '', fee: '', transport_amount: '', insurance_amount: '' }

export default function GigDetailModal({
  open,
  gig,
  gigArtists,       // artist_gig_detail rows for this gig
  allArtists,       // full artist list for the selector
  onClose,
  onSave,           // fn({ gigFields, artistLines })
  saving,
  saveError,
  onClearError,
  onToggleInsurance,
  toggling,
}) {
  const navigate = useNavigate()

  const [form, setForm]     = useState({})
  const [lines, setLines]   = useState([{ ...EMPTY_LINE }])

  useEffect(() => {
    if (open && gig) {
      setForm({
        performance_type: gig.performance_type || '',
        hotel_price:      gig.hotel_price      || '',
        status:           gig.status || gig.gig_status || 'planned',
        source:           gig.source           || 'contract',
        notes:            gig.notes || gig.gig_notes   || '',
      })
      const existing = gigArtists || []
      setLines(existing.length
        ? existing.map(a => ({
            artist_id:        a.artist_id,
            role:             a.role             || '',
            fee:              a.fee              ?? '',
            transport_amount: a.transport_amount ?? '',
            insurance_amount: a.insurance_amount ?? '',
            insurance_issued: a.insurance_issued || false,
            gig_artist_id:    a.gig_artist_id,
          }))
        : [{ ...EMPTY_LINE }]
      )
    }
  }, [open, gig, gigArtists])

  if (!open || !gig) return null

  const set    = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const setLine = (i, field, value) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }])
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    onSave?.({
      gigFields: {
        id:               gig.gig_id,
        hotel_id:         gig.hotel_id,
        gig_date:         gig.gig_date,
        performance_type: form.performance_type || null,
        hotel_price:      Number(form.hotel_price) || 0,
        status:           form.status,
        source:           form.source,
        notes:            form.notes || null,
      },
      artistLines: lines.filter(l => l.artist_id),
    })
  }

  const anyUninsured = (gigArtists || []).some(a => !a.insurance_issued)
  const invoiced     = !gig.needs_invoicing && (gig.status || gig.gig_status) === 'performed'

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 580 }}>

        {/* header */}
        <div className="modal-header">
          <div>
            <button
              className="btn btn-ghost"
              style={{ padding: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--brand)' }}
              onClick={() => { navigate(`/hotels/detail?id=${gig.hotel_id}`); onClose() }}
            >
              {gig.hotel_name} →
            </button>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
              <span>{fmtDateLong(gig.gig_date)}</span>
              {(gig.status === 'performed' || gig.gig_status === 'performed') && (
                <span className={`badge ${invoiced ? 'badge-green' : 'badge-amber'}`}>
                  {invoiced ? '✓ Invoiced' : '⚠ Uninvoiced'}
                </span>
              )}
              {(gigArtists || []).length > 0 && (
                <span className={`badge ${anyUninsured ? 'badge-amber' : 'badge-green'}`}>
                  {anyUninsured ? '⚠ Insurance pending' : '✓ Insurance OK'}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={saveError} onDismiss={onClearError} />

          {/* gig fields */}
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

          {/* artists section — always expanded */}
          <div style={{ marginTop: 'var(--sp-2)' }}>
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
                {anyUninsured && <span style={{ color: 'var(--red)', marginLeft: 6, fontWeight: 'var(--weight-normal)' }}>ins! insurance pending</span>}
              </span>
            </div>

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
                      <select value={line.artist_id} onChange={e => setLine(i, 'artist_id', e.target.value)}>
                        <option value="">— select —</option>
                        {(allArtists || []).map(a => (
                          <option key={a.id} value={a.id}>{a.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      {i === 0 && <label>Role</label>}
                      <input type="text" value={line.role} onChange={e => setLine(i, 'role', e.target.value)} placeholder="Lead" />
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
                      <button className="btn btn-ghost btn-sm" onClick={() => removeLine(i)} disabled={lines.length === 1}>✕</button>
                    </div>
                    {/* insurance toggle per artist */}
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
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-ghost"
            onClick={() => { navigate(`/hotels/detail?id=${gig.hotel_id}`); onClose() }}
          >
            View hotel →
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
