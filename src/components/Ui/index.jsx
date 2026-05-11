import { useState, useCallback } from 'react'

export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="banner banner-error">
      <span>⚠ {message}</span>
      {onRetry && (
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function SaveError({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="banner banner-error">
      <span>✕ {message}</span>
      {onDismiss && (
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  )
}

export function SaveToast({ message = 'Saved' }) {
  return <div className="toast">✓ {message}</div>
}

export function useSaveToast(duration = 3000) {
  const [visible, setVisible] = useState(false)
  const show = useCallback(() => {
    setVisible(true)
    setTimeout(() => setVisible(false), duration)
  }, [duration])
  return { showToast: show, toastVisible: visible }
}
