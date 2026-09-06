'use client'

import { useEffect, useRef, useState } from 'react'
import { Package, X, Plus } from 'lucide-react'
import { addInventoryItem } from '@/lib/queries'
import type { InventoryItem } from '@/lib/types'

interface AddItemModalProps {
  close: () => void
  onSaved: (item: InventoryItem) => void
  currency?: string
}

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'bag', 'dozen', 'pair', 'set', 'roll', 'sheet']

export function AddItemModal({ close, onSaved, currency = 'NPR' }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [quantity, setQuantity] = useState('')
  const [lowThreshold, setLowThreshold] = useState('5')
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  const parseMoney = (val: string) => {
    const n = parseFloat(val.replace(/,/g, ''))
    return isNaN(n) || n < 0 ? null : Math.round(n * 100)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Item name is required.')
      nameRef.current?.focus()
      return
    }

    const qty = parseFloat(quantity || '0')
    const threshold = parseFloat(lowThreshold || '5')
    const cost = parseMoney(costPrice || '0')
    const sale = parseMoney(salePrice || '0')

    if (isNaN(qty) || qty < 0) { setError('Enter a valid current quantity.'); return }
    if (isNaN(threshold) || threshold < 0) { setError('Enter a valid low-stock threshold.'); return }
    if (cost === null) { setError('Enter a valid cost price.'); return }
    if (sale === null) { setError('Enter a valid sale price.'); return }

    try {
      setSaving(true)
      const item = await addInventoryItem({
        name: name.trim(),
        sku: sku.trim() || null,
        unit,
        current_quantity: qty,
        low_stock_threshold: threshold,
        cost_price_minor: cost,
        sale_price_minor: sale,
      })
      onSaved(item)
      close()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add item. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="quick-modal add-item-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Stock management</span>
            <h2 id="add-item-title">Add inventory item</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close" type="button">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '14px' }} role="alert">{error}</div>
        )}

        <form onSubmit={handleSave} noValidate>
          {/* Name */}
          <label>
            Item name *
            <input
              ref={nameRef}
              type="text"
              required
              placeholder="e.g. Basmati Rice 5kg"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </label>

          {/* SKU & Unit row */}
          <div className="modal-two-col">
            <label>
              SKU / Code
              <input
                type="text"
                placeholder="e.g. RCE-001"
                value={sku}
                onChange={e => setSku(e.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              Unit
              <select value={unit} onChange={e => setUnit(e.target.value)} disabled={saving}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>

          {/* Qty & Threshold row */}
          <div className="modal-two-col">
            <label>
              Current stock
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              Low-stock alert at
              <input
                type="number"
                min="0"
                step="any"
                placeholder="5"
                value={lowThreshold}
                onChange={e => setLowThreshold(e.target.value)}
                disabled={saving}
              />
            </label>
          </div>

          {/* Prices row */}
          <div className="modal-two-col">
            <label>
              Cost price ({currency})
              <div className="input-currency-wrapper">
                <span className="currency-prefix">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  disabled={saving}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </label>
            <label>
              Sale price ({currency})
              <div className="input-currency-wrapper">
                <span className="currency-prefix">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  disabled={saving}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="primary-button full-button"
            disabled={saving}
            style={{ marginTop: '8px' }}
          >
            {saving ? 'Adding item…' : <><Package size={15} /> Add to inventory</>}
          </button>
        </form>

        <span className="modal-hint">Press Enter to save · Esc to close</span>
      </div>
    </div>
  )
}
