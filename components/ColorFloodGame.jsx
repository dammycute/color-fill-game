'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { COLORS, LEVELS, generateGrid, floodFill, isBoardFilled, deepCopy, calcStars } from '@/lib/gameLogic'

function WinScreen({ level, moves, maxMoves, onNext, onMenu, onReplay, isLastLevel }) {
  const stars = calcStars(moves, maxMoves)
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#0F0F1A',
      gap: 16, padding: 32, animation: 'fadeInScale 0.35s ease forwards',
      zIndex: 10,
    }}>
      <div style={{ fontSize: 56 }}>{isLastLevel ? '🏆' : '🎉'}</div>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900,
        color: '#fff', letterSpacing: 3,
        textShadow: '0 0 20px rgba(52,152,219,0.6)',
      }}>
        {isLastLevel ? 'ALL DONE!' : `LEVEL ${level} CLEAR!`}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1,2,3].map(i => (
          <span key={i} style={{
            fontSize: 32,
            color: i <= stars ? '#F39C12' : '#1f1f30',
            textShadow: i <= stars ? '0 0 10px rgba(243,156,18,0.6)' : 'none',
            transition: 'all 0.3s ease',
          }}>★</span>
        ))}
      </div>
      <div style={{ color: '#6B7280', fontSize: 13, letterSpacing: 1 }}>
        {moves} / {maxMoves} moves used
      </div>
      {isLastLevel ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, maxWidth: 260 }}>
          You've completed all {LEVELS.length} levels! Check the leaderboard.
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={onReplay} style={secondaryBtn}>↺ Retry</button>
        {!isLastLevel && <button onClick={onNext} style={primaryBtn}>Next →</button>}
      </div>
      <button onClick={onMenu} style={{ color: '#3a3a5a', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1, marginTop: 4 }}>
        ↩ Lobby
      </button>
    </div>
  )
}

function LoseScreen({ level, onReplay, onMenu }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#0F0F1A',
      gap: 16, padding: 32, animation: 'fadeInScale 0.35s ease forwards', zIndex: 10,
    }}>
      <div style={{ fontSize: 56 }}>💀</div>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900,
        color: '#E74C3C', letterSpacing: 3,
      }}>OUT OF MOVES</div>
      <div style={{ color: '#6B7280', fontSize: 13 }}>Level {level}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={onMenu} style={secondaryBtn}>↩ Lobby</button>
        <button onClick={onReplay} style={primaryBtn}>↺ Try Again</button>
      </div>
    </div>
  )
}

const primaryBtn = {
  background: '#3498DB', color: '#fff', border: 'none', borderRadius: 12,
  padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  letterSpacing: 1, boxShadow: '0 4px 20px rgba(52,152,219,0.4)',
}
const secondaryBtn = {
  background: '#1A1A2E', color: '#999', border: '1px solid #2a2a4a',
  borderRadius: 12, padding: '12px 24px', fontSize: 14, cursor: 'pointer',
}

