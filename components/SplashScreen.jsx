'use client'
import { useEffect, useState } from 'react'

const COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C']

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // in | hold | out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 2200)
    const t3 = setTimeout(() => onDone(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: '#0F0F1A',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.6s ease',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Radial glow bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(52,152,219,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Color dots orbiting */}
      <div style={{ position: 'absolute', width: 300, height: 300 }}>
        {COLORS.map((color, i) => {
          const angle = (i / COLORS.length) * 360
          const rad = (angle * Math.PI) / 180
          const x = 150 + 120 * Math.cos(rad) - 6
          const y = 150 + 120 * Math.sin(rad) - 6
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y,
              width: 12, height: 12, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 12px ${color}`,
              opacity: phase === 'in' ? 0 : 0.8,
              transition: `opacity 0.4s ease ${i * 0.08}s`,
              animation: phase === 'hold' ? `float 2s ease-in-out ${i * 0.15}s infinite` : 'none',
            }} />
          )
        })}
      </div>

      {/* Main title */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 900,
          letterSpacing: '0.15em',
          color: '#fff',
          lineHeight: 1.1,
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'scale(0.9)' : 'scale(1)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          textShadow: '0 0 30px rgba(52,152,219,0.6), 0 0 60px rgba(52,152,219,0.3)',
        }}>
          COLOR
        </div>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 900,
          letterSpacing: '0.15em',
          background: 'linear-gradient(90deg, #3498DB, #9B59B6, #1ABC9C)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'scale(0.9)' : 'scale(1)',
          transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
        }}>
          FLOOD
        </div>

        {/* Subtitle */}
        <div style={{
          marginTop: 24,
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          opacity: phase === 'in' ? 0 : 1,
          transition: 'opacity 0.6s ease 0.3s',
        }}>
          ONLINE MULTIPLAYER
        </div>

        {/* Created by */}
        <div style={{
          marginTop: 12,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(52,152,219,0.1)',
          border: '1px solid rgba(52,152,219,0.3)',
          borderRadius: 100,
          padding: '6px 18px',
          opacity: phase === 'in' ? 0 : 1,
          transition: 'opacity 0.6s ease 0.45s',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            CREATED BY
          </span>
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 13,
            fontWeight: 700,
            color: '#3498DB',
            letterSpacing: '0.15em',
          }}>
            HTCODE
          </span>
        </div>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: 48,
        width: 160, height: 2,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #3498DB, #9B59B6)',
          borderRadius: 2,
          width: phase === 'in' ? '0%' : phase === 'hold' ? '80%' : '100%',
          transition: phase === 'in' ? 'width 0.5s ease' : phase === 'hold' ? 'width 1.5s ease' : 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}
