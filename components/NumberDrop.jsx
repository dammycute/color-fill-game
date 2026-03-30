'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const COLS = 5
const ROWS = 8
const GAP = 4

const TILE_COLORS = {
    2: { bg: '#2B2B3E', text: '#B8B4CC' },
    4: { bg: '#363550', text: '#D0CCEE' },
    8: { bg: '#9B59B6', text: '#FFFFFF' },
    16: { bg: '#8E44AD', text: '#FFFFFF' },
    32: { bg: '#E74C3C', text: '#FFFFFF' },
    64: { bg: '#C0392B', text: '#FFFFFF' },
    128: { bg: '#E67E22', text: '#FFFFFF' },
    256: { bg: '#D35400', text: '#FFFFFF' },
    512: { bg: '#2ECC71', text: '#FFFFFF' },
    1024: { bg: '#27AE60', text: '#FFFFFF' },
    2048: { bg: '#F1C40F', text: '#1A1A2E' },
    4096: { bg: '#F39C12', text: '#1A1A2E' },
    8192: { bg: '#1ABC9C', text: '#FFFFFF' },
}

function getTileStyle(val) {
    return TILE_COLORS[val] || { bg: '#3498DB', text: '#FFFFFF' }
}

// Seeded RNG — same as gameLogic.js pattern
function makeRng(seed) {
    let s = 0
    const str = seed.toString()
    for (let i = 0; i < str.length; i++) {
        s = (s << 5) - s + str.charCodeAt(i)
        s = s & s
    }
    return () => {
        s = (s * 16807) % 2147483647
        if (s <= 0) s += 2147483646
        return (s - 1) / 2147483646
    }
}

function randomVal(rng, maxTile = 64) {
    const options = [2, 2, 2, 4, 4, 8, 8, 16, 32, 64]
    const valid = options.filter(v => v <= maxTile || v <= 64)
    return valid[Math.floor(rng() * valid.length)]
}

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function findConnectedGroup(board, startR, startC) {
    const val = board[startR][startC]
    if (val === null) return []
    const visited = new Set()
    const stack = [[startR, startC]]
    const group = []
    while (stack.length) {
        const [r, c] = stack.pop()
        const key = `${r},${c}`
        if (visited.has(key)) continue
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
        if (board[r][c] !== val) continue
        visited.add(key)
        group.push([r, c])
        stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
    }
    return group
}

function settleBoardOnce(board, newestR, newestC) {
    let currentBoard = board.map(row => [...row])
    let scoreGained = 0
    let changed = false

    // Gravity
    for (let c = 0; c < COLS; c++) {
        let writeY = ROWS - 1
        for (let r = ROWS - 1; r >= 0; r--) {
            if (currentBoard[r][c] !== null) {
                if (r !== writeY) {
                    currentBoard[writeY][c] = currentBoard[r][c]
                    currentBoard[r][c] = null
                    changed = true
                }
                writeY--
            }
        }
    }

    if (!changed) {
        const checked = new Set()
        let bestGroup = null
        let bestSize = 1
        let bestContainsNewest = false

        for (let r = ROWS - 1; r >= 0; r--) {
            for (let c = 0; c < COLS; c++) {
                if (currentBoard[r][c] === null) continue
                const key = `${r},${c}`
                if (checked.has(key)) continue
                const group = findConnectedGroup(currentBoard, r, c)
                group.forEach(([gr, gc]) => checked.add(`${gr},${gc}`))
                if (group.length < 2) continue
                const containsNewest = group.some(([gr, gc]) => gr === newestR && gc === newestC)
                if (
                    bestGroup === null ||
                    (!bestContainsNewest && containsNewest) ||
                    (containsNewest === bestContainsNewest && group.length > bestSize)
                ) {
                    bestGroup = group
                    bestSize = group.length
                    bestContainsNewest = containsNewest
                }
            }
        }

        if (bestGroup) {
            const val = currentBoard[bestGroup[0][0]][bestGroup[0][1]]
            const mergedVal = val * Math.pow(2, bestGroup.length - 1)
            scoreGained += mergedVal

            let resultR = -1, resultC = -1
            if (bestContainsNewest) {
                resultR = newestR
                resultC = newestC
            } else {
                for (const [r, c] of bestGroup) {
                    if (r > resultR || (r === resultR && c < resultC)) {
                        resultR = r; resultC = c
                    }
                }
            }

            for (const [r, c] of bestGroup) currentBoard[r][c] = null
            currentBoard[resultR][resultC] = mergedVal
            changed = true
            return { newBoard: currentBoard, scoreGained, changed, mergeR: resultR, mergeC: resultC }
        }
    }

    return { newBoard: currentBoard, scoreGained, changed, mergeR: -1, mergeC: -1 }
}

