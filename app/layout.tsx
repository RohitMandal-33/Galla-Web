import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SupabaseProvider } from '@/lib/supabase-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'galla — Simple business, clear mind.',
  description: 'A premium business ledger for modern merchants.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f2ed',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-[#f5f2ed]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
