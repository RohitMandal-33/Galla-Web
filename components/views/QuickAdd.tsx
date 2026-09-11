'use client'

import { useRef, useEffect, useState } from 'react'
import {
  X,
  ShoppingCart,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  FileText,
  Banknote,
  ChevronRight,
  Clock,
  UserCircle2,
  Plus,
} from 'lucide-react'
import { useAddTransactionViewModel, type TxnType, type PayMethod } from '@/lib/viewmodels/useAddTransaction'
import type { NavKey } from '@/components/Sidebar'
import type { Party } from '@/lib/types'
import { minorToDisplay } from '@/lib/queries'
import { formatOccurred, initials, avatarColor } from '@/lib/format'
import { Avatar } from '@/components/ui/Avatar'
import { AddPartyModal } from '@/components/modals/AddPartyModal'

/* ─── Transaction type config ──────────────────────────────────── */
const TXN_TYPES: {
  key: TxnType
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  dir: 'in' | 'out'
  hint: string
}[] = [
  {
    key: 'sale',
    label: 'Sale',
    icon: ShoppingCart,
    color: '#306b4b',
    bg: '#edf5ee',
    border: '#cee1d0',
    dir: 'in',
    hint: 'Record a product or service sale',
  },
  {
    key: 'expense',
    label: 'Expense',
    icon: TrendingDown,
    color: '#9a4f44',
    bg: '#fdf0ee',
    border: '#f0cdc9',
    dir: 'out',
    hint: 'Log a business expense or cost',
  },
  {
    key: 'receive',
    label: 'Receive',
    icon: ArrowDownLeft,
    color: '#3b6ba1',
    bg: '#e8f0fa',
    border: '#bcd1ef',
    dir: 'in',
    hint: 'Collect a pending payment',
  },
  {
    key: 'paid',
    label: 'Paid',
    icon: ArrowUpRight,
    color: '#7a5230',
    bg: '#fdf3e7',
    border: '#f0dcba',
    dir: 'out',
    hint: 'Mark a payment you made',
  },
  {
    key: 'credit',
    label: 'Credit',
    icon: CreditCard,
    color: '#5c3d8f',
    bg: '#f2ecfb',
    border: '#d9c8f0',
    dir: 'in',
    hint: 'Credit given — udhaar / khata',
  },
  {
    key: 'invoice',
    label: 'Invoice',
    icon: FileText,
    color: '#6b5c20',
    bg: '#fdf8e7',
    border: '#e8d98e',
    dir: 'in',
    hint: 'Record an invoiced transaction',
  },
]

/* ─── Pay method config ────────────────────────────────────────── */
const PAY_METHODS: { key: PayMethod; label: string; icon: React.ElementType }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Digital / Card', icon: CreditCard },
]

/* ─── Sub-components ───────────────────────────────────────────── */

