'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NavKey } from '@/components/Sidebar'

const VALID_KEYS: NavKey[] = ['Pulse', 'Khata', 'Stock', 'Invoices', 'Reports', 'Settings']

function isValidNavKey(val: unknown): val is NavKey {
  return typeof val === 'string' && VALID_KEYS.includes(val as NavKey)
}

function getInitialKey(): NavKey {
  if (typeof window === 'undefined') return 'Pulse'
  const hash = window.location.hash.replace('#', '')
  if (isValidNavKey(hash)) return hash
  const urlParams = new URLSearchParams(window.location.search)
  const tab = urlParams.get('tab')
  if (isValidNavKey(tab)) return tab
  return 'Pulse'
}

export type NavDirection = 'back' | 'forward' | 'none'

/**
 * Headless Navigation Stack with:
 * 1. Default back navigation to 'Pulse' (the home/dashboard).
 * 2. Direction detection ('back' vs 'forward') for smooth contextual page transitions.
 * 3. Synchronization with native browser history (back/forward keys, swipe gestures, mouse buttons).
 */
export function useNavigationStack(defaultRoute: NavKey = 'Pulse') {
  const [active, setActiveState] = useState<NavKey>(() => getInitialKey() || defaultRoute)
  const [navDirection, setNavDirection] = useState<NavDirection>('none')
  const indexRef = useRef<number>(0)

  // Initialize browser history on mount, guaranteeing 'Pulse' is always the root back page
  useEffect(() => {
    const initial = getInitialKey() || defaultRoute
    if (typeof window !== 'undefined') {
      if (initial !== 'Pulse') {
        // Seed root as Pulse so browser back button returns to Pulse first
        window.history.replaceState({ key: 'Pulse', index: 0 }, '', '#Pulse')
        window.history.pushState({ key: initial, index: 1 }, '', `#${initial}`)
        indexRef.current = 1
      } else {
        window.history.replaceState({ key: 'Pulse', index: 0 }, '', '#Pulse')
        indexRef.current = 0
      }
    }
  }, [defaultRoute])

  // Navigate forward by pushing a new entry to the browser's native history stack
  const push = useCallback((key: NavKey) => {
    setActiveState(current => {
      if (current === key) return current

      const isReturningHome = key === 'Pulse'
      const nextIndex = isReturningHome ? Math.max(0, indexRef.current - 1) : indexRef.current + 1
      indexRef.current = nextIndex

      setNavDirection(isReturningHome ? 'back' : 'forward')

      if (typeof window !== 'undefined') {
        window.history.pushState({ key, index: nextIndex }, '', `#${key}`)
      }
      return key
    })
  }, [])

  // Replace current entry without adding to history
  const replace = useCallback((key: NavKey) => {
    setActiveState(key)
    setNavDirection('none')
    if (typeof window !== 'undefined') {
      window.history.replaceState({ key, index: indexRef.current }, '', `#${key}`)
    }
  }, [])

  // Programmatic back using native window.history
  const back = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [])

  const forward = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
  }, [])

  // Listen to native browser popstate (back button, forward button, swipe, browser shortcuts)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const stateKey = e.state?.key
      const stateIndex = e.state?.index
      const hashKey = window.location.hash.replace('#', '')

      // If state or hash is missing/empty, default to 'Pulse'
      const target: NavKey = isValidNavKey(stateKey)
        ? stateKey
        : isValidNavKey(hashKey)
        ? hashKey
        : 'Pulse'

      const isBack =
        typeof stateIndex === 'number'
          ? stateIndex < indexRef.current
          : target === 'Pulse'

      indexRef.current = typeof stateIndex === 'number' ? stateIndex : (target === 'Pulse' ? 0 : indexRef.current)
      setNavDirection(isBack ? 'back' : 'forward')
      setActiveState(target)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return {
    active,
    navDirection,
    push,
    replace,
    back,
    forward,
    setActive: push,
  }
}
