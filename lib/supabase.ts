import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(url, key)
  }
  if (!client) {
    client = createBrowserClient<Database>(url, key)
  }
  return client
}
