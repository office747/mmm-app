import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, fmtDate } from '../../lib/dates.js'
import { LoadingSpinner, ErrorBanner } from '../ui/index.jsx'
import ProgrammeCell from './ProgrammeCell.jsx'

function isToday(iso) {
  return iso === new Date().toISOString().slice(0, 10)
}

export default function ProgrammeGrid({
  weekStart,
  hotels,
  gigs,
  loading,
  error,
  onRefetch,
  onGigClick,
  gigArtists,
  showArtists,
  onAddGig,
}) {
  const navigate = useNavigate()
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // index gigs by hotelId + date
  const gigIndex = useMemo(() => {
    const idx = {}
    for (const g of gigs || []) {
      const key = `${g.hotel_id}__${g.gig_date}`
      if (!idx[key]) idx[key] = []
      idx[key].push(g)
    }
    return idx
  }, [gigs])

  // index artists by gig_id
  const artistIndex = useMemo(() => {
    const idx = {}
    for (const a of gigArtists || []) {
      if (!idx[a.gig_id]) idx[a.gig_id] = []
      idx[a.gig_id].push(a)
    }
    return idx
  }, [gigArtists])

  if (loading) return <LoadingSpinner message="Loading programme…" />
  if (error)   return <ErrorBanner message={error} onRetry={onRefetch} />

  if (!hotels?.length) {
    return <div className="empty-state">No hotels match your filter.</div>
  }

  return (
    <div
      className="weekly-scroll-wrap"
      style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', overflowX: 'auto' }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
        <thead>
          <tr>
            {/* hotel column header — sticky top-left */}
            <th style={{
              textAlign: 'left',
              padding: '8px 10px',
              background: 'var(--bg)',
              borderBottom: '2px solid var(--border-strong)',
              borderRight: '2px solid var(--border-strong)',
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 4,
              minWidth: 160,
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semi)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '2px 2px 0 var(--border)',
            }}>
              Hotel
            </th>

            {/* day columns — sticky top */}
            {weekDays.map(day => (
              <th
                key={day}
                style={{
                  padding: '8px 6px',
                  background: isToday(day) ? 'var(--brand-subtle)' : 'var(--bg)',
                  borderBottom: `2px solid ${isToday(day) ? 'var(--brand)' : 'var(--border-strong)'}`,
                  borderLeft: '1px solid var(--border)',
                  minWidth: 130,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semi)',
                  color: isToday(day) ? 'var(--brand)' : 'var(--text-secondary)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  top: 0,
                  zIndex: 3,
                  boxShadow: '0 2px 0 var(--border)',
                }}
              >
                {fmtDate(day)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hotels.map((hotel, i) => (
            <tr
              key={hotel.id}
              style={{
                background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg)',
                borderBottom: '2px solid var(--border)',
              }}
            >
              {/* hotel name — sticky left */}
              <td style={{
                padding: '8px 10px',
                fontWeight: 'var(--weight-medium)',
                fontSize: 'var(--text-sm)',
                borderRight: '2px solid var(--border-strong)',
                borderBottom: '2px solid var(--border)',
                position: 'sticky',
                left: 0,
                background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg)',
                zIndex: 1,
                whiteSpace: 'nowrap',
                boxShadow: '2px 0 0 var(--border)',
              }}>
                <div
                  onClick={() => navigate(`/hotels/detail?id=${hotel.id}`)}
                  style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 'var(--weight-medium)' }}
                >
                  {hotel.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-normal)' }}>
                  invoicing {hotel.billing_cycle}
                </div>
              </td>

              {/* day cells */}
              {weekDays.map(day => {
                const key  = `${hotel.id}__${day}`
                const cell = gigIndex[key] || []
                return (
                  <React.Fragment key={day}>
                    <ProgrammeCell
                      gigs={cell}
                      gigArtists={cell.map(g => artistIndex[g.gig_id] || []).flat()}
                      showArtists={showArtists}
                      onGigClick={onGigClick}
                      onAddGig={() => onAddGig(hotel.id, day)}
                    />
                  </React.Fragment>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
