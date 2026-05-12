import { useState, useCallback } from 'react'

/**
 * useCopyToClipboard
 * Returns { copy, copied } where copied is true for `timeout` ms after copying.
 *
 * Usage:
 *   const { copy, copied } = useCopyToClipboard()
 *   <button onClick={() => copy(artist.phone)}>
 *     {copied ? '✓' : 'Copy'}
 *   </button>
 */
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback for older browsers / non-https
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), timeout)
  }, [timeout])

  return { copy, copied }
}
