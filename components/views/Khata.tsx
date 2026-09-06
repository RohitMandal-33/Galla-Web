'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, FileText, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useKhataViewModel } from '@/lib/viewmodels/useKhata'
import { minorToDisplay } from '@/lib/queries'
import { avatarColor, formatShortDate, initials } from '@/lib/format'
import type { Business } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { AddPartyModal } from '@/components/modals/AddPartyModal'

export function Khata({ business }: { business: Business | null }) {
  const currency = business?.currency ?? 'NPR'
  const [showAddParty, setShowAddParty] = useState(false)
  const {
    parties, selected, setSelected, filter, setFilter, search, setSearch,
    filteredParties, party, partyTxns, loading, handlePartyAdded,
  } = useKhataViewModel()

  if (loading) return <div className="page-content"><Spinner /></div>

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Your people, your trust</span>
          <h1>Khata<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Keep every promise and payment in one clear place.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAddParty(true)}>
          <Plus size={17} /> Add party
        </button>
      </div>

      <div className="khata-layout card">
        {/* Party pane */}
        <div className="party-pane">
          <div className="pane-header">
            <strong>All parties</strong>
            <span className="count-badge">{parties.length}</span>
            <button className="icon-button" onClick={() => setShowAddParty(true)} aria-label="Add party">
              <Plus size={17} />
            </button>
          </div>
          <div className="small-search">
            <Search size={15} />
            <input placeholder="Find a party" value={search} onChange={e => { setSearch(e.target.value); setSelected(0) }} />
          </div>
          <div className="filter-tabs">
            <button className={filter === 'all' ? 'selected' : ''} onClick={() => { setFilter('all'); setSelected(0) }}>All <span>{parties.length}</span></button>
            <button className={filter === 'collect' ? 'selected' : ''} onClick={() => { setFilter('collect'); setSelected(0) }}>To collect <span>{parties.filter(p => p.balance_minor > 0).length}</span></button>
            <button className={filter === 'pay' ? 'selected' : ''} onClick={() => { setFilter('pay'); setSelected(0) }}>To pay <span>{parties.filter(p => p.balance_minor < 0).length}</span></button>
          </div>
          <div className="party-list">
            {filteredParties.length === 0 && (
              <div style={{ padding: '28px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <p style={{ margin: 0, color: '#9b9e97', fontSize: '12px' }}>
                  {search ? `No parties match "${search}"` : 'No parties yet in your Khata.'}
                </p>
                {!search && (
                  <button className="secondary-button" onClick={() => setShowAddParty(true)} style={{ fontSize: '11px', padding: '7px 11px' }}>
                    <Plus size={14} /> Add your first party
                  </button>
                )}
              </div>
            )}
            {filteredParties.map((item, index) => (
              <button
                className={`party-row ${selected === index ? 'selected' : ''}`}
                onClick={() => setSelected(index)}
                key={item.id}
              >
                <Avatar initials={initials(item.name)} color={avatarColor(item.name)} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.phone ?? '—'}</small>
                </span>
                <span className={`party-balance ${item.balance_minor >= 0 ? 'collect' : 'pay'}`}>
                  <strong>{minorToDisplay(Math.abs(item.balance_minor), currency)}</strong>
                  <small>{item.balance_minor >= 0 ? 'to collect' : 'to pay'}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statement pane */}
        {party ? (
          <div className="statement-pane">
            <div className="statement-head">
              <div className="party-title">
                <Avatar initials={initials(party.name)} color={avatarColor(party.name)} />
                <div>
                  <h2>{party.name}</h2>
                  <span>{party.phone ?? 'No phone'}</span>
                </div>
              </div>
              <button className="icon-button"><MoreHorizontal size={19} /></button>
            </div>
            <div className="statement-balance">
              <div>
                <span>Net balance</span>
                <strong>{minorToDisplay(Math.abs(party.balance_minor), currency)}</strong>
                <small>{party.balance_minor >= 0 ? 'They owe you' : 'You owe them'}</small>
              </div>
              <div className="statement-actions">
                <button className="amber-button"><ArrowUpRight size={15} /> Give udhaar</button>
                <button className="green-button"><ArrowDownLeft size={15} /> Receive payment</button>
              </div>
            </div>
            <div className="statement-table">
              <div className="statement-line head">
                <span>Date</span><span>Description</span><span>Type</span><span className="align-right">Amount</span>
              </div>
              {partyTxns.length === 0 && (
                <div className="statement-line">
                  <span className="muted-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '14px 0', fontStyle: 'italic' }}>No transactions recorded.</span>
                </div>
              )}
              {partyTxns.map(t => (
                <div className="statement-line" key={t.id}>
                  <span className="muted-text">{formatShortDate(t.occurred_at)}</span>
                  <strong>{t.note ?? (t.direction === 'money_in' ? 'Payment received' : 'Payment made')}</strong>
                  <span className="tag">{t.category ?? (t.is_credit ? 'Credit' : 'Cash')}</span>
                  <strong className="align-right">{minorToDisplay(t.amount_minor, currency)}</strong>
                </div>
              ))}
            </div>
            <button className="outline-button"><FileText size={15} /> Download statement</button>
          </div>
        ) : (
          <div className="statement-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b9e97' }}>
            Select a party to view their statement.
          </div>
        )}
      </div>

      {showAddParty && (
        <AddPartyModal
          close={() => setShowAddParty(false)}
          onSaved={handlePartyAdded}
          currency={currency}
        />
      )}
    </div>
  )
}