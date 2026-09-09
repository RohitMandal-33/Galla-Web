import type { Business, InventoryItem, Invoice, Party, Transaction } from './types'

export const DEMO_COOKIE_NAME = 'galla_demo_mode'

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@galla.app',
  user_metadata: { business_name: 'Shree Ganesh Kirana Store' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  const hasCookie = document.cookie
    .split(';')
    .some(item => item.trim().startsWith(`${DEMO_COOKIE_NAME}=true`))
  const hasStorage = localStorage.getItem(DEMO_COOKIE_NAME) === 'true'
  return hasCookie || hasStorage
}

export function enableDemoMode(): void {
  if (typeof window === 'undefined') return
  document.cookie = `${DEMO_COOKIE_NAME}=true; path=/; max-age=604800; SameSite=Lax`
  localStorage.setItem(DEMO_COOKIE_NAME, 'true')
  // Ensure mock data is initialized
  getDemoStore()
}

export function disableDemoMode(): void {
  if (typeof window === 'undefined') return
  document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
  localStorage.removeItem(DEMO_COOKIE_NAME)
  localStorage.removeItem('galla_demo_store_v1')
}

// ── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_BUSINESS: Business = {
  id: 'demo-user-id',
  email: 'demo@galla.app',
  name: 'Shree Ganesh Kirana Store',
  currency: 'NPR',
  tax_rate_pct: 13,
  created_at: '2024-01-01T08:00:00.000Z',
  updated_at: new Date().toISOString(),
}

const INITIAL_PARTIES: Party[] = [
  {
    id: 'party-ram',
    business_id: 'demo-user-id',
    name: 'Ram Bahadur Shrestha',
    phone: '+977 9841234567',
    balance_minor: 345000, // NPR 3,450 to collect
    remind_enabled: true,
    remind_every_days: 14,
    last_reminded_at: null,
    settled_at: null,
    created_at: '2024-02-10T09:00:00.000Z',
    updated_at: '2024-02-10T09:00:00.000Z',
  },
  {
    id: 'party-sita',
    business_id: 'demo-user-id',
    name: 'Sita Devi Sharma',
    phone: '+977 9851098765',
    balance_minor: 182000, // NPR 1,820 to collect
    remind_enabled: false,
    remind_every_days: 14,
    last_reminded_at: null,
    settled_at: null,
    created_at: '2024-02-15T11:30:00.000Z',
    updated_at: '2024-02-15T11:30:00.000Z',
  },
  {
    id: 'party-krishna',
    business_id: 'demo-user-id',
    name: 'Krishna Prasad Bhattarai',
    phone: '+977 9803322110',
    balance_minor: 85000, // NPR 850 to collect
    remind_enabled: true,
    remind_every_days: 7,
    last_reminded_at: null,
    settled_at: null,
    created_at: '2024-02-20T14:15:00.000Z',
    updated_at: '2024-02-20T14:15:00.000Z',
  },
  {
    id: 'party-himalayan',
    business_id: 'demo-user-id',
    name: 'Himalayan FMCG Distributors',
    phone: '+977 9811223344',
    balance_minor: -750000, // -NPR 7,500 to pay (wholesale supplier)
    remind_enabled: false,
    remind_every_days: 30,
    last_reminded_at: null,
    settled_at: null,
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'party-pashupati',
    business_id: 'demo-user-id',
    name: 'Pashupati Dairy Collection',
    phone: '+977 9866554433',
    balance_minor: 0, // Settled
    remind_enabled: false,
    remind_every_days: 14,
    last_reminded_at: null,
    settled_at: '2024-02-25T16:00:00.000Z',
    created_at: '2024-01-20T08:30:00.000Z',
    updated_at: '2024-02-25T16:00:00.000Z',
  },
]

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-rice',
    business_id: 'demo-user-id',
    name: 'Basmati Rice (25kg Bag)',
    sku: 'RIC-25K',
    unit: 'bag',
    current_quantity: 14,
    low_stock_threshold: 5,
    cost_price_minor: 220000, // NPR 2,200
    sale_price_minor: 265000, // NPR 2,650
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'item-oil',
    business_id: 'demo-user-id',
    name: 'Mustard Oil (1L Pouch)',
    sku: 'OIL-01L',
    unit: 'pkt',
    current_quantity: 4, // Low stock
    low_stock_threshold: 8,
    cost_price_minor: 19000, // NPR 190
    sale_price_minor: 23000, // NPR 230
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'item-dal',
    business_id: 'demo-user-id',
    name: 'Chana Dal Premium (1kg)',
    sku: 'DAL-01K',
    unit: 'kg',
    current_quantity: 28,
    low_stock_threshold: 10,
    cost_price_minor: 13000, // NPR 130
    sale_price_minor: 16500, // NPR 165
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'item-sugar',
    business_id: 'demo-user-id',
    name: 'Refined Sugar (1kg)',
    sku: 'SUG-01K',
    unit: 'kg',
    current_quantity: 45,
    low_stock_threshold: 15,
    cost_price_minor: 9000, // NPR 90
    sale_price_minor: 11000, // NPR 110
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'item-tea',
    business_id: 'demo-user-id',
    name: 'Ilam CTC Garden Tea (500g)',
    sku: 'TEA-500',
    unit: 'pkt',
    current_quantity: 2, // Low stock
    low_stock_threshold: 6,
    cost_price_minor: 26000, // NPR 260
    sale_price_minor: 32000, // NPR 320
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'item-soap',
    business_id: 'demo-user-id',
    name: 'Detergent Bar (4-in-1 Pack)',
    sku: 'SOP-004',
    unit: 'pack',
    current_quantity: 18,
    low_stock_threshold: 6,
    cost_price_minor: 11500, // NPR 115
    sale_price_minor: 14500, // NPR 145
    created_at: '2024-01-05T10:00:00.000Z',
    updated_at: '2024-01-05T10:00:00.000Z',
    deleted_at: null,
  },
]

