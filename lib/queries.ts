import { createClient } from './supabase'
import type { Business, InventoryItem, Invoice, Party, Transaction } from './types'
import { getDemoStore, isDemoMode, saveDemoStore } from './demo'

const PAISA = 100 // minor units (paisa) per rupee

export function minorToDisplay(minor: number, currency = 'NPR'): string {
  const amount = Math.abs(minor / PAISA)
  return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Fetch business profile for the authenticated user */
export async function getBusiness(userId?: string) {
  if (isDemoMode()) return getDemoStore().business

  try {
    const supabase = createClient()
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id
    }

    if (!currentUserId) {
      return getDemoStore().business
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', currentUserId) // MUST be 'id', NOT 'user_id'
      .maybeSingle()

    if (error) {
      console.error('getBusiness error:', error)
      return getDemoStore().business
    }
    return data as unknown as Business || getDemoStore().business
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

export async function addTransaction(
  userIdOrEntry: string | {
    direction: 'money_in' | 'money_out'
    amount_minor?: number
    amountMinor?: number
    party_id?: string | null
    partyId?: string | null
    inventoryItemId?: string | null
    invoiceId?: string | null
    category?: string | null
    note?: string | null
    isCredit?: boolean
    occurredAt?: string
  },
  txnObj?: {
    direction: 'money_in' | 'money_out'
    amountMinor?: number
    amount_minor?: number
    partyId?: string | null
    party_id?: string | null
    inventoryItemId?: string | null
    invoiceId?: string | null
    category?: string | null
    note?: string | null
    isCredit?: boolean
    is_credit?: boolean
    occurredAt?: string
  }
) {
  let userId: string | undefined
  let txn: {
    direction: 'money_in' | 'money_out'
    amountMinor: number
    partyId?: string | null
    inventoryItemId?: string | null
    invoiceId?: string | null
    category?: string | null
    note?: string | null
    isCredit?: boolean
    occurredAt?: string
  }

  if (typeof userIdOrEntry === 'string') {
    userId = userIdOrEntry
    const amountMinor = txnObj?.amountMinor ?? txnObj?.amount_minor ?? 0
    txn = {
      direction: txnObj!.direction,
      amountMinor,
      partyId: txnObj?.partyId ?? txnObj?.party_id,
      inventoryItemId: txnObj?.inventoryItemId,
      invoiceId: txnObj?.invoiceId,
      category: txnObj?.category,
      note: txnObj?.note,
      isCredit: txnObj?.isCredit ?? txnObj?.is_credit,
      occurredAt: txnObj?.occurredAt,
    }
  } else {
    const amountMinor = userIdOrEntry.amountMinor ?? userIdOrEntry.amount_minor ?? 0
    txn = {
      direction: userIdOrEntry.direction,
      amountMinor,
      partyId: userIdOrEntry.partyId ?? userIdOrEntry.party_id,
      inventoryItemId: userIdOrEntry.inventoryItemId,
      invoiceId: userIdOrEntry.invoiceId,
      category: userIdOrEntry.category,
      note: userIdOrEntry.note,
      isCredit: userIdOrEntry.isCredit,
      occurredAt: userIdOrEntry.occurredAt,
    }
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const party = txn.partyId ? store.parties.find(p => p.id === txn.partyId) : null
    const newTxn: Transaction = {
      id: crypto.randomUUID(),
      business_id: 'demo-user-id',
      party_id: txn.partyId ?? null,
      inventory_item_id: txn.inventoryItemId ?? null,
      direction: txn.direction,
      amount_minor: txn.amountMinor,
      note: txn.note ?? null,
      category: txn.category ?? null,
      is_credit: txn.isCredit ?? false,
      is_adjustment: false,
      is_write_off: false,
      photo_url: null,
      invoice_id: txn.invoiceId ?? null,
      occurred_at: txn.occurredAt || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      parties: party ? { name: party.name } : null,
    }
    store.transactions.unshift(newTxn)
    saveDemoStore(store)
    return newTxn
  }

  const supabase = createClient()
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Demo fallback if unauthenticated
      return addTransaction('demo-user-id', txnObj ?? (userIdOrEntry as any))
    }
    userId = user.id
  }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('transactions') as any)
    .insert({
      id,
      business_id: userId,
      direction: txn.direction,
      amount_minor: txn.amountMinor,
      party_id: txn.partyId || null,
      inventory_item_id: txn.inventoryItemId || null,
      invoice_id: txn.invoiceId || null,
      category: txn.category || null,
      note: txn.note || null,
      is_credit: txn.isCredit ?? false,
      is_adjustment: false,
      is_write_off: false,
      occurred_at: txn.occurredAt || now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    .select()
    .single()

  if (error) throw error
  return data
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
  const partyId = crypto.randomUUID()
  const now = new Date().toISOString()

  if (isDemoMode()) {
    const store = getDemoStore()
    const newParty: Party = {
      id: partyId,
      business_id: 'demo-user-id',
      name: entry.name.trim(),
      phone: entry.phone?.trim() || null,
      balance_minor: entry.balance_minor ?? 0,
      remind_enabled: false,
      remind_every_days: 14,
      last_reminded_at: null,
      settled_at: null,
      created_at: now,
      updated_at: now,
    }
    store.parties.push(newParty)

    if (entry.balance_minor && entry.balance_minor !== 0) {
      store.transactions.unshift({
        id: crypto.randomUUID(),
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
        occurred_at: now,
        created_at: now,
        updated_at: now,
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
      id: partyId,
      business_id: user.id,
      name: entry.name.trim(),
      phone: entry.phone?.trim() || null,
      balance_minor: entry.balance_minor ?? 0,
      remind_enabled: false,
      remind_every_days: 14,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw error

  if (entry.balance_minor && entry.balance_minor !== 0) {
    try {
      await addTransaction(user.id, {
        direction: entry.balance_minor > 0 ? 'money_out' : 'money_in',
        amountMinor: Math.abs(entry.balance_minor),
        partyId: data.id,
        category: 'Opening Balance',
        note: 'Opening balance',
        isCredit: true,
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
  const itemId = crypto.randomUUID()
  const now = new Date().toISOString()

  if (isDemoMode()) {
    const store = getDemoStore()
    const newItem: InventoryItem = {
      id: itemId,
      business_id: 'demo-user-id',
      name: entry.name.trim(),
      sku: entry.sku?.trim() || null,
      unit: entry.unit.trim() || 'pcs',
      current_quantity: entry.current_quantity,
      low_stock_threshold: entry.low_stock_threshold,
      cost_price_minor: entry.cost_price_minor,
      sale_price_minor: entry.sale_price_minor,
      created_at: now,
      updated_at: now,
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
      id: itemId,
      business_id: user.id,
      name: entry.name.trim(),
      sku: entry.sku?.trim() || null,
      unit: entry.unit.trim() || 'pcs',
      current_quantity: entry.current_quantity,
      low_stock_threshold: entry.low_stock_threshold,
      cost_price_minor: entry.cost_price_minor,
      sale_price_minor: entry.sale_price_minor,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    .select()
    .single()

  if (error) throw error
  return data as InventoryItem
}

export async function addKhataTransaction(
  userIdOrParams: string | {
    partyId?: string
    party_id?: string
    direction: 'money_in' | 'money_out'
    amountMinor?: number
    amount_minor?: number
    isCredit?: boolean
    is_credit?: boolean
    note?: string
  },
  paramsObj?: {
    partyId?: string
    party_id?: string
    direction: 'money_in' | 'money_out'
    amountMinor?: number
    amount_minor?: number
    isCredit?: boolean
    is_credit?: boolean
    note?: string
  }
) {
  let userId: string | undefined
  let params: {
    partyId: string
    direction: 'money_in' | 'money_out'
    amountMinor: number
    isCredit: boolean
    note?: string
  }

  if (typeof userIdOrParams === 'string') {
    userId = userIdOrParams
    params = {
      partyId: (paramsObj?.partyId ?? paramsObj?.party_id)!,
      direction: paramsObj!.direction,
      amountMinor: (paramsObj?.amountMinor ?? paramsObj?.amount_minor)!,
      isCredit: paramsObj?.isCredit ?? paramsObj?.is_credit ?? true,
      note: paramsObj?.note,
    }
  } else {
    params = {
      partyId: (userIdOrParams.partyId ?? userIdOrParams.party_id)!,
      direction: userIdOrParams.direction,
      amountMinor: (userIdOrParams.amountMinor ?? userIdOrParams.amount_minor)!,
      isCredit: userIdOrParams.isCredit ?? userIdOrParams.is_credit ?? true,
      note: userIdOrParams.note,
    }
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const party = store.parties.find(p => p.id === params.partyId)
    const newTxn: Transaction = {
      id: crypto.randomUUID(),
      business_id: 'demo-user-id',
      party_id: params.partyId,
      inventory_item_id: null,
      direction: params.direction,
      amount_minor: params.amountMinor,
      note: params.note ?? (params.direction === 'money_in' ? 'Payment received' : 'Udhaar given'),
      category: params.direction === 'money_in' ? 'Khata Payment' : 'Udhaar Given',
      is_credit: params.isCredit,
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

    let delta = 0
    if (params.isCredit) {
      delta = params.direction === 'money_in' ? params.amountMinor : -params.amountMinor
    } else {
      delta = params.direction === 'money_in' ? -params.amountMinor : params.amountMinor
    }

    if (party) {
      party.balance_minor += delta
      party.updated_at = new Date().toISOString()
    }
    saveDemoStore(store)
    return
  }

  const supabase = createClient()
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    userId = user.id
  }

  // 1. Record the ledger transaction
  await addTransaction(userId, {
    direction: params.direction,
    amountMinor: params.amountMinor,
    partyId: params.partyId,
    isCredit: params.isCredit,
    note: params.note,
  })

  // 2. Compute Party balance delta matching Mobile logic:
  //    - Credit sale to customer (money_in, isCredit=true): debtor owes you (+amount)
  //    - Customer cash repayment (money_in, isCredit=false): reduces receivable (-amount)
  //    - Credit purchase from supplier (money_out, isCredit=true): you owe supplier (-amount)
  //    - Supplier payment made (money_out, isCredit=false): reduces payable (+amount)
  let delta = 0
  if (params.isCredit) {
    delta = params.direction === 'money_in' ? params.amountMinor : -params.amountMinor
  } else {
    delta = params.direction === 'money_in' ? -params.amountMinor : params.amountMinor
  }

  // 3. Fetch current party balance and apply delta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: party, error: partyErr } = await (supabase.from('parties') as any)
    .select('balance_minor')
    .eq('id', params.partyId)
    .single()

  if (!partyErr && party) {
    const newBalance = (party.balance_minor || 0) + delta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('parties') as any)
      .update({
        balance_minor: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.partyId)
  }
}

// 4. Soft Delete for any record
export async function softDeleteRecord(
  table: 'transactions' | 'parties' | 'inventory_items' | 'invoices',
  id: string
) {
  if (isDemoMode()) return

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export interface DailyBucket {
  date: string    // YYYY-MM-DD
  inflow: number  // minor units
  outflow: number // minor units
}

export interface CategoryBreakdown {
  name: string
  total: number // minor units
}

export interface ChartData {
  daily: DailyBucket[]
  categories: CategoryBreakdown[]
}

type ChartTxnRow = { direction: string; amount_minor: number; category: string | null; occurred_at: string }

function buildChartData(transactions: ChartTxnRow[]): ChartData {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const buckets: Record<string, DailyBucket> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    buckets[key] = { date: key, inflow: 0, outflow: 0 }
  }

  const categoryMap: Record<string, number> = {}

  for (const t of transactions) {
    const key = t.occurred_at.split('T')[0]
    if (key in buckets) {
      if (t.direction === 'money_in') buckets[key].inflow += t.amount_minor
      else buckets[key].outflow += t.amount_minor
    }
    if (t.direction === 'money_out') {
      const cat = t.category ?? 'Other'
      categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount_minor
    }
  }

  const categories = Object.entries(categoryMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return { daily: Object.values(buckets), categories }
}

/** Chart data: 30-day daily inflow/outflow + expense breakdown by category */
export async function getChartData(): Promise<ChartData> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  since.setHours(0, 0, 0, 0)

  if (isDemoMode()) {
    const txns = getDemoStore().transactions.filter(t => !t.deleted_at)
    return buildChartData(txns)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('direction, amount_minor, category, occurred_at')
      .is('deleted_at', null)
      .gte('occurred_at', since.toISOString())
    if (error) throw error
    return buildChartData((data ?? []) as ChartTxnRow[])
  } catch {
    const txns = getDemoStore().transactions.filter(t => !t.deleted_at)
    return buildChartData(txns)
  }
}
