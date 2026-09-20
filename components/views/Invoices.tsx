'use client'

import Image from 'next/image'
import { CheckCircle2, Clock, FileText, Plus, Trash2, ArrowLeft, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useInvoicesViewModel, type InvoiceLineInput } from '@/lib/viewmodels/useInvoices'
import type { Business } from '@/lib/types'

interface EditableLine {
  id: string
  inventory_item_id?: string | null
  description: string
  quantity: number
  unit_price: number
}

export function Invoices({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const taxRatePct = business?.tax_rate_pct ?? 13

  const {
    invoices,
    parties,
    inventoryItems,
    loading,
    saving,
    error,
    handleCreateInvoice,
    handleMarkPaid,
    handleMarkUnpaid,
    reload,
  } = useInvoicesViewModel()

  const [view, setView] = useState<'create' | 'history'>('create')
  const [selectedPartyId, setSelectedPartyId] = useState<string>('')
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isPaidNow, setIsPaidNow] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [lines, setLines] = useState<EditableLine[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ])

  const selectedParty = useMemo(
    () => parties.find(p => p.id === selectedPartyId),
    [parties, selectedPartyId]
  )

  const subtotal = useMemo(() => {
    return lines.reduce((acc, l) => acc + (l.quantity * l.unit_price), 0)
  }, [lines])

  const tax = useMemo(() => {
    return Math.round(subtotal * (taxRatePct / 100))
  }, [subtotal, taxRatePct])

  const total = subtotal + tax

  const handleItemSelect = (index: number, itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    setLines(prev => {
      const next = [...prev]
      if (item) {
        next[index] = {
          ...next[index],
          inventory_item_id: item.id,
          description: item.name,
          unit_price: item.sale_price_minor / 100,
        }
      } else {
        next[index] = {
          ...next[index],
          inventory_item_id: null,
        }
      }
      return next
    })
  }

  const updateLine = (index: number, field: keyof EditableLine, val: string | number) => {
    setLines(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
  }

  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: String(Date.now()), description: '', quantity: 1, unit_price: 0 },
    ])
  }

  const removeLine = (index: number) => {
    if (lines.length <= 1) return
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0 || !lines.some(l => l.description.trim())) {
      alert('Please add at least one line item with a description')
      return
    }

    try {
      const linePayload: InvoiceLineInput[] = lines
        .filter(l => l.description.trim())
        .map(l => ({
          description: l.description.trim(),
          quantity: Number(l.quantity) || 1,
          unit_price_minor: Math.round((Number(l.unit_price) || 0) * 100),
          inventory_item_id: l.inventory_item_id ?? null,
        }))

      await handleCreateInvoice({
        partyId: selectedPartyId || null,
        issueDate,
        dueDate: dueDate || null,
        taxRatePct,
        notes: notes.trim() || null,
        lines: linePayload,
        isPaidNow,
      })

      setSuccessMessage('Invoice created and synced successfully!')
      setTimeout(() => setSuccessMessage(null), 4000)

      // Reset form
      setLines([{ id: String(Date.now()), description: '', quantity: 1, unit_price: 0 }])
      setNotes('')
      setIsPaidNow(false)
      setSelectedPartyId('')
    } catch {
      // Error handled by viewmodel
    }
  }

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Look sharp, get paid</span>
          <h1>Invoicing<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Create, send, and track professional invoices.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {view === 'create' ? (
            <button className="secondary-button" onClick={() => setView('history')}>
              <FileText size={16} /> Past invoices ({invoices.length})
            </button>
          ) : (
            <button className="secondary-button" onClick={() => setView('create')}>
              <ArrowLeft size={16} /> New invoice
            </button>
          )}
          <button className="icon-button" onClick={() => reload()} title="Refresh invoices">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{
          background: '#ebf5ef',
          border: '1px solid #b7dfc8',
          color: '#1a5c38',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {view === 'history' ? (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Invoice History</h2>
            <button className="primary-button" onClick={() => setView('create')}>
              <Plus size={15} /> Create Invoice
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#888', padding: '32px 0', textAlign: 'center' }}>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#7b877e' }}>
              <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 6px' }}>No invoices yet</p>
              <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Create your first invoice to bill customers and sync with mobile.</p>
              <button className="primary-button" onClick={() => setView('create')}>
                Create invoice now
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9e4dc', textAlign: 'left', color: '#7b877e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 8px' }}>Invoice #</th>
                    <th style={{ padding: '12px 8px' }}>Customer / Party</th>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Due Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const isPaid = inv.status === 'paid'
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #eeeae4' }}>
                        <td style={{ padding: '14px 8px', fontWeight: 600, color: '#20342b' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          {inv.parties?.name ?? inv.party_name ?? 'Walk-in Customer'}
                        </td>
                        <td style={{ padding: '14px 8px', color: '#666' }}>
                          {inv.issue_date}
                        </td>
                        <td style={{ padding: '14px 8px', color: '#666' }}>
                          {inv.due_date ?? '—'}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600, color: '#20342b' }}>
                          {currency} {(inv.total_minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: isPaid ? '#eaf5ed' : '#fff4e5',
                            color: isPaid ? '#226b42' : '#b25e09',
                          }}>
                            {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                          {isPaid ? (
                            <button
                              onClick={() => handleMarkUnpaid(inv.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #e0dad1',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                color: '#666',
                              }}
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              style={{
                                background: '#20533c',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="invoice-layout">
          <form onSubmit={handleSubmit} className="card invoice-editor">
            <div className="editor-top">
              <span className="eyebrow">New invoice</span>
              <span className="invoice-number">Auto-numbered on save</span>
            </div>

            <div className="form-grid">
              <label>Bill to
                <select
                  value={selectedPartyId}
                  onChange={e => setSelectedPartyId(e.target.value)}
                >
                  <option value="">— Walk-in Customer (General) —</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>Issue Date
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  required
                />
              </label>

              <label>Due Date (Optional)
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </label>

              <label>Notes / Terms
                <input
                  type="text"
                  placeholder="Thank you for your business!"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="line-items-head">
              <span>Item description / Product</span>
              <span>Qty</span>
              <span>Rate ({currency})</span>
              <span>Total</span>
            </div>

            {lines.map((line, idx) => (
              <div className="line-item" key={line.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1fr 1fr 28px', gap: '8px', alignItems: 'center' }}>
                <div>
                  {inventoryItems.length > 0 && (
                    <select
                      style={{ marginBottom: '4px', fontSize: '11px', padding: '4px 6px', width: '100%' }}
                      value={line.inventory_item_id ?? ''}
                      onChange={e => handleItemSelect(idx, e.target.value)}
                    >
                      <option value="">— Select inventory item or type below —</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({currency} {(item.sale_price_minor / 100).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    placeholder="Product or service description"
                    value={line.description}
                    onChange={e => updateLine(idx, 'description', e.target.value)}
                    required
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={line.quantity}
                  onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={line.unit_price}
                  onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                  required
                />
                <strong style={{ textAlign: 'right' }}>
                  {currency} {(line.quantity * line.unit_price).toFixed(2)}
                </strong>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#a00', cursor: 'pointer', padding: '4px' }}
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : <span />}
              </div>
            ))}

            <button type="button" className="add-line" onClick={addLine}>
              <Plus size={15} /> Add line item
            </button>

            <div style={{ marginTop: '14px', padding: '12px', background: '#f8f6f2', borderRadius: '6px' }}>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', fontSize: '12px', color: '#20342b' }}>
                <input
                  type="checkbox"
                  checked={isPaidNow}
                  onChange={e => setIsPaidNow(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                <strong>Payment received in full</strong> (records cash in drawer &amp; syncs to mobile)
              </label>
            </div>

            <div className="invoice-total">
              <span>Subtotal</span>
              <strong>{currency} {subtotal.toFixed(2)}</strong>
              <span>Tax ({taxRatePct}%)</span>
              <strong>{currency} {tax.toFixed(2)}</strong>
              <span className="total-label">Total due</span>
              <strong className="grand-total">{currency} {total.toFixed(2)}</strong>
            </div>

            <button type="submit" disabled={saving} className="primary-button full-button">
              <FileText size={16} /> {saving ? 'Saving & Syncing...' : 'Save & Record Invoice'}
            </button>
          </form>

          <div className="card invoice-preview">
            <div className="preview-toolbar">
              <span>Live preview</span>
              <div>
                <button className="preview-active">A4</button>
              </div>
            </div>

            <div className="paper">
              <div className="paper-header">
                <Image src="/galla_logo.png" alt="Galla" width={28} height={28} className="paper-logo-img" />
                <div>
                  <strong>{business?.name ?? 'galla'}</strong>
                  <span>Simple business, clear mind.</span>
                </div>
                <span className="paper-invoice">
                  INVOICE<br />
                  <b># DRAFT</b>
                </span>
              </div>
              <div className="paper-rule" />
              <div className="bill-row">
                <div>
                  <small>BILLED TO</small>
                  <strong>{selectedParty?.name ?? 'Walk-in Customer'}</strong>
                  {selectedParty?.phone && <span>{selectedParty.phone}</span>}
                </div>
                <div>
                  <small>DATE ISSUED</small>
                  <strong>{issueDate}</strong>
                  {dueDate && <span>Due: {dueDate}</span>}
                </div>
              </div>
              <div className="paper-items">
                <div className="paper-item head">
                  <span>DESCRIPTION</span>
                  <span>QTY</span>
                  <span>AMOUNT</span>
                </div>
                {lines.map((l, i) => (
                  <div className="paper-item" key={i}>
                    <span>{l.description || `Item ${i + 1}`}</span>
                    <span>{l.quantity}</span>
                    <strong>{currency} {(l.quantity * l.unit_price).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
              <div className="paper-total">
                <span>Total due</span>
                <strong>{currency} {total.toFixed(2)}</strong>
              </div>
              <div className="paper-footer">
                {notes ? <div style={{ marginBottom: '8px', color: '#444' }}>Note: {notes}</div> : null}
                Thank you for your business.<br />
                <span>{business?.name ?? 'galla'} · Powered by Galla</span>
              </div>
            </div>

            <button className="outline-button print-button" onClick={() => window.print()}>
              <FileText size={15} /> Print preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}