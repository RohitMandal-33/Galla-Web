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

import type { ChartData } from '@/lib/queries'

const CAT_COLORS = ['#2d6b4d', '#4a9a72', '#c67462', '#e8a06e', '#8b9e8a']

function CashPulse({ daily }: { daily: ChartData['daily'] }) {
  const W = 96
  const H = 104

  const maxVal = Math.max(...daily.flatMap(d => [d.inflow, d.outflow]), 1)
  const step = W / (daily.length - 1 || 1)

  const toY = (v: number) => H - (v / maxVal) * (H - 4) - 2

  const inflowPts = daily.map((d, i) => `${i * step},${toY(d.inflow)}`).join(' ')
  const outflowPts = daily.map((d, i) => `${i * step},${toY(d.outflow)}`).join(' ')

  // Axis labels — pick max inflow rounded nicely
  const topLabel = maxVal >= 100000
    ? `${Math.round(maxVal / 100000 * 10) / 10}L`
    : maxVal >= 1000
      ? `${Math.round(maxVal / 100) / 10}k`
      : `${Math.round(maxVal / 100)}`
  const midLabel = maxVal >= 100000
    ? `${Math.round(maxVal / 200000 * 10) / 10}L`
    : maxVal >= 1000
      ? `${Math.round(maxVal / 200) / 10}k`
      : `${Math.round(maxVal / 200)}`

  // X-axis: show day of month for 1st, 8th, 15th, 22nd, today
  const xLabels = [0, 7, 14, 21, daily.length - 1].map(idx => {
    const d = daily[idx]
    if (!d) return ''
    if (idx === daily.length - 1) return 'Today'
    return new Date(d.date + 'T00:00:00').getDate().toString()
  })

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
        <div className="chart-y"><span>{topLabel}</span><span>{midLabel}</span><span>0</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Cash inflow and outflow trend">
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2d6b4d" stopOpacity=".2" />
              <stop offset="1" stopColor="#2d6b4d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${H} ${inflowPts} ${W},${H}`}
            fill="url(#area)"
          />
          <polyline points={inflowPts} fill="none" stroke="#2d6b4d" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <polyline points={outflowPts} fill="none" stroke="#c67462" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="chart-x">
        <span>{xLabels[0]}</span>
        <span>{xLabels[1]}</span>
        <span>{xLabels[2]}</span>
        <span>{xLabels[3]}</span>
        <span>{xLabels[4]}</span>
      </div>
    </div>
  )
}


function EmptyDonut() {
  // Manually drawn SVG smiley — no emoji rendering issues
  return (
    <svg viewBox="0 0 100 100" width="110" height="110" aria-label="No expense data yet" role="img">
      {/* Dashed track ring */}
      <circle
        cx="50" cy="50" r="36"
        fill="none"
        stroke="#2a2f27"
        strokeWidth="14"
        strokeDasharray="6 4"
      />
      {/* Face circle */}
      <circle cx="50" cy="50" r="16" fill="#2a2f27" />
      {/* Eyes */}
      <circle cx="44" cy="46" r="2.2" fill="#9b9e97" />
      <circle cx="56" cy="46" r="2.2" fill="#9b9e97" />
      {/* Smile arc */}
      <path
        d="M 43 54 Q 50 60 57 54"
        fill="none"
        stroke="#9b9e97"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CategoryChart({ categories }: { categories: ChartData['categories'] }) {
  const isEmpty = categories.length === 0
  const total = categories.reduce((s, c) => s + c.total, 0)

  // Build SVG donut segments with a small gap between slices
  const R = 36
  const CX = 50
  const CY = 50
  const circumference = 2 * Math.PI * R
  const GAP = 2 // px gap between segments

  let offset = 0
  const segments = categories.map((cat, i) => {
    const pct = total > 0 ? cat.total / total : 0
    const dash = Math.max(pct * circumference - GAP, 0)
    const seg = (
      <circle
        key={cat.name}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={CAT_COLORS[i % CAT_COLORS.length]}
        strokeWidth={14}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
      />
    )
    offset += pct * circumference
    return seg
  })

  const totalDisplay = total >= 100000
    ? `${(total / 100000).toFixed(1)}L`
    : `${(total / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <div className="card category-card">
      <div className="card-heading">
        <div><span className="eyebrow">Expenses</span><h3>Where money goes</h3></div>
        <button className="icon-button"><MoreHorizontal size={18} /></button>
      </div>
      <div className="donut-wrap">
        {isEmpty ? (
          /* ── Empty state: full-width centred layout ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', padding: '8px 0' }}>
            <EmptyDonut />
            <p style={{ color: '#9b9e97', fontSize: '0.78rem', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
              No expenses recorded yet.<br />Add a money-out entry to see the breakdown.
            </p>
          </div>
        ) : (
          <>
            {/* Donut with overlay label */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="110" height="110" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
                {/* Track */}
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--ink-5, #1e2219)" strokeWidth={14} />
                {segments}
              </svg>
              <div className="donut-center" style={{ position: 'absolute' }}>
                <strong>{totalDisplay}</strong>
                <span>outflows</span>
              </div>
            </div>

            {/* Legend */}
            <div className="category-list">
              {categories.map((cat, i) => {
                const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0
                return (
                  <div key={cat.name}>
                    <i style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span>{cat.name}</span>
                    <b>{pct}%</b>
                  </div>
                )
              })}
            </div>
          </>
        )}
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
  const { kpis, transactions, chartData, loading } = useDashboardViewModel(currency)

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
          <button className="primary-button" onClick={onAdd}><Plus size={17} /> Add transaction</button>
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
            <CashPulse daily={chartData?.daily ?? []} />
            <CategoryChart categories={chartData?.categories ?? []} />
          </section>

          <ActivityTable transactions={transactions} currency={currency} />
        </>
      )}
    </div>
  )
}