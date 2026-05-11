import { useState, useCallback, useRef } from 'react'

export function useSave(mutationFn, { onSuccess, onError } = {}) {
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState(null)

  // keep refs so useCallback never needs to re-create
  const mutationRef  = useRef(mutationFn)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef   = useRef(onError)
  mutationRef.current  = mutationFn
  onSuccessRef.current = onSuccess
  onErrorRef.current   = onError

  const save = useCallback(async (payload) => {
    setSaving(true)
    setSaveError(null)
    try {
      const { data, error } = await mutationRef.current(payload)
      if (error) throw error
      onSuccessRef.current?.(data)
      return { data, error: null }
    } catch (err) {
      const message = err.message || 'Changes were not saved. Please try again.'
      setSaveError(message)
      onErrorRef.current?.(err)
      return { data: null, error: message }
    } finally {
      setSaving(false)
    }
  }, []) // stable forever — reads latest fn via refs

  const clearError = useCallback(() => setSaveError(null), [])

  return { save, saving, saveError, clearError }
}
