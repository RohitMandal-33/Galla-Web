'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  ExternalLink,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSupabase } from '@/lib/supabase-provider'
import { avatarColor, initials } from '@/lib/format'
import type { Business } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

export type NavKey = 'Pulse' | 'Khata' | 'Stock' | 'Invoices' | 'Reports' | 'Settings'

export function Sidebar({
  active,
  setActive,
  open,
  setOpen,
  collapsed = false,
  setCollapsed,
  business,
  navItems,
  onOpenShortcuts,
}: {
  active: NavKey
  setActive: (key: NavKey) => void
  open: boolean
  setOpen: (value: boolean) => void
  collapsed?: boolean
  setCollapsed?: (value: boolean | ((prev: boolean) => boolean)) => void
  business: Business | null
  navItems: { label: NavKey; icon: LucideIcon }[]
  onOpenShortcuts?: () => void
}) {
  const { user, signOut } = useSupabase()
  const displayName = business?.name ?? 'My Business'
  const userInitials = initials(displayName)
  const userColor = avatarColor(displayName)

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (branchRef.current && !branchRef.current.contains(target)) {
        setBranchMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false)
        setBranchMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelectNav = (label: NavKey) => {
    setActive(label)
    setOpen(false)
    setProfileMenuOpen(false)
    setBranchMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="brand-row">
          <div className="brand-badge">
            <Image src="/galla_logo.png" alt="Galla" width={32} height={32} className="brand-logo-img" priority />
            {!collapsed && <span className="brand-name">galla</span>}
          </div>

          {/* Sidebar Collapse / Expand Toggle (Three Dash) */}
          {setCollapsed && (
            <button
              className="icon-button desktop-toggle"
              onClick={() => setCollapsed(prev => !prev)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Branch / Business Selector */}
        <div className="branch-wrap" ref={branchRef}>
          <button
            className={`branch-switch ${branchMenuOpen ? 'active' : ''}`}
            onClick={() => {
              setBranchMenuOpen(prev => !prev)
              setProfileMenuOpen(false)
            }}
            title={displayName}
            aria-expanded={branchMenuOpen}
          >
            <span className="branch-dot" />
            {!collapsed && (
              <>
                <span className="branch-name">{displayName}</span>
                <ChevronDown size={14} className={`branch-chevron ${branchMenuOpen ? 'rotate' : ''}`} />
              </>
            )}
          </button>

          {/* Branch Menu Popover */}
          {branchMenuOpen && (
            <div className="popover-menu branch-popover">
              <div className="popover-header">
                <span className="popover-eyebrow">Active Register</span>
                <strong>{displayName}</strong>
                <small>{business?.currency ?? 'NPR'} · Main Store</small>
              </div>
              <div className="popover-divider" />
              <div className="popover-item active">
                <Store size={15} />
                <div style={{ flex: 1 }}>
                  <span>Main Register</span>
                  <small style={{ color: '#88988e' }}>Default store counter</small>
                </div>
                <Check size={14} style={{ color: '#bdc85a' }} />
              </div>
              <div className="popover-divider" />
              <button
                className="popover-action"
                onClick={() => {
                  handleSelectNav('Settings')
                }}
              >
                <Settings size={15} />
                <span>Store Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="main-nav">
          {!collapsed && <div className="nav-label">Workspace</div>}
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? 'active' : ''}`}
              onClick={() => handleSelectNav(label)}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
              {label === 'Pulse' && <span className="live-dot" />}
            </button>
          ))}
        </nav>

        {/* Sidebar Bottom / Profile Area */}
        <div className="sidebar-bottom" ref={profileRef}>
          {!collapsed && <div className="nav-label">Account</div>}
          <button
            className={`nav-item ${active === 'Settings' ? 'active' : ''}`}
            onClick={() => handleSelectNav('Settings')}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18} strokeWidth={1.8} />
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Profile Row */}
          <div
            className={`profile-mini ${profileMenuOpen ? 'profile-active' : ''}`}
            onClick={() => {
              setProfileMenuOpen(prev => !prev)
              setBranchMenuOpen(false)
            }}
            role="button"
            tabIndex={0}
            aria-expanded={profileMenuOpen}
            aria-label="User profile and options"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setProfileMenuOpen(prev => !prev)
              }
            }}
          >
            <Avatar initials={userInitials} color={userColor} />
            {!collapsed && (
              <div>
                <strong>{displayName}</strong>
                <small>Owner account</small>
              </div>
            )}
            {!collapsed && (
              <button
                className="icon-button profile-dots"
                onClick={e => {
                  e.stopPropagation()
                  setProfileMenuOpen(prev => !prev)
                }}
                aria-label="More account options"
              >
                <MoreHorizontal size={17} />
              </button>
            )}
          </div>

          {/* Profile Menu Popover */}
          {profileMenuOpen && (
            <div className="popover-menu profile-popover">
              <div className="popover-header profile-head">
                <Avatar initials={userInitials} color={userColor} />
                <div className="profile-details">
                  <strong>{displayName}</strong>
                  <span className="profile-email">{user?.email ?? 'merchant@galla.app'}</span>
                  <span className="role-tag">Owner</span>
                </div>
              </div>
              <div className="popover-divider" />
              <button
                className="popover-action"
                onClick={() => handleSelectNav('Settings')}
              >
                <Settings size={15} />
                <span>Business Settings</span>
              </button>
              {onOpenShortcuts && (
                <button
                  className="popover-action"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    onOpenShortcuts()
                  }}
                >
                  <Command size={15} />
                  <span>Keyboard Shortcuts</span>
                  <kbd className="popover-kbd">[</kbd>
                </button>
              )}
              <a
                className="popover-action"
                href="https://github.com/RohitMandal-33/Galla-Web"
                target="_blank"
                rel="noreferrer"
                onClick={() => setProfileMenuOpen(false)}
              >
                <CircleHelp size={15} />
                <span>Help &amp; Documentation</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </a>
              <div className="popover-divider" />
              <button
                className="popover-action logout-action"
                onClick={() => {
                  setProfileMenuOpen(false)
                  signOut()
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {!collapsed && (
            <div className="sidebar-foot">
              <span>Galla v1.0</span>
              <CircleHelp size={15} />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}