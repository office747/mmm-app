/**
 * lib/n8n/invoices.js
 * N8n webhooks related to invoices.
 */

import { triggerWebhook } from './base.js'

/**
 * Build a normalised hotel object for the webhook payload.
 * Ensures all fields Entersoft needs are explicitly present.
 */
function buildHotelPayload(hotel) {
  const primary = hotel.hotel_contacts?.find(c => c.is_primary)
    || hotel.hotel_contacts?.[0]
    || {}
  return {
    id:            hotel.id,
    name:          hotel.name,
    legal_name:    hotel.legal_name    || null,
    vat_number:    hotel.vat_number    || null,
    billing_cycle: hotel.billing_cycle || null,
    primary_email: hotel.primary_email || primary.email || null,
    primary_name:  primary.name        || null,
    primary_phone: primary.phone       || null,
  }
}

/**
 * Build a normalised invoice object for the webhook payload.
 */
function buildInvoicePayload(invoice) {
  return {
    id:                   invoice.id,
    invoice_number:       invoice.invoice_number       || null,
    invoice_type:         invoice.invoice_type,
    corrects_invoice_id:  invoice.corrects_invoice_id  || null,
    period_start:         invoice.period_start,
    period_end:           invoice.period_end,
    subtotal:             invoice.subtotal,
    vat_rate:             invoice.vat_rate,
    vat_amount:           invoice.vat_amount,
    total:                invoice.total,
    status:               invoice.status,
    sent_to_email:        invoice.sent_to_email        || null,
  }
}

/**
 * Build normalised line items — includes vat_rate per line for Entersoft.
 */
function buildLineItems(lineItems, vatRate = 24) {
  return lineItems.map(l => ({
    date:        l.date,
    description: l.description,
    amount:      Number(l.amount),
    vat_rate:    vatRate,
    vat_amount:  Number((l.amount * vatRate / 100).toFixed(2)),
    total:       Number((l.amount * (1 + vatRate / 100)).toFixed(2)),
  }))
}

/**
 * Triggered when staff confirms an invoice for generation.
 * N8n flow: create Entersoft invoice → get PDF → save to Drive → email hotel.
 *
 * After completing, N8n should POST back to Supabase to update:
 *   invoices.entersoft_invoice_id
 *   invoices.drive_url
 *   invoices.invoice_number  (if Entersoft assigns it)
 *
 * @param {Object} p
 * @param {Object} p.invoice      — invoice record from Supabase
 * @param {Object} p.hotel        — full hotel record including hotel_contacts
 * @param {Array}  p.lineItems    — array of { date, description, amount }
 * @param {string} p.driveFolder  — target Drive folder path
 * @param {string} p.emailSubject — pre-filled subject line
 * @param {string} p.emailBody    — pre-filled email body
 */
export async function triggerInvoiceGeneration({ invoice, hotel, lineItems, driveFolder, emailSubject, emailBody }) {
  return triggerWebhook('invoice-generate', {
    invoice:       buildInvoicePayload(invoice),
    hotel:         buildHotelPayload(hotel),
    line_items:    buildLineItems(lineItems, invoice.vat_rate || 24),
    drive_folder:  driveFolder,
    email_subject: emailSubject,
    email_body:    emailBody,
    // N8n uses this to write back to the correct Supabase row
    callback: {
      supabase_table: 'invoices',
      supabase_id:    invoice.id,
      fields_to_update: ['entersoft_invoice_id', 'invoice_number', 'drive_url'],
    },
    triggered_at: new Date().toISOString(),
  })
}

/**
 * Triggered when a PTY (correction) invoice is confirmed.
 * N8n flow: create PTY in Entersoft referencing original → Drive → email hotel.
 *
 * @param {Object} p
 * @param {Object} p.invoice         — the PTY invoice record
 * @param {Object} p.originalInvoice — the invoice being corrected
 * @param {Object} p.hotel
 * @param {Array}  p.lineItems
 * @param {string} p.driveFolder
 * @param {string} p.emailSubject
 * @param {string} p.emailBody
 */
export async function triggerPtyGeneration({ invoice, originalInvoice, hotel, lineItems, driveFolder, emailSubject, emailBody }) {
  return triggerWebhook('invoice-pty', {
    invoice:          buildInvoicePayload(invoice),
    original_invoice: originalInvoice
      ? buildInvoicePayload(originalInvoice)
      : null,
    hotel:            buildHotelPayload(hotel),
    line_items:       buildLineItems(lineItems, invoice.vat_rate || 24),
    drive_folder:     driveFolder,
    email_subject:    emailSubject,
    email_body:       emailBody,
    callback: {
      supabase_table:   'invoices',
      supabase_id:      invoice.id,
      fields_to_update: ['entersoft_invoice_id', 'invoice_number', 'drive_url'],
    },
    triggered_at: new Date().toISOString(),
  })
}
