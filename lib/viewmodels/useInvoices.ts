'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  getInvoices,
  getParties,
  getInventoryItems,
  createInvoice,
  updateInvoiceStatus,
  type InvoiceLineInput,
} from '@/lib/queries'
import type { Invoice, Party, InventoryItem } from '@/lib/types'

export type { InvoiceLineInput }

export function useInvoicesViewModel() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [invs, ps, items] = await Promise.all([getInvoices(), getParties(), getInventoryItems()])
      setInvoices(invs)
      setParties(ps)
      setInventoryItems(items)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()

    const supabase = createClient()
    const sub = supabase
      .channel('invoices-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, reload)
      .subscribe()

    const handleSync = () => reload()
    window.addEventListener('galla-sync', handleSync)
    window.addEventListener('galla-demo-data-changed', handleSync)

    return () => {
      sub.unsubscribe()
      window.removeEventListener('galla-sync', handleSync)
      window.removeEventListener('galla-demo-data-changed', handleSync)
    }
  }, [reload])

  const handleCreateInvoice = async (params: {
    partyId?: string | null
    issueDate: string
    dueDate?: string | null
    taxRatePct: number
    notes?: string | null
    lines: InvoiceLineInput[]
    isPaidNow?: boolean
  }) => {
    setError(null)
    setSaving(true)
    try {
      const party = params.partyId ? parties.find(p => p.id === params.partyId) : null
      const inv = await createInvoice({
        ...params,
        partyName: party?.name ?? null,
      })
      setInvoices(prev => [inv, ...prev])
      return inv
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save invoice'
      setError(msg)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId)
    if (!inv) return
    await updateInvoiceStatus(invoiceId, 'paid', inv.total_minor)
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'paid', paid_amount_minor: i.total_minor } : i))
  }

  const handleMarkUnpaid = async (invoiceId: string) => {
    await updateInvoiceStatus(invoiceId, 'unpaid', 0)
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'unpaid', paid_amount_minor: 0 } : i))
  }

  return {
    invoices,
    parties,
    inventoryItems,
    loading,
    saving,
    error,
    setError,
    handleCreateInvoice,
    handleMarkPaid,
    handleMarkUnpaid,
    reload,
  }
}