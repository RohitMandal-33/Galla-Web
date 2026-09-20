'use client'

import { Bell, Store, UserRound, Pen, GitBranch, Users, Plus, CheckCircle2, Shield } from 'lucide-react'
import { useState } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import { useSettingsViewModel } from '@/lib/viewmodels/useSettings'
import type { Business } from '@/lib/types'

type SettingsTab = 'profile' | 'notifications' | 'branches' | 'staff' | 'account'

export function Settings({
  business,
  onBusinessUpdate,
}: {
  business: Business | null
  onBusinessUpdate: (b: Business) => void
}) {
  const { user, signOut } = useSupabase()
  const {
    name, setName,
    currency, setCurrency,
    taxRate, setTaxRate,
    locale, setLocale,
    lowCashThreshold, setLowCashThreshold,
    notifyPaymentDue, setNotifyPaymentDue,
    notifyLowCash, setNotifyLowCash,
    notifyLowStock, setNotifyLowStock,
    saving, saved, save,
    branches, staff,
    addBranch, addStaff,
  } = useSettingsViewModel(business, onBusinessUpdate)

  const [tab, setTab] = useState<SettingsTab>('profile')

  // Branch creation modal state
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddress, setNewBranchAddress] = useState('')
  const [newBranchPhone, setNewBranchPhone] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)

  // Staff creation modal state
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffPhone, setNewStaffPhone] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'manager' | 'staff'>('staff')
  const [addingStaff, setAddingStaff] = useState(false)

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim()) return
    setAddingBranch(true)
    try {
      await addBranch({
        name: newBranchName.trim(),
        address: newBranchAddress.trim() || null,
        phone: newBranchPhone.trim() || null,
      })
      setNewBranchName('')
      setNewBranchAddress('')
      setNewBranchPhone('')
      setShowAddBranch(false)
    } finally {
      setAddingBranch(false)
    }
  }

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName.trim()) return
    setAddingStaff(true)
    try {
      await addStaff({
        name: newStaffName.trim(),
        phone: newStaffPhone.trim() || null,
        role: newStaffRole,
      })
      setNewStaffName('')
      setNewStaffPhone('')
      setNewStaffRole('staff')
      setShowAddStaff(false)
    } finally {
      setAddingStaff(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h1>Settings<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Configure business settings, alerts, branches &amp; staff.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-nav card">
          <button
            className={tab === 'profile' ? 'active' : ''}
            onClick={() => setTab('profile')}
          >
            <Store size={17} /> Business profile
          </button>
          <button
            className={tab === 'notifications' ? 'active' : ''}
            onClick={() => setTab('notifications')}
          >
            <Bell size={17} /> Notifications
          </button>
          <button
            className={tab === 'branches' ? 'active' : ''}
            onClick={() => setTab('branches')}
          >
            <GitBranch size={17} /> Branches ({branches.length})
          </button>
          <button
            className={tab === 'staff' ? 'active' : ''}
            onClick={() => setTab('staff')}
          >
            <Users size={17} /> Staff &amp; Team ({staff.length})
          </button>
          <button
            className={tab === 'account' ? 'active' : ''}
            onClick={() => setTab('account')}
          >
            <UserRound size={17} /> Account &amp; session
          </button>
        </div>

        {tab === 'profile' && (
          <div className="card settings-card">
            <span className="eyebrow">Business profile</span>
            <h3>Shop details &amp; preferences</h3>
            <div className="settings-form">
              <label>
                Store / Business name
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Shree Ganesh Kirana Store"
                    style={{ paddingRight: '32px', width: '100%' }}
                  />
                  <Pen size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
                </div>
              </label>

              <label>Email
                <input value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
              </label>

              <label>Currency
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="NPR">NPR — Nepalese Rupee</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </label>

              <label>Language / Locale
                <select value={locale} onChange={e => setLocale(e.target.value)}>
                  <option value="ne">Nepali (नेपाली)</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </label>

              <label>Default Tax rate (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  placeholder="13.00"
                />
              </label>

              <label>Low Cash Alert Threshold ({currency})
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={lowCashThreshold}
                  onChange={e => setLowCashThreshold(e.target.value)}
                  placeholder="5000"
                />
              </label>
            </div>

            <div className="settings-save">
              <span>{saved ? '✓ Saved & synced with mobile!' : 'Changes sync automatically across devices.'}</span>
              <button className="primary-button" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="card settings-card">
            <span className="eyebrow">Alerts &amp; Reminders</span>
            <h3>Automated notifications</h3>
            <p style={{ color: '#748079', fontSize: '13px', margin: '0 0 24px' }}>
              These rules govern alerts both in Galla Web and push notifications on your mobile device.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f6f2', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#20342b' }}>Udhaar &amp; Payment Due Reminders</strong>
                  <span style={{ fontSize: '11px', color: '#777' }}>Alert when customer debts are overdue or require scheduled WhatsApp follow-ups.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPaymentDue}
                  onChange={e => setNotifyPaymentDue(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f6f2', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#20342b' }}>Low Cash Drawer Warning</strong>
                  <span style={{ fontSize: '11px', color: '#777' }}>Trigger alert when cash in hand falls below {currency} {lowCashThreshold || '0'}.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowCash}
                  onChange={e => setNotifyLowCash(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f6f2', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#20342b' }}>Low Stock Warnings</strong>
                  <span style={{ fontSize: '11px', color: '#777' }}>Notify when inventory item quantities drop below their reorder threshold.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={e => setNotifyLowStock(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="settings-save">
              <span>{saved ? '✓ Saved & synced with mobile!' : 'Save changes to sync notification rules.'}</span>
              <button className="primary-button" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'branches' && (
          <div className="card settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow">Multi-Location</span>
                <h3 style={{ margin: 0 }}>Branches</h3>
              </div>
              <button className="primary-button" onClick={() => setShowAddBranch(true)}>
                <Plus size={15} /> Add Branch
              </button>
            </div>

            {branches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                <GitBranch size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Main Store (Default)</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Add branches to track inventory and sales across multiple store locations.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {branches.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f9f7f3', borderRadius: '6px', border: '1px solid #eeeae4' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13px' }}>{b.name}</strong>
                        {b.is_default && (
                          <span style={{ fontSize: '10px', background: '#edf5ee', color: '#2d6b4d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Default
                          </span>
                        )}
                      </div>
                      {b.address && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{b.address}</div>}
                      {b.phone && <div style={{ fontSize: '11px', color: '#888' }}>{b.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'staff' && (
          <div className="card settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="eyebrow">Role-based access</span>
                <h3 style={{ margin: 0 }}>Staff &amp; Team</h3>
              </div>
              <button className="primary-button" onClick={() => setShowAddStaff(true)}>
                <Plus size={15} /> Add Team Member
              </button>
            </div>

            {staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Owner (You)</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Add managers and staff to attribute transactions and control drawer access.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staff.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f9f7f3', borderRadius: '6px', border: '1px solid #eeeae4' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13px' }}>{s.name}</strong>
                        <span style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: s.role === 'owner' ? '#faedd1' : s.role === 'manager' ? '#e2edf7' : '#eeeae4',
                          color: s.role === 'owner' ? '#916a1b' : s.role === 'manager' ? '#1d5786' : '#555',
                        }}>
                          {s.role}
                        </span>
                      </div>
                      {s.phone && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{s.phone}</div>}
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: s.is_active ? '#2d6b4d' : '#888', fontWeight: 500 }}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className="card settings-card">
            <span className="eyebrow">Security &amp; Session</span>
            <h3>Account details</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 0' }}>
              <div className="session-icon"><UserRound size={22} /></div>
              <div>
                <strong style={{ fontSize: '15px' }}>{user?.email}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#777' }}>
                  Authenticated with Supabase. Role: Authenticated Merchant.
                </p>
              </div>
            </div>
            <div className="settings-save">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2d6b4d' }}>
                <Shield size={14} /> Encrypted SSL Connection
              </span>
              <button className="secondary-button" onClick={signOut}>
                Sign out of Galla
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div className="modal-backdrop" onClick={() => setShowAddBranch(false)}>
          <div className="quick-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add Branch</h2>
              <button className="icon-button" onClick={() => setShowAddBranch(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBranch}>
              <label>
                Branch Name
                <input
                  required
                  placeholder="e.g. New Road Branch"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                />
              </label>
              <label>
                Address (Optional)
                <input
                  placeholder="e.g. New Road, Pokhara"
                  value={newBranchAddress}
                  onChange={e => setNewBranchAddress(e.target.value)}
                />
              </label>
              <label>
                Phone (Optional)
                <input
                  placeholder="e.g. 061-523456"
                  value={newBranchPhone}
                  onChange={e => setNewBranchPhone(e.target.value)}
                />
              </label>
              <button type="submit" disabled={addingBranch} className="primary-button full-button" style={{ marginTop: '16px' }}>
                {addingBranch ? 'Adding...' : 'Create Branch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="modal-backdrop" onClick={() => setShowAddStaff(false)}>
          <div className="quick-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add Team Member</h2>
              <button className="icon-button" onClick={() => setShowAddStaff(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <label>
                Full Name
                <input
                  required
                  placeholder="e.g. Bikash Thapa"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                />
              </label>
              <label>
                Phone Number
                <input
                  placeholder="e.g. 9801234567"
                  value={newStaffPhone}
                  onChange={e => setNewStaffPhone(e.target.value)}
                />
              </label>
              <label>
                Role
                <select
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value as 'owner' | 'manager' | 'staff')}
                >
                  <option value="staff">Staff / Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Co-Owner</option>
                </select>
              </label>
              <button type="submit" disabled={addingStaff} className="primary-button full-button" style={{ marginTop: '16px' }}>
                {addingStaff ? 'Adding...' : 'Add Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}