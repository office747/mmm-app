/**
 * lib/n8n/invoices.js
 * N8n webhooks related to invoices.
 */

import { triggerWebhook } from './base.js'

/**
 * Triggered when staff confirms an invoice for generation.
 * N8n flow: create Entersoft invoice → get PDF → save to Drive → email hotel.
 *
 * @param {Object} p
 * @param {Object} p.invoice      — invoice record (id, number, period, total, vat)
 * @param {Object} p.hotel        — hotel record (id, name, billing contact email)
 * @param {Array}  p.lineItems    — array of { date, description, amount }
 * @param {string} p.driveFolder  — target Drive folder path
 * @param {string} p.emailSubject — pre-filled subject line
 * @param {string} p.emailBody    — pre-filled email body
 */
export async function triggerInvoiceGeneration({ invoice, hotel, lineItems, driveFolder, emailSubject, emailBody }) {
  return triggerWebhook('invoice-generate', {
    invoice,
    hotel,
    line_items:    lineItems,
    drive_folder:  driveFolder,
    email_subject: emailSubject,
    email_body:    emailBody,
    triggered_at:  new Date().toISOString(),
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
 */
export async function triggerPtyGeneration({ invoice, originalInvoice, hotel, lineItems }) {
  return triggerWebhook('invoice-pty', {
    invoice,
    original_invoice: originalInvoice,
    hotel,
    line_items:   lineItems,
    triggered_at: new Date().toISOString(),
  })
}
