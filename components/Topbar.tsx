'use client'

import { Bell, Menu, Plus, Search } from 'lucide-react'
import { avatarColor, initials } from '@/lib/format'
import type { Business } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

export function Topbar({
  onMenu,
  onAdd,
  query,
  setQuery,
  business,
  collapsed = false,
  onToggleSidebar,
}: {
  onMenu: () => void
  onAdd: () => void
  query: string
  setQuery: (value: string) => void
  business: Business | null
  collapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const displayName = business?.name ?? 'My Business'
  const userInitials = initials(displayName)
  const userColor = avatarColor(displayName)

  return (
    <header className="topbar">
      {/* Mobile Drawer Trigger */}
      <button className="icon-button menu-button mobile-menu-btn" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Desktop expand trigger when sidebar is collapsed */}
      {collapsed && onToggleSidebar && (
        <button
          className="icon-button desktop-expand-btn"
          onClick={onToggleSidebar}
          aria-label="Expand sidebar"
          title="Expand sidebar ([)"
        >
          <Menu size={19} />
        </button>
      )}

      <div className="top-search">
        <Search size={17} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions, parties, items" />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <button className="icon-button notification" aria-label="Notifications">
          <Bell size={18} />
          <span />
        </button>
        <button className="add-button" onClick={onAdd}>
          <Plus size={17} /> Add entry <kbd>N</kbd>
        </button>
        <Avatar initials={userInitials} color={userColor} />
      </div>
    </header>
  )
}