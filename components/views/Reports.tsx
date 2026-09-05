'use client'

import { ArrowDownLeft, ChevronDown, ChevronRight, FileText, Sparkles } from 'lucide-react'

export function Reports() {
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