import { useNavigate } from 'react-router-dom'

export default function HotelHeader({ hotel }) {
  const navigate = useNavigate()
  const primaryContact = hotel?.hotel_contacts?.find(c => c.is_primary) || hotel?.hotel_contacts?.[0]

  return (
    <>
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hotels')}>
          ← All hotels
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{hotel?.name}</h1>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>
            {hotel?.legal_name && <>{hotel.legal_name} &nbsp;·&nbsp;</>}
            Billing: <strong>{hotel?.billing_cycle}</strong>
            {primaryContact?.email && <> &nbsp;·&nbsp; {primaryContact.email}</>}
            {hotel?.season_start && (
              <> &nbsp;·&nbsp; Season: {hotel.season_start} – {hotel.season_end}</>
            )}
          </div>
          {hotel?.notes && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--sp-1)' }}>
              {hotel.notes}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
