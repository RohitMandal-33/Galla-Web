'use client'

import { useEffect, useState, useRef } from 'react'
import { Building2, User, X, Plus } from 'lucide-react'
import { addParty } from '@/lib/queries'
import type { Party } from '@/lib/types'

interface AddPartyModalProps {
  close: () => void
  onSaved: (party: Party) => void
  currency?: string
}

export type PartyType = 'individual' | 'company'
export type BalanceDirection = 'collect' | 'pay'

export function AddPartyModal({ close, onSaved, currency = 'NPR' }: AddPartyModalProps) {
  const [partyType, setPartyType] = useState<PartyType>('individual')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [balanceDirection, setBalanceDirection] = useState<BalanceDirection>('collect')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)

  // Auto focus input on mount
  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(partyType === 'company' ? 'Please enter a company name.' : 'Please enter a person\'s name.')
      nameInputRef.current?.focus()
      return
    }

    // Parse opening balance (in paisa / minor units = 100 per rupee)
    let balanceMinor = 0
    if (openingBalance.trim()) {
      const parsedAmount = parseFloat(openingBalance.replace(/,/g, ''))
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setError('Please enter a valid opening balance amount.')
        return
      }
      balanceMinor = Math.round(parsedAmount * 100)
      if (balanceDirection === 'pay') {
        balanceMinor = -balanceMinor
      }
    }

    try {
      setSaving(true)
      const createdParty = await addParty({
        name: trimmedName,
        phone: phone.trim() || null,
        balance_minor: balanceMinor,
      })
      onSaved(createdParty)
      close()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add party. Please try again.'
      setError(msg)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="quick-modal add-party-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-party-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Khata ledger</span>
            <h2 id="add-party-title">Add new party</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close modal" type="button">
            <X size={18} />
          </button>
        </div>

        {/* Entity Type Toggle: Individual vs Company */}
        <div className="entry-type" role="tablist" aria-label="Party type">
          <button
            type="button"
            role="tab"
            aria-selected={partyType === 'individual'}
            className={partyType === 'individual' ? 'active' : ''}
            onClick={() => {
              setPartyType('individual')
              setError(null)
            }}
          >
            <User size={15} /> Individual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={partyType === 'company'}
            className={partyType === 'company' ? 'active' : ''}
            onClick={() => {
              setPartyType('company')
              setError(null)
            }}
          >
            <Building2 size={15} /> Company
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '14px' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} noValidate>
          {/* Name Field */}
          <label>
            {partyType === 'company' ? 'Company Name *' : 'Full Name *'}
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder={partyType === 'company' ? 'e.g. Everest Traders Pvt. Ltd.' : 'e.g. Ram Prasad Shrestha'}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </label>

          {/* Phone Number Field */}
          <label>
            Phone number
            <input
              type="tel"
              placeholder="e.g. 9841234567 or +977 98..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={saving}
            />
          </label>

          {/* Opening Balance (Optional) */}
          <div style={{ marginTop: '2px', marginBottom: '14px' }}>
            <label style={{ marginBottom: '6px' }}>
              Opening balance (optional)
              <div className="input-currency-wrapper">
                <span className="currency-prefix">{currency}</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  disabled={saving}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </label>

            {/* If an opening balance is entered, show direction buttons */}
            {parseFloat(openingBalance || '0') > 0 && (
              <div className="balance-direction-toggle">
                <button
                  type="button"
                  className={`balance-btn ${balanceDirection === 'collect' ? 'active collect' : ''}`}
                  onClick={() => setBalanceDirection('collect')}
                >
                  They owe you (To collect)
                </button>
                <button
                  type="button"
                  className={`balance-btn ${balanceDirection === 'pay' ? 'active pay' : ''}`}
                  onClick={() => setBalanceDirection('pay')}
                >
                  You owe them (To pay)
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="primary-button full-button"
            disabled={saving}
            style={{ marginTop: '6px' }}
          >
            {saving ? (
              'Adding party…'
            ) : (
              <>
                <Plus size={16} /> Add party
              </>
            )}
          </button>
        </form>

        <span className="modal-hint">Press Enter to save · Esc to close</span>
      </div>
    </div>
  )
}
