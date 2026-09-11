'use client'

import { useEffect, useState } from 'react'
import { addTransaction, getParties, getPartyTransactions, getRecentTransactions } from '@/lib/queries'
import type { Party, Transaction } from '@/lib/types'

export type TxnType = 'sale' | 'expense' | 'receive' | 'paid' | 'credit' | 'invoice'
export type PayMethod = 'cash' | 'card'

/** Maps each transaction type to its direction and default category */
const TYPE_META: Record<TxnType, { direction: 'money_in' | 'money_out'; category: string; isCredit?: boolean }> = {
  sale:    { direction: 'money_in',  category: 'Sales' },
  receive: { direction: 'money_in',  category: 'Payment Received' },
  credit:  { direction: 'money_in',  category: 'Credit', isCredit: true },
  invoice: { direction: 'money_in',  category: 'Invoice' },
  expense: { direction: 'money_out', category: 'Expense' },
  paid:    { direction: 'money_out', category: 'Payment Made' },
}

export function useAddTransactionViewModel(currency: string, onSaved: () => void, close: () => void) {
  const [txnType, setTxnType]       = useState<TxnType | null>(null)
  const [payMethod, setPayMethod]   = useState<PayMethod>('cash')
  const [amountStr, setAmountStr]   = useState('')
  const [note, setNote]             = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Party selection
  const [parties, setParties]             = useState<Party[]>([])
  const [partyQuery, setPartyQuery]       = useState('')
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)

  // Recent transactions
  const [recentTxns, setRecentTxns]     = useState<Transaction[]>([])
  const [recentLoading, setRecentLoading] = useState(false)

  // Load parties on mount
  useEffect(() => {
    getParties().then(setParties).catch(() => setParties([]))
  }, [])

  // Load recent transactions whenever selected party changes
  useEffect(() => {
    setRecentLoading(true)
    const load = selectedParty
      ? getPartyTransactions(selectedParty.id)
      : getRecentTransactions(8)
    load
      .then(txns => setRecentTxns(txns.slice(0, 8)))
      .catch(() => setRecentTxns([]))
      .finally(() => setRecentLoading(false))
  }, [selectedParty])

  const filteredParties = parties.filter(p =>
    !partyQuery || p.name.toLowerCase().includes(partyQuery.toLowerCase())
  )

  const clearAmount = () => { setAmountStr(''); setError(null) }

  const selectType = (t: TxnType) => {
    setTxnType(t)
    clearAmount()
    setNote('')
  }

  const selectParty = (p: Party | null) => {
    setSelectedParty(p)
    setPartyQuery(p?.name ?? '')
  }

  const addPartyToSelection = (party: Party) => {
    setParties(current => [party, ...current])
    selectParty(party)
  }

  const save = async () => {
    if (!txnType) { setError('Choose a transaction type'); return }
    const amount = parseFloat(amountStr)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }

    const meta = TYPE_META[txnType]
    setSaving(true)
    try {
      await addTransaction({
        direction: meta.direction,
        amount_minor: Math.round(amount * 100),
        note: note || undefined,
        category: meta.category,
        party_id: selectedParty?.id ?? null,
        isCredit: meta.isCredit ?? false,
      })
      onSaved()
      close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Escape = close, Enter = save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Enter' && !saving && txnType) save()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [amountStr, note, txnType, payMethod, selectedParty, saving]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    txnType, setTxnType: selectType,
    payMethod, setPayMethod,
    amountStr, setAmountStr: (v: string) => { setAmountStr(v); setError(null) },
    note, setNote,
    saving, error,
    save,
    parties: filteredParties,
    partyQuery, setPartyQuery,
    selectedParty, selectParty,
    addPartyToSelection,
    recentTxns, recentLoading,
    currency,
  }
}
