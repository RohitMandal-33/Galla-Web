'use client'

import { useEffect, useState } from 'react'
import { getParties } from '@/lib/queries'
import type { Party } from '@/lib/types'

export function useInvoicesViewModel() {
  const [parties, setParties] = useState<Party[]>([])

  useEffect(() => { getParties().then(setParties) }, [])

  return { parties }
}