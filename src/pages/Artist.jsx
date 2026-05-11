import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import { useQueryParams } from '../hooks/useQueryParams'
import { useSave } from '../hooks/useSave'
import { useSaveToast, LoadingSpinner, ErrorBanner, SaveError, SaveToast } from '../components/Ui/index.jsx'

// ── helpers ───────────────────────────────────────────────────
function isoWeekStart(offsetWeeks = 0) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offsetWeeks * 7)
  return d.toISOString().slice(0, 10)
}

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

function fmtMonth(iso) {
  return new Date(iso + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function monthStart(offset = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7) // YYYY-MM
}

const TRANSPORT_LABEL = { gas_a: 'Gas A €10', gas_b: 'Gas B €20', none: '—' }

// ── main component ────────────────────────────────────────────

export default function Artist() {
  const { params, setParam, setParams } = useQueryParams()
  const { showToast, toastVisible } = useSaveToast()

  const artistId   = params.get('id')
  const activeTab  = params.get('tab') || 'week'
  const weekStart  = params.get('week') || isoWeekStart()
  const month      = params.get('month') || monthStart()

  const weekEnd = addDays(weekStart, 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // ── fetch artists list ──────────────────────────────────────
  const { data: artists, loading: artistsLoading, error: artistsError } = useSupabase(
    () => supabase.from('artists').select('id, full_name').eq('active', true).order('full_name'),
    []
  )

  // ── fetch selected artist detail ────────────────────────────
  const { data: artistData, loading: artistLoading, error: artistError } = useSupabase(
    () => artistId
      ? supabase.from('artists').select('*').eq('id', artistId).single()
      : Promise.resolve({ data: null, error: null }),
    [artistId]
  )

  // ── fetch gigs for weekly view ───────────────────────────────
  const { data: weekGigs, loading: weekLoading, error: weekError, refetch: refetchWeek } = useSupabase(
    () => artistId
      ? supabase
          .from('artist_gig_detail')
          .select('*')
          .eq('artist_id', artistId)
          .gte('gig_date', weekStart)
          .lte('gig_date', weekEnd)
          .order('gig_date')
      : Promise.resolve({ data: [], error: null }),
    [artistId, weekStart]
  )

  // ── fetch gigs for monthly payroll ──────────────────────────
  const { data: monthGigs, loading: monthLoading, error: monthError, refetch: refetchMonth } = useSupabase(
    () => artistId
      ? supabase
          .from('artist_gig_detail')
          .select('*')
          .eq('artist_id', artistId)
          .gte('gig_date', month + '-01')
          .lte('gig_date', month + '-31')
          .order('gig_date')
      : Promise.resolve({ data: [], error: null }),
    [artistId, month]
  )

  // ── mutation: toggle insurance_issued ───────────────────────
  const { save: toggleInsurance, saving: toggling, saveError: toggleError, clearError } = useSave(
    async ({ gigArtistId, value }) => supabase
      .from('gig_artists')
      .update({ insurance_issued: value })
      .eq('id', gigArtistId),
    {
      onSuccess: () => {
        refetchWeek()
        refetchMonth()
        showToast()
      }
    }
  )

  // ── weekly gigs indexed by date ──────────────────────────────
  const gigsByDay = useMemo(() => {
    const map = {}
    for (const g of weekGigs || []) {
      if (!map[g.gig_date]) map[g.gig_date] = []
      map[g.gig_date].push(g)
    }
    return map
  }, [weekGigs])

  // ── monthly totals ───────────────────────────────────────────
  const monthTotals = useMemo(() => {
    if (!monthGigs) return { fees: 0, transport: 0, gross: 0 }
    return monthGigs.reduce((acc, g) => ({
      fees:      acc.fees + Number(g.fee),
      transport: acc.transport + Number(g.transport_amount),
      gross:     acc.gross + Number(g.total_earned),
    }), { fees: 0, transport: 0, gross: 0 })
  }, [monthGigs])

  // ── render ───────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Artists</h1>
      </div>

      {/* ── artist selector ── */}
      <div style={s.filters}>
        <label style={s.label}>Artist</label>
        {artistsLoading ? (
          <span style={s.muted}>Loading…</span>
        ) : artistsError ? (
          <span style={s.errorText}>Could not load artists</span>
        ) : (
          <select
            style={s.select}
            value={artistId || ''}
            onChange={e => setParams({ id: e.target.value, tab: 'week', week: isoWeekStart(), month: monthStart() })}
          >
            <option value="">— select artist —</option>
            {(artists || []).map(a => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── no artist selected ── */}
      {!artistId && (
        <div style={s.empty}>Select an artist to view their schedule and payroll.</div>
      )}

      {/* ── artist selected ── */}
      {artistId && (
        <>
          {/* artist info bar */}
          {artistLoading ? <LoadingSpinner /> : artistError ? (
            <ErrorBanner message={artistError} />
          ) : artistData && (
            <div style={s.infoBar}>
              <div>
                <div style={s.artistName}>{artistData.full_name}</div>
                <div style={s.artistSub}>
                  Insurance type: <strong>{artistData.insurance_type}</strong>
                  {artistData.phone && <> &nbsp;·&nbsp; {artistData.phone}</>}
                  {artistData.email && <> &nbsp;·&nbsp; {artistData.email}</>}
                </div>
              </div>
            </div>
          )}

          {/* tabs */}
          <div style={s.tabs}>
            {[['week', 'Weekly Schedule'], ['payroll', 'Monthly Payroll']].map(([key, label]) => (
              <button
                key={key}
                style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }}
                onClick={() => setParam('tab', key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── weekly schedule tab ── */}
          {activeTab === 'week' && (
            <div>
              <div style={s.weekNav}>
                <button style={s.btn} onClick={() => setParam('week', addDays(weekStart, -7))}>← Prev</button>
                <span style={s.weekLabel}>
                  {fmtDate(weekStart)} – {fmtDate(weekEnd)}
                </span>
                <button style={s.btn} onClick={() => setParam('week', addDays(weekStart, 7))}>Next →</button>
                <button style={{ ...s.btn, marginLeft: 8 }} onClick={() => setParam('week', isoWeekStart())}>Today</button>
              </div>

              {weekLoading ? <LoadingSpinner message="Loading schedule…" /> :
               weekError   ? <ErrorBanner message={weekError} onRetry={refetchWeek} /> : (
                <>
                  <SaveError message={toggleError} onDismiss={clearError} />
                  <div style={s.weekGrid}>
                    {weekDays.map(day => {
                      const gigs = gigsByDay[day] || []
                      return (
                        <div key={day} style={s.dayCol}>
                          <div style={s.dayHeader}>{fmtDate(day)}</div>
                          {gigs.length === 0 ? (
                            <div style={s.emptyDay}>—</div>
                          ) : gigs.map(g => (
                            <div key={g.gig_artist_id} style={s.gigCard}>
                              <div style={s.gigHotel}>{g.hotel_name}</div>
                              <div style={s.gigType}>{g.performance_type || '—'}</div>
                              <div style={s.gigFee}>Fee: <strong>€{Number(g.fee).toFixed(2)}</strong></div>
                              {Number(g.transport_amount) > 0 && (
                                <div style={s.gigTransport}>Transport: €{Number(g.transport_amount).toFixed(2)}</div>
                              )}
                              <div style={s.gigTotal}>Total: <strong>€{Number(g.total_earned).toFixed(2)}</strong></div>
                              <div style={s.gigFlags}>
                                <label style={s.flagLabel}>
                                  <input
                                    type="checkbox"
                                    checked={g.insurance_issued}
                                    disabled={toggling}
                                    onChange={e => toggleInsurance({ gigArtistId: g.gig_artist_id, value: e.target.checked })}
                                  />
                                  {' '}Insurance {g.insurance_issued ? '✓' : '⚠'}
                                </label>
                              </div>
                              {g.gig_status === 'cancelled' && (
                                <div style={s.cancelledBadge}>Cancelled</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* week summary */}
                  {weekGigs && weekGigs.length > 0 && (
                    <div style={s.weekSummary}>
                      Week total: &nbsp;
                      <strong>€{weekGigs.reduce((s, g) => s + Number(g.fee), 0).toFixed(2)}</strong> fees
                      {weekGigs.some(g => g.transport_amount > 0) && (
                        <> + <strong>€{weekGigs.reduce((s, g) => s + Number(g.transport_amount), 0).toFixed(2)}</strong> transport</>
                      )}
                      &nbsp;= <strong>€{weekGigs.reduce((s, g) => s + Number(g.total_earned), 0).toFixed(2)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── monthly payroll tab ── */}
          {activeTab === 'payroll' && (
            <div>
              <div style={s.weekNav}>
                <button style={s.btn} onClick={() => setParam('month', monthStart(
                  (new Date(month + '-01') - new Date(monthStart())) / (1000 * 60 * 60 * 24 * 30) - 1
                ))}>← Prev</button>
                <span style={s.weekLabel}>{fmtMonth(month)}</span>
                <button style={s.btn} onClick={() => setParam('month', monthStart(
                  (new Date(month + '-01') - new Date(monthStart())) / (1000 * 60 * 60 * 24 * 30) + 1
                ))}>Next →</button>
                <button style={{ ...s.btn, marginLeft: 8 }} onClick={() => setParam('month', monthStart())}>This month</button>
              </div>

              {monthLoading ? <LoadingSpinner message="Loading payroll…" /> :
               monthError   ? <ErrorBanner message={monthError} onRetry={refetchMonth} /> : (
                <>
                  <SaveError message={toggleError} onDismiss={clearError} />

                  {(!monthGigs || monthGigs.length === 0) ? (
                    <div style={s.empty}>No gigs recorded for {fmtMonth(month)}.</div>
                  ) : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          {['Date','Hotel','Performance','Role','Fee','Transport','Total','Insurance'].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthGigs.map(g => (
                          <tr key={g.gig_artist_id} style={g.gig_status === 'cancelled' ? s.cancelledRow : {}}>
                            <td style={s.td}>{fmtDate(g.gig_date)}</td>
                            <td style={s.td}>{g.hotel_name}</td>
                            <td style={s.td}>{g.performance_type || '—'}</td>
                            <td style={s.td}>{g.role || '—'}</td>
                            <td style={s.td}>€{Number(g.fee).toFixed(2)}</td>
                            <td style={s.td}>
                              {Number(g.transport_amount) > 0 ? `€${Number(g.transport_amount).toFixed(2)}` : '—'}
                            </td>
                            <td style={{ ...s.td, fontWeight: 600 }}>€{Number(g.total_earned).toFixed(2)}</td>
                            <td style={s.td}>
                              <label style={s.flagLabel}>
                                <input
                                  type="checkbox"
                                  checked={g.insurance_issued}
                                  disabled={toggling}
                                  onChange={e => toggleInsurance({ gigArtistId: g.gig_artist_id, value: e.target.checked })}
                                />
                                {' '}{g.insurance_issued ? '✓' : '⚠'}
                              </label>
                            </td>
                          </tr>
                        ))}
                        {/* totals row */}
                        <tr style={s.totalsRow}>
                          <td style={s.td} colSpan={4}><strong>{fmtMonth(month)} total — {monthGigs.length} gigs</strong></td>
                          <td style={s.td}><strong>€{monthTotals.fees.toFixed(2)}</strong></td>
                          <td style={s.td}><strong>€{monthTotals.transport.toFixed(2)}</strong></td>
                          <td style={s.td}><strong>€{monthTotals.gross.toFixed(2)}</strong></td>
                          <td style={s.td} />
                        </tr>
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {toastVisible && <SaveToast message="Saved" />}
    </div>
  )
}

// ── styles ────────────────────────────────────────────────────
const s = {
  page:          { padding: 20, maxWidth: 1200, margin: '0 auto' },
  header:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  h1:            { fontSize: 18, fontWeight: 700 },
  filters:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  label:         { fontSize: 13, color: '#444' },
  select:        { padding: '5px 8px', border: '1px solid #ccc', borderRadius: 3, fontSize: 13 },
  muted:         { fontSize: 13, color: '#888' },
  errorText:     { fontSize: 13, color: '#c0392b' },
  empty:         { padding: '40px 0', color: '#888', fontSize: 14 },
  infoBar:       { background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '12px 16px', marginBottom: 16 },
  artistName:    { fontWeight: 700, fontSize: 15 },
  artistSub:     { fontSize: 12, color: '#666', marginTop: 3 },
  tabs:          { display: 'flex', borderBottom: '2px solid #ddd', marginBottom: 16 },
  tab:           { padding: '8px 18px', cursor: 'pointer', fontSize: 13, color: '#666', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive:     { color: '#1a1a2e', borderBottomColor: '#1a1a2e', fontWeight: 600 },
  weekNav:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  weekLabel:     { fontWeight: 600, fontSize: 14 },
  btn:           { cursor: 'pointer', border: '1px solid #ccc', background: '#fff', padding: '5px 12px', borderRadius: 3, fontSize: 13 },
  weekGrid:      { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, overflowX: 'auto' },
  dayCol:        { minWidth: 130 },
  dayHeader:     { fontWeight: 600, fontSize: 12, padding: '5px 0', borderBottom: '2px solid #ddd', marginBottom: 6, color: '#333' },
  emptyDay:      { color: '#ccc', fontSize: 12, textAlign: 'center', padding: '10px 0' },
  gigCard:       { background: '#f0f4ff', border: '1px solid #c5cff5', borderRadius: 3, padding: '6px 8px', marginBottom: 6, fontSize: 12 },
  gigHotel:      { fontWeight: 700, marginBottom: 2 },
  gigType:       { color: '#555', marginBottom: 2 },
  gigFee:        { marginBottom: 1 },
  gigTransport:  { color: '#666', marginBottom: 1 },
  gigTotal:      { marginBottom: 4 },
  gigFlags:      { marginTop: 4, paddingTop: 4, borderTop: '1px solid #dde' },
  flagLabel:     { fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 },
  cancelledBadge:{ background: '#f8d7da', color: '#721c24', borderRadius: 3, padding: '1px 5px', fontSize: 10, marginTop: 3, display: 'inline-block' },
  weekSummary:   { marginTop: 12, padding: '10px 14px', background: '#fff', border: '1px solid #ddd', borderRadius: 3, fontSize: 13 },
  table:         { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 13 },
  th:            { background: '#eee', textAlign: 'left', padding: '7px 10px', fontSize: 12, fontWeight: 600, borderBottom: '2px solid #ddd' },
  td:            { padding: '7px 10px', borderBottom: '1px solid #eee', verticalAlign: 'top' },
  totalsRow:     { background: '#f0f4ff' },
  cancelledRow:  { opacity: 0.5, textDecoration: 'line-through' },
}
