'use client'

import { useEffect, useRef, useState } from 'react'
import { Store, X } from 'lucide-react'
import { updateBusiness } from '@/lib/queries'
import type { Business } from '@/lib/types'

interface EditStoreModalProps {
  close: () => void
  business: Business | null
  onSaved: (business: Business) => void
}

export function EditStoreModal({ close, business, onSaved }: EditStoreModalProps) {
  const [storeName, setStoreName] = useState(business?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

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

    const trimmed = storeName.trim()
    if (!trimmed) {
      setError('Please enter a store name.')
      inputRef.current?.focus()
      return
    }

    setSaving(true)
    try {
      await updateBusiness({ name: trimmed })
      if (business) {
        onSaved({ ...business, name: trimmed })
      } else {
        close()
      }
    } catch (err) {
      console.error(err)
      setError('Failed to update store name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="quick-modal edit-store-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-store-title"
      >
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: '#eef4ed',
                color: '#2d6b4d',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <span className="eyebrow">Store Configuration</span>
              <h2 id="edit-store-title" style={{ fontSize: '18px' }}>Edit store name</h2>
            </div>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close modal" type="button">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '14px' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} noValidate>
          <label>
            Store / Business Name *
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. Shree Ganesh Kirana Store"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              disabled={saving}
            />
          </label>

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={close}
              disabled={saving}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <span className="modal-hint">Press Enter to save · Esc to close</span>
      </div>
    </div>
  )
}
