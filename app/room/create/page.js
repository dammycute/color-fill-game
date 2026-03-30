'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const GAME_INFO = {
  colorflood: { emoji: '🌊', label: 'Color Flood', color: '#3498DB' },
  numberdrop: { emoji: '🔢', label: 'Number Drop', color: '#9B59B6' },
  numbershoot: { emoji: '🏹', label: 'Number Shoot', color: '#1ABC9C' },
}

function CreateRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(searchParams.get('game') || 'colorflood')

  useEffect(() => {
    const g = sessionStorage.getItem('selected_game')
    if (g) setSelectedGame(g)
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), game: selectedGame }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      localStorage.setItem('cf_username', username.trim())
      localStorage.setItem('cf_room_code', data.code)
      localStorage.setItem('cf_room_id', data.roomId)
      localStorage.setItem('cf_is_creator', '1')
      localStorage.setItem('cf_game', selectedGame)

      router.push(`/room/${data.code}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const gameInfo = GAME_INFO[selectedGame]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(52,152,219,0.08) 0%, transparent 55%), #0F0F1A',
      padding: 24,
    }}>
      <div style={{
        background: '#1A1A2E', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 36px', width: '100%', maxWidth: 420,
        animation: 'fadeInScale 0.35s ease forwards',
      }}>
        <button onClick={() => router.push('/select-game')} style={{
          background: 'none', border: 'none', color: '#4B5563',
          fontSize: 13, cursor: 'pointer', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900,
            color: '#fff', letterSpacing: 2, marginBottom: 8,
          }}>
            CREATE ROOM
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            You'll be the room creator. Share the code with friends.
          </div>
        </div>

        {/* Game selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#6B7280', letterSpacing: 1, display: 'block', marginBottom: 8, fontWeight: 600 }}>
            GAME
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(GAME_INFO).map(([id, info]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedGame(id)}
                style={{
                  flex: 1, padding: '10px 12px',
                  background: selectedGame === id ? `rgba(${id === 'colorflood' ? '52,152,219' : '155,89,182'},0.12)` : '#0F0F1A',
                  border: `1px solid ${selectedGame === id ? info.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>{info.emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: selectedGame === id ? info.color : '#6B7280',
                  fontFamily: 'Orbitron, monospace', letterSpacing: 1,
                }}>{info.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', letterSpacing: 1, display: 'block', marginBottom: 8, fontWeight: 600 }}>
              YOUR USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter a username..."
              maxLength={20}
              autoFocus
              style={{
                width: '100%', background: '#0F0F1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 16px',
                color: '#fff', fontSize: 15,
                outline: 'none', fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = gameInfo.color}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E74C3C',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              background: loading || !username.trim() ? '#1e293b' : `linear-gradient(135deg, ${gameInfo.color}, ${gameInfo.color}cc)`,
              color: loading || !username.trim() ? '#4B5563' : '#fff',
              border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 14, fontWeight: 800, cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: 2, fontFamily: 'Orbitron, monospace',
              boxShadow: loading || !username.trim() ? 'none' : `0 6px 20px ${gameInfo.color}44`,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE ROOM'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0F0F1A', minHeight: '100vh' }} />}>
      <CreateRoomForm />
    </Suspense>
  )
}