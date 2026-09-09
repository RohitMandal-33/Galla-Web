'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getBusiness } from '@/lib/queries'
import type { Business } from '@/lib/types'

export function useBusinessViewModel(user: User | null) {
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    getBusiness().then(setBusiness).catch(console.error)

    const handleDemoChange = () => {
      getBusiness().then(setBusiness).catch(console.error)
    }
    window.addEventListener('galla-demo-data-changed', handleDemoChange)
    return () => { window.removeEventListener('galla-demo-data-changed', handleDemoChange) }
  }, [user])

  return { business, setBusiness }
}