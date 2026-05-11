import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * useQueryParams — read and write URL search params
 *
 * @returns {{ params, setParam, setParams }}
 *
 * Usage:
 *   const { params, setParam } = useQueryParams()
 *   const artistId = params.get('id')
 *   setParam('tab', 'payroll')          // adds/updates one param
 *   setParams({ id: '123', tab: 'week' }) // sets multiple at once
 */
export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  // set a single param, preserve others
  const setParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === null || value === undefined) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      return next
    })
  }, [setSearchParams])

  // set multiple params at once, preserve others
  const setParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined) {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }
      return next
    })
  }, [setSearchParams])

  return { params: searchParams, setParam, setParams }
}
