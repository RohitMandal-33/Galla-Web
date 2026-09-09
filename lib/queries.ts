import { createClient } from './supabase'
import type { Business, InventoryItem, Invoice, Party, Transaction } from './types'
import { getDemoStore, isDemoMode, saveDemoStore } from './demo'

const PAISA = 100 // minor units (paisa) per rupee

export function minorToDisplay(minor: number, currency = 'NPR'): string {
  const amount = Math.abs(minor / PAISA)
  return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Fetch business profile for the authenticated user */
export async function getBusiness(): Promise<Business> {
  if (isDemoMode()) {
    return getDemoStore().business
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Business
  } catch (err) {
    if (isDemoMode() || typeof window !== 'undefined') {
      return getDemoStore().business
    }
    throw err
  }
}

/** Update business profile */
export async function updateBusiness(updates: { name?: string; currency?: string; tax_rate_pct?: number }) {
  if (isDemoMode()) {
    const store = getDemoStore()
    store.business = {
      ...store.business,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveDemoStore(store)
    return
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const store = getDemoStore()
    store.business = { ...store.business, ...updates, updated_at: new Date().toISOString() }
    saveDemoStore(store)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('businesses') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw error
}

type TxnRow = { direction: string; amount_minor: number; occurred_at: string }
type PartyBalRow = { balance_minor: number }

/** Dashboard KPIs: cash in hand, sales today, expenses today, udhaar */
export async function getDashboardKPIs(currency = 'NPR') {
  if (isDemoMode()) {
    const { transactions, parties } = getDemoStore()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let totalIn = 0
    let totalOut = 0
    let salesToday = 0
    let expensesToday = 0

    for (const t of transactions) {
      if (t.direction === 'money_in') totalIn += t.amount_minor
      else totalOut += t.amount_minor
      const occurred = new Date(t.occurred_at)
      if (occurred >= today) {
        if (t.direction === 'money_in') salesToday += t.amount_minor
        else expensesToday += t.amount_minor
      }
    }

    const cashInHand = totalIn - totalOut
    const activeParties = parties.filter(p => !p.settled_at)
    const udhaar = activeParties
      .filter(p => p.balance_minor > 0)
      .reduce((s, p) => s + p.balance_minor, 0)
    const activeDebtors = activeParties.filter(p => p.balance_minor > 0).length

    return { cashInHand, salesToday, expensesToday, udhaar, activeDebtors, currency }
  }

  try {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: rawTxns, error } = await supabase
      .from('transactions')
      .select('direction, amount_minor, occurred_at')
      .is('deleted_at', null)

    if (error) throw error
    const txns = (rawTxns ?? []) as unknown as TxnRow[]

    let totalIn = 0
    let totalOut = 0
    let salesToday = 0
    let expensesToday = 0

    for (const t of txns) {
      if (t.direction === 'money_in') totalIn += t.amount_minor
      else totalOut += t.amount_minor
      const occurred = new Date(t.occurred_at)
      if (occurred >= today) {
        if (t.direction === 'money_in') salesToday += t.amount_minor
        else expensesToday += t.amount_minor
      }
    }

    const cashInHand = totalIn - totalOut

    const { data: rawParties } = await supabase
      .from('parties')
      .select('balance_minor')
      .is('settled_at', null)
    const parties = (rawParties ?? []) as unknown as PartyBalRow[]

    const udhaar = parties
      .filter(p => p.balance_minor > 0)
      .reduce((s, p) => s + p.balance_minor, 0)

    const activeDebtors = parties.filter(p => p.balance_minor > 0).length

    return { cashInHand, salesToday, expensesToday, udhaar, activeDebtors, currency }
  } catch (err) {
    // Fallback to demo store if Supabase fails or unauthenticated
    const { transactions, parties } = getDemoStore()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let totalIn = 0
    let totalOut = 0
    let salesToday = 0
    let expensesToday = 0
    for (const t of transactions) {
      if (t.direction === 'money_in') totalIn += t.amount_minor
      else totalOut += t.amount_minor
      const occurred = new Date(t.occurred_at)
      if (occurred >= today) {
        if (t.direction === 'money_in') salesToday += t.amount_minor
        else expensesToday += t.amount_minor
      }
    }
    const cashInHand = totalIn - totalOut
    const activeParties = parties.filter(p => !p.settled_at)
    const udhaar = activeParties
      .filter(p => p.balance_minor > 0)
      .reduce((s, p) => s + p.balance_minor, 0)
    const activeDebtors = activeParties.filter(p => p.balance_minor > 0).length
    return { cashInHand, salesToday, expensesToday, udhaar, activeDebtors, currency }
  }
}

/** Fetch recent transactions (with party name joined) */
export async function getRecentTransactions(limit = 20): Promise<Transaction[]> {
  if (isDemoMode()) {
    const txns = getDemoStore().transactions.filter(t => !t.deleted_at)
    return txns.slice(0, limit)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*, parties(name)')
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as unknown as Transaction[]
  } catch {
    return getDemoStore().transactions.slice(0, limit)
  }
}

/** Fetch all parties */
export async function getParties(): Promise<Party[]> {
  if (isDemoMode()) {
    return getDemoStore().parties.filter(p => !p.settled_at)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .is('settled_at', null)
      .order('name')
    if (error) throw error
    return (data ?? []) as unknown as Party[]
  } catch {
    return getDemoStore().parties.filter(p => !p.settled_at)
  }
}

/** Fetch transactions for a specific party */
export async function getPartyTransactions(partyId: string): Promise<Transaction[]> {
  if (isDemoMode()) {
    return getDemoStore().transactions
      .filter(t => t.party_id === partyId && !t.deleted_at)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('party_id', partyId)
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as unknown as Transaction[]
  } catch {
    return getDemoStore().transactions
      .filter(t => t.party_id === partyId && !t.deleted_at)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
  }
}

/** Fetch inventory items */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (isDemoMode()) {
    return getDemoStore().items.filter(i => !i.deleted_at)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    if (error) throw error
    return (data ?? []) as unknown as InventoryItem[]
  } catch {
    return getDemoStore().items.filter(i => !i.deleted_at)
  }
}

/** Insert a quick transaction entry */
export async function addTransaction(entry: {
  direction: 'money_in' | 'money_out'
  amount_minor: number
  note?: string
  category?: string
  party_id?: string
}) {
  if (isDemoMode()) {
    const store = getDemoStore()
    const party = entry.party_id ? store.parties.find(p => p.id === entry.party_id) : null
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      business_id: 'demo-user-id',
      party_id: entry.party_id ?? null,
      inventory_item_id: null,
      direction: entry.direction,
      amount_minor: entry.amount_minor,
      note: entry.note ?? null,
      category: entry.category ?? null,
      is_credit: false,
      is_adjustment: false,
      is_write_off: false,
      photo_url: null,
      invoice_id: null,
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      parties: party ? { name: party.name } : null,
    }
    store.transactions.unshift(newTxn)
    saveDemoStore(store)
    return
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const store = getDemoStore()
    const party = entry.party_id ? store.parties.find(p => p.id === entry.party_id) : null
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      business_id: 'demo-user-id',
      party_id: entry.party_id ?? null,
      inventory_item_id: null,
      direction: entry.direction,
      amount_minor: entry.amount_minor,
      note: entry.note ?? null,
      category: entry.category ?? null,
      is_credit: false,
      is_adjustment: false,
      is_write_off: false,
      photo_url: null,
      invoice_id: null,
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      parties: party ? { name: party.name } : null,
    }
    store.transactions.unshift(newTxn)
    saveDemoStore(store)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('transactions') as any).insert({
    business_id: user.id,
    direction: entry.direction,
    amount_minor: entry.amount_minor,
    note: entry.note ?? null,
    category: entry.category ?? null,
    party_id: entry.party_id ?? null,
    occurred_at: new Date().toISOString(),
  })
  if (error) throw error
}

