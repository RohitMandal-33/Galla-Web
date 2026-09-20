'use client'

import { useCallback, useEffect, useState } from 'react'
import { getReportData, type ReportData } from '@/lib/queries'

export type ReportPeriod = 'today' | '7d' | '30d' | 'month'

function periodDates(period: ReportPeriod): { start: Date; end: Date; label: string } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  switch (period) {
    case 'today': {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Today' }
    }
    case '7d': {
      const start = new Date()
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 7 days' }
    }
    case 'month': {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'This month' }
    }
    case '30d':
    default: {
      const start = new Date()
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 30 days' }
    }
  }
}

export function useReportsViewModel() {
  const [period, setPeriod] = useState<ReportPeriod>('30d')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { start, end } = periodDates(period)
      const report = await getReportData(start, end)
      setData(report)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
    const handleSync = () => load()
    window.addEventListener('galla-sync', handleSync)
    window.addEventListener('galla-demo-data-changed', handleSync)
    return () => {
      window.removeEventListener('galla-sync', handleSync)
      window.removeEventListener('galla-demo-data-changed', handleSync)
    }
  }, [load])

  const { label } = periodDates(period)

  return { period, setPeriod, data, loading, periodLabel: label }
}
