'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Menu, Search } from 'lucide-react'
import { avatarColor, initials } from '@/lib/format'
import type { Business } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

export function Topbar({
  onMenu,
  query,
  setQuery,
  business,
  collapsed = false,
  onToggleSidebar,
}: {
  onMenu: () => void
  query: string
  setQuery: (value: string) => void
  business: Business | null
  collapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const displayName = business?.name ?? 'My Business'
  const userInitials = initials(displayName)
  const userColor = avatarColor(displayName)

  useEffect(() => {
    if (!showNotifications) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

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
        <div className="notification-anchor" ref={notificationRef}>
          <button
            className="icon-button notification"
            onClick={() => setShowNotifications(value => !value)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            <span />
          </button>

          {showNotifications && (
            <div className="notification-popover" role="dialog" aria-labelledby="notifications-title">
              <div className="notification-popover-arrow" />
              <div className="modal-head">
                <h2 id="notifications-title">Notifications</h2>
              </div>
              <div className="notification-empty">
                <Bell size={20} />
                <p>No new notifications.</p>
                <span>You're all caught up.</span>
              </div>
            </div>
          )}
        </div>
        <Avatar initials={userInitials} color={userColor} />
      </div>
    </header>
  )
}