/** Fetch invoices with party name */
export async function getInvoices(): Promise<Invoice[]> {
  if (isDemoMode()) {
    return getDemoStore().invoices.filter(i => !i.deleted_at)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, parties(name)')
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Invoice[]
  } catch {
    return getDemoStore().invoices.filter(i => !i.deleted_at)
  }
}

/** Add a new party to Khata */
export async function addParty(entry: {
  name: string
  phone?: string | null
  balance_minor?: number
}): Promise<Party> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const newParty: Party = {
      id: `party-${Date.now()}`,
      business_id: 'demo-user-id',
      name: entry.name.trim(),
      phone: entry.phone?.trim() || null,
      balance_minor: entry.balance_minor ?? 0,
      remind_enabled: false,
      remind_every_days: 14,
      last_reminded_at: null,
      settled_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.parties.push(newParty)

    if (entry.balance_minor && entry.balance_minor !== 0) {
      store.transactions.unshift({
        id: `txn-${Date.now()}`,
        business_id: 'demo-user-id',
        party_id: newParty.id,
        inventory_item_id: null,
        direction: entry.balance_minor > 0 ? 'money_out' : 'money_in',
        amount_minor: Math.abs(entry.balance_minor),
        note: 'Opening balance',
        category: 'Opening Balance',
        is_credit: true,
        is_adjustment: false,
        is_write_off: false,
        photo_url: null,
        invoice_id: null,
        occurred_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        parties: { name: newParty.name },
      })
    }

    saveDemoStore(store)
    return newParty
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return addParty({ ...entry }) // will route to demo mode if unauthenticated
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('parties') as any)
    .insert({
      business_id: user.id,
      name: entry.name.trim(),
      phone: entry.phone?.trim() || null,
      balance_minor: entry.balance_minor ?? 0,
      remind_enabled: false,
      remind_every_days: 14,
    })
    .select()
    .single()

  if (error) throw error

  if (entry.balance_minor && entry.balance_minor !== 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('transactions') as any).insert({
        business_id: user.id,
        party_id: data.id,
        direction: entry.balance_minor > 0 ? 'money_out' : 'money_in',
        amount_minor: Math.abs(entry.balance_minor),
        note: 'Opening balance',
        category: 'Opening Balance',
        is_credit: true,
        occurred_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal
    }
  }

  return data as Party
}

