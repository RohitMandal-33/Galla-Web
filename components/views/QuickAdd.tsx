'use client'

import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import { useQuickAddViewModel } from '@/lib/viewmodels/useQuickAdd'

export function QuickAdd({ close, onSaved, currency }: { close: () => void; onSaved: () => void; currency: string }) {
  const vm = useQuickAddViewModel(currency, onSaved, close)
  const { direction, setDirection, amountStr, setAmountStr, note, setNote, category, setCategory, saving, error, save } = vm

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
        <label>Amount<input autoFocus placeholder={`${currency} 0.00`} value={amountStr} onChange={e => setAmountStr(e.target.value)} /></label>
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
        <button className="primary-button full-button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save entry'}
        </button>
        <span className="modal-hint">Press Enter to save · Esc to close</span>
      </div>
    </div>
  )
}