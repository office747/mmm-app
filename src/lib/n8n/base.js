/**
 * lib/n8n/base.js
 * Base webhook caller — all N8n triggers go through here.
 * Never import this directly in components — use the domain files.
 */

const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL

export async function triggerWebhook(path, payload) {
  const url = `${N8N_BASE}/${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`N8n webhook failed: ${res.status} ${res.statusText}`)
  return res.json().catch(() => null) // some webhooks return empty body
}
