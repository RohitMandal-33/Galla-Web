'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createBranch,
  createStaffMember,
  getBranches,
  getStaffMembers,
  updateBusiness,
} from '@/lib/queries'
import type { Branch, Business, StaffMember } from '@/lib/types'

export function useSettingsViewModel(
  business: Business | null,
  onBusinessUpdate?: (b: Business) => void
) {
  const [name, setName] = useState(business?.name ?? '')
  const [currency, setCurrency] = useState(business?.currency ?? 'NPR')
  const [taxRate, setTaxRate] = useState(String(business?.tax_rate_pct ?? 0))
  const [locale, setLocale] = useState(business?.locale ?? 'ne')
  const [lowCashThreshold, setLowCashThreshold] = useState(
    String(Math.round((business?.low_cash_threshold_minor ?? 500000) / 100))
  )
  const [notifyPaymentDue, setNotifyPaymentDue] = useState(
    business?.notify_payment_due ?? true
  )
  const [notifyLowCash, setNotifyLowCash] = useState(
    business?.notify_low_cash ?? true
  )
  const [notifyLowStock, setNotifyLowStock] = useState(
    business?.notify_low_stock ?? true
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Branches & Staff
  const [branches, setBranches] = useState<Branch[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loadingExtras, setLoadingExtras] = useState(false)

  const loadExtras = useCallback(async () => {
    setLoadingExtras(true)
    try {
      const [bList, sList] = await Promise.all([getBranches(), getStaffMembers()])
      setBranches(bList)
      setStaff(sList)
    } finally {
      setLoadingExtras(false)
    }
  }, [])

  useEffect(() => {
    setName(business?.name ?? '')
    setCurrency(business?.currency ?? 'NPR')
    setTaxRate(String(business?.tax_rate_pct ?? 0))
    setLocale(business?.locale ?? 'ne')
    setLowCashThreshold(
      String(Math.round((business?.low_cash_threshold_minor ?? 500000) / 100))
    )
    setNotifyPaymentDue(business?.notify_payment_due ?? true)
    setNotifyLowCash(business?.notify_low_cash ?? true)
    setNotifyLowStock(business?.notify_low_stock ?? true)
  }, [business])

  useEffect(() => {
    loadExtras()

    const handleSync = () => {
      loadExtras()
    }
    window.addEventListener('galla-sync', handleSync)
    window.addEventListener('galla-demo-data-changed', handleSync)
    return () => {
      window.removeEventListener('galla-sync', handleSync)
      window.removeEventListener('galla-demo-data-changed', handleSync)
    }
  }, [loadExtras])

  const save = async () => {
    setSaving(true)
    try {
      const thresholdMinor = Math.round((parseFloat(lowCashThreshold) || 0) * 100)
      const updates = {
        name,
        currency,
        tax_rate_pct: parseFloat(taxRate) || 0,
        locale,
        low_cash_threshold_minor: thresholdMinor,
        notify_payment_due: notifyPaymentDue,
        notify_low_cash: notifyLowCash,
        notify_low_stock: notifyLowStock,
      }

      await updateBusiness(updates)

      if (business) {
        onBusinessUpdate?.({
          ...business,
          ...updates,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const addBranch = async (entry: { name: string; address?: string | null; phone?: string | null }) => {
    const newBranch = await createBranch(entry)
    setBranches(prev => [...prev, newBranch])
    return newBranch
  }

  const addStaff = async (entry: { name: string; phone?: string | null; role?: 'owner' | 'manager' | 'staff' }) => {
    const newMember = await createStaffMember(entry)
    setStaff(prev => [...prev, newMember])
    return newMember
  }

  return {
    name,
    setName,
    currency,
    setCurrency,
    taxRate,
    setTaxRate,
    locale,
    setLocale,
    lowCashThreshold,
    setLowCashThreshold,
    notifyPaymentDue,
    setNotifyPaymentDue,
    notifyLowCash,
    setNotifyLowCash,
    notifyLowStock,
    setNotifyLowStock,
    saving,
    saved,
    save,
    branches,
    staff,
    loadingExtras,
    addBranch,
    addStaff,
    reloadExtras: loadExtras,
  }
}