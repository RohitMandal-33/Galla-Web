'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useSupabase } from '@/lib/supabase-provider'
import {
  addTransaction,
  getBusiness,
  getDashboardKPIs,
  getInventoryItems,
  getParties,
  getPartyTransactions,
  getRecentTransactions,
  minorToDisplay,
  updateBusiness,
} from '@/lib/queries'
import type { Business, InventoryItem, Party, Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase'

type NavKey = 'Pulse' | 'Khata' | 'Stock' | 'Invoices' | 'Reports' | 'Settings'

const navItems: { label: NavKey; icon: typeof LayoutDashboard }[] = [
  { label: 'Pulse', icon: LayoutDashboard },
  { label: 'Khata', icon: WalletCards },
  { label: 'Stock', icon: Boxes },
  { label: 'Invoices', icon: FileText },
  { label: 'Reports', icon: BarChart3 },
]

// ─── Utilities ──────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = ['blue', 'sand', 'rose', 'green', 'forest']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatOccurred(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ initials: inits, color }: { initials: string; color: string }) {
  return <span className={`avatar avatar-${color}`}>{inits}</span>
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#78817b' }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )
}

function Sidebar({
  active,
  setActive,
  open,
  setOpen,
  business,
}: {
  active: NavKey
  setActive: (key: NavKey) => void
  open: boolean
  setOpen: (value: boolean) => void
  business: Business | null
}) {
  const { signOut } = useSupabase()
  const displayName = business?.name ?? 'My Business'
  const userInitials = initials(displayName)
  const userColor = avatarColor(displayName)

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark">g</div>
        <span className="brand-name">galla</span>
        <button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <div className="branch-switch">
        <span className="branch-dot" />
        <span className="branch-name">{displayName}</span>
        <ChevronDown size={14} />
      </div>
      <nav className="main-nav">
        <div className="nav-label">Workspace</div>
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? 'active' : ''}`}
            onClick={() => { setActive(label); setOpen(false) }}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Pulse' && <span className="live-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="nav-label">Account</div>
        <button
          className={`nav-item ${active === 'Settings' ? 'active' : ''}`}
          onClick={() => { setActive('Settings'); setOpen(false) }}
        >
          <Settings size={18} strokeWidth={1.8} />
          <span>Settings</span>
        </button>
        <div className="profile-mini">
          <Avatar initials={userInitials} color={userColor} />
          <div>
            <strong>{displayName}</strong>
            <small>Owner account</small>
          </div>
          <button
            className="icon-button"
            onClick={signOut}
            title="Sign out"
            style={{ marginLeft: 'auto' }}
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
        <div className="sidebar-foot">
          <span>Galla v1.0</span>
          <CircleHelp size={15} />
        </div>
      </div>
    </aside>
  )
}

function Topbar({
  onMenu,
  onAdd,
  query,
  setQuery,
  business,
}: {
  onMenu: () => void
  onAdd: () => void
  query: string
  setQuery: (value: string) => void
  business: Business | null
}) {
  const displayName = business?.name ?? 'My Business'
  const userInitials = initials(displayName)
  const userColor = avatarColor(displayName)
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="top-search">
        <Search size={17} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions, parties, items" />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <button className="icon-button notification" aria-label="Notifications">
          <Bell size={18} />
          <span />
        </button>
        <button className="add-button" onClick={onAdd}>
          <Plus size={17} /> Add entry <kbd>N</kbd>
        </button>
        <Avatar initials={userInitials} color={userColor} />
      </div>
    </header>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function CashPulse() {
  const points = [42, 55, 49, 68, 58, 77, 70, 86, 72, 91, 84, 96]
  const out = [34, 42, 38, 48, 44, 55, 50, 61, 53, 64, 61, 68]
  const path = points.map((point, index) => `${index * 8.7},${104 - point}`).join(' ')
  const outPath = out.map((point, index) => `${index * 8.7},${104 - point}`).join(' ')
  return (
    <div className="card pulse-chart">
      <div className="card-heading">
        <div><span className="eyebrow">Cash pulse</span><h3>Inflow &amp; outflow</h3></div>
        <button className="range-button">Last 30 days <ChevronDown size={14} /></button>
      </div>
      <div className="chart-legend">
        <span><i className="legend-in" /> Inflow</span>
        <span><i className="legend-out" /> Outflow</span>
        <span className="chart-total">Live data</span>
      </div>
      <div className="line-chart">
        <div className="chart-y"><span>50k</span><span>25k</span><span>0</span></div>
        <svg viewBox="0 0 96 104" preserveAspectRatio="none" role="img" aria-label="Cash inflow and outflow trend">
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2d6b4d" stopOpacity=".2" />
              <stop offset="1" stopColor="#2d6b4d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,104 ${path} 96,104`} fill="url(#area)" />
          <polyline points={path} fill="none" stroke="#2d6b4d" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <polyline points={outPath} fill="none" stroke="#c67462" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="chart-x"><span>1</span><span>8</span><span>15</span><span>22</span><span>Today</span></div>
    </div>
  )
}