// Helper for dynamic timestamps relative to today
function timeOffset(hoursAgo: number): string {
  const d = new Date()
  d.setTime(d.getTime() - hoursAgo * 60 * 60 * 1000)
  return d.toISOString()
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    business_id: 'demo-user-id',
    party_id: 'party-ram',
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 120000, // NPR 1,200
    category: 'Sales',
    note: 'Udhaar collection (cash payment)',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(1.5),
    created_at: timeOffset(1.5),
    updated_at: timeOffset(1.5),
    deleted_at: null,
    parties: { name: 'Ram Bahadur Shrestha' },
  },
  {
    id: 'txn-2',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 385000, // NPR 3,850
    category: 'Sales',
    note: 'Afternoon counter grocery sales',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(3.2),
    created_at: timeOffset(3.2),
    updated_at: timeOffset(3.2),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-3',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_out',
    amount_minor: 85000, // NPR 850
    category: 'Operations',
    note: 'Staff tea, snacks & dusters',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(5.1),
    created_at: timeOffset(5.1),
    updated_at: timeOffset(5.1),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-4',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 460000, // NPR 4,600
    category: 'Sales',
    note: 'Morning counter rush',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(7.5),
    created_at: timeOffset(7.5),
    updated_at: timeOffset(7.5),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-5',
    business_id: 'demo-user-id',
    party_id: 'party-pashupati',
    inventory_item_id: null,
    direction: 'money_out',
    amount_minor: 150000, // NPR 1,500
    category: 'Inventory',
    note: 'Fresh milk & curd crates delivery',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(8.5),
    created_at: timeOffset(8.5),
    updated_at: timeOffset(8.5),
    deleted_at: null,
    parties: { name: 'Pashupati Dairy Collection' },
  },
  {
    id: 'txn-6',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 540000, // NPR 5,400
    category: 'Sales',
    note: 'Daily cash counter closing',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(24),
    created_at: timeOffset(24),
    updated_at: timeOffset(24),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-7',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_out',
    amount_minor: 320000, // NPR 3,200
    category: 'Utilities',
    note: 'NEA monthly electricity bill',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(28),
    created_at: timeOffset(28),
    updated_at: timeOffset(28),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-8',
    business_id: 'demo-user-id',
    party_id: 'party-sita',
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 250000, // NPR 2,500
    category: 'Sales',
    note: 'Khata repayment received via eSewa',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(48),
    created_at: timeOffset(48),
    updated_at: timeOffset(48),
    deleted_at: null,
    parties: { name: 'Sita Devi Sharma' },
  },
  {
    id: 'txn-9',
    business_id: 'demo-user-id',
    party_id: 'party-himalayan',
    inventory_item_id: 'item-rice',
    direction: 'money_out',
    amount_minor: 1200000, // NPR 12,000
    category: 'Inventory',
    note: 'Restocking 5 bags Basmati rice',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(72),
    created_at: timeOffset(72),
    updated_at: timeOffset(72),
    deleted_at: null,
    parties: { name: 'Himalayan FMCG Distributors' },
  },
  {
    id: 'txn-10',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 720000, // NPR 7,200
    category: 'Sales',
    note: 'Weekend retail rush sales',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(96),
    created_at: timeOffset(96),
    updated_at: timeOffset(96),
    deleted_at: null,
    parties: null,
  },
  {
    id: 'txn-11',
    business_id: 'demo-user-id',
    party_id: 'party-krishna',
    inventory_item_id: null,
    direction: 'money_in',
    amount_minor: 150000, // NPR 1,500
    category: 'Sales',
    note: 'Tea stall weekly settlement',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(120),
    created_at: timeOffset(120),
    updated_at: timeOffset(120),
    deleted_at: null,
    parties: { name: 'Krishna Prasad Bhattarai' },
  },
  {
    id: 'txn-12',
    business_id: 'demo-user-id',
    party_id: null,
    inventory_item_id: null,
    direction: 'money_out',
    amount_minor: 180000, // NPR 1,800
    category: 'Operations',
    note: 'Ward office business certificate fee',
    is_credit: false,
    is_adjustment: false,
    is_write_off: false,
    photo_url: null,
    invoice_id: null,
    occurred_at: timeOffset(144),
    created_at: timeOffset(144),
    updated_at: timeOffset(144),
    deleted_at: null,
    parties: null,
  },
]

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1042',
    business_id: 'demo-user-id',
    party_id: 'party-ram',
    invoice_number: 'INV-1042',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    subtotal_minor: 345000,
    tax_rate_pct: 13,
    tax_minor: 44850,
    total_minor: 389850,
    paid_amount_minor: 0,
    status: 'unpaid',
    notes: 'Monthly grain & ration delivery supply',
    created_at: timeOffset(5),
    updated_at: timeOffset(5),
    deleted_at: null,
    parties: { name: 'Ram Bahadur Shrestha' },
  },
]

