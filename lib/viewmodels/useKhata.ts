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

  useEffect(() => {
    getParties().then(p => {
      setParties(p)
      setLoading(false)
    })
  }, [])

  const filteredParties = useMemo(() => {
    let list = parties
    if (filter === 'collect') list = list.filter(p => p.balance_minor > 0)
    if (filter === 'pay') list = list.filter(p => p.balance_minor < 0)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [parties, filter, search])

  useEffect(() => {
    if (filteredParties.length === 0) return
    const party = filteredParties[selected] ?? parties[0]
    if (!party) return
    getPartyTransactions(party.id).then(setPartyTxns)
  }, [filteredParties, parties, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const party = filteredParties[selected]

  return { parties, selected, setSelected, filter, setFilter, search, setSearch, filteredParties, party, partyTxns, loading }
}