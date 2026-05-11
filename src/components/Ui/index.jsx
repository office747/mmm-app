/**
 * Shared UI primitives
 * LoadingSpinner, ErrorBanner, SaveToast, SaveError
 */

// ── Loading spinner ───────────────────────────────────────────
export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={styles.spinnerWrap}>
      <div style={styles.spinner} />
      <span style={styles.spinnerText}>{message}</span>
    </div>
  )
}

// ── Full-page fetch error ─────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={styles.errorBanner}>
      <span>⚠ {message}</span>
      {onRetry && (
        <button style={styles.retryBtn} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

// ── Inline save error (inside form/modal) ────────────────────
export function SaveError({ message, onDismiss }) {
  if (!message) return null
  return (
    <div style={styles.saveError}>
      <span>✕ {message}</span>
      {onDismiss && (
        <button style={styles.dismissBtn} onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  )
}

// ── Success toast (auto-dismisses via parent timeout) ────────
export function SaveToast({ message = 'Saved' }) {
  return (
    <div style={styles.toast}>
      ✓ {message}
    </div>
  )
}

// ── useSaveToast helper — use this in pages ───────────────────
// returns { showToast, toastVisible }
// call showToast() after a successful save
import { useState, useCallback } from 'react'

export function useSaveToast(duration = 3000) {
  const [visible, setVisible] = useState(false)

  const show = useCallback(() => {
    setVisible(true)
    setTimeout(() => setVisible(false), duration)
  }, [duration])

  return { showToast: show, toastVisible: visible }
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '40px 20px',
    color: '#666',
    fontSize: 14,
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid #ddd',
    borderTopColor: '#1a1a2e',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  spinnerText: {
    color: '#666',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: 4,
    padding: '10px 14px',
    fontSize: 13,
    color: '#856404',
    margin: '12px 0',
  },
  retryBtn: {
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid #856404',
    borderRadius: 3,
    padding: '3px 10px',
    fontSize: 12,
    color: '#856404',
  },
  saveError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 13,
    color: '#721c24',
    margin: '8px 0',
  },
  dismissBtn: {
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    fontSize: 12,
    color: '#721c24',
    textDecoration: 'underline',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#1a1a2e',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
}

// inject keyframes once
if (typeof document !== 'undefined') {
  const id = 'mmm-spinner-keyframes'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
    document.head.appendChild(style)
  }
}
