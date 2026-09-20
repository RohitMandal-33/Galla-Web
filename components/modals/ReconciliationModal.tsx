'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Calculator, ArrowRight, DollarSign } from 'lucide-react'
import { createReconciliation, getDashboardKPIs } from '@/lib/queries'

interface ReconciliationModalProps {
  expectedCashMinor?: number
  currency: string
  onClose: () => void
  onSuccess?: () => void
}

export function ReconciliationModal({
  expectedCashMinor,
  currency,
  onClose,
  onSuccess,
}: ReconciliationModalProps) {
  const [expected, setExpected] = useState(expectedCashMinor ?? 0)

  useEffect(() => {
    if (expectedCashMinor !== undefined) {
      setExpected(expectedCashMinor)
    } else {
      getDashboardKPIs(currency).then(k => setExpected(k.cashInHand))
    }
  }, [expectedCashMinor, currency])

  const [useDenominations, setUseDenominations] = useState(false)
  const [directAmount, setDirectAmount] = useState('')
  const [denominations, setDenominations] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
  })
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate actual counted cash in minor units
  const denomTotalMinor = Object.entries(denominations).reduce(
    (sum, [noteVal, count]) => sum + Number(noteVal) * count * 100,
    0
  )

  const actualCashMinor = useDenominations
    ? denomTotalMinor
    : Math.round((parseFloat(directAmount) || 0) * 100)

  const discrepancyMinor = actualCashMinor - expected
  const isMatch = discrepancyMinor === 0 && (actualCashMinor > 0 || !useDenominations)

  const handleDenomChange = (val: number, countStr: string) => {
    const count = parseInt(countStr, 10) || 0
    setDenominations(prev => ({
      ...prev,
      [val]: Math.max(0, count),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await createReconciliation({
        countedCashMinor: actualCashMinor,
        expectedCashMinor: expected,
        note: note.trim() || null,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile drawer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="quick-modal"
        style={{ width: 'min(520px, 95vw)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow" style={{ color: '#7b877e' }}>End of day / Shift check</span>
            <h2 style={{ fontSize: '20px' }}>Reconcile Cash Drawer</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">✕</button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Expected Drawer Balance */}
          <div style={{ background: '#f6f4ef', padding: '14px 16px', borderRadius: '8px', marginBottom: '18px', border: '1px solid #eae5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#7a857e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected system cash</span>
              <strong style={{ display: 'block', fontSize: '18px', color: '#20342b' }}>
                {currency} {(expected / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <span style={{ fontSize: '11px', background: '#edf5ee', color: '#2d6b4d', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Live KPI
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="entry-type" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={!useDenominations ? 'active' : ''}
              onClick={() => setUseDenominations(false)}
            >
              <DollarSign size={15} /> Total Cash Amount
            </button>
            <button
              type="button"
              className={useDenominations ? 'active' : ''}
              onClick={() => setUseDenominations(true)}
            >
              <Calculator size={15} /> Note Counter
            </button>
          </div>

          {!useDenominations ? (
            <label>
              Counted Physical Cash in Drawer ({currency})
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="Enter total physical cash"
                value={directAmount}
                onChange={e => setDirectAmount(e.target.value)}
                autoFocus
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7b877e', letterSpacing: '0.05em' }}>
                Denomination breakdown
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[1000, 500, 100, 50, 20, 10, 5].map(val => (
                  <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#faf8f5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e8e3d8' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, width: '45px', color: '#333' }}>
                      {val} ×
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={denominations[val] || ''}
                      onChange={e => handleDenomChange(val, e.target.value)}
                      style={{ padding: '6px', textAlign: 'center', width: '100%', fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Counted: <strong>{currency} {(denomTotalMinor / 100).toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Discrepancy Status Card */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: isMatch ? '#eaf5ed' : discrepancyMinor < 0 ? '#fdf2f0' : '#fcf6e8',
            border: `1px solid ${isMatch ? '#bde2c8' : discrepancyMinor < 0 ? '#f6c7c0' : '#fae6b8'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {isMatch ? (
              <CheckCircle2 size={24} style={{ color: '#2d6b4d', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={24} style={{ color: discrepancyMinor < 0 ? '#b45f50' : '#b08b30', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isMatch ? '#226b42' : discrepancyMinor < 0 ? '#992d1c' : '#886208' }}>
                {isMatch
                  ? 'Drawer balances perfectly'
                  : discrepancyMinor < 0
                  ? `Shortage of ${currency} ${(Math.abs(discrepancyMinor) / 100).toFixed(2)}`
                  : `Surplus of ${currency} ${(discrepancyMinor / 100).toFixed(2)}`}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                {isMatch
                  ? 'Counted cash equals system recorded cash.'
                  : 'An automatic adjustment transaction will record this discrepancy in your ledger.'}
              </div>
            </div>
          </div>

          <label>
            Notes / Shift Memo
            <input
              type="text"
              placeholder="e.g. End of day reconciliation by evening shift"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="primary-button full-button"
            style={{ marginTop: '16px' }}
          >
            {saving ? 'Recording...' : 'Confirm & Save Reconciliation'} <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
