'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C']

export default function NotFound() {
  const [colorIdx, setColorIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIdx(prev => (prev + 1) % COLORS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, rgba(52,152,219,0.08) 0%, #0F0F1A 80%)',
      color: '#fff',
      textAlign: 'center',
      padding: '24px',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Inter, sans-serif'
    }} className="noise">
      
      {/* Dynamic Background Grid Decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.04,
        display: 'grid',
        gridTemplateColumns: 'repeat(15, 1fr)',
        gap: '4px',
        pointerEvents: 'none',
        transform: 'rotate(-5deg) scale(1.1)',
      }}>
        {Array.from({ length: 225 }).map((_, i) => (
          <div key={i} style={{ 
            aspectRatio: '1', 
            background: COLORS[(i + colorIdx) % COLORS.length],
            borderRadius: '2px',
            transition: 'background 2s ease'
          }} />
        ))}
      </div>

      {/* Main Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
      }}>
        {/* Animated Icon */}
        <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'float 4s ease-in-out infinite' }}>
          🧩
        </div>

        <h1 style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 'clamp(90px, 18vw, 160px)',
          fontWeight: 900,
          margin: 0,
          lineHeight: 0.9,
          color: COLORS[colorIdx],
          textShadow: `0 0 40px ${COLORS[colorIdx]}55`,
          transition: 'color 2s ease, text-shadow 2s ease',
          letterSpacing: '-2px'
        }}>
          404
        </h1>
        
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '0.3em',
          marginTop: '20px',
          color: '#fff',
          textTransform: 'uppercase',
          opacity: 0.9
        }}>
          GRID MISSED
        </div>

        <div style={{
          height: '2px',
          width: '60px',
          background: COLORS[colorIdx],
          margin: '24px auto',
          transition: 'background 2s ease',
          boxShadow: `0 0 10px ${COLORS[colorIdx]}`
        }} />

        <p style={{
          fontSize: '15px',
          color: '#6B7280',
          marginTop: '0',
          maxWidth: '320px',
          margin: '0 auto',
          lineHeight: '1.7',
          letterSpacing: '0.02em'
        }}>
          The coordinate you requested has been flooded out of existence.
        </p>

        <div style={{ marginTop: '48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg, #3498DB, #2980B9)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '16px 36px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '2px',
              fontFamily: 'Orbitron, monospace',
              boxShadow: '0 6px 24px rgba(52,152,219,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="hover-lift"
            onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(52,152,219,0.45)';
            }}
            onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(52,152,219,0.3)';
            }}
            >
              RETURN TO LOBBY
            </button>
          </Link>
        </div>
      </div>

      {/* Aesthetic Accents */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        fontSize: '10px',
        fontFamily: 'Orbitron, monospace',
        color: '#374151',
        letterSpacing: '0.4em',
        textTransform: 'uppercase'
      }}>
        Error Code: 0xCOLOR_NOT_FOUND
      </div>

      {/* Floating particles (CSS-only for performance) */}
      <style jsx>{`
        .noise::after {
          opacity: 0.15 !important;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
