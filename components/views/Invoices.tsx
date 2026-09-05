'use client'

import Image from 'next/image'
import { FileText, MoreHorizontal, Plus } from 'lucide-react'
import { useState } from 'react'
import { useInvoicesViewModel } from '@/lib/viewmodels/useInvoices'
import type { Business } from '@/lib/types'

export function Invoices({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const { parties } = useInvoicesViewModel()
  const [lineItems, setLineItems] = useState(1)

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
              <Image src="/galla_logo.png" alt="Galla" width={28} height={28} className="paper-logo-img" />
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