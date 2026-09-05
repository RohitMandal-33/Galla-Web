'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getInventoryItems } from '@/lib/queries'
import type { InventoryItem } from '@/lib/types'

export function useStockViewModel() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLow, setFilterLow] = useState(false)

  useEffect(() => {
    getInventoryItems().then(d => { setItems(d); setLoading(false) })

    const supabase = createClient()
    const sub = supabase
      .channel('inventory-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        getInventoryItems().then(setItems)
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [])

  const filtered = useMemo(() => {
    let list = items
    if (filterLow) list = list.filter(i => i.current_quantity <= i.low_stock_threshold)
    if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [items, search, filterLow])

  const totalValue = items.reduce((s, i) => s + i.current_quantity * i.sale_price_minor, 0)
  const lowCount = items.filter(i => i.current_quantity <= i.low_stock_threshold && i.current_quantity > 0).length
  const outCount = items.filter(i => i.current_quantity === 0).length

  return { items, loading, search, setSearch, filterLow, setFilterLow, filtered, totalValue, lowCount, outCount }
}