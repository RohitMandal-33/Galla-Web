export type TxnDirection = 'money_in' | 'money_out'
export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'cancelled'

export interface Business {
  id: string
  email: string
  name: string
  currency: string
  tax_rate_pct: number
  created_at: string
  updated_at: string
}

export interface Party {
  id: string
  business_id: string
  name: string
  phone: string | null
  balance_minor: number
  remind_enabled: boolean
  remind_every_days: number
  last_reminded_at: string | null
  settled_at: string | null
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  business_id: string
  name: string
  sku: string | null
  unit: string
  current_quantity: number
  low_stock_threshold: number
  cost_price_minor: number
  sale_price_minor: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Transaction {
  id: string
  business_id: string
  party_id: string | null
  inventory_item_id: string | null
  direction: TxnDirection
  amount_minor: number
  category: string | null
  note: string | null
  is_credit: boolean
  is_adjustment: boolean
  is_write_off: boolean
  photo_url: string | null
  invoice_id: string | null
  occurred_at: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // joined
  parties?: { name: string } | null
}

export interface Invoice {
  id: string
  business_id: string
  party_id: string | null
  invoice_number: string
  issue_date: string
  due_date: string | null
  subtotal_minor: number
  tax_rate_pct: number
  tax_minor: number
  total_minor: number
  paid_amount_minor: number
  status: InvoiceStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // joined
  parties?: { name: string } | null
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  inventory_item_id: string | null
  description: string
  quantity: number
  unit_price_minor: number
  total_minor: number
}

export interface Reconciliation {
  id: string
  business_id: string
  occurred_at: string
  counted_cash_minor: number
  expected_cash_minor: number
  discrepancy_minor: number
  note: string | null
  created_at: string
}

// Supabase Database type for createBrowserClient generic
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business
        Insert: Partial<Business> & { id: string; email: string }
        Update: Partial<Business>
        Relationships: []
      }
      parties: {
        Row: Party
        Insert: Omit<Party, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Party>
        Relationships: []
      }
      inventory_items: {
        Row: InventoryItem
        Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<InventoryItem>
        Relationships: []
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'parties'>
        Update: Partial<Transaction>
        Relationships: []
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'parties'>
        Update: Partial<Invoice>
        Relationships: []
      }
      invoice_items: {
        Row: InvoiceItem
        Insert: Omit<InvoiceItem, 'id'>
        Update: Partial<InvoiceItem>
        Relationships: []
      }
      reconciliations: {
        Row: Reconciliation
        Insert: Omit<Reconciliation, 'id' | 'created_at'>
        Update: Partial<Reconciliation>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      txn_direction: TxnDirection
      invoice_status: InvoiceStatus
    }
  }
}

