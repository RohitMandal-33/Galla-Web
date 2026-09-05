'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getBusiness } from '@/lib/queries'
import type { Business } from '@/lib/types'

export function useBusinessViewModel(user: User | null) {
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    if (!user) return
    getBusiness().then(setBusiness).catch(console.error)
  }, [user])

  return { business, setBusiness }
}