function CategoryChart() {
  return (
    <div className="card category-card">
      <div className="card-heading">
        <div><span className="eyebrow">Expenses</span><h3>Where money goes</h3></div>
        <button className="icon-button"><MoreHorizontal size={18} /></button>
      </div>
      <div className="donut-wrap">
        <div className="donut"><div className="donut-center"><strong>Live</strong><span>synced</span></div></div>
        <div className="category-list">
          <div><i className="cat-a" /><span>Inventory</span><b>—</b></div>
          <div><i className="cat-b" /><span>Operations</span><b>—</b></div>
          <div><i className="cat-c" /><span>Utilities</span><b>—</b></div>
          <div><i className="cat-d" /><span>Other</span><b>—</b></div>
        </div>
      </div>
    </div>
  )
}

function ActivityTable({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  return (
    <div className="card activity-card">
      <div className="card-heading">
        <div><span className="eyebrow">Live ledger</span><h3>Recent activity</h3></div>
        <button className="text-button">View all <ChevronRight size={15} /></button>
      </div>
      <div className="activity-table">
        <div className="table-row table-head">
          <span>Transaction</span><span>Category</span><span>Time</span><span className="align-right">Amount</span><span />
        </div>
        {transactions.length === 0 && (
          <div className="table-row" style={{ color: '#9b9e97', fontStyle: 'italic' }}>
            <span style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '18px 0' }}>No transactions yet. Add your first entry!</span>
          </div>
        )}
        {transactions.map(item => {
          const partyName = item.parties?.name ?? item.note ?? 'Manual entry'
          const color = avatarColor(partyName)
          return (
            <div className="table-row" key={item.id}>
              <div className="transaction-name">
                <Avatar initials={initials(partyName)} color={color} />
                <div>
                  <strong>{partyName}</strong>
                  <small>{item.direction === 'money_in' ? 'Money in' : 'Money out'}</small>
                </div>
              </div>
              <span className="muted-text">{item.category ?? '—'}</span>
              <span className="muted-text">{formatOccurred(item.occurred_at)}</span>
              <strong className={`amount ${item.direction === 'money_in' ? 'in' : 'out'}`}>
                {item.direction === 'money_in' ? '+ ' : '− '}{minorToDisplay(item.amount_minor, currency)}
              </strong>
              <button className="more-button"><MoreHorizontal size={17} /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Dashboard({ onAdd, business }: { onAdd: () => void; business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getDashboardKPIs>> | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [k, t] = await Promise.all([getDashboardKPIs(currency), getRecentTransactions(20)])
      setKpis(k)
      setTransactions(t)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [currency])

  useEffect(() => {
    load()

    // Realtime subscription for transactions
    const supabase = createClient()
    const sub = supabase
      .channel('transactions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => load())
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [load])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">{today}</span>
          <h1>{greeting}<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Here is what is happening in your business today.</p>
        </div>
        <div className="title-actions">
          <button className="secondary-button"><Activity size={16} /> Reconcile</button>
          <button className="primary-button" onClick={onAdd}><Plus size={17} /> Add entry</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <section className="hero-grid">
            <div className="cash-hero">
              <div className="hero-top">
                <div>
                  <span className="hero-eyebrow">Cash in hand</span>
                  <h2>{minorToDisplay(kpis?.cashInHand ?? 0, currency)}</h2>
                  <div className="hero-change"><ArrowUpRight size={14} /> Live balance <span>updated now</span></div>
                </div>
                <div className="hero-art">
                  <div className="hero-ring ring-one" />
                  <div className="hero-ring ring-two" />
                  <span>रु</span>
                </div>
              </div>
              <div className="hero-footer">
                <span>Based on all recorded transactions</span>
                <button className="hero-action">Count till <ChevronRight size={14} /></button>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="mini-kpi">
                <div className="kpi-icon kpi-green"><ArrowDownLeft size={17} /></div>
                <span>Sales today</span>
                <strong>{minorToDisplay(kpis?.salesToday ?? 0, currency)}</strong>
                <small className="positive">Money in</small>
              </div>
              <div className="mini-kpi">
                <div className="kpi-icon kpi-red"><ArrowUpRight size={17} /></div>
                <span>Expenses today</span>
                <strong>{minorToDisplay(kpis?.expensesToday ?? 0, currency)}</strong>
                <small className="negative">Money out</small>
              </div>
              <div className="mini-kpi">
                <div className="kpi-icon kpi-amber"><WalletCards size={17} /></div>
                <span>To collect udhaar</span>
                <strong>{minorToDisplay(kpis?.udhaar ?? 0, currency)}</strong>
                <small className="amber-text">{kpis?.activeDebtors ?? 0} active debtors</small>
              </div>
              <div className="mini-kpi">
                <div className="kpi-icon kpi-ink"><BarChart3 size={17} /></div>
                <span>Net balance</span>
                <strong>{minorToDisplay(kpis?.cashInHand ?? 0, currency)}</strong>
                <small className={(kpis?.cashInHand ?? 0) >= 0 ? 'positive' : 'negative'}>
                  {(kpis?.cashInHand ?? 0) >= 0 ? 'Positive' : 'Negative'}
                </small>
              </div>
            </div>
          </section>

          <section className="charts-grid">
            <CashPulse />
            <CategoryChart />
          </section>

          <ActivityTable transactions={transactions} currency={currency} />
        </>
      )}
    </div>
  )
}

// ─── Khata ───────────────────────────────────────────────────────────────────

function Khata({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const [parties, setParties] = useState<Party[]>([])
  const [selected, setSelected] = useState(0)
  const [partyTxns, setPartyTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'collect' | 'pay'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getParties().then(p => {
      setParties(p)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (parties.length === 0) return
    const party = filteredParties[selected] ?? parties[0]
    if (!party) return
    getPartyTransactions(party.id).then(setPartyTxns)
  }, [parties, selected, filter, search]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredParties = useMemo(() => {
    let list = parties
    if (filter === 'collect') list = list.filter(p => p.balance_minor > 0)
    if (filter === 'pay') list = list.filter(p => p.balance_minor < 0)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [parties, filter, search])

  const party = filteredParties[selected]

  if (loading) return <div className="page-content"><Spinner /></div>

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Your people, your trust</span>
          <h1>Khata<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Keep every promise and payment in one clear place.</p>
        </div>
        <button className="primary-button"><Plus size={17} /> Add party</button>
      </div>

      <div className="khata-layout card">
        {/* Party pane */}
        <div className="party-pane">
          <div className="pane-header">
            <strong>All parties</strong>
            <span className="count-badge">{parties.length}</span>
            <button className="icon-button"><Plus size={17} /></button>
          </div>
          <div className="small-search">
            <Search size={15} />
            <input placeholder="Find a party" value={search} onChange={e => { setSearch(e.target.value); setSelected(0) }} />
          </div>
          <div className="filter-tabs">
            <button className={filter === 'all' ? 'selected' : ''} onClick={() => { setFilter('all'); setSelected(0) }}>All <span>{parties.length}</span></button>
            <button className={filter === 'collect' ? 'selected' : ''} onClick={() => { setFilter('collect'); setSelected(0) }}>To collect <span>{parties.filter(p => p.balance_minor > 0).length}</span></button>
            <button className={filter === 'pay' ? 'selected' : ''} onClick={() => { setFilter('pay'); setSelected(0) }}>To pay <span>{parties.filter(p => p.balance_minor < 0).length}</span></button>
          </div>
          <div className="party-list">
            {filteredParties.length === 0 && (
              <p style={{ padding: '20px', color: '#9b9e97', fontSize: '12px', textAlign: 'center' }}>
                No parties yet. Add your first party.
              </p>
            )}
            {filteredParties.map((item, index) => (
              <button
                className={`party-row ${selected === index ? 'selected' : ''}`}
                onClick={() => setSelected(index)}
                key={item.id}
              >
                <Avatar initials={initials(item.name)} color={avatarColor(item.name)} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.phone ?? '—'}</small>
                </span>
                <span className={`party-balance ${item.balance_minor >= 0 ? 'collect' : 'pay'}`}>
                  <strong>{minorToDisplay(Math.abs(item.balance_minor), currency)}</strong>
                  <small>{item.balance_minor >= 0 ? 'to collect' : 'to pay'}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statement pane */}
        {party ? (
          <div className="statement-pane">
            <div className="statement-head">
              <div className="party-title">
                <Avatar initials={initials(party.name)} color={avatarColor(party.name)} />
                <div>
                  <h2>{party.name}</h2>
                  <span>{party.phone ?? 'No phone'}</span>
                </div>
              </div>
              <button className="icon-button"><MoreHorizontal size={19} /></button>
            </div>
            <div className="statement-balance">
              <div>
                <span>Net balance</span>
                <strong>{minorToDisplay(Math.abs(party.balance_minor), currency)}</strong>
                <small>{party.balance_minor >= 0 ? 'They owe you' : 'You owe them'}</small>
              </div>
              <div className="statement-actions">
                <button className="amber-button"><ArrowUpRight size={15} /> Give udhaar</button>
                <button className="green-button"><ArrowDownLeft size={15} /> Receive payment</button>
              </div>
            </div>
            <div className="statement-table">
              <div className="statement-line head">
                <span>Date</span><span>Description</span><span>Type</span><span className="align-right">Amount</span>
              </div>
              {partyTxns.length === 0 && (
                <div className="statement-line">
                  <span className="muted-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '14px 0', fontStyle: 'italic' }}>No transactions recorded.</span>
                </div>
              )}
              {partyTxns.map(t => (
                <div className="statement-line" key={t.id}>
                  <span className="muted-text">{formatShortDate(t.occurred_at)}</span>
                  <strong>{t.note ?? (t.direction === 'money_in' ? 'Payment received' : 'Payment made')}</strong>
                  <span className="tag">{t.category ?? (t.is_credit ? 'Credit' : 'Cash')}</span>
                  <strong className="align-right">{minorToDisplay(t.amount_minor, currency)}</strong>
                </div>
              ))}
            </div>
            <button className="outline-button"><FileText size={15} /> Download statement</button>
          </div>
        ) : (
          <div className="statement-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b9e97' }}>
            Select a party to view their statement.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stock ────────────────────────────────────────────────────────────────────

function Stock({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
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

  const stockStatus = (item: InventoryItem) => {
    if (item.current_quantity === 0) return 'Critical'
    if (item.current_quantity <= item.low_stock_threshold) return 'Low stock'
    return 'Healthy'
  }

  if (loading) return <div className="page-content"><Spinner /></div>

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Know what is moving</span>
          <h1>Stock<span className="title-dot">.</span></h1>
          <p className="page-subtitle">{items.length} items in your inventory, worth {minorToDisplay(totalValue, currency)}.</p>
        </div>
        <button className="primary-button"><Plus size={17} /> Add item</button>
      </div>

      <div className="stock-summary">
        <div><span>Total valuation</span><strong>{minorToDisplay(totalValue, currency)}</strong></div>
        <div><span>Items in stock</span><strong>{items.length}</strong></div>
        <div><span>Low stock alerts</span><strong className="amber-text">{lowCount}</strong></div>
        <div><span>Out of stock</span><strong className="negative">{outCount}</strong></div>
      </div>

      <div className="card stock-card">
        <div className="stock-toolbar">
          <div className="small-search">
            <Search size={15} />
            <input placeholder="Search inventory" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="stock-filters">
            <button className={`filter-chip ${!filterLow ? 'active' : ''}`} onClick={() => setFilterLow(false)}>All items</button>
            <button className={`filter-chip ${filterLow ? 'active' : ''}`} onClick={() => setFilterLow(true)}>Low stock</button>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
        </div>
        <div className="stock-table">
          <div className="stock-row stock-head">
            <span>Item</span><span>Current stock</span><span>Cost price</span><span>Sale price</span><span>Valuation</span><span>Status</span><span />
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9b9e97', fontStyle: 'italic', fontSize: '12px' }}>
              No items found. Add your first inventory item.
            </div>
          )}
          {filtered.map(item => {
            const status = stockStatus(item)
            const valuation = item.current_quantity * item.sale_price_minor
            return (
              <div className="stock-row" key={item.id}>
                <div className="stock-item">
                  <span className="item-icon"><Package size={16} /></span>
                  <strong>{item.name}</strong>
                </div>
                <span><strong>{item.current_quantity}</strong> <small>{item.unit}</small></span>
                <span>{minorToDisplay(item.cost_price_minor, currency)}</span>
                <span>{minorToDisplay(item.sale_price_minor, currency)}</span>
                <strong>{minorToDisplay(valuation, currency)}</strong>
                <span className={`stock-status ${status === 'Healthy' ? 'healthy' : status === 'Low stock' ? 'low' : 'critical'}`}>
                  <i />{status}
                </span>
                <button className="more-button"><MoreHorizontal size={17} /></button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Invoices (create-form, wired to Supabase party list) ─────────────────────

function Invoices({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const [lineItems, setLineItems] = useState(1)
  const [parties, setParties] = useState<Party[]>([])

  useEffect(() => { getParties().then(setParties) }, [])

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Look sharp, get paid</span>
          <h1>Invoicing<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Create a clean invoice in seconds.</p>
        </div>
        <button className="secondary-button"><FileText size={16} /> Past invoices</button>
      </div>

      <div className="invoice-layout">
        <div className="card invoice-editor">
          <div className="editor-top">
            <span className="eyebrow">New invoice</span>
            <span className="invoice-number"># INV-{String(Date.now()).slice(-4)}</span>
          </div>
          <div className="form-grid">
            <label>Bill to
              <select>
                {parties.length === 0 && <option>— no parties yet —</option>}
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>Invoice date<input type="text" defaultValue={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} /></label>
          </div>
          <div className="line-items-head">
            <span>Item description</span><span>Qty</span><span>Rate</span><span>Total</span>
          </div>
          {Array.from({ length: lineItems }).map((_, i) => (
            <div className="line-item" key={i}>
              <input placeholder="Item or service description" />
              <input defaultValue="1" />
              <input placeholder={`${currency} 0`} />
              <strong>{currency} 0</strong>
            </div>
          ))}
          <button className="add-line" onClick={() => setLineItems(l => l + 1)}>
            <Plus size={15} /> Add line item
          </button>
          <div className="invoice-total">
            <span>Subtotal</span><strong>{currency} 0</strong>
            <span>Tax ({business?.tax_rate_pct ?? 0}%)</span><strong>{currency} 0</strong>
            <span className="total-label">Total due</span><strong className="grand-total">{currency} 0</strong>
          </div>
          <button className="primary-button full-button"><FileText size={16} /> Save &amp; send invoice</button>
        </div>

        <div className="card invoice-preview">
          <div className="preview-toolbar">
            <span>Live preview</span>
            <div>
              <button className="preview-active">A4</button>
              <button>Thermal</button>
              <button className="icon-button"><MoreHorizontal size={17} /></button>
            </div>
          </div>
          <div className="paper">
            <div className="paper-header">
              <div className="paper-logo">g</div>
              <div><strong>galla</strong><span>Simple business, clear mind.</span></div>
              <span className="paper-invoice">INVOICE<br /><b># INV-{String(Date.now()).slice(-4)}</b></span>
            </div>
            <div className="paper-rule" />
            <div className="bill-row">
              <div><small>BILLED TO</small><strong>{parties[0]?.name ?? '—'}</strong></div>
              <div><small>DATE ISSUED</small><strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
            </div>
            <div className="paper-items">
              <div className="paper-item head"><span>DESCRIPTION</span><span>QTY</span><span>AMOUNT</span></div>
              {Array.from({ length: lineItems }).map((_, i) => (
                <div className="paper-item" key={i}>
                  <span>Line item {i + 1}</span><span>1</span><strong>{currency} 0</strong>
                </div>
              ))}
            </div>
            <div className="paper-total"><span>Total due</span><strong>{currency} 0</strong></div>
            <div className="paper-footer">
              Thank you for your business.<br /><span>galla · {business?.name ?? 'My Business'}</span>
            </div>
          </div>
          <button className="outline-button print-button"><FileText size={15} /> Print invoice</button>
        </div>
      </div>
    </div>
  )
}

// ─── Reports ─────────────────────────────────────────────────────────────────

function Reports() {
  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">A clearer view of growth</span>
          <h1>Reports<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Understand the numbers behind your next decision.</p>
        </div>
        <div className="title-actions">
          <button className="secondary-button"><FileText size={15} /> Export PDF</button>
          <button className="primary-button"><ArrowDownLeft size={15} /> Download CSV</button>
        </div>
      </div>
      <div className="report-controls card">
        <div className="report-tabs">
          <button>Today</button><button>7 days</button>
          <button className="active">30 days</button><button>This month</button><button>Custom range</button>
        </div>
        <span className="report-date">Last 30 days <ChevronDown size={14} /></span>
      </div>
      <div className="report-grid">
        <div className="card pl-card">
          <div className="card-heading">
            <div><span className="eyebrow">Profit &amp; loss</span><h3>This period</h3></div>
            <span className="report-positive">Live</span>
          </div>
          <div className="pl-rows">
            <div><span>Revenue</span><strong className="positive">—</strong></div>
            <div><span>Cost of goods sold</span><strong className="negative">—</strong></div>
            <div className="highlight"><span>Gross profit</span><strong>—</strong></div>
            <div><span>Operating expenses</span><strong className="negative">—</strong></div>
            <div className="net-row"><span>Net cash</span><strong>—</strong></div>
          </div>
        </div>
        <div className="card insight-card">
          <div className="insight-icon"><Sparkles size={18} /></div>
          <span className="eyebrow">Galla insight</span>
          <h3>Reports coming soon.</h3>
          <p>Connect your transactions and inventory to unlock detailed P&L reports, category breakdowns, and AI-powered insights.</p>
          <button className="text-button">Add first entry <ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="card monthly-card">
        <div className="card-heading">
          <div><span className="eyebrow">Performance</span><h3>Revenue vs expenses</h3></div>
          <span className="chart-total">This period</span>
        </div>
        <div className="bar-chart">
          {[20, 30, 25, 40, 35, 50, 60].map((height, i) => (
            <div className="bar-column" key={i}>
              <div className="bars">
                <i style={{ height: `${height}%` }} />
                <i style={{ height: `${height * 0.55}%` }} />
              </div>
              <span>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsPage({ business, onBusinessUpdate }: { business: Business | null; onBusinessUpdate: (b: Business) => void }) {
  const { user, signOut } = useSupabase()
  const [name, setName] = useState(business?.name ?? '')
  const [currency, setCurrency] = useState(business?.currency ?? 'NPR')
  const [taxRate, setTaxRate] = useState(String(business?.tax_rate_pct ?? 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(business?.name ?? '')
    setCurrency(business?.currency ?? 'NPR')
    setTaxRate(String(business?.tax_rate_pct ?? 0))
  }, [business])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateBusiness({ name, currency, tax_rate_pct: parseFloat(taxRate) || 0 })
      // Optimistic update
      if (business) onBusinessUpdate({ ...business, name, currency, tax_rate_pct: parseFloat(taxRate) || 0 })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h1>Settings<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Your business, your rules.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="settings-nav card">
          <button className="active"><Store size={17} /> Business profile</button>
          <button><UserRound size={17} /> Account &amp; session</button>
          <button><Bell size={17} /> Notifications</button>
        </div>
        <div className="card settings-card">
          <span className="eyebrow">Business profile</span>
          <h3>Tell us about your shop</h3>
          <div className="settings-form">
            <label>Business name<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email<input value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} /></label>
            <label>Currency
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="NPR">NPR — Nepalese Rupee</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </label>
            <label>Tax rate (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="settings-save">
            <span>{saved ? '✓ Saved!' : 'Changes are saved when you click Save.'}</span>
            <button className="primary-button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
      <div className="card session-card">
        <div className="session-icon"><UserRound size={19} /></div>
        <div>
          <span className="eyebrow">Current session</span>
          <h3>{user?.email}</h3>
          <p>Authenticated with Supabase. Your data is private and encrypted.</p>
        </div>
        <button className="secondary-button" onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}

// ─── Quick Add Modal ───────────────────────────────────────────────────────────

function QuickAdd({ close, onSaved, currency }: { close: () => void; onSaved: () => void; currency: string }) {
  const [direction, setDirection] = useState<'money_in' | 'money_out'>('money_in')
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('Sales')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const amount = parseFloat(amountStr)
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    try {
      await addTransaction({
        direction,
        amount_minor: Math.round(amount * 100),
        note: note || undefined,
        category,
      })
      onSaved()
      close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Enter' && !saving) handleSave()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [amountStr, note, category, direction, saving]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="quick-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">Quick entry</span><h2>What happened?</h2></div>
          <button className="icon-button" onClick={close}><X size={18} /></button>
        </div>
        <div className="entry-type">
          <button className={direction === 'money_in' ? 'active' : ''} onClick={() => setDirection('money_in')}>
            <ArrowDownLeft size={16} /> Money in
          </button>
          <button className={direction === 'money_out' ? 'active' : ''} onClick={() => setDirection('money_out')}>
            <ArrowUpRight size={16} /> Money out
          </button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}
        <label>Amount<input autoFocus placeholder={`${currency} 0.00`} value={amountStr} onChange={e => { setAmountStr(e.target.value); setError(null) }} /></label>
        <label>Note (optional)<input placeholder="e.g. Rohan General Store" value={note} onChange={e => setNote(e.target.value)} /></label>
        <label>Category
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>Sales</option>
            <option>Inventory</option>
            <option>Operations</option>
            <option>Utilities</option>
            <option>Other</option>
          </select>
        </label>
        <button className="primary-button full-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save entry'}
        </button>
        <span className="modal-hint">Press Enter to save · Esc to close</span>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { user, loading: authLoading } = useSupabase()
  const [active, setActive] = useState<NavKey>('Pulse')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [business, setBusiness] = useState<Business | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    getBusiness().then(setBusiness).catch(console.error)
  }, [user])

  // Keyboard shortcut: N = new entry
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setShowQuickAdd(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spinner /></div>
  }

  const page = (() => {
    switch (active) {
      case 'Pulse': return <Dashboard key={refreshKey} onAdd={() => setShowQuickAdd(true)} business={business} />
      case 'Khata': return <Khata business={business} />
      case 'Stock': return <Stock business={business} />
      case 'Invoices': return <Invoices business={business} />
      case 'Reports': return <Reports />
      case 'Settings': return <SettingsPage business={business} onBusinessUpdate={setBusiness} />
    }
  })()

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} open={menuOpen} setOpen={setMenuOpen} business={business} />
      <div className="main-shell">
        <Topbar
          onMenu={() => setMenuOpen(true)}
          onAdd={() => setShowQuickAdd(true)}
          query={query}
          setQuery={setQuery}
          business={business}
        />
        <main>{page}</main>
      </div>
      {showQuickAdd && (
        <QuickAdd
          close={() => setShowQuickAdd(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
          currency={business?.currency ?? 'NPR'}
        />
      )}
    </div>
  )
}
