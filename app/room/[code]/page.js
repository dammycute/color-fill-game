'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ColorFloodGame from '@/components/ColorFloodGame'
import Leaderboard from '@/components/Leaderboard'
import { LEVELS } from '@/lib/gameLogic'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={copy} style={{
      background: copied ? 'rgba(46,204,113,0.15)' : 'rgba(52,152,219,0.12)',
      border: `1px solid ${copied ? 'rgba(46,204,113,0.3)' : 'rgba(52,152,219,0.25)'}`,
      color: copied ? '#2ECC71' : '#3498DB',
      borderRadius: 8, padding: '4px 10px', fontSize: 11,
      cursor: 'pointer', fontWeight: 600, letterSpacing: 1,
      transition: 'all 0.2s ease',
    }}>
      {copied ? '✓ COPIED' : 'COPY'}
    </button>
  )
}

export default function GameRoomPage() {
  const { code } = useParams()
  if (code && code.length !== 6) notFound()
  const router = useRouter()

  const [room, setRoom] = useState(null)
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isCreator, setIsCreator] = useState(false)
  const [playerCount, setPlayerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [roomClosed, setRoomClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  // Load from localStorage and verify room
  useEffect(() => {
    const storedCode = localStorage.getItem('cf_room_code')
    const storedUsername = localStorage.getItem('cf_username')
    const storedRoomId = localStorage.getItem('cf_room_id')
    const storedCreator = localStorage.getItem('cf_is_creator')

    if (!storedUsername || storedCode !== code) {
      router.push(`/room/join?code=${code}`)
      return
    }

    setUsername(storedUsername)
    setRoomId(storedRoomId)
    setIsCreator(storedCreator === '1')

    // Verify room is still active
    fetch(`/api/rooms?code=${code}`)
      .then(r => r.json())
      .then(async data => {
        if (data.error) { router.push('/'); return }
        if (!data.is_active || new Date(data.expires_at) < new Date()) {
          setRoomClosed(true)
          setLoading(false)
          return
        }

        // Ensure we are in the players table (re-join if refreshed)
        await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code, username: storedUsername }),
        })

        setRoom(data)
        setPlayerCount(data.playerCount)
        setLoading(false)
      })
      .catch(() => router.push('/'))
  }, [code])

  // Realtime: room status + player count
  useEffect(() => {
    if (!roomId) return

    const roomChannel = supabase
      .channel(`room-status:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, payload => {
        if (!payload.new.is_active) {
          setRoomClosed(true)
          setTimeout(() => router.push('/'), 4000)
        }
      })
      .subscribe()

    const playersChannel = supabase
      .channel(`players-count:${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'players',
        filter: `room_id=eq.${roomId}`,
      }, async () => {
        const { count } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', roomId)
        setPlayerCount(count || 0)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(playersChannel)
    }
  }, [roomId])

  const handleLevelComplete = useCallback(async (level, movesUsed, stars) => {
    if (!roomId || !username) return
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username, level, movesUsed, stars }),
      })
    } catch {
      // Retry silently
      setTimeout(() => fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username, level, movesUsed, stars }),
      }), 2000)
    }
  }, [roomId, username])

  const handleLeave = useCallback(async () => {
    if (!roomId || !username) return
    
    // Use sendBeacon or keepalive fetch for reliability on close
    fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, username }),
      keepalive: true
    })
  }, [roomId, username])

  const handleLobby = useCallback(() => {
    localStorage.removeItem('cf_room_code')
    localStorage.removeItem('cf_room_id')
    localStorage.removeItem('cf_is_creator')
    router.push('/')
  }, [router])

  const handleCloseRoom = async () => {
    if (!confirm('Close this room for everyone? This cannot be undone.')) return
    setClosing(true)
    await fetch('/api/close-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, username }),
    })
    handleLobby()
  }

  // Cleanup on unmount/close
  useEffect(() => {
    const onUnload = () => { handleLeave() }
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      handleLeave()
    }
  }, [handleLeave])

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0F0F1A',
    }}>
      <div style={{
        fontFamily: 'Orbitron, monospace', color: '#3498DB', fontSize: 13,
        letterSpacing: 3, animation: 'pulse-glow 1.5s ease-in-out infinite',
      }}>LOADING...</div>
    </div>
  )

  if (roomClosed) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0F0F1A', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🚪</div>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, color: '#E74C3C', letterSpacing: 2 }}>
        ROOM CLOSED
      </div>
      <div style={{ color: '#6B7280', fontSize: 13 }}>The creator has closed this room.</div>
      <div style={{ color: '#4B5563', fontSize: 11 }}>Redirecting to home...</div>
    </div>
  )

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/join?code=${code}` : ''

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 30%, rgba(52,152,219,0.06) 0%, transparent 50%), #0F0F1A',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(26,26,46,0.8)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 100,
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', gap: 8 }}>
          {/* Room code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#4B5563', letterSpacing: 1 }}>ROOM</span>
            <span style={{
              fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 900,
              color: '#fff', letterSpacing: '0.2em',
            }}>{code}</span>
            <CopyButton text={shareUrl} />
          </div>
          {/* Player count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(46,204,113,0.08)', borderRadius: 20,
            padding: '3px 10px', border: '1px solid rgba(46,204,113,0.15)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC71', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#2ECC71', fontWeight: 600 }}>{playerCount} online</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Username badge */}
          <div style={{
            background: '#0F0F1A', border: '1px solid rgba(52,152,219,0.2)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, color: '#3498DB', fontWeight: 600,
          }}>
            {username} {isCreator && <span style={{ color: '#F39C12', fontSize: 10 }}>★</span>}
          </div>

          {/* Mobile leaderboard toggle */}
          <button
            onClick={() => setShowLeaderboard(l => !l)}
            style={{
              display: 'none',
              background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '6px 12px', color: '#D1D5DB',
              fontSize: 12, cursor: 'pointer',
              ['@media(max-width:768px)']: { display: 'block' },
            }}
            className="lg:hidden"
          >
            🏆
          </button>

          {isCreator && (
            <button onClick={handleCloseRoom} disabled={closing} style={{
              background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
              color: '#E74C3C', borderRadius: 8, padding: '6px 12px',
              fontSize: 11, cursor: 'pointer', fontWeight: 600, letterSpacing: 1,
            }}>
              {closing ? '...' : 'CLOSE ROOM'}
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: 20, padding: '20px',
        maxWidth: 1100, margin: '0 auto',
      }}
      className="room-layout"
      >
        {/* Game area */}
        <div style={{
          background: '#1A1A2E', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden', minHeight: 500,
          display: 'flex', flexDirection: 'column',
        }}>
          <ColorFloodGame
            key={`${code}-${gameKey}`}
            roomCode={code}
            username={username}
            onLevelComplete={handleLevelComplete}
            onMenu={handleLobby}
          />
        </div>

        {/* Leaderboard sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Leaderboard roomId={roomId} currentUsername={username} />

          {/* Room info card */}
          <div style={{
            background: '#1A1A2E', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, color: '#374151', letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
              ROOM INFO
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#4B5563' }}>Creator</span>
                <span style={{ color: '#D1D5DB', fontWeight: 600 }}>{room?.creator_username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#4B5563' }}>Expires</span>
                <span style={{ color: '#D1D5DB' }}>
                  {room?.expires_at ? new Date(room.expires_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#4B5563' }}>Levels</span>
                <span style={{ color: '#D1D5DB' }}>{LEVELS.length} levels</span>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: '#374151', letterSpacing: 1, marginBottom: 6 }}>SHARE LINK</div>
              <div style={{
                background: '#0F0F1A', borderRadius: 8, padding: '8px 12px',
                fontSize: 11, color: '#4B5563', wordBreak: 'break-all',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {`...join?code=${code}`}
                </span>
                <CopyButton text={shareUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .room-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
