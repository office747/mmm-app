const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL

export async function triggerInvoice(payload) {
    const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`N8n webhook failed: ${res.status}`)
    return res.json()
}