function getMaxTile(board) {
    let max = 2
    for (const row of board)
        for (const cell of row)
            if (cell !== null && cell > max) max = cell
    return max
}

// ─── Tile with pop animation ──────────────────────────────────────────────────
function Tile({ value, size, isNew }) {
    const [popped, setPopped] = useState(false)
    useEffect(() => {
        if (isNew) {
            setPopped(true)
            const t = setTimeout(() => setPopped(false), 160)
            return () => clearTimeout(t)
        }
    }, [isNew, value])

    const style = getTileStyle(value)
    const fontSize = value > 999
        ? Math.floor(size * 0.28)
        : value > 99
            ? Math.floor(size * 0.34)
            : Math.floor(size * 0.42)

    return (
        <div style={{
            width: size, height: size,
            background: style.bg,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 6px ${style.bg}88`,
            transform: popped ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.15s ease',
            cursor: 'default',
        }}>
            <span style={{
                fontSize, fontWeight: 900, color: style.text,
                fontFamily: 'Orbitron, monospace',
                userSelect: 'none',
            }}>{value}</span>
        </div>
    )
}

// ─── Main Game ────────────────────────────────────────────────────────────────
export default function NumberDropGame({
    roomCode = 'SOLO00',
    roomId = null,
    username = 'You',
    onGameOver = null,
    onMenu = null,
    isSolo = false,
}) {
    const rngRef = useRef(null)
    const tileCountRef = useRef(0)

    const initRng = useCallback((seed) => {
        rngRef.current = makeRng(seed)
        tileCountRef.current = 0
    }, [])

    const nextVal = useCallback(() => {
        if (!rngRef.current) return 2
        tileCountRef.current++
        const maxTile = 64
        return randomVal(rngRef.current, maxTile)
    }, [])

    const [board, setBoard] = useState(createBoard)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [highScore, setHighScore] = useState(0)

    // Falling piece state
    const [piece, setPiece] = useState({ col: 2, val: 2 })
    const [nextPieceVal, setNextPieceVal] = useState(4)
    const [fallingRow, setFallingRow] = useState(0)
    const [isDropping, setIsDropping] = useState(false) // locked while settling
    const [ghostRow, setGhostRow] = useState(-1)
    const [newTilePos, setNewTilePos] = useState(null)

    // Board container sizing
    const boardRef = useRef(null)
    const [cellSize, setCellSize] = useState(52)
    const dropIntervalRef = useRef(null)
    const settlingRef = useRef(false)

    // Load high score
    useEffect(() => {
        try {
            const hs = localStorage.getItem('nd_highscore')
            if (hs) setHighScore(parseInt(hs, 10))
        } catch { }
    }, [])

    // Measure board cell size
    useEffect(() => {
        const measure = () => {
            if (boardRef.current) {
                const w = boardRef.current.offsetWidth
                if (w > 0) {
                    const size = Math.max(Math.floor((w - GAP * (COLS + 1)) / COLS), 24)
                    setCellSize(size)
                }
            }
        }
        const raf = requestAnimationFrame(measure)
        const ro = new ResizeObserver(measure)
        if (boardRef.current) ro.observe(boardRef.current)
        return () => { cancelAnimationFrame(raf); ro.disconnect() }
    }, [gameStarted])

    // Ghost row: lowest row the piece can land in its column
    useEffect(() => {
        let landRow = fallingRow
        for (let r = fallingRow + 1; r < ROWS; r++) {
            if (board[r][piece.col] !== null) break
            landRow = r
        }
        setGhostRow(landRow !== fallingRow ? landRow : -1)
    }, [board, piece.col, fallingRow])

    function startGame() {
        const seed = roomCode + Date.now()
        initRng(seed)
        const v1 = nextVal()
        const v2 = nextVal()
        setBoard(createBoard())
        setScore(0)
        setGameOver(false)
        setPiece({ col: 2, val: v1 })
        setNextPieceVal(v2)
        setFallingRow(0)
        setIsDropping(false)
        setNewTilePos(null)
        settlingRef.current = false
        setGameStarted(true)
    }

    // Auto-fall timer
    useEffect(() => {
        if (!gameStarted || gameOver || isDropping) return
        const interval = setInterval(() => {
            setFallingRow(prev => {
                const nextRow = prev + 1
                if (nextRow >= ROWS || board[nextRow][piece.col] !== null) {
                    // Land the piece
                    landPiece(prev)
                    return prev
                }
                return nextRow
            })
        }, 600)
        return () => clearInterval(interval)
    }, [gameStarted, gameOver, isDropping, board, piece.col])

    function landPiece(row) {
        if (settlingRef.current) return
        settlingRef.current = true
        setIsDropping(true)

        setBoard(prev => {
            // Check top row overflow
            if (prev[row][piece.col] !== null) {
                // Game over
                setGameOver(true)
                settlingRef.current = false
                setIsDropping(false)
                return prev
            }

            const newBoard = prev.map(r => [...r])
            newBoard[row][piece.col] = piece.val
            setNewTilePos({ r: row, c: piece.col })

            // Settle loop
            let current = newBoard
            let newestR = row, newestC = piece.col
            let totalScore = 0
            let iterations = 0

            const settle = () => {
                const { newBoard: settled, scoreGained, changed, mergeR, mergeC } = settleBoardOnce(current, newestR, newestC)
                if (changed && iterations < 20) {
                    current = settled
                    totalScore += scoreGained

                    if (scoreGained > 0) {
                        newestR = mergeR; newestC = mergeC;
                        setNewTilePos({ r: mergeR, c: mergeC });
                    } else {
                        // Gravity pass: find where the newest tile fell to
                        let foundR = newestR;
                        for (let r = ROWS - 1; r >= 0; r--) {
                            if (settled[r][newestC] !== null) { foundR = r; break; }
                        }
                        newestR = foundR;
                    }

                    setBoard(settled.map(r => [...r]))
                    setScore(s => s + scoreGained)

                    iterations++
                    setTimeout(settle, 150)
                } else {
                    // Check game over: any tile in row 0
                    const over = current[0].some(cell => cell !== null)
                    if (over) {
                        const finalScore = score + totalScore
                        setScore(finalScore)
                        setGameOver(true)
                        if (finalScore > highScore) {
                            setHighScore(finalScore)
                            try { localStorage.setItem('nd_highscore', finalScore.toString()) } catch { }
                        }
                        if (onGameOver) onGameOver(finalScore, getMaxTile(current))
                    } else {
                        setScore(s => {
                            const ns = s + totalScore
                            if (ns > highScore) {
                                setHighScore(ns)
                                try { localStorage.setItem('nd_highscore', ns.toString()) } catch { }
                            }
                            return ns
                        })
                    }

                    // Spawn next piece
                    const v = nextVal()
                    setPiece({ col: 2, val: nextPieceVal })
                    setNextPieceVal(v)
                    setFallingRow(0)
                    settlingRef.current = false
                    setIsDropping(false)
                    setNewTilePos(null)
                }
            }

            setTimeout(settle, 80)
            return newBoard
        })
    }

    // Tap column to move piece
    const handleColumnTap = useCallback((col) => {
        if (!gameStarted || gameOver || isDropping) return
        setPiece(prev => ({ ...prev, col }))
    }, [gameStarted, gameOver, isDropping])

    // Swipe down / click drop button to fast-drop
    const handleDrop = useCallback(() => {
        if (!gameStarted || gameOver || isDropping) return
        // Find landing row
        let landRow = fallingRow
        for (let r = fallingRow + 1; r < ROWS; r++) {
            if (board[r][piece.col] !== null) break
            landRow = r
        }
        setFallingRow(landRow)
        landPiece(landRow)
    }, [gameStarted, gameOver, isDropping, fallingRow, board, piece.col])

    // Touch handling for swipe-down
    const touchStartY = useRef(null)
    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
    const onTouchEnd = (e) => {
        if (touchStartY.current === null) return
        const dy = e.changedTouches[0].clientY - touchStartY.current
        if (dy > 40) handleDrop()
        touchStartY.current = null
    }

    const boardWidth = cellSize * COLS + GAP * (COLS + 1)
    const boardHeight = cellSize * ROWS + GAP * (ROWS + 1)

    // ── HOME SCREEN ──────────────────────────────────────────────────────────────
    if (!gameStarted && !gameOver) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '40px 24px', gap: 24,
                minHeight: 500,
            }}>
                <div style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>🔢</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900,
                        color: '#fff', letterSpacing: 3, lineHeight: 1.1,
                    }}>NUMBER DROP</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, letterSpacing: 1 }}>
                        {isSolo ? 'Beat your high score' : 'Compete for the top score'}
                    </div>
                </div>

                {/* Mini preview board */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(5, 36px)',
                    gap: 3, padding: 10, background: '#0F0F1A', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    {[
                        [null, null, null, null, null],
                        [null, null, null, null, null],
                        [null, null, 8, null, null],
                        [null, 8, null, 8, null],
                        [null, 8, 16, 8, null],
                        [2, null, 16, null, 2],
                        [2, 4, 32, 4, 2],
                        [4, 4, 32, 4, 4],
                    ].flat().map((val, i) => (
                        <div key={i} style={{
                            width: 36, height: 36, borderRadius: 4,
                            background: val ? getTileStyle(val).bg : 'rgba(255,255,255,0.02)',
                            border: val ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 900, color: val ? getTileStyle(val).text : 'transparent',
                            fontFamily: 'Orbitron, monospace',
                        }}>{val}</div>
                    ))}
                </div>

                {/* How to play */}
                <div style={{
                    background: 'rgba(155,89,182,0.06)', borderRadius: 12,
                    border: '1px solid rgba(155,89,182,0.15)',
                    padding: '14px 18px', maxWidth: 320, textAlign: 'center',
                }}>
                    <div style={{ fontSize: 10, color: '#9B59B6', fontWeight: 800, letterSpacing: 2, marginBottom: 8, fontFamily: 'Orbitron, monospace' }}>
                        HOW TO PLAY
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
                        Tap a column to aim the falling tile. Swipe ↓ or press DROP to place it fast.
                        Connect matching numbers to merge them — bigger groups = bigger scores!
                    </div>
                </div>

                {highScore > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(46,204,113,0.06)', borderRadius: 10,
                        border: '1px solid rgba(46,204,113,0.15)',
                        padding: '8px 20px',
                    }}>
                        <span style={{ fontSize: 14 }}>🏆</span>
                        <div>
                            <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: 2, fontWeight: 700 }}>BEST SCORE</div>
                            <div style={{ fontSize: 18, color: '#2ECC71', fontWeight: 900, fontFamily: 'Orbitron, monospace' }}>
                                {highScore.toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={startGame}
                    style={{
                        background: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
                        color: '#fff', border: 'none', borderRadius: 14,
                        padding: '16px 48px', fontSize: 16, fontWeight: 800,
                        cursor: 'pointer', letterSpacing: 3,
                        fontFamily: 'Orbitron, monospace',
                        boxShadow: '0 8px 28px rgba(155,89,182,0.45)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(155,89,182,0.55)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(155,89,182,0.45)' }}
                >
                    PLAY
                </button>

                {onMenu && (
                    <button onClick={onMenu} style={{
                        background: 'none', border: 'none', color: '#374151',
                        fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                    }}>
                        ← Back to lobby
                    </button>
                )}
            </div>
        )
    }

    // ── GAME OVER SCREEN ─────────────────────────────────────────────────────────
    if (gameOver) {
        const isNewBest = score >= highScore && score > 0
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '40px 24px', gap: 20,
                minHeight: 500, animation: 'fadeInScale 0.35s ease forwards',
            }}>
                <div style={{ fontSize: 64 }}>💀</div>
                <div style={{
                    fontFamily: 'Orbitron, monospace', fontSize: 24, fontWeight: 900,
                    color: '#E74C3C', letterSpacing: 3,
                }}>GAME OVER</div>

                <div style={{
                    display: 'flex', gap: 12, width: '100%', maxWidth: 320,
                }}>
                    {[
                        { label: 'SCORE', value: score.toLocaleString(), color: '#fff', highlight: isNewBest },
                        { label: 'BEST', value: highScore.toLocaleString(), color: '#2ECC71' },
                        { label: 'MAX TILE', value: getMaxTile(board), color: '#F39C12' },
                    ].map(({ label, value, color, highlight }) => (
                        <div key={label} style={{
                            flex: 1, background: highlight ? 'rgba(46,204,113,0.08)' : '#1A1A2E',
                            border: `1px solid ${highlight ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: 12, padding: '14px 8px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 10, color: '#4B5563', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'Orbitron, monospace' }}>{value}</div>
                            {highlight && <div style={{ fontSize: 8, color: '#2ECC71', marginTop: 2, letterSpacing: 1 }}>NEW BEST!</div>}
                        </div>
                    ))}
                </div>

                {!isSolo && (
                    <div style={{ fontSize: 12, color: '#4B5563', textAlign: 'center' }}>
                        Score submitted to leaderboard 🏆
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    {onMenu && (
                        <button onClick={onMenu} style={{
                            background: '#1A1A2E', color: '#9CA3AF',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12, padding: '12px 24px',
                            fontSize: 13, cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
                        }}>
                            ↩ Lobby
                        </button>
                    )}
                    <button onClick={startGame} style={{
                        background: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '12px 28px', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', letterSpacing: 2,
                        fontFamily: 'Orbitron, monospace',
                        boxShadow: '0 4px 20px rgba(155,89,182,0.4)',
                    }}>
                        ↺ RETRY
                    </button>
                </div>
            </div>
        )
    }

    // ── ACTIVE GAME ───────────────────────────────────────────────────────────────
    const curStyle = getTileStyle(piece.val)
    const nextStyle = getTileStyle(nextPieceVal)

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: '12px 0', width: '100%',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '0 14px', gap: 10,
            }}>
                {onMenu && (
                    <button
                        onClick={() => { if (window.confirm('Leave the game? Progress will be lost.')) onMenu() }}
                        style={{
                            background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8, padding: '6px 12px', color: '#6B7280',
                            fontSize: 12, cursor: 'pointer', flexShrink: 0,
                        }}
                    >← Lobby</button>
                )}
                {/* Score */}
                <div style={{
                    flex: 1, background: '#1A1A2E', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '6px 12px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, monospace' }}>
                        {score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>SCORE</div>
                </div>
                {/* Next tile */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1, marginBottom: 4 }}>NEXT</div>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: nextStyle.bg, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 10px ${nextStyle.bg}66`,
                    }}>
                        <span style={{
                            fontSize: nextPieceVal > 99 ? 9 : 12, fontWeight: 900,
                            color: nextStyle.text, fontFamily: 'Orbitron, monospace',
                        }}>{nextPieceVal}</span>
                    </div>
                </div>
            </div>

            {/* Board */}
            <div
                ref={boardRef}
                style={{
                    width: '94%', maxWidth: 320,
                    background: '#0a0a16',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    position: 'relative',
                    userSelect: 'none',
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div style={{
                    width: boardWidth, height: boardHeight + cellSize + GAP,
                    position: 'relative',
                    margin: '0 auto',
                }}>
                    {/* Falling piece row (above the board) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: fallingRow * (cellSize + GAP) + GAP,
                            left: piece.col * (cellSize + GAP) + GAP,
                            width: cellSize, height: cellSize,
                            background: curStyle.bg,
                            borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 18px ${curStyle.bg}88`,
                            transition: `left 0.1s ease${fallingRow === 0 ? '' : ', top 0.15s linear'}`,
                            zIndex: 10,
                        }}
                    >
                        <span style={{
                            fontSize: piece.val > 99 ? Math.floor(cellSize * 0.28) : Math.floor(cellSize * 0.38),
                            fontWeight: 900, color: curStyle.text,
                            fontFamily: 'Orbitron, monospace',
                        }}>{piece.val}</span>
                    </div>

                    {/* Ghost */}
                    {ghostRow >= 0 && ghostRow !== fallingRow && (
                        <div style={{
                            position: 'absolute',
                            top: ghostRow * (cellSize + GAP) + GAP,
                            left: piece.col * (cellSize + GAP) + GAP,
                            width: cellSize, height: cellSize,
                            borderRadius: 6,
                            border: `2px solid ${curStyle.bg}88`,
                            boxSizing: 'border-box',
                            pointerEvents: 'none', zIndex: 5,
                        }} />
                    )}

                    {/* Settled tiles */}
                    {board.map((row, r) =>
                        row.map((val, c) =>
                            val !== null ? (
                                <div
                                    key={`${r}-${c}`}
                                    style={{
                                        position: 'absolute',
                                        top: r * (cellSize + GAP) + GAP,
                                        left: c * (cellSize + GAP) + GAP,
                                        width: cellSize, height: cellSize,
                                    }}
                                >
                                    <Tile
                                        value={val}
                                        size={cellSize}
                                        isNew={newTilePos?.r === r && newTilePos?.c === c}
                                    />
                                </div>
                            ) : null
                        )
                    )}

                    {/* Column tap zones */}
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div
                            key={c}
                            onClick={() => handleColumnTap(c)}
                            style={{
                                position: 'absolute',
                                top: 0, left: c * (cellSize + GAP) + GAP,
                                width: cellSize, height: '100%',
                                cursor: 'pointer', zIndex: 20,
                                background: 'transparent',
                                borderRadius: 4,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                padding: '2px 14px', width: '100%', justifyContent: 'center',
            }}>
                <button
                    onClick={() => handleColumnTap(Math.max(0, piece.col - 1))}
                    disabled={isDropping}
                    style={{
                        background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, width: 48, height: 40,
                        color: '#9CA3AF', fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >←</button>

                <button
                    onClick={handleDrop}
                    disabled={isDropping}
                    style={{
                        background: isDropping ? '#1A1A2E' : `linear-gradient(135deg, ${curStyle.bg}, ${curStyle.bg}cc)`,
                        border: 'none',
                        borderRadius: 10, padding: '0 28px', height: 40,
                        color: '#fff', fontSize: 12, cursor: isDropping ? 'not-allowed' : 'pointer',
                        fontFamily: 'Orbitron, monospace', fontWeight: 800, letterSpacing: 1.5,
                        boxShadow: isDropping ? 'none' : `0 4px 16px ${curStyle.bg}55`,
                        transition: 'all 0.15s ease',
                        flex: 1, maxWidth: 140,
                    }}
                >
                    DROP ↓
                </button>

                <button
                    onClick={() => handleColumnTap(Math.min(COLS - 1, piece.col + 1))}
                    disabled={isDropping}
                    style={{
                        background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, width: 48, height: 40,
                        color: '#9CA3AF', fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >→</button>
            </div>

            <div style={{ fontSize: 10, color: '#2a2a48', letterSpacing: 0.5 }}>
                Tap column to aim  •  Swipe ↓ or DROP to place
            </div>
        </div>
    )
}