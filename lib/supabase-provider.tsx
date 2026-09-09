'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from './supabase'
import { DEMO_USER, disableDemoMode, isDemoMode } from './demo'

interface SupabaseContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  isDemo: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextValue>({
  session: null,
  user: null,
  loading: true,
  isDemo: false,
  signOut: async () => {},
})

const MOCK_SESSION: Session = {
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'demo-refresh-token',
  user: DEMO_USER as unknown as User,
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (isDemoMode()) {
      setIsDemo(true)
      setSession(MOCK_SESSION)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemoMode()) {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    if (isDemoMode() || isDemo) {
      disableDemoMode()
      setIsDemo(false)
      setSession(null)
      window.location.href = '/auth'
      return
    }
    await supabase.auth.signOut()
    setSession(null)
  }, [supabase, isDemo])

  return (
    <SupabaseContext.Provider value={{ session, user: session?.user ?? null, loading, isDemo, signOut }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => useContext(SupabaseContext)
