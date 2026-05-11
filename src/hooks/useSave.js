import { useState, useCallback } from 'react'

/**
 * useSave — mutation hook for insert / update / delete
 *
 * @param {Function} mutationFn  — async function that performs the Supabase write
 * @param {Object}   options
 *   @param {Function} options.onSuccess  — called with the result after a successful save
 *   @param {Function} options.onError    — called with the error if save fails
 *
 * @returns {{ save, saving, saveError, clearError }}
 *
 * Usage:
 *   const { save, saving, saveError } = useSave(
 *     async (values) => supabase.from('artists').upsert(values),
 *     { onSuccess: refetch }
 *   )
 *
 *   // in a handler:
 *   await save(formValues)
 */
export function useSave(mutationFn, { onSuccess, onError } = {}) {
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState(null)

  const save = useCallback(async (payload) => {
    setSaving(true)
    setSaveError(null)
    try {
      const { data, error } = await mutationFn(payload)
      if (error) throw error
      onSuccess?.(data)
      return { data, error: null }
    } catch (err) {
      const message = err.message || 'Changes were not saved. Please try again.'
      setSaveError(message)
      onError?.(err)
      return { data: null, error: message }
    } finally {
      setSaving(false)
    }
  }, [mutationFn, onSuccess, onError])

  const clearError = useCallback(() => setSaveError(null), [])

  return { save, saving, saveError, clearError }
}
