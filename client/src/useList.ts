import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export function useList<T>(load: () => Promise<T[]>, deps: DependencyList = []) {
  const [items, setItems] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)
  // Only the latest request may update state, so a slow response for an old dep value is dropped.
  const latest = useRef(0)

  const reload = useCallback(() => {
    const request = ++latest.current
    load()
      .then((data) => {
        if (request !== latest.current) return
        setItems(data)
        setError(null)
      })
      .catch((e: Error) => {
        if (request === latest.current) setError(e.message)
      })
    // The caller declares load's deps, so they can't be checked statically here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(reload, [reload])

  return { items, error, reload }
}
