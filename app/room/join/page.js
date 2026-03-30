'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!code.trim() || !username.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), username: username.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      localStorage.setItem('cf_username', data.username)
      localStorage.setItem('cf_room_code', data.code)
      localStorage.setItem('cf_room_id', data.roomId)
      localStorage.setItem('cf_game', data.game || 'colorflood')
      localStorage.removeItem('cf_is_creator')

      router.push(`/room/${data.code}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 70% 40%, rgba(155,89,182,0.08) 0%, transparent 55%), #0F0F1A',
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
        }}>
          ← Back
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900,
            color: '#fff', letterSpacing: 2, marginBottom: 8,
          }}>
            JOIN ROOM
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Enter the 6-character room code and pick a unique username.
          </div>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', letterSpacing: 1, display: 'block', marginBottom: 8, fontWeight: 600 }}>
              ROOM CODE
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. XK92PL"
              autoFocus={!code}
              style={{
                width: '100%', background: '#0F0F1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 16px',
                color: '#fff', fontSize: 20, letterSpacing: '0.3em',
                fontFamily: 'Orbitron, monospace', fontWeight: 700,
                outline: 'none', textTransform: 'uppercase',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#9B59B6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

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
              autoFocus={!!code}
              style={{
                width: '100%', background: '#0F0F1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 16px',
                color: '#fff', fontSize: 15,
                outline: 'none', fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#3498DB'}
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
            disabled={loading || !code.trim() || !username.trim()}
            style={{
              background: loading || !code.trim() || !username.trim() ? '#1e293b' : 'linear-gradient(135deg, #9B59B6, #8E44AD)',
              color: loading || !code.trim() || !username.trim() ? '#4B5563' : '#fff',
              border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 14, fontWeight: 800,
              cursor: loading || !code.trim() || !username.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: 2, fontFamily: 'Orbitron, monospace',
              boxShadow: loading || !code.trim() || !username.trim() ? 'none' : '0 6px 20px rgba(155,89,182,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'JOINING...' : 'JOIN ROOM →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0F0F1A', minHeight: '100vh' }} />}>
      <JoinForm />
    </Suspense>
  )
}