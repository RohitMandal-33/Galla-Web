'use client'

import { ArrowDownLeft, FileText, Sparkles, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useReportsViewModel, type ReportPeriod } from '@/lib/viewmodels/useReports'
import type { Business } from '@/lib/types'

export function Reports({ business }: { business?: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const { period, setPeriod, data, loading, periodLabel } = useReportsViewModel()

  const moneyIn = (data?.moneyInMinor ?? 0) / 100
  const moneyOut = (data?.moneyOutMinor ?? 0) / 100
  const net = (data?.netMinor ?? 0) / 100
  const udhaarGiven = (data?.udhaarGivenMinor ?? 0) / 100
  const udhaarCollected = (data?.udhaarCollectedMinor ?? 0) / 100
  const outstandingUdhaar = (data?.outstandingReceivableMinor ?? 0) / 100

  const handleDownloadCSV = () => {
    if (!data) return
    const rows = [
      ['Metric', 'Amount', 'Currency'],
      ['Period', periodLabel, ''],
      ['Total Money In (Revenue)', moneyIn.toFixed(2), currency],
      ['Total Money Out (Expenses)', moneyOut.toFixed(2), currency],
      ['Net Profit / Cash', net.toFixed(2), currency],
      ['Udhaar Given (Credit Out)', udhaarGiven.toFixed(2), currency],
      ['Udhaar Collected (Credit In)', udhaarCollected.toFixed(2), currency],
      ['Total Outstanding Market Credit', outstandingUdhaar.toFixed(2), currency],
      ['Tax Estimate', ((data.taxMinor ?? 0) / 100).toFixed(2), currency],
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `galla_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">A clearer view of growth</span>
          <h1>Reports<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Real-time financial performance and profit &amp; loss analysis.</p>
        </div>
        <div className="title-actions">
          <button className="secondary-button" onClick={handleExportPDF}>
            <FileText size={15} /> Export PDF
          </button>
          <button className="primary-button" onClick={handleDownloadCSV}>
            <ArrowDownLeft size={15} /> Download CSV
          </button>
        </div>
      </div>

      <div className="report-controls card">
        <div className="report-tabs">
          {(['today', '7d', '30d', 'month'] as ReportPeriod[]).map(p => {
            const labels: Record<ReportPeriod, string> = {
              today: 'Today',
              '7d': '7 days',
              '30d': '30 days',
              month: 'This month',
            }
            return (
              <button
                key={p}
                className={period === p ? 'active' : ''}
                onClick={() => setPeriod(p)}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>
        <span className="report-date">{periodLabel}</span>
      </div>

      <div className="report-grid">
        <div className="card pl-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Profit &amp; loss statement</span>
              <h3>{periodLabel}</h3>
            </div>
            <span className="report-positive">Live Synced</span>
          </div>

          <div className="pl-rows">
            <div>
              <span>Total Revenue (Sales &amp; Cash In)</span>
              <strong className="positive" style={{ color: '#2d6b4d' }}>
                {currency} {moneyIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span>Total Expenses (Purchases &amp; Operations)</span>
              <strong className="negative" style={{ color: '#b45f50' }}>
                {currency} {moneyOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="highlight">
              <span>Gross Operating Result</span>
              <strong>
                {currency} {(moneyIn - moneyOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span>Estimated Tax ({business?.tax_rate_pct ?? 13}%)</span>
              <strong style={{ color: '#666' }}>
                {currency} {((data?.taxMinor ?? 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span>Udhaar Given to Customers</span>
              <strong style={{ color: '#c27803' }}>
                {currency} {udhaarGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span>Udhaar Recovered</span>
              <strong style={{ color: '#2d6b4d' }}>
                {currency} {udhaarCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="net-row">
              <span>Net Profit / Net Cashflow</span>
              <strong style={{ color: net >= 0 ? '#20533c' : '#b45f50', fontSize: '18px' }}>
                {currency} {net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        <div className="card insight-card">
          <div className="insight-icon">
            <Sparkles size={18} />
          </div>
          <span className="eyebrow">Smart Insights</span>
          <h3>{net >= 0 ? 'Profitable Flow' : 'Negative Cashflow'}</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: '1.6' }}>
            {net >= 0
              ? `Your business is net positive by ${currency} ${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })} this period. Keep collecting credit on time.`
              : `Expenses exceeded inflows by ${currency} ${Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Review top expense categories below.`}
          </p>

          <div style={{ marginTop: '16px', borderTop: '1px solid #dce8da', paddingTop: '14px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#66746b', marginBottom: '8px' }}>
              Top Expense Categories
            </div>
            {data?.topCategories && data.topCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.topCategories.map(cat => (
                  <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#273b31', fontWeight: 500 }}>{cat.name}</span>
                    <strong style={{ color: '#555' }}>
                      {currency} {(cat.total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>No categorised expenses in this period.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card monthly-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">Overview</span>
            <h3>Cash Flow Balance ({periodLabel})</h3>
          </div>
          <span className="chart-total">
            {currency} {(moneyIn + moneyOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Total volume
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px 0 8px' }}>
          <div style={{ background: '#f6faf7', padding: '16px', borderRadius: '8px', border: '1px solid #d8e8dc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2d6b4d', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <TrendingUp size={16} /> Total Inflow
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a5c38' }}>
              {currency} {moneyIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: '#667', marginTop: '4px' }}>
              Cash: {currency} {((data?.cashInMinor ?? 0) / 100).toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#fdf7f6', padding: '16px', borderRadius: '8px', border: '1px solid #f2dad7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45f50', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <TrendingDown size={16} /> Total Outflow
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#992d1c' }}>
              {currency} {moneyOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: '#667', marginTop: '4px' }}>
              Cash: {currency} {((data?.cashOutMinor ?? 0) / 100).toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#fbf8f0', padding: '16px', borderRadius: '8px', border: '1px solid #fae8bd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b08b30', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <DollarSign size={16} /> Market Udhaar (Receivable)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#806117' }}>
              {currency} {outstandingUdhaar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: '#667', marginTop: '4px' }}>
              Active customer debts in Khata
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}