export interface DemoStore {
  business: Business
  parties: Party[]
  items: InventoryItem[]
  transactions: Transaction[]
  invoices: Invoice[]
}

export function getDemoStore(): DemoStore {
  if (typeof window === 'undefined') {
    return {
      business: INITIAL_BUSINESS,
      parties: INITIAL_PARTIES,
      items: INITIAL_ITEMS,
      transactions: INITIAL_TRANSACTIONS,
      invoices: INITIAL_INVOICES,
    }
  }

  const raw = localStorage.getItem('galla_demo_store_v1')
  if (raw) {
    try {
      return JSON.parse(raw) as DemoStore
    } catch {
      // invalid JSON, reset
    }
  }

  const fresh: DemoStore = {
    business: INITIAL_BUSINESS,
    parties: INITIAL_PARTIES,
    items: INITIAL_ITEMS,
    transactions: INITIAL_TRANSACTIONS,
    invoices: INITIAL_INVOICES,
  }
  localStorage.setItem('galla_demo_store_v1', JSON.stringify(fresh))
  return fresh
}

export function saveDemoStore(store: DemoStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('galla_demo_store_v1', JSON.stringify(store))
  window.dispatchEvent(new Event('galla-demo-data-changed'))
}

export function resetDemoStore(): DemoStore {
  if (typeof window === 'undefined') {
    return {
      business: INITIAL_BUSINESS,
      parties: INITIAL_PARTIES,
      items: INITIAL_ITEMS,
      transactions: INITIAL_TRANSACTIONS,
      invoices: INITIAL_INVOICES,
    }
  }
  const fresh: DemoStore = {
    business: INITIAL_BUSINESS,
    parties: INITIAL_PARTIES,
    items: INITIAL_ITEMS,
    transactions: INITIAL_TRANSACTIONS,
    invoices: INITIAL_INVOICES,
  }
  localStorage.setItem('galla_demo_store_v1', JSON.stringify(fresh))
  window.dispatchEvent(new Event('galla-demo-data-changed'))
  return fresh
}
