'use client'

import { useEffect, useState } from 'react'
import { addTransaction } from '@/lib/queries'
import type { TxnDirection } from '@/lib/types'

export function useQuickAddViewModel(currency: string, onSaved: () => void, close: () => void) {
  const [direction, setDirection] = useState<TxnDirection>('money_in')
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('Sales')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAmountStrAndClearError = (v: string) => {
    setAmountStr(v)
    setError(null)
  }

  const save = async () => {
    const amount = parseFloat(amountStr)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    try {
      await addTransaction({
        direction,
        amount_minor: Math.round(amount * 100),
        note: note || undefined,
        category,
      })
      onSaved()
      close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape, save on Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Enter' && !saving) save()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [amountStr, note, category, direction, saving]) // eslint-disable-line react-hooks/exhaustive-deps

  return { direction, setDirection, amountStr, setAmountStr: setAmountStrAndClearError, note, setNote, category, setCategory, saving, error, save }
}