'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Sparkles, Eye, EyeOff, Zap } from 'lucide-react'

type Mode = 'login' | 'signup'

const DEMO_EMAIL = 'demo@galla.app'
const DEMO_PASSWORD = 'demo1234'

export default function AuthPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { business_name: businessName || 'My Business' } },
        })
        if (error) throw error
        setInfo('Check your email for a confirmation link.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setMode('login')
    setError(null)
    setInfo(null)
  }

  return (
    <div className="auth-split-page">
      {/* ── LEFT PANEL: Mobile app showcase ── */}
      <div className="auth-showcase" aria-hidden="true">
        <div className="showcase-inner">
          <div className="showcase-brand">
            <Image src="/galla_logo.png" alt="Galla" width={36} height={36} className="brand-logo-img" priority />
            <span className="showcase-brand-name">galla</span>
          </div>

          <h2 className="showcase-headline">
            Your kirana,<br />
            <span className="showcase-accent">fully in control.</span>
          </h2>
          <p className="showcase-sub">
            Cash khata · Udhaar · Stock · Invoices — all in one place, on any device.
          </p>

          {/* Phone mockup frames with the screenshots */}
          <div className="phone-showcase">
            {/* Background / second phone */}
            <div className="phone-frame phone-back">
              <Image
                src="/app-screen-2.jpg"
                alt="Galla Stock screen"
                fill
                className="phone-screen-img"
                sizes="200px"
              />
            </div>
            {/* Foreground / main phone */}
            <div className="phone-frame phone-front">
              <Image
                src="/app-screen-1.jpg"
                alt="Galla Dashboard screen"
                fill
                className="phone-screen-img"
                sizes="220px"
              />
            </div>
          </div>

          <div className="showcase-badges">
            <span className="showcase-badge"><span className="badge-dot" />Live sync</span>
            <span className="showcase-badge"><span className="badge-dot" />Works offline</span>
            <span className="showcase-badge"><span className="badge-dot" />Nepali rupee</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login form ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Brand (shown on mobile only — desktop shows it in left panel) */}
          <div className="auth-brand auth-brand-mobile">
            <Image src="/galla_logo.png" alt="Galla" width={40} height={40} className="auth-logo-img" priority />
            <span className="brand-name">galla</span>
          </div>

          <div className="auth-heading">
            <h1>{mode === 'login' ? 'Welcome to Galla' : 'Start for free.'}</h1>
            <p>{mode === 'login' ? 'Your daily khata — cash, udhaar & stock' : 'Create your galla account in seconds.'}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <label>
                Business name
                <input
                  type="text"
                  placeholder="Anish Kirana Store"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  autoComplete="organization"
                />
              </label>
            )}
            <label>
              <span className="auth-field-icon">✉</span> Email
              <input
                type="email"
                placeholder="demo@galla.app"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="password-label">
              <span className="auth-field-icon">🔒</span> Password
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button type="submit" className="primary-button full-button auth-submit-btn" disabled={loading}>
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>Don&apos;t have an account? <button onClick={() => { setMode('signup'); setError(null) }}>Sign up with email</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('login'); setError(null) }}>Sign in</button></>
            )}
          </div>

          {/* Demo account one-tap button */}
          <button className="demo-tap-btn" onClick={fillDemo} type="button">
            <Zap size={15} />
            Use demo account — one tap
          </button>

          {/* Demo info card */}
          <div className="demo-info-card">
            <div className="demo-info-header">
              <span><Sparkles size={13} /> Demo account (mock data)</span>
              <button className="demo-fill-btn" onClick={fillDemo} type="button">Tap to fill</button>
            </div>
            <div className="demo-info-row">
              <span>Email</span>
              <strong>{DEMO_EMAIL}</strong>
            </div>
            <div className="demo-info-row">
              <span>Password</span>
              <strong>{DEMO_PASSWORD}</strong>
            </div>
            <p className="demo-info-note">
              Loads Shree Ganesh Kirana mock data: 6 inventory items, 5 parties, 10+ transactions, 1 invoice — graphs become populated
            </p>
          </div>

          <div className="auth-footer">
            <Sparkles size={12} />
            <span>Simple business, clear mind.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
