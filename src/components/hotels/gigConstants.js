// shared across HotelGigs, HotelGigRow, HotelGigDetail
export { fmtDate } from '../../lib/dates.js'
export const STATUS_BG = {
  planned:   'var(--bg-hover)',
  confirmed: 'var(--blue-bg)',
  performed: 'var(--brand-subtle)',
  cancelled: 'var(--red-bg)',
}

export const STATUS_COLOR = {
  planned:   'var(--text-secondary)',
  confirmed: 'var(--blue)',
  performed: 'var(--brand)',
  cancelled: 'var(--red)',
}

export const STATUS_BORDER = {
  planned:   'var(--border-strong)',
  confirmed: 'var(--blue-border)',
  performed: 'var(--brand-subtle2)',
  cancelled: 'var(--red-border)',
}

export const SOURCE_BADGE = {
  contract:       'badge-brand',
  hotel_request:  'badge-amber',
  mmm_initiative: 'badge-neutral',
}

export const SOURCE_LABEL = {
  contract:       'Contract',
  hotel_request:  'Ad-hoc',
  mmm_initiative: 'MMM',
}
