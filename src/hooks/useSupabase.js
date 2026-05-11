import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useSupabase — data fetching hook
 *
 * @param {Function} queryFn   — a function that returns a Supabase query
 *                               e.g. () => supabase.from('artists').select('*')
 * @param {Array}    deps      — re-fetch when any of these change (like useEffect deps)
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSupabase(
 *     () => supabase.from('artists').select('*').eq('active', true),
 *     []
 *   )
 */
export function useSupabase(queryFn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // keep a stable ref to queryFn so we don't need it in the dep array
  const queryRef = useRef(queryFn)
  useEffect(() => { queryRef.current = queryFn })

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: sbError } = await queryRef.current()
      if (sbError) throw sbError
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
