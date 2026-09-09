'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getDashboardKPIs, getRecentTransactions } from '@/lib/queries'
import type { Transaction } from '@/lib/types'

export function useDashboardViewModel(currency: string) {
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getDashboardKPIs>> | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [k, t] = await Promise.all([getDashboardKPIs(currency), getRecentTransactions(20)])
      setKpis(k)
      setTransactions(t)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [currency])

  useEffect(() => {
    load()

    // Realtime subscription for transactions
    const supabase = createClient()
    const sub = supabase
      .channel('transactions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => load())
      .subscribe()

    const handleDemoChange = () => { load() }
    window.addEventListener('galla-demo-data-changed', handleDemoChange)

    return () => {
      sub.unsubscribe()
      window.removeEventListener('galla-demo-data-changed', handleDemoChange)
    }
  }, [load])

  return { kpis, transactions, loading }
}