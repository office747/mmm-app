/**
 * lib/n8n/artists.js
 * N8n webhooks related to artists.
 */

import { triggerWebhook } from './base.js'

/**
 * Triggered when an artist is created or updated.
 * N8n flow: receive artist → find/create HubSpot contact → update custom fields.
 *
 * @param {Object} artist          — full artist record from Supabase
 * @param {'created'|'updated'} action
 */
export async function syncArtistToHubspot(artist, action) {
  return triggerWebhook('artist-sync', {
    action,
    artist: {
      id:        artist.id,
      full_name: artist.full_name,
      email:     artist.email || null,
      phone:     artist.phone || null,
      active:    artist.active,
    },
    triggered_at: new Date().toISOString(),
  })
}
