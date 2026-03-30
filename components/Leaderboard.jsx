'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function getRank(i) {
  if (i === 0) return { emoji: '🥇', color: '#F39C12' }
  if (i === 1) return { emoji: '🥈', color: '#9BA0A6' }
  if (i === 2) return { emoji: '🥉', color: '#CD7F32' }
  return { emoji: `${i + 1}`, color: '#4B5563' }
}

export default function Leaderboard({ roomId, currentUsername, gameMode = 'colorflood' }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const isNumberDrop = gameMode === 'numberdrop'

  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from('scores')
      .select('username, level, moves_used, stars')
      .eq('room_id', roomId)

    if (error || !data) return

    if (isNumberDrop) {
      // Number Drop: moves_used = score, higher is better. One row per player (level=1)
      const map = {}
      for (const row of data) {
        if (!map[row.username] || row.moves_used > map[row.username].score) {
          map[row.username] = { username: row.username, score: row.moves_used, stars: row.stars }
        }
      }
      const sorted = Object.values(map).sort((a, b) => b.score - a.score)
      setEntries(sorted.slice(0, 15))
    } else {
      // Color Flood: aggregate levels
      const map = {}
      for (const row of data) {
        if (!map[row.username]) {
          map[row.username] = { username: row.username, bestLevels: {} }
        }
        const u = map[row.username]
        const existing = u.bestLevels[row.level]
        if (!existing || row.stars > existing.stars || (row.stars === existing.stars && row.moves_used < existing.moves_used)) {
          u.bestLevels[row.level] = { stars: row.stars, moves: row.moves_used }
        }
      }

      const entries = Object.values(map).map(u => {
        const levels = Object.values(u.bestLevels)
        return {
          username: u.username,
          levelsCompleted: levels.length,
          totalStars: levels.reduce((s, l) => s + l.stars, 0),
          totalMoves: levels.reduce((s, l) => s + l.moves, 0),
        }
      })

      entries.sort((a, b) => {
        if (b.levelsCompleted !== a.levelsCompleted) return b.levelsCompleted - a.levelsCompleted
        if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars
        return a.totalMoves - b.totalMoves
      })
      setEntries(entries.slice(0, 15))
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!roomId) return
    fetchLeaderboard()

    const channel = supabase
      .channel(`leaderboard:${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'scores',
        filter: `room_id=eq.${roomId}`,
      }, () => fetchLeaderboard())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomId, gameMode])

  return (
    <div style={{
      background: '#1A1A2E', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', width: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>
          LEADERBOARD
        </div>
        <div style={{
          fontSize: 10, color: '#2ECC71', letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#2ECC71',
            display: 'inline-block',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }} />
          LIVE
        </div>
      </div>

      {/* Column headers */}
      {isNumberDrop ? (
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 70px 40px',
          padding: '8px 16px', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          {['#', 'PLAYER', 'SCORE', '⭐'].map((h, i) => (
            <div key={i} style={{
              fontSize: 9, color: '#374151', fontWeight: 700,
              letterSpacing: 1, textAlign: i > 1 ? 'center' : 'left',
            }}>{h}</div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 36px 40px 50px',
          padding: '8px 16px', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          {['#', 'PLAYER', 'LVL', '⭐', 'MOVES'].map((h, i) => (
            <div key={i} style={{
              fontSize: 9, color: '#374151', fontWeight: 700,
              letterSpacing: 1, textAlign: i > 1 ? 'center' : 'left',
            }}>{h}</div>
          ))}
        </div>
      )}

      {/* Rows */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#374151', fontSize: 13 }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#374151', fontSize: 12 }}>
            No scores yet. Be the first!
          </div>
        ) : entries.map((entry, i) => {
          const rank = getRank(i)
          const isMe = entry.username === currentUsername
          return (
            <div key={entry.username} style={{
              display: 'grid',
              gridTemplateColumns: isNumberDrop ? '32px 1fr 70px 40px' : '32px 1fr 36px 40px 50px',
              padding: '10px 16px', gap: 8, alignItems: 'center',
              background: isMe ? 'rgba(52,152,219,0.08)' : 'transparent',
              borderLeft: isMe ? '2px solid #3498DB' : '2px solid transparent',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: 'background 0.2s ease',
            }}>
              <div style={{ fontSize: i < 3 ? 16 : 11, color: rank.color, textAlign: 'center', fontWeight: 700 }}>
                {rank.emoji}
              </div>
              <div style={{
                fontSize: 13, fontWeight: isMe ? 700 : 500,
                color: isMe ? '#3498DB' : '#D1D5DB',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.username}
                {isMe && <span style={{ fontSize: 9, marginLeft: 6, color: '#3498DB', opacity: 0.7 }}>YOU</span>}
              </div>

              {isNumberDrop ? (
                <>
                  <div style={{ fontSize: 12, color: '#fff', textAlign: 'center', fontWeight: 700, fontFamily: 'Orbitron, monospace' }}>
                    {entry.score?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#F39C12', textAlign: 'center', fontWeight: 600 }}>
                    {'★'.repeat(entry.stars || 1)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{entry.levelsCompleted}</div>
                  <div style={{ fontSize: 13, color: '#F39C12', textAlign: 'center', fontWeight: 600 }}>{entry.totalStars}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>{entry.totalMoves}</div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}