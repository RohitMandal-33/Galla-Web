'use client'

import { useEffect, useMemo, useState } from 'react'
import { getParties, getPartyTransactions } from '@/lib/queries'
import type { Party, Transaction } from '@/lib/types'

export type KhataFilter = 'all' | 'collect' | 'pay'

export function useKhataViewModel() {
  const [parties, setParties] = useState<Party[]>([])
  const [selected, setSelected] = useState(0)
  const [partyTxns, setPartyTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<KhataFilter>('all')
  const [search, setSearch] = useState('')

  const reloadParties = async () => {
    const p = await getParties()
    setParties(p)
    return p
  }

  useEffect(() => {
    reloadParties().then(() => setLoading(false))
  }, [])

  const filteredParties = useMemo(() => {
    let list = parties
    if (filter === 'collect') list = list.filter(p => p.balance_minor > 0)
    if (filter === 'pay') list = list.filter(p => p.balance_minor < 0)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [parties, filter, search])

  const handlePartyAdded = (newParty: Party) => {
    setParties(prev => {
      const filtered = prev.filter(p => p.id !== newParty.id)
      return [newParty, ...filtered].sort((a, b) => a.name.localeCompare(b.name))
    })
    setFilter('all')
    setSearch('')
    // In sorted list, find the index of newParty
    setTimeout(() => {
      setParties(curr => {
        const idx = curr.findIndex(p => p.id === newParty.id)
        if (idx >= 0) setSelected(idx)
        return curr
      })
    }, 0)
  }

  useEffect(() => {
    if (filteredParties.length === 0) {
      setPartyTxns([])
      return
    }
    const currentParty = filteredParties[selected] ?? filteredParties[0]
    if (!currentParty) {
      setPartyTxns([])
      return
    }
    getPartyTransactions(currentParty.id).then(setPartyTxns)
  }, [filteredParties, selected])

  const party = filteredParties[selected]

  return {
    parties,
    selected,
    setSelected,
    filter,
    setFilter,
    search,
    setSearch,
    filteredParties,
    party,
    partyTxns,
    loading,
    reloadParties,
    handlePartyAdded,
  }
}