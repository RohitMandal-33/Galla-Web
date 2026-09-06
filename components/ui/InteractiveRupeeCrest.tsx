'use client'

import React, { useState, useRef } from 'react'

const BLESSINGS = [
  'शुभ लाभ! ✦',
  'गल्ला भरियोस्! 🪙',
  'बिक्री बढोस्! 📈',
  'लक्ष्मी बास गरून्! ✨',
  'धन वर्षा! 💰',
  'जय व्यापार! 🌾',
]

const PARTICLE_SYMBOLS = ['✦', 'रु', '•', '✨', '🪙', '★']

interface Particle {
  id: number
  x: number
  y: number
  symbol: string
  color: string
}

export function InteractiveRupeeCrest() {
  const [isFlipping, setIsFlipping] = useState(false)
  const [blessing, setBlessing] = useState<string | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [flipCount, setFlipCount] = useState(0)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const blessingIndexRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isFlipping) return
    const rect = containerRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -py * 18, y: px * 18 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const triggerFlip = () => {
    if (isFlipping) return
    setIsFlipping(true)

    // Next auspicious blessing
    const nextBlessing = BLESSINGS[blessingIndexRef.current % BLESSINGS.length]
    blessingIndexRef.current += 1
    setBlessing(nextBlessing)
    setFlipCount(c => c + 1)

    // Spawn 8 festive golden particles radiating outward
    const newParticles: Particle[] = Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 2 * Math.PI + (Math.random() * 0.4 - 0.2)
      const distance = 42 + Math.random() * 26
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 8,
        symbol: PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)],
        color: ['#fce38a', '#ffd700', '#f38181', '#eaffd0', '#ffffff'][i % 5],
      }
    })
    setParticles(newParticles)

    // Reset animations — kept in sync with the .flipping CSS animation duration (700ms)
    setTimeout(() => {
      setIsFlipping(false)
      setTilt({ x: 0, y: 0 })
    }, 700)

    setTimeout(() => {
      setParticles([])
    }, 900)

    setTimeout(() => {
      setBlessing(null)
    }, 2200)
  }

  return (
    <div
      ref={containerRef}
      className={`hero-art interactive-crest ${isFlipping ? 'flipping' : ''}`}
      onClick={triggerFlip}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          triggerFlip()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Lucky Nepali Rupee coin toss. Click to flip for good fortune."
      title="Click to flip lucky coin 🪙"
      style={{
        transform: isFlipping
          ? undefined
          : `perspective(400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {/*
        Coin-toss animation. We fake the "edge-on" view of a spinning coin
        with scaleX instead of a real rotateY flip, because the medallion
        only has one printed face — a true 3D rotateY would show the रु
        glyph mirrored backwards on every other half-turn. scaleX gives the
        same "thin sliver at the midpoint" read without that artifact.
        The keyframe spacing decelerates toward the end, then adds two
        small bounces to sell a physical landing.
      */}
      <style>{`
        @keyframes coin-toss-flip {
          0%   { transform: translateY(0)     scaleX(1)    scaleY(1);    filter: brightness(1); }
          6%   { transform: translateY(-22px) scaleX(0.15) scaleY(1.05); filter: brightness(1.5); }
          12%  { transform: translateY(-38px) scaleX(1)    scaleY(1);    filter: brightness(1); }
          18%  { transform: translateY(-48px) scaleX(0.15) scaleY(1.05); filter: brightness(1.5); }
          24%  { transform: translateY(-54px) scaleX(1)    scaleY(1);    filter: brightness(1); }
          30%  { transform: translateY(-54px) scaleX(0.15) scaleY(1.05); filter: brightness(1.5); }
          38%  { transform: translateY(-46px) scaleX(1)    scaleY(1);    filter: brightness(1); }
          46%  { transform: translateY(-32px) scaleX(0.3)  scaleY(1.03); filter: brightness(1.3); }
          55%  { transform: translateY(-14px) scaleX(1)    scaleY(1);    filter: brightness(1); }
          64%  { transform: translateY(0)     scaleX(0.55) scaleY(0.94); filter: brightness(1.15); }
          72%  { transform: translateY(-8px)  scaleX(1)    scaleY(1);    filter: brightness(1); }
          82%  { transform: translateY(0)     scaleX(0.8)  scaleY(0.97); filter: brightness(1.05); }
          90%  { transform: translateY(-2px)  scaleX(1)    scaleY(1);    filter: brightness(1); }
          100% { transform: translateY(0)     scaleX(1)    scaleY(1);    filter: brightness(1); }
        }
        .interactive-crest.flipping .crest-medallion {
          animation: coin-toss-flip 0.7s cubic-bezier(0.33, 0, 0.2, 1) forwards !important;
          transform-origin: center bottom;
        }
      `}</style>

      {/* Floating blessing badge */}
      {blessing && (
        <div className="crest-blessing-popup" aria-live="polite">
          {blessing}
        </div>
      )}

      {/* Burst particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="crest-particle"
          style={
            {
              '--target-x': `${p.x}px`,
              '--target-y': `${p.y}px`,
              color: p.color,
            } as React.CSSProperties
          }
        >
          {p.symbol}
        </span>
      ))}

      {/* Ripple shockwave when clicked */}
      <div className={`crest-shockwave ${isFlipping ? 'active' : ''}`} />

      {/* Outer ambient decorative ring */}
      <div className="hero-ring ring-one" />

      {/* Inner decorative ring */}
      <div className="hero-ring ring-two" />

      {/* Central coin medallion with toss animation */}
      <div className="crest-medallion">
        <div className="crest-medallion-rim" />
        <span className="crest-rupee-symbol">रु</span>
        <div className="crest-shine-glint" />
      </div>

      {/* Tooltip on hover */}
      <span className="crest-hint">Flip for luck 🪙</span>
    </div>
  )
}
