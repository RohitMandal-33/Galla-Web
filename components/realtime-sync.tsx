'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Subscribes to Supabase Postgres changes for all tables that mobile syncs.
 * Instead of router.refresh() (which only re-runs server components and does
 * not update client-side React state), we dispatch a CustomEvent that every
 * viewmodel already listens for via the 'galla-demo-data-changed' / new
 * 'galla-sync' pattern.
 */
export function RealtimeSync({ userId }: { userId: string | null | undefined }) {
  useEffect(() => {
    if (!userId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const notify = () => window.dispatchEvent(new Event('galla-sync'))

    const channel = supabase
      .channel(`galla_web_live_sync_${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'transactions',
        filter: `business_id=eq.${userId}`,
      }, notify)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'parties',
        filter: `business_id=eq.${userId}`,
      }, notify)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inventory_items',
        filter: `business_id=eq.${userId}`,
      }, notify)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'invoices',
        filter: `business_id=eq.${userId}`,
      }, notify)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'businesses',
        filter: `id=eq.${userId}`,
      }, notify)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reconciliations',
        filter: `business_id=eq.${userId}`,
      }, notify)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return null
}
