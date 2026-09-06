'use client'

import { useState } from 'react'
import { MoreHorizontal, Package, Plus, Search } from 'lucide-react'
import { useStockViewModel } from '@/lib/viewmodels/useStock'
import { minorToDisplay } from '@/lib/queries'
import type { Business, InventoryItem } from '@/lib/types'
import { Spinner } from '@/components/ui/Spinner'
import { AddItemModal } from '@/components/modals/AddItemModal'

export function Stock({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const [showAddItem, setShowAddItem] = useState(false)
  const { items, loading, search, setSearch, filterLow, setFilterLow, filtered, totalValue, lowCount, outCount, handleItemAdded } = useStockViewModel()

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
        <button className="primary-button" onClick={() => setShowAddItem(true)}>
          <Plus size={17} /> Add item
        </button>
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
          </div>
        </div>
        <div className="stock-table">
          <div className="stock-row stock-head">
            <span>Item</span><span>Current stock</span><span>Cost price</span><span>Sale price</span><span>Valuation</span><span>Status</span><span />
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p style={{ margin: 0, color: '#9b9e97', fontStyle: 'italic', fontSize: '12px' }}>
                {search ? `No items match "${search}"` : filterLow ? 'No low-stock items.' : 'No items yet. Add your first inventory item.'}
              </p>
              {!search && !filterLow && (
                <button className="secondary-button" onClick={() => setShowAddItem(true)} style={{ fontSize: '11px', padding: '7px 11px' }}>
                  <Plus size={14} /> Add first item
                </button>
              )}
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
                <button className="more-button" aria-label={`More options for ${item.name}`}>
                  <MoreHorizontal size={17} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {showAddItem && (
        <AddItemModal
          close={() => setShowAddItem(false)}
          onSaved={handleItemAdded}
          currency={currency}
        />
      )}
    </div>
  )
}