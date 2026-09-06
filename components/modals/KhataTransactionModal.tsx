'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import { addKhataTransaction } from '@/lib/queries'

interface KhataTransactionModalProps {
  partyId: string
  partyName: string
  mode: 'udhaar' | 'payment'
  close: () => void
  onSaved: () => void
  currency?: string
}

export function KhataTransactionModal({
  partyId,
  partyName,
  mode,
  close,
  onSaved,
  currency = 'NPR',
}: KhataTransactionModalProps) {
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => { amountRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  const isUdhaar = mode === 'udhaar'

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const amount = parseFloat(amountStr.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero.')
      amountRef.current?.focus()
      return
    }

    const amountMinor = Math.round(amount * 100)

    try {
      setSaving(true)
      await addKhataTransaction({
        party_id: partyId,
        // Giving udhaar = money goes out to the party; receiving payment = money comes in
        direction: isUdhaar ? 'money_out' : 'money_in',
        amount_minor: amountMinor,
        note: note.trim() || (isUdhaar ? 'Udhaar given' : 'Payment received'),
        is_credit: true,
      })
      onSaved()
      close()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transaction failed. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="quick-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="khata-txn-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">{partyName}</span>
            <h2 id="khata-txn-title">
              {isUdhaar ? 'Give udhaar' : 'Receive payment'}
            </h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close" type="button">
            <X size={18} />
          </button>
        </div>

        {/* Mode indicator */}
        <div className={`khata-txn-banner ${isUdhaar ? 'udhaar' : 'payment'}`}>
          {isUdhaar
            ? <><ArrowUpRight size={15} /> Giving credit — they will owe you more</>
            : <><ArrowDownLeft size={15} /> Collecting — their balance will decrease</>
          }
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '14px' }} role="alert">{error}</div>
        )}

        <form onSubmit={handleSave} noValidate>
          <label>
            Amount ({currency}) *
            <div className="input-currency-wrapper">
              <span className="currency-prefix">{currency}</span>
              <input
                ref={amountRef}
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                disabled={saving}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </label>

          <label>
            Note (optional)
            <input
              type="text"
              placeholder={isUdhaar ? 'e.g. Goods supplied on credit' : 'e.g. Cash received'}
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={saving}
            />
          </label>

          <button
            type="submit"
            className={isUdhaar ? 'primary-button full-button amber-solid-button' : 'primary-button full-button'}
            disabled={saving}
            style={{ marginTop: '8px' }}
          >
            {saving
              ? 'Saving…'
              : isUdhaar
                ? <><ArrowUpRight size={15} /> Confirm udhaar</>
                : <><ArrowDownLeft size={15} /> Confirm payment</>
            }
          </button>
        </form>

        <span className="modal-hint">Press Enter to confirm · Esc to cancel</span>
      </div>
    </div>
  )
}
