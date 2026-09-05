import { createClient } from './supabase'
import type { Business, InventoryItem, Party, Transaction } from './types'

const PAISA = 100 // minor units (paisa) per rupee

export function minorToDisplay(minor: number, currency = 'NPR'): string {
  const amount = Math.abs(minor / PAISA)
  return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Fetch business profile for the authenticated user */
export async function getBusiness(): Promise<Business> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .single()
  if (error) throw error
  return data as unknown as Business
}

/** Update business profile */
export async function updateBusiness(updates: { name?: string; currency?: string; tax_rate_pct?: number }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
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
}

/** Fetch recent transactions (with party name joined) */
export async function getRecentTransactions(limit = 20): Promise<Transaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, parties(name)')
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as Transaction[]
}

/** Fetch all parties */
export async function getParties(): Promise<Party[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .is('settled_at', null)
    .order('name')
  if (error) throw error
  return (data ?? []) as unknown as Party[]
}

/** Fetch transactions for a specific party */
export async function getPartyTransactions(partyId: string): Promise<Transaction[]> {
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
}

/** Fetch inventory items */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return (data ?? []) as unknown as InventoryItem[]
}

/** Insert a quick transaction entry */
export async function addTransaction(entry: {
  direction: 'money_in' | 'money_out'
  amount_minor: number
  note?: string
  category?: string
  party_id?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
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
export async function getInvoices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, parties(name)')
    .is('deleted_at', null)
    .order('issue_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as import('./types').Invoice[]
}
