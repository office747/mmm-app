/**
 * lib/n8n/hotels.js
 * N8n webhooks related to hotels.
 */

import { triggerWebhook } from './base.js'

/**
 * Triggered when a hotel is created or updated.
 * N8n flow: sync to HubSpot company record.
 *
 * @param {Object} hotel
 * @param {'created'|'updated'} action
 */
export async function syncHotelToHubspot(hotel, action) {
  return triggerWebhook('hotel-sync', {
    action,
    hotel: {
      id:            hotel.id,
      name:          hotel.name,
      legal_name:    hotel.legal_name  || null,
      billing_cycle: hotel.billing_cycle,
      active:        hotel.active,
    },
    triggered_at: new Date().toISOString(),
  })
}
