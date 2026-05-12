/**
 * lib/n8n/notifications.js
 * N8n webhooks for artist notifications.
 */

import { triggerWebhook } from './base.js'

function buildArtistGigPayload(artist, gig) {
  return {
    artist: {
      id:    artist.artist_id,
      name:  artist.artist_name,
      email: artist.artist_email || null,
      phone: artist.artist_phone || null,
    },
    gig: gig ? {
      date:             gig.gig_date,
      start_time:       gig.start_time || null,
      hotel_name:       gig.hotel_name,
      hotel_id:         gig.hotel_id,
      performance_type: gig.performance_type || null,
    } : null,
    triggered_at: new Date().toISOString(),
  }
}

/**
 * Send SMS notification to an artist about a gig.
 * N8n flow: receive payload → send SMS via provider → log result.
 */
export async function notifyArtistSms(artist, gig, message) {
  return triggerWebhook('notify-artist-sms', { ...buildArtistGigPayload(artist, gig), message: message || null })
}

/**
 * Send email notification to an artist about a gig.
 * N8n flow: receive payload → send email → log result.
 */
export async function notifyArtistEmail(artist, gig, message) {
  return triggerWebhook('notify-artist-email', { ...buildArtistGigPayload(artist, gig), message: message || null })
}
