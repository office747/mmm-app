import { useState, useEffect } from 'react'
import { SaveError } from '../ui/index.jsx'

const EMPTY = {
  full_name:  '',
  phone:      '',
  email:      '',
  bank_name:  '',
  bank_iban:  '',
  notes:      '',
  active:     true,
}

export default function ArtistModal({ open, artist, onSave, onClose, saving, saveError, onClearError }) {
  const [form, setForm] = useState(EMPTY)
  const isEdit = Boolean(artist?.id)

  // populate form when editing, reset when adding
  useEffect(() => {
    if (open) {
      setForm(artist ? { ...EMPTY, ...artist } : EMPTY)
    }
  }, [open, artist])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    if (!form.full_name.trim()) return
    onSave(form)
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">

        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit artist' : 'Add artist'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={saveError} onDismiss={onClearError} />

          {/* name */}
          <div className="form-row">
            <label>Full name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="e.g. Κρικώνης Ορέστης"
              autoFocus
            />
          </div>

          {/* status */}
          <div className="form-row">
            <label>Status</label>
            <select value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* contact */}
          <div className="section-label">Contact</div>
          <div className="form-grid">
            <div className="form-row">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+30 69…"
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="artist@email.com"
              />
            </div>
          </div>

          {/* banking */}
          <div className="section-label">Banking</div>
          <div className="form-grid">
            <div className="form-row">
              <label>Bank name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => set('bank_name', e.target.value)}
                placeholder="e.g. Eurobank"
              />
            </div>
            <div className="form-row">
              <label>IBAN</label>
              <input
                type="text"
                value={form.bank_iban}
                onChange={e => set('bank_iban', e.target.value.toUpperCase())}
                placeholder="GR…"
              />
            </div>
          </div>

          {/* notes */}
          <div className="form-row">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.full_name.trim()}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add artist'}
          </button>
        </div>

      </div>
    </div>
  )
}
