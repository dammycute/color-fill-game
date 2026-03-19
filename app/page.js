'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SplashScreen from '@/components/SplashScreen'

const COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C']

function AnimatedGrid() {
  const [cells, setCells] = useState(() =>
    Array.from({ length: 16 }, (_, i) => (i * 3 + Math.floor(i / 4) * 2) % 6)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setCells(prev => prev.map(c => Math.random() > 0.75 ? (c + 1) % 6 : c))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 28px)',
      gap: 4, padding: 12, background: '#1A1A2E',
      borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{
          width: 28, height: 28, borderRadius: 5,
          background: COLORS[c],
          transition: 'background 0.4s ease',
          boxShadow: `0 2px 8px ${COLORS[c]}44`,
        }} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('splash_seen')
    if (seen) { setShowSplash(false); setVisible(true) }
  }, [])

  const handleSplashDone = () => {
    sessionStorage.setItem('splash_seen', '1')
    setShowSplash(false)
    setTimeout(() => setVisible(true), 50)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(52,152,219,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(155,89,182,0.07) 0%, transparent 55%), #0F0F1A',
      padding: 24, gap: 32,
    }}>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 28, maxWidth: 400, width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(40px, 10vw, 60px)',
            fontWeight: 900, letterSpacing: '0.12em', color: '#fff',
            lineHeight: 1.05,
            textShadow: '0 0 40px rgba(52,152,219,0.5)',
          }}>COLOR</div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(40px, 10vw, 60px)',
            fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1.05,
            background: 'linear-gradient(135deg, #3498DB 0%, #9B59B6 50%, #1ABC9C 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>FLOOD</div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#4B5563', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Online Multiplayer
          </div>
        </div>

        <AnimatedGrid />

        {/* How to play */}
        <div style={{
          background: 'rgba(52,152,219,0.06)', borderRadius: 14,
          border: '1px solid rgba(52,152,219,0.15)',
          padding: '16px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#3498DB', fontWeight: 800, letterSpacing: 2, marginBottom: 8, fontFamily: 'Orbitron, monospace' }}>
            HOW TO PLAY
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7 }}>
            Tap colors to flood-fill from the top-left corner. Fill the entire board before you run out of moves. Compete with your room!
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button
            onClick={() => router.push('/room/create')}
            style={{
              background: 'linear-gradient(135deg, #3498DB, #2980B9)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '16px 24px', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', letterSpacing: 2,
              fontFamily: 'Orbitron, monospace',
              boxShadow: '0 6px 24px rgba(52,152,219,0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 32px rgba(52,152,219,0.5)' }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 6px 24px rgba(52,152,219,0.4)' }}
          >
            + CREATE ROOM
          </button>

          <button
            onClick={() => router.push('/room/join')}
            style={{
              background: '#1A1A2E', color: '#D1D5DB',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '16px 24px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              letterSpacing: 2, fontFamily: 'Orbitron, monospace',
              transition: 'border-color 0.15s ease, color 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(52,152,219,0.4)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#D1D5DB' }}
          >
            → JOIN ROOM
          </button>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 11, color: '#374151', letterSpacing: '0.2em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          CREATED BY{' '}
          <span style={{ color: '#3498DB', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
            HTCODE
          </span>
        </div>
      </div>
    </div>
  )
}
