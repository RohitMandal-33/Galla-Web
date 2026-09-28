'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'galla_theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  // Initialize theme from localStorage or system on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
      const initialTheme: Theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
      setThemeState(initialTheme)

      const system = getSystemTheme()
      const resolved = initialTheme === 'system' ? system : initialTheme
      setResolvedTheme(resolved)
      applyTheme(resolved)
    } catch {
      // localStorage may fail in restricted/private contexts
    }
    setMounted(true)
  }, [])

  // Listen for system theme changes when theme === 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        const nextResolved = media.matches ? 'dark' : 'light'
        setResolvedTheme(nextResolved)
        applyTheme(nextResolved)
      }
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  const applyTheme = (resolved: ResolvedTheme) => {
    const root = document.documentElement
    if (resolved === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      root.style.colorScheme = 'light'
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0d1310' : '#f5f2ed')
    }
  }

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {}

    const resolved = nextTheme === 'system' ? getSystemTheme() : nextTheme
    startTransition(() => {
      setResolvedTheme(resolved)
      applyTheme(resolved)
    })
  }

  const toggleTheme = () => {
    const nextResolved: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextResolved)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: mounted ? resolvedTheme : 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