export default function ColorFloodGame({ roomCode, username, onLevelComplete, onMenu }) {
  const handleMenuClick = () => {
    if (window.confirm('Leave this room? Your session will be cleared.')) {
      onMenu()
    }
  }

  const [levelIndex, setLevelIndex] = useState(0)
  const [grid, setGrid] = useState(null)
  const [moves, setMoves] = useState(0)
  const [gameState, setGameState] = useState('playing')
  const [lastColor, setLastColor] = useState(null)
  const [poppedCells, setPoppedCells] = useState(new Set())
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const config = LEVELS[Math.min(levelIndex, LEVELS.length - 1)]
  const { grid: GRID_SIZE, maxMoves: MAX_MOVES, colors: NUM_COLORS } = config

  useEffect(() => {
    setGrid(generateGrid(GRID_SIZE, NUM_COLORS, roomCode + levelIndex))
    setMoves(0)
    setGameState('playing')
    setLastColor(null)
  }, [levelIndex, GRID_SIZE, NUM_COLORS, roomCode])

  const cellSize = containerWidth > 0
    ? Math.max(Math.floor((Math.min(containerWidth, 480) - 24) / GRID_SIZE), GRID_SIZE > 30 ? 4 : 8)
    : 0

  useEffect(() => {
    if (!containerRef.current) return
    
    // Initial measure
    if (containerRef.current.offsetWidth > 0) {
      setContainerWidth(containerRef.current.offsetWidth)
    }

    const ro = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect) {
        setContainerWidth(entries[0].contentRect.width)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleColorPick = useCallback((colorIdx) => {
    if (gameState !== 'playing' || !grid) return
    const currentColor = grid[0][0]
    if (colorIdx === currentColor) return

    const newGrid = deepCopy(grid)
    const changed = new Set()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (newGrid[r][c] === currentColor) changed.add(`${r},${c}`)

    floodFill(newGrid, 0, 0, currentColor, colorIdx)

    const popped = new Set()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (newGrid[r][c] !== grid[r][c]) popped.add(`${r},${c}`)

    setPoppedCells(popped)
    setTimeout(() => setPoppedCells(new Set()), 180)

    const newMoves = moves + 1
    setGrid(newGrid)
    setMoves(newMoves)
    setLastColor(colorIdx)

    if (isBoardFilled(newGrid)) {
      setGameState('won')
      const stars = calcStars(newMoves, MAX_MOVES)
      if (onLevelComplete) {
        setTimeout(() => onLevelComplete(levelIndex + 1, newMoves, stars), 350)
      }
    } else if (newMoves >= MAX_MOVES) {
      setGameState('lost')
    }
  }, [grid, moves, gameState, GRID_SIZE, MAX_MOVES, levelIndex, onLevelComplete])

  const handleNext = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(l => l + 1)
      setGameState('playing')
    }
  }
  const handleReplay = () => {
    setGrid(generateGrid(GRID_SIZE, NUM_COLORS, roomCode + levelIndex))
    setMoves(0)
    setGameState('playing')
    setLastColor(null)
  }

  const movesLeft = MAX_MOVES - moves
  const progressPct = moves / MAX_MOVES
  const progressColor = progressPct < 0.6 ? '#2ECC71' : progressPct < 0.85 ? '#F39C12' : '#E74C3C'
  const isLastLevel = levelIndex >= LEVELS.length - 1

  return (
    <div ref={containerRef} style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 12, width: '100%', padding: '12px 0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
        <button onClick={handleMenuClick} style={{
          background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '6px 12px', color: '#6B7280',
          fontSize: 12, cursor: 'pointer', flexShrink: 0,
        }}>← Lobby</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 3 }}>
          LEVEL {levelIndex + 1}
        </div>
        <div style={{
          background: '#1A1A2E', borderRadius: 8, padding: '4px 12px',
          textAlign: 'center', flexShrink: 0,
          border: `1px solid ${movesLeft <= 3 ? '#E74C3C44' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: movesLeft <= 3 ? '#E74C3C' : '#fff' }}>{movesLeft}</div>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>MOVES</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '90%', height: 3, background: '#1A1A2E', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: progressColor,
          width: `${progressPct * 100}%`, transition: 'width 0.2s ease, background 0.3s ease',
        }} />
      </div>

      {/* Grid */}
      {grid && cellSize > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gap: 1, borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r},${c}`} style={{
                width: cellSize, height: cellSize,
                background: COLORS[cell],
                transform: poppedCells.has(`${r},${c}`) ? 'scale(0.82)' : 'scale(1)',
                transition: 'transform 0.12s ease, background 0.08s ease',
                borderRadius: cellSize > 20 ? 2 : 0,
              }} />
            ))
          )}
        </div>
      )}

      {/* Color palette */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: NUM_COLORS > 12 ? 6 : 10, padding: '10px 16px',
        background: '#1A1A2E', borderRadius: 20, marginTop: 4,
        border: '1px solid rgba(255,255,255,0.04)',
        justifyContent: 'center', maxWidth: '95%'
      }}>
        {COLORS.slice(0, NUM_COLORS).map((color, i) => {
          const isActive = grid && grid[0][0] === i
          const isLast = lastColor === i
          return (
            <button key={i} onClick={() => handleColorPick(i)} style={{
              width: NUM_COLORS > 12 ? 30 : 40, height: NUM_COLORS > 12 ? 30 : 40, borderRadius: '50%',
              background: color, border: 'none', cursor: 'pointer',
              transform: isActive ? 'scale(1.22)' : 'scale(1)',
              boxShadow: isActive ? `0 0 0 2.5px rgba(255,255,255,0.75), 0 0 12px ${color}` :
                         isLast ? `0 0 0 1.5px rgba(255,255,255,0.3)` : `0 2px 8px rgba(0,0,0,0.4)`,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              position: 'relative',
              outline: 'none',
            }}>
              {isActive && (
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ color: '#2a2a4a', fontSize: 11, letterSpacing: 0.4 }}>
        Tap a color to flood from top-left ↖
      </div>

      {/* Overlays */}
      {gameState === 'won' && (
        <WinScreen
          level={levelIndex + 1}
          moves={moves}
          maxMoves={MAX_MOVES}
          onNext={handleNext}
          onMenu={handleMenuClick}
          onReplay={handleReplay}
          isLastLevel={isLastLevel}
        />
      )}
      {gameState === 'lost' && (
        <LoseScreen level={levelIndex + 1} onReplay={handleReplay} onMenu={handleMenuClick} />
      )}
    </div>
  )
}
