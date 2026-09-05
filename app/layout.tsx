import { Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SupabaseProvider } from '@/lib/supabase-provider'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'galla — Simple business, clear mind.',
  description: 'A premium business ledger for modern merchants.',
  icons: {
    icon: [
      { url: '/galla_logo.png' },
      { url: '/icon-light-32x32.png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f2ed',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-[#f5f2ed]">
      <body className={`${outfit.className} antialiased`}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
