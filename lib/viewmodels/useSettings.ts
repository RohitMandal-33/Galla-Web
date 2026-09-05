'use client'

import { useEffect, useState } from 'react'
import { updateBusiness } from '@/lib/queries'
import type { Business } from '@/lib/types'

export function useSettingsViewModel(
  business: Business | null,
  onBusinessUpdate?: (b: Business) => void
) {
  const [name, setName] = useState(business?.name ?? '')
  const [currency, setCurrency] = useState(business?.currency ?? 'NPR')
  const [taxRate, setTaxRate] = useState(String(business?.tax_rate_pct ?? 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(business?.name ?? '')
    setCurrency(business?.currency ?? 'NPR')
    setTaxRate(String(business?.tax_rate_pct ?? 0))
  }, [business])

  const save = async () => {
    setSaving(true)
    try {
      await updateBusiness({ name, currency, tax_rate_pct: parseFloat(taxRate) || 0 })
      // Optimistic update
      if (business) onBusinessUpdate?.({ ...business, name, currency, tax_rate_pct: parseFloat(taxRate) || 0 })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return { name, setName, currency, setCurrency, taxRate, setTaxRate, saving, saved, save }
}