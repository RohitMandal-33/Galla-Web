'use client'

import { Bell, Store, UserRound } from 'lucide-react'
import { useSupabase } from '@/lib/supabase-provider'
import { useSettingsViewModel } from '@/lib/viewmodels/useSettings'
import type { Business } from '@/lib/types'

export function Settings({ business, onBusinessUpdate }: { business: Business | null; onBusinessUpdate: (b: Business) => void }) {
  const { user, signOut } = useSupabase()
  const { name, setName, currency, setCurrency, taxRate, setTaxRate, saving, saved, save } =
    useSettingsViewModel(business, onBusinessUpdate)

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h1>Settings<span className="title-dot">.</span></h1>
          <p className="page-subtitle">Your business, your rules.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="settings-nav card">
          <button className="active"><Store size={17} /> Business profile</button>
          <button><UserRound size={17} /> Account &amp; session</button>
          <button><Bell size={17} /> Notifications</button>
        </div>
        <div className="card settings-card">
          <span className="eyebrow">Business profile</span>
          <h3>Tell us about your shop</h3>
          <div className="settings-form">
            <label>Business name<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email<input value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} /></label>
            <label>Currency
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="NPR">NPR — Nepalese Rupee</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </label>
            <label>Tax rate (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="settings-save">
            <span>{saved ? '✓ Saved!' : 'Changes are saved when you click Save.'}</span>
            <button className="primary-button" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
      <div className="card session-card">
        <div className="session-icon"><UserRound size={19} /></div>
        <div>
          <span className="eyebrow">Current session</span>
          <h3>{user?.email}</h3>
          <p>Authenticated with Supabase. Your data is private and encrypted.</p>
        </div>
        <button className="secondary-button" onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}