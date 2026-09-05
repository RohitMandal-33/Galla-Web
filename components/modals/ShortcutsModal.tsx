'use client'

import { useEffect } from 'react'
import { Command, X } from 'lucide-react'

interface ShortcutItem {
  keys: string[]
  description: string
}

const shortcuts: ShortcutItem[] = [
  { keys: ['N'], description: 'Quick add new transaction' },
  { keys: ['⌘', 'K'], description: 'Focus global search' },
  { keys: ['['], description: 'Toggle sidebar collapse' },
  { keys: ['Esc'], description: 'Close modals / popovers' },
]

export function ShortcutsModal({ close }: { close: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close])

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="shortcuts-modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Command size={18} style={{ color: '#20533c' }} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 650 }}>Keyboard Shortcuts</h3>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close shortcuts modal">
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: '0 0 18px', color: '#76827a', fontSize: '12px' }}>
          Speed up your daily workflow with built-in hotkeys.
        </p>
        <div className="shortcuts-list">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="shortcut-row">
              <span className="shortcut-desc">{description}</span>
              <div className="shortcut-keys">
                {keys.map(k => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
