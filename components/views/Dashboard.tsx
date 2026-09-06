'use client'

import Image from 'next/image'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  WalletCards,
} from 'lucide-react'
import { useDashboardViewModel } from '@/lib/viewmodels/useDashboard'
import { minorToDisplay } from '@/lib/queries'
import { avatarColor, formatOccurred, initials } from '@/lib/format'
import type { Business, Transaction } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { InteractiveRupeeCrest } from '@/components/ui/InteractiveRupeeCrest'

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

export function Dashboard({ onAdd, business }: { onAdd: () => void; business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const { kpis, transactions, loading } = useDashboardViewModel(currency)

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
              <div className="cash-hero-bg-wrap" aria-hidden="true">
                <Image
                  src="/himalaya.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                  className="cash-hero-bg-img"
                />
                <div className="cash-hero-overlay" />
              </div>
              <div className="hero-top">
                <div>
                  <span className="hero-eyebrow">Cash in hand</span>
                  <h2>{minorToDisplay(kpis?.cashInHand ?? 0, currency)}</h2>
                  <div className="hero-change"><ArrowUpRight size={14} /> Live balance <span>updated now</span></div>
                </div>
                <InteractiveRupeeCrest />
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