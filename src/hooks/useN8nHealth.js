import { useState, useEffect, useCallback } from 'react'

const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL

/**
 * useN8nHealth
 * Polls the N8n base URL every `interval` ms.
 * Uses cors mode so we get the actual HTTP status — 530 (Cloudflare tunnel down),
 * 502/503, or network error all count as offline.
 */
export function useN8nHealth(interval = 60_000) {
  const [status, setStatus] = useState('checking')

  const check = useCallback(async () => {
    if (!N8N_BASE) { setStatus('offline'); return }
    try {
      const base = N8N_BASE.replace(/\/+$/, '').replace(/\/webhook.*$/, '')
      const res = await fetch(`${base}/webhook/g1gs/healthcheck`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      setStatus(res.ok ? 'online' : 'offline')
    } catch {
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, interval)
    return () => clearInterval(id)
  }, [check, interval])

  return status
}
