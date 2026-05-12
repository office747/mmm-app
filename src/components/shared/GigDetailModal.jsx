import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmtDateLong } from '../../lib/dates.js'
import { SaveError } from '../ui/index.jsx'
import GigDetailFields  from './GigDetailFields.jsx'
import GigDetailArtists from './GigDetailArtists.jsx'

const EMPTY_LINE = { artist_id: '', role: '', fee: '', transport_amount: '', insurance_amount: '' }

export default function GigDetailModal({
  open,
  gig,
  gigArtists,
  allArtists,
  onClose,
  onSave,
  saving,
  saveError,
  onClearError,
  onToggleInsurance,
  toggling,
}) {
  const navigate = useNavigate()
  const [form,  setForm]  = useState({})
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])

  useEffect(() => {
    if (open && gig) {
      setForm({
        performance_type: gig.performance_type || '',
        hotel_price:      gig.hotel_price      || '',
        start_time:       gig.start_time       || '',
        status:           gig.status || gig.gig_status || 'planned',
        source:           gig.source            || 'contract',
        notes:            gig.notes || gig.gig_notes || '',
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

  const handleSave = () => onSave?.({
    gigFields: {
      id:               gig.gig_id,
      hotel_id:         gig.hotel_id,
      gig_date:         gig.gig_date,
      performance_type: form.performance_type || null,
      hotel_price:      Number(form.hotel_price) || 0,
      start_time:       form.start_time || null,
      status:           form.status,
      source:           form.source,
      notes:            form.notes || null,
    },
    artistLines: lines.filter(l => l.artist_id),
  })

  const anyUninsured = (gigArtists || []).some(a => !a.insurance_issued)
  const invoiced     = !gig.needs_invoicing && (gig.status || gig.gig_status) === 'performed'

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ width: 580 }}>

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
                <span className={`badge ${anyUninsured ? 'badge-red' : 'badge-green'}`}>
                  {anyUninsured ? 'ins! pending' : 'ins ✓'}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={saveError} onDismiss={onClearError} />
          <GigDetailFields form={form} onChange={setForm} />
          <GigDetailArtists
            lines={lines}
            onChange={setLines}
            allArtists={allArtists}
            onToggleInsurance={onToggleInsurance}
            toggling={toggling}
          />
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
