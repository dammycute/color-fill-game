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
      display: 'grid', gridTemplateColumns: 'repeat(4, 26px)',
      gap: 4, padding: 10, background: '#1A1A2E',
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{
          width: 26, height: 26, borderRadius: 4,
          background: COLORS[c],
          transition: 'background 0.4s ease',
          boxShadow: `0 2px 6px ${COLORS[c]}44`,
        }} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [visible, setVisible] = useState(false)
  const [hoveredMode, setHoveredMode] = useState(null)

  useEffect(() => {
    const seen = sessionStorage.getItem('splash_seen')
    if (seen) { setShowSplash(false); setVisible(true) }
  }, [])

  const handleSplashDone = () => {
    sessionStorage.setItem('splash_seen', '1')
    setShowSplash(false)
    setTimeout(() => setVisible(true), 50)
  }

  const handleModeSelect = (mode) => {
    // Store mode, then go to game selection
    sessionStorage.setItem('play_mode', mode)
    router.push('/select-game')
  }

  const modes = [
    {
      id: 'solo',
      icon: '🎮',
      label: 'SOLO PLAY',
      sub: 'Just you vs the game',
      color: '#2ECC71',
      glow: 'rgba(46,204,113,0.3)',
      border: 'rgba(46,204,113,0.25)',
      bg: 'rgba(46,204,113,0.06)',
    },
    {
      id: 'group',
      icon: '👥',
      label: 'GROUP PLAY',
      sub: 'Compete with friends',
      color: '#3498DB',
      glow: 'rgba(52,152,219,0.3)',
      border: 'rgba(52,152,219,0.25)',
      bg: 'rgba(52,152,219,0.06)',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(52,152,219,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(155,89,182,0.07) 0%, transparent 55%), #0F0F1A',
      padding: 24,
    }}>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 32, maxWidth: 420, width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(36px, 9vw, 54px)',
            fontWeight: 900, letterSpacing: '0.12em', color: '#fff',
            lineHeight: 1.05,
            textShadow: '0 0 40px rgba(52,152,219,0.4)',
          }}>ARCADE</div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(36px, 9vw, 54px)',
            fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1.05,
            background: 'linear-gradient(135deg, #3498DB 0%, #9B59B6 50%, #1ABC9C 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>VAULT</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4B5563', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Online Multiplayer Games
          </div>
        </div>

        <AnimatedGrid />

        {/* Mode selection */}
        <div style={{ width: '100%' }}>
          <div style={{
            fontSize: 10, color: '#4B5563', letterSpacing: '0.3em',
            textAlign: 'center', marginBottom: 16, fontFamily: 'Orbitron, monospace',
            textTransform: 'uppercase',
          }}>
            SELECT MODE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
                style={{
                  background: hoveredMode === mode.id ? mode.bg : '#1A1A2E',
                  border: `1px solid ${hoveredMode === mode.id ? mode.border : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 18,
                  width: '100%', textAlign: 'left',
                  transition: 'all 0.2s ease',
                  transform: hoveredMode === mode.id ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: hoveredMode === mode.id ? `0 8px 28px ${mode.glow}` : '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: hoveredMode === mode.id ? mode.bg : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hoveredMode === mode.id ? mode.border : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}>
                  {mode.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: 14, fontWeight: 900, color: '#fff',
                    letterSpacing: 2, marginBottom: 4,
                  }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {mode.sub}
                  </div>
                </div>
                <div style={{
                  color: hoveredMode === mode.id ? mode.color : '#374151',
                  fontSize: 18, transition: 'color 0.2s ease',
                }}>
                  →
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 10, color: '#374151', letterSpacing: '0.2em',
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