function TxnTypeGrid({
  selected,
  onSelect,
  onInvoice,
}: {
  selected: TxnType | null
  onSelect: (t: TxnType) => void
  onInvoice: () => void
}) {
  return (
    <div className="txn-type-grid">
      {TXN_TYPES.map(t => {
        const Icon = t.icon
        const active = selected === t.key
        const isInvoice = t.key === 'invoice'
        return (
          <button
            key={t.key}
            id={`txn-type-${t.key}`}
            className={`txn-type-tile${active ? ' active' : ''}${isInvoice ? ' txn-type-redirect' : ''}`}
            style={
              active
                ? {
                    background: t.bg,
                    borderColor: t.border,
                    color: t.color,
                  }
                : {}
            }
            onClick={() => isInvoice ? onInvoice() : onSelect(t.key)}
            title={isInvoice ? 'Go to Invoices section' : t.hint}
            aria-pressed={!isInvoice ? active : undefined}
          >
            <span
              className="txn-tile-icon"
              style={active ? { background: t.color + '22', color: t.color } : {}}
            >
              <Icon size={17} />
            </span>
            <span className="txn-tile-label">{t.label}</span>
            {isInvoice ? (
              <span className="txn-tile-redirect-arrow">↗</span>
            ) : t.dir === 'in' ? (
              <span className="txn-tile-dir in">+</span>
            ) : (
              <span className="txn-tile-dir out">−</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function PayMethodToggle({
  selected,
  onSelect,
}: {
  selected: PayMethod
  onSelect: (m: PayMethod) => void
}) {
  return (
    <div className="pay-method-row">
      {PAY_METHODS.map(m => {
        const Icon = m.icon
        const active = selected === m.key
        return (
          <button
            key={m.key}
            id={`pay-method-${m.key}`}
            className={`pay-method-btn${active ? ' active' : ''}`}
            onClick={() => onSelect(m.key)}
            aria-pressed={active}
          >
            <Icon size={15} />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function PartyDropdown({
  parties,
  selected,
  onSelect,
  onAddParty,
}: {
  parties: Party[]
  selected: Party | null
  onSelect: (party: Party | null) => void
  onAddParty: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="party-search-wrap" ref={ref}>
      <button
        id="party-dropdown-trigger"
        type="button"
        className="party-select-trigger"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? selected.name : 'Select a party (optional)'}
        <ChevronRight size={14} className={`party-select-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <div className="party-dropdown" role="listbox">
          <button
            type="button"
            className="party-dropdown-row party-dropdown-add"
            onClick={() => { setOpen(false); onAddParty() }}
          >
            <span className="party-dropdown-add-icon"><Plus size={14} /></span>
            <strong>Add new party</strong>
          </button>
          {selected && (
            <button
              type="button"
              className="party-dropdown-row party-dropdown-clear"
              onClick={() => { onSelect(null); setOpen(false) }}
            >
              <span className="party-dropdown-clear-icon"><X size={13} /></span>
              <strong>Remove selected party</strong>
            </button>
          )}
          {parties.map(p => {
            const color = avatarColor(p.name)
            return (
              <button
                key={p.id}
                type="button"
                className="party-dropdown-row"
                role="option"
                aria-selected={selected?.id === p.id}
                onClick={() => { onSelect(p); setOpen(false) }}
              >
                <Avatar initials={initials(p.name)} color={color} />
                <div className="party-dropdown-info">
                  <strong>{p.name}</strong>
                  {p.phone && <small>{p.phone}</small>}
                </div>
                <ChevronRight size={13} className="party-dropdown-chevron" />
              </button>
            )
          })}
          {parties.length === 0 && <div className="party-dropdown-empty">No parties yet</div>}
        </div>
      )}
    </div>
  )
}

function RecentFeed({
  txns,
  loading,
  currency,
  partyName,
}: {
  txns: import('@/lib/types').Transaction[]
  loading: boolean
  currency: string
  partyName?: string
}) {
  return (
    <div className="recent-feed">
      <div className="recent-feed-header">
        <Clock size={12} />
        {partyName ? `Recent with ${partyName}` : 'Recent transactions'}
      </div>
      {loading ? (
        <div className="recent-feed-loading">
          <span className="recent-feed-skeleton" />
          <span className="recent-feed-skeleton" />
          <span className="recent-feed-skeleton" />
        </div>
      ) : txns.length === 0 ? (
        <div className="recent-feed-empty">
          <UserCircle2 size={22} />
          <span>No transactions yet</span>
        </div>
      ) : (
        txns.map(t => {
          const name = t.parties?.name ?? t.note ?? 'Manual entry'
          const color = avatarColor(name)
          const isIn = t.direction === 'money_in'
          return (
            <div key={t.id} className="recent-feed-row">
              <Avatar initials={initials(name)} color={color} />
              <div className="recent-feed-info">
                <strong>{name}</strong>
                <small>{t.category ?? (isIn ? 'Money in' : 'Money out')} · {formatOccurred(t.occurred_at)}</small>
              </div>
              <span className={`recent-feed-amount ${isIn ? 'in' : 'out'}`}>
                {isIn ? '+' : '−'}{minorToDisplay(t.amount_minor, currency)}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

/* ─── Main component ───────────────────────────────────────────── */

export function QuickAdd({
  close,
  onSaved,
  currency,
  onNavigate,
}: {
  close: () => void
  onSaved: () => void
  currency: string
  onNavigate?: (key: NavKey) => void
}) {
  const handleInvoiceRedirect = () => {
    close()
    onNavigate?.('Invoices')
  }
  const vm = useAddTransactionViewModel(currency, onSaved, close)
  const {
    txnType, setTxnType,
    payMethod, setPayMethod,
    amountStr, setAmountStr,
    note, setNote,
    saving, error, save,
    parties,
    selectedParty, selectParty,
    addPartyToSelection,
    recentTxns, recentLoading,
  } = vm
  const [showAddParty, setShowAddParty] = useState(false)

  const activeMeta = txnType ? TXN_TYPES.find(t => t.key === txnType) : null

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="add-txn-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add transaction"
      >
        {/* ── Header ── */}
        <div className="add-txn-header">
          <div>
            <span className="eyebrow">New transaction</span>
            <h2 className="add-txn-title">Add Transaction</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="add-txn-body">
          {/* ── Left column ── */}
          <div className="add-txn-left">
            {/* Step 1: type */}
            <div className="add-txn-section">
              <p className="add-txn-step-label">
                <span className="step-badge">1</span>
                What type of transaction?
              </p>
              <TxnTypeGrid selected={txnType} onSelect={setTxnType} onInvoice={handleInvoiceRedirect} />
            </div>

            {/* Step 2: pay method — shown after type selected */}
            {txnType && (
              <div className="add-txn-section">
                <p className="add-txn-step-label">
                  <span className="step-badge">2</span>
                  Payment method
                  {activeMeta && (
                    <span
                      className="txn-hint-pill"
                      style={{ background: activeMeta.bg, color: activeMeta.color, border: `1px solid ${activeMeta.border}` }}
                    >
                      {activeMeta.label}
                    </span>
                  )}
                </p>
                <PayMethodToggle selected={payMethod} onSelect={setPayMethod} />
              </div>
            )}

            {/* Step 3: amount + note — shown after type */}
            {txnType && (
              <div className="add-txn-section">
                <p className="add-txn-step-label">
                  <span className="step-badge">3</span>
                  Details
                </p>
                {error && <div className="auth-error" style={{ marginBottom: '10px' }}>{error}</div>}
                <label className="add-txn-label">
                  Amount
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">{currency}</span>
                    <input
                      id="txn-amount-input"
                      autoFocus
                      placeholder="0.00"
                      value={amountStr}
                      onChange={e => setAmountStr(e.target.value)}
                      style={{ paddingLeft: `${currency.length * 8 + 18}px` }}
                    />
                  </div>
                </label>
                <label className="add-txn-label" style={{ marginTop: '10px' }}>
                  Note <span style={{ textTransform: 'none', fontSize: '9px', color: '#aaa' }}>(optional)</span>
                  <input
                    id="txn-note-input"
                    placeholder="e.g. Rohan General Store"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </label>
              </div>
            )}

            {/* Step 4: party — shown after type */}
            {txnType && (
              <div className="add-txn-section">
                <p className="add-txn-step-label">
                  <span className="step-badge">4</span>
                  Party <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
                </p>
                <PartyDropdown
                  parties={parties}
                  selected={selectedParty}
                  onSelect={selectParty}
                  onAddParty={() => setShowAddParty(true)}
                />
                {selectedParty && (
                  <div className="selected-party-badge">
                    <Avatar
                      initials={initials(selectedParty.name)}
                      color={avatarColor(selectedParty.name)}
                    />
                    <div>
                      <strong>{selectedParty.name}</strong>
                      {selectedParty.phone && <small>{selectedParty.phone}</small>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save */}
            {txnType && (
              <button
                id="txn-save-btn"
                className="primary-button full-button"
                style={{ marginTop: '4px' }}
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : `Save ${activeMeta?.label ?? 'Transaction'}`}
              </button>
            )}
            <span className="modal-hint">Press Enter to save · Esc to close</span>
          </div>

          {/* ── Right column: recent feed ── */}
          {txnType && (
            <div className="add-txn-right">
              <RecentFeed
                txns={recentTxns}
                loading={recentLoading}
                currency={currency}
                partyName={selectedParty?.name}
              />
            </div>
          )}
        </div>
      </div>
      {showAddParty && (
        <AddPartyModal
          close={() => setShowAddParty(false)}
          onSaved={(party: Party) => {
            addPartyToSelection(party)
            setShowAddParty(false)
          }}
          currency={currency}
        />
      )}
    </div>
  )
}