import { useState, useEffect } from 'react'
import { SaveError } from '../ui/index.jsx'

const EMPTY = {
  name:          '',
  legal_name:    '',
  vat_number:    '',
  billing_cycle: 'weekly',
  season_start:  '',
  season_end:    '',
  notes:         '',
  active:        true,
}

const EMPTY_CONTACT = { name: '', email: '', phone: '', is_primary: true }

export default function HotelModal({ open, hotel, contacts, onSave, onClose, saving, saveError, onClearError }) {
  const [form, setForm]         = useState(EMPTY)
  const [ctcts, setCtcts]       = useState([EMPTY_CONTACT])
  const isEdit                  = Boolean(hotel?.id)

  useEffect(() => {
    if (open) {
      setForm(hotel ? { ...EMPTY, ...hotel } : EMPTY)
      setCtcts(contacts?.length ? contacts : [{ ...EMPTY_CONTACT }])
    }
  }, [open, hotel, contacts])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const setContact = (i, field, value) =>
    setCtcts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  const addContact = () =>
    setCtcts(prev => [...prev, { ...EMPTY_CONTACT, is_primary: false }])

  const removeContact = (i) =>
    setCtcts(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSave({ hotel: form, contacts: ctcts.filter(c => c.name.trim() || c.email.trim()) })
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">

        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit hotel' : 'Add hotel'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <SaveError message={saveError} onDismiss={onClearError} />

          {/* name */}
          <div className="form-row">
            <label>Hotel name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Amirandes"
              autoFocus
            />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Legal name</label>
              <input
                type="text"
                value={form.legal_name}
                onChange={e => set('legal_name', e.target.value)}
                placeholder="e.g. ΑΡΙΩΝ ΑΞΤΕ"
              />
            </div>
            <div className="form-row">
              <label>VAT number</label>
              <input
                type="text"
                value={form.vat_number}
                onChange={e => set('vat_number', e.target.value)}
                placeholder="e.g. 999273094"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Billing cycle</label>
              <select value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div className="form-row">
              <label>Status</label>
              <select value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Season start</label>
              <input type="date" value={form.season_start} onChange={e => set('season_start', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Season end</label>
              <input type="date" value={form.season_end} onChange={e => set('season_end', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Invoice every Monday, CC accounts dept."
            />
          </div>

          {/* contacts */}
          <div className="section-label">Billing contacts</div>
          {ctcts.map((c, i) => (
            <div key={i} style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--sp-3)',
              marginBottom: 'var(--sp-3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)' }}>
                  {c.is_primary ? 'Primary contact' : `Contact ${i + 1}`}
                </span>
                {i > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeContact(i)}>Remove</button>
                )}
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Name</label>
                  <input type="text" value={c.name} onChange={e => setContact(i, 'name', e.target.value)} placeholder="Contact name" />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input type="email" value={c.email} onChange={e => setContact(i, 'email', e.target.value)} placeholder="billing@hotel.com" />
                </div>
              </div>
              <div className="form-row">
                <label>Phone</label>
                <input type="tel" value={c.phone} onChange={e => setContact(i, 'phone', e.target.value)} placeholder="+30 21…" />
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addContact}>+ Add contact</button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add hotel'}
          </button>
        </div>

      </div>
    </div>
  )
}
