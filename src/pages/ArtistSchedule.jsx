import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSupabase } from '../hooks/useSupabase.js'
import { useQueryParams } from '../hooks/useQueryParams.js'
import { LoadingSpinner, ErrorBanner } from '../components/ui/index.jsx'
import MultiArtistGrid from '../components/artists/MultiArtistGrid.jsx'

function isoWeekStart() {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function ArtistSchedule() {
  const navigate  = useNavigate()
  const { params, setParam } = useQueryParams()

  const ids       = (params.get('ids') || '').split(',').filter(Boolean)
  const weekStart = params.get('week') || isoWeekStart()
  const weekEnd   = addDays(weekStart, 6)

  // ── fetch only the selected artists ─────────────────────
  const { data: artists, loading: artistsLoading, error: artistsError } = useSupabase(
    () => ids.length
      ? supabase.from('artists').select('id, full_name').in('id', ids).order('full_name')
      : Promise.resolve({ data: [], error: null }),
    [ids.join(',')]
  )

  // ── fetch all gigs for selected artists this week ────────
  const { data: gigs, loading: gigsLoading, error: gigsError, refetch } = useSupabase(
    () => ids.length
      ? supabase
          .from('artist_gig_detail')
          .select('*')
          .in('artist_id', ids)
          .gte('gig_date', weekStart)
          .lte('gig_date', weekEnd)
          .order('gig_date')
      : Promise.resolve({ data: [], error: null }),
    [ids.join(','), weekStart]
  )

  const loading = artistsLoading || gigsLoading
  const error   = artistsError || gigsError

  if (!ids.length) return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Artist Schedule</h1>
      </div>
      <div className="empty-state">No artists selected. Go to the artist list and select artists to compare.</div>
    </div>
  )

  return (
    <div className="page">
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/artists')}>
          ← All artists
        </button>
      </div>

      <div className="page-header">
        <h1 className="page-title">Weekly Schedule</h1>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {ids.length} artist{ids.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="week-nav">
        <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, -7))}>← Prev</button>
        <span className="week-nav-label">
          {new Date(weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(weekEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={() => setParam('week', addDays(weekStart, 7))}>Next →</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setParam('week', isoWeekStart())}>Today</button>
      </div>

      <MultiArtistGrid
        weekStart={weekStart}
        artists={artists || []}
        gigs={gigs || []}
        loading={loading}
        error={error}
        onRefetch={refetch}
      />
    </div>
  )
}