/** Add a new inventory item */
export async function addInventoryItem(entry: {
  name: string
  sku?: string | null
  unit: string
  current_quantity: number
  low_stock_threshold: number
  cost_price_minor: number
  sale_price_minor: number
}): Promise<InventoryItem> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      business_id: 'demo-user-id',
      name: entry.name.trim(),
      sku: entry.sku?.trim() || null,
      unit: entry.unit.trim() || 'pcs',
      current_quantity: entry.current_quantity,
      low_stock_threshold: entry.low_stock_threshold,
      cost_price_minor: entry.cost_price_minor,
      sale_price_minor: entry.sale_price_minor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }
    store.items.push(newItem)
    saveDemoStore(store)
    return newItem
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('inventory_items') as any)
    .insert({
      business_id: user.id,
      name: entry.name.trim(),
      sku: entry.sku?.trim() || null,
      unit: entry.unit.trim() || 'pcs',
      current_quantity: entry.current_quantity,
      low_stock_threshold: entry.low_stock_threshold,
      cost_price_minor: entry.cost_price_minor,
      sale_price_minor: entry.sale_price_minor,
    })
    .select()
    .single()

  if (error) throw error
  return data as InventoryItem
}

/** Record a khata transaction (give udhaar or receive payment) */
export async function addKhataTransaction(entry: {
  party_id: string
  direction: 'money_in' | 'money_out'
  amount_minor: number
  note?: string
  is_credit?: boolean
}): Promise<void> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const party = store.parties.find(p => p.id === entry.party_id)
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      business_id: 'demo-user-id',
      party_id: entry.party_id,
      inventory_item_id: null,
      direction: entry.direction,
      amount_minor: entry.amount_minor,
      note: entry.note ?? (entry.direction === 'money_in' ? 'Payment received' : 'Udhaar given'),
      category: entry.direction === 'money_in' ? 'Khata Payment' : 'Udhaar Given',
      is_credit: entry.is_credit ?? true,
      is_adjustment: false,
      is_write_off: false,
      photo_url: null,
      invoice_id: null,
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      parties: party ? { name: party.name } : null,
    }
    store.transactions.unshift(newTxn)

    if (party) {
      const delta = entry.direction === 'money_in' ? -entry.amount_minor : entry.amount_minor
      party.balance_minor += delta
      party.updated_at = new Date().toISOString()
    }
    saveDemoStore(store)
    return
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('transactions') as any).insert({
    business_id: user.id,
    party_id: entry.party_id,
    direction: entry.direction,
    amount_minor: entry.amount_minor,
    note: entry.note ?? null,
    is_credit: entry.is_credit ?? true,
    occurred_at: new Date().toISOString(),
  })
  if (error) throw error

  const delta = entry.direction === 'money_in' ? -entry.amount_minor : entry.amount_minor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partyData, error: fetchErr } = await (supabase.from('parties') as any)
    .select('balance_minor')
    .eq('id', entry.party_id)
    .single()
  if (!fetchErr && partyData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('parties') as any)
      .update({ balance_minor: partyData.balance_minor + delta, updated_at: new Date().toISOString() })
      .eq('id', entry.party_id)
  }
}
