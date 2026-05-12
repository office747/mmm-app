/**
 * lib/dates.js
 * Shared date helpers — import from here throughout the app.
 */

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday
 * of the current week, offset by `offsetWeeks`.
 */
export function isoWeekStart(offsetWeeks = 0) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offsetWeeks * 7)
  return d.toISOString().slice(0, 10)
}

/**
 * Adds `n` days to an ISO date string and returns the result.
 */
export function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Returns YYYY-MM for the current month, offset by `offsetMonths`.
 */
export function currentMonth(offsetMonths = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toISOString().slice(0, 7)
}

/**
 * Shifts a YYYY-MM string by `offsetMonths` and returns the new YYYY-MM.
 */
export function monthOf(ym, offsetMonths) {
  const d = new Date(ym + '-01')
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toISOString().slice(0, 7)
}

/**
 * Returns { start, end } ISO date strings for a given YYYY-MM.
 */
export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  return {
    start: `${ym}-01`,
    end:   new Date(y, m, 0).toISOString().slice(0, 10),
  }
}

/**
 * Formats an ISO date as "Mon 1 Sep" style.
 */
export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

/**
 * Formats an ISO date as "1 Sep – 7 Sep 2025" week label.
 */
export function fmtWeekLabel(weekStart) {
  const end = addDays(weekStart, 6)
  return `${new Date(weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

/**
 * Formats a YYYY-MM string as "September 2025".
 */
export function fmtMonthLabel(ym) {
  return new Date(ym + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/**
 * Formats an ISO date as "1 Sep 2025" (no weekday).
 */
export function fmtDateLong(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// alias — some files may use monthStart instead of currentMonth
export const monthStart = currentMonth
