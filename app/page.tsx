'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Boxes, FileText, LayoutDashboard, WalletCards } from 'lucide-react'
import { useSupabase } from '@/lib/supabase-provider'
import { useBusinessViewModel } from '@/lib/viewmodels/useBusiness'
import { Sidebar, type NavKey } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { Spinner } from '@/components/ui/Spinner'
import { Dashboard } from '@/components/views/Dashboard'
import { Khata } from '@/components/views/Khata'
import { Stock } from '@/components/views/Stock'
import { Invoices } from '@/components/views/Invoices'
import { Reports } from '@/components/views/Reports'
import { Settings } from '@/components/views/Settings'
import { QuickAdd } from '@/components/views/QuickAdd'
import { ShortcutsModal } from '@/components/modals/ShortcutsModal'
import { RealtimeSync } from '@/components/realtime-sync'

const navItems: { label: NavKey; icon: typeof LayoutDashboard }[] = [
  { label: 'Pulse', icon: LayoutDashboard },
  { label: 'Khata', icon: WalletCards },
  { label: 'Stock', icon: Boxes },
  { label: 'Invoices', icon: FileText },
  { label: 'Reports', icon: BarChart3 },
]

export default function Page() {
  const { user, loading: authLoading } = useSupabase()
  const { business, setBusiness } = useBusinessViewModel(user)
  const [active, setActive] = useState<NavKey>('Pulse')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [query, setQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Keyboard shortcuts:
  // N = Quick Add
  // [ = Toggle Sidebar Collapse
  // ? = Open Shortcuts Modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
      if (inInput) return

      if (e.key === 'n' || e.key === 'N') {
        setShowQuickAdd(true)
      } else if (e.key === '[') {
        setSidebarCollapsed(prev => !prev)
      } else if (e.key === '?') {
        setShowShortcuts(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spinner /></div>
  }

  const page = (() => {
    switch (active) {
      case 'Pulse': return <Dashboard key={refreshKey} onAdd={() => setShowQuickAdd(true)} business={business} />
      case 'Khata': return <Khata business={business} />
      case 'Stock': return <Stock business={business} />
      case 'Invoices': return <Invoices business={business} />
      case 'Reports': return <Reports />
      case 'Settings': return <Settings business={business} onBusinessUpdate={setBusiness} />
    }
  })()

  return (
    <div className="app-shell">
      <RealtimeSync userId={user?.id} />
      <Sidebar
        active={active}
        setActive={setActive}
        open={menuOpen}
        setOpen={setMenuOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        business={business}
        navItems={navItems}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />
      <div className="main-shell">
        <Topbar
          onMenu={() => setMenuOpen(prev => !prev)}
          onAdd={() => setShowQuickAdd(true)}
          query={query}
          setQuery={setQuery}
          business={business}
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <main>{page}</main>
      </div>

      {showQuickAdd && (
        <QuickAdd
          close={() => setShowQuickAdd(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
          currency={business?.currency ?? 'NPR'}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal close={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}