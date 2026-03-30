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
    16384: { bg: '#16A085', text: '#FFFFFF' },
    32768: { bg: '#117A65', text: '#FFFFFF' },
    65536: { bg: '#0E6251', text: '#FFFFFF' },
    131072: { bg: '#0B5345', text: '#FFFFFF' },
}

function getTileStyle(val) {
    return TILE_COLORS[val] || { bg: '#3498DB', text: '#FFFFFF' }
}

function formatNumber(num) {
    if (num < 10000) return num.toString();
    const suffixes = ['', 'K', 'M', 'B', 'T', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff'];
    const exp = Math.floor(Math.log10(num) / 3);
    const shortValue = (num / Math.pow(1000, exp)).toFixed(exp > 0 ? 1 : 0);
    return (shortValue.endsWith('.0') ? shortValue.slice(0, -2) : shortValue) + suffixes[exp];
}

function makeRng(seed) {
    let s = 0
    const str = seed.toString()
    for (let i = 0; i < str.length; i++) {
        s = (s << 5) - s + str.charCodeAt(i)
    }
    s = (Math.abs(s) % 2147483646) + 1
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

function randomVal(rng, maxTile = 2) {
    // 1/4th rule: shoot tiles up to 25% of your max
    const threshold = Math.max(8, maxTile / 4)
    
    // Phase out smaller tiles: keep only the top 6 power-of-2 levels available
    // e.g. if threshold is 256, min is 8. Options: 8, 16, 32, 64, 128, 256.
    const minVal = Math.max(2, threshold / 32)
    
    const options = []
    let current = minVal
    while (current <= threshold) {
        // More weight on the smaller numbers in our current range for balance
        let weight = 1
        if (current === minVal) weight = 5
        else if (current === minVal * 2) weight = 3
        else if (current === minVal * 4) weight = 2
        
        for (let i = 0; i < weight; i++) {
            options.push(current)
        }
        current *= 2
    }
    
    return options[Math.floor(rng() * options.length)]
}

function getMaxTile(board) {
    let max = 2
    for (const row of board)
        for (const cell of row)
            if (cell !== null && cell.val > max) max = cell.val
    return max
}

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function findConnectedGroup(board, startR, startC) {
    if (board[startR][startC] === null) return []
    const val = board[startR][startC].val
    const visited = new Set()
    const stack = [[startR, startC]]
    const group = []
    while (stack.length) {
        const [r, c] = stack.pop()
        const key = `${r},${c}`
        if (visited.has(key)) continue
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
        if (board[r][c] === null || board[r][c].val !== val) continue
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

    // Merges
    const checked = new Set()
    let bestGroup = null
    let bestSize = 1
    let bestContainsNewest = false

    for (let r = 0; r < ROWS; r++) {
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

    let resultR = -1, resultC = -1
    return { newBoard: currentBoard, scoreGained, changed, bestGroup, bestContainsNewest }
}

function applyGravity(board) {
    let currentBoard = board.map(row => [...row])
    let changed = false
    for (let c = 0; c < COLS; c++) {
        let writeY = 0
        for (let r = 0; r < ROWS; r++) {
            if (currentBoard[r][c] !== null && currentBoard[r][c].status !== 'breaking') {
                if (r !== writeY) {
                    currentBoard[writeY][c] = currentBoard[r][c]
                    currentBoard[r][c] = null
                    changed = true
                }
                writeY++
            }
        }
    }
    return { newBoard: currentBoard, changed }
}

function Tile({ value, size, isNew, status }) {
    const [popped, setPopped] = useState(false)
    useEffect(() => {
        if (isNew) {
            setPopped(true)
            const t = setTimeout(() => setPopped(false), 160)
            return () => clearTimeout(t)
        }
    }, [isNew, value])

    const style = getTileStyle(value)
    const fontSize = value > 9999
        ? Math.floor(size * 0.22)
        : value > 999
            ? Math.floor(size * 0.28)
            : value > 99
                ? Math.floor(size * 0.34)
                : Math.floor(size * 0.42)

    return (
        <div style={{
            width: size, height: size,
            background: style.bg, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 6px ${style.bg}88`,
            transform: popped ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.15s ease',
            animation: status === 'breaking' ? 'breakAnim 0.4s forwards' : status === 'merging' ? 'mergeAnim 0.3s forwards' : isNew ? 'spawnAnim 0.2s forwards' : 'none'
        }}>
            <span style={{ fontSize, fontWeight: 900, color: style.text, fontFamily: 'Orbitron, monospace' }}>{formatNumber(value)}</span>
        </div>
    )
}

export default function NumberShootGame({ roomCode = 'SOLO_SHOOT', onMenu }) {
    const rngRef = useRef(null)
    const idRef = useRef(0)
    const nextId = useCallback(() => {
        idRef.current += 1
        return `t-${idRef.current}`
    }, [])

    const [board, setBoard] = useState(createBoard)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [goalTile, setGoalTile] = useState(2048)
    const [showLevelUp, setShowLevelUp] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [nextVal, setNextVal] = useState(2)
    const [shooterCol, setShooterCol] = useState(2)
    const [isShooting, setIsShooting] = useState(false)
    const [shotPiece, setShotPiece] = useState(null) // { r, c, val } for animation
    const [newTilePos, setNewTilePos] = useState(null)
    const [cellSize, setCellSize] = useState(52)
    const boardRef = useRef(null)

    const initRng = useCallback((seed) => {
        rngRef.current = makeRng(seed)
    }, [])

    const getNextVal = useCallback((currentBoard) => {
        if (!rngRef.current) return 2
        const max = getMaxTile(currentBoard)
        return randomVal(rngRef.current, max)
    }, [])

    useEffect(() => {
        if (!gameStarted || gameOver) return
        const max = getMaxTile(board)
        if (max >= goalTile) {
            setLevel(l => l + 1)
            setGoalTile(g => g * 2)
            setShowLevelUp(true)
        }
    }, [board, goalTile, gameStarted, gameOver])

    useEffect(() => {
         if (showLevelUp) {
             const timer = setTimeout(() => setShowLevelUp(false), 2000)
             return () => clearTimeout(timer)
         }
    }, [showLevelUp])

    useEffect(() => {
        const measure = () => {
            if (boardRef.current) {
                const w = boardRef.current.offsetWidth
                const size = Math.max(Math.floor((w - GAP * (COLS + 1)) / COLS), 24)
                setCellSize(size)
            }
        }
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [gameStarted])

    // --- Persistence Logic ---
    const SOLO_SAVE_KEY = 'NUMBER_SHOOT_SOLO_DATA_' + roomCode
    
    // Save state on change
    useEffect(() => {
        if (!gameStarted || gameOver || roomCode !== 'SOLO_SHOOT') return
        const data = {
            board, score, level, goalTile, nextVal,
            idCounter: idRef.current,
            timestamp: Date.now()
        }
        localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify(data))
    }, [board, score, level, goalTile, nextVal, gameStarted, gameOver, roomCode, SOLO_SAVE_KEY])

    // Clear on game over
    useEffect(() => {
       if (gameOver && roomCode === 'SOLO_SHOOT') {
           localStorage.removeItem(SOLO_SAVE_KEY)
       }
    }, [gameOver, roomCode, SOLO_SAVE_KEY])

    // Restoration
    const [hasSave, setHasSave] = useState(false)
    useEffect(() => {
        if (roomCode === 'SOLO_SHOOT') {
            const saved = localStorage.getItem(SOLO_SAVE_KEY)
            if (saved) setHasSave(true)
        }
    }, [roomCode, SOLO_SAVE_KEY])

    function resumeGame() {
        const saved = localStorage.getItem(SOLO_SAVE_KEY)
        if (saved) {
            try {
                const data = JSON.parse(saved)
                initRng(roomCode + data.timestamp)
                setBoard(data.board)
                setScore(data.score)
                setLevel(data.level)
                setGoalTile(data.goalTile)
                setNextVal(data.nextVal)
                idRef.current = data.idCounter || 1000
                setGameStarted(true)
            } catch (e) {
                console.error('Failed to restore save', e)
                startGame(true)
            }
        }
    }

    function startGame(fresh = true) {
        if (!fresh && hasSave) {
            resumeGame()
            return
        }
        initRng(roomCode + Date.now())
        const newBoard = createBoard()
        // Pre-fill columns from the top down (2-4 tiles per column)
        for (let c = 0; c < COLS; c++) {
            const count = 2 + Math.floor(Math.random() * 3)
            for (let r = 0; r < count; r++) {
                const val = [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)]
                newBoard[r][c] = { id: nextId(), val, status: 'idle' }
            }
        }
        setBoard(newBoard)
        setScore(0)
        setLevel(1)
        setGoalTile(2048)
        setShowLevelUp(false)
        setGameOver(false)
        setNextVal(getNextVal(newBoard))
        setShooterCol(2)
        setIsShooting(false)
        setShotPiece(null)
        setGameStarted(true)
    }

    const handleShoot = useCallback((targetCol = null) => {
        if (!gameStarted || gameOver || isShooting) return
        
        const col = targetCol !== null ? targetCol : shooterCol
        if (targetCol !== null) setShooterCol(targetCol)

        // Find landing row (first empty cell from bottom up, or hitting a tile)
        let landRow = -1
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === null) {
                // If it's at the top, or the cell above is not empty, it stays here
                if (r === 0 || board[r - 1][col] !== null) {
                    landRow = r
                    break
                }
            }
        }

        if (landRow === -1) {
            setGameOver(true)
            return
        }

        setIsShooting(true)
        setShotPiece({ r: ROWS, c: col, val: nextVal, id: nextId() }) // Start below board

        // Animation: Shot travels from shooter to landRow
        setTimeout(() => {
            setShotPiece(p => ({ ...p, r: landRow }))
            setTimeout(() => {
                finalizeShot(landRow, col, nextVal)
            }, 100)
        }, 50)
    }, [gameStarted, gameOver, isShooting, board, shooterCol, nextVal, nextId])

    function finalizeShot(row, col, value) {
        setShotPiece(null)
        setNewTilePos({ r: row, c: col })
        
        setBoard(prev => {
            const nextBoard = prev.map(r => [...r])
            nextBoard[row][col] = { id: nextId(), val: value, status: 'idle' }

            const runSettleStep = (boardState, r, c, iter) => {
                const { bestGroup, bestContainsNewest } = settleBoardOnce(boardState, r, c)
                
                if (bestGroup && iter < 30) {
                    // Phase 1: Mark group as merging
                    const mergingBoard = boardState.map(gridRow => gridRow.map(cell => cell ? { ...cell } : null))
                    bestGroup.forEach(([gr, gc]) => {
                        if (mergingBoard[gr][gc]) mergingBoard[gr][gc].status = 'merging'
                    })
                    setBoard(mergingBoard)

                    // Phase 2: After animation, actually merge
                    setTimeout(() => {
                        const postMergeBoard = boardState.map(gridRow => gridRow.map(cell => cell ? { ...cell } : null))
                        const val = postMergeBoard[bestGroup[0][0]][bestGroup[0][1]].val
                        const mergedVal = val * Math.pow(2, bestGroup.length - 1)
                        setScore(s => s + mergedVal)

                        let resultR = -1, resultC = -1
                        if (bestContainsNewest) {
                            resultR = r; resultC = c
                        } else {
                            for (const [gr, gc] of bestGroup) {
                                if (resultR === -1 || gr < resultR || (gr === resultR && gc < resultC)) {
                                    resultR = gr; resultC = gc
                                }
                            }
                        }

                        // Remove components and place result
                        bestGroup.forEach(([gr, gc]) => postMergeBoard[gr][gc] = null)
                        postMergeBoard[resultR][resultC] = { id: nextId(), val: mergedVal, status: 'idle' }
                        setNewTilePos({ r: resultR, c: resultC })

                        // Gravity
                        const { newBoard: gravityBoard } = applyGravity(postMergeBoard)
                        setBoard(gravityBoard)
                        
                        setTimeout(() => runSettleStep(gravityBoard, resultR, resultC, iter + 1), 200)
                    }, 250)
                } else {
                    // Check for "breaking" tiles (val < minVal)
                    const max = getMaxTile(boardState)
                    const threshold = Math.max(8, max / 4)
                    const minValLimit = Math.max(2, threshold / 32)
                    
                    let breakIndices = []
                    for(let br=0; br<ROWS; br++) {
                        for(let bc=0; bc<COLS; bc++) {
                            if (boardState[br][bc] && boardState[br][bc].val < minValLimit) {
                                breakIndices.push([br, bc])
                            }
                        }
                    }

                    if (breakIndices.length > 0) {
                        const breakingBoard = boardState.map(gridRow => gridRow.map(cell => cell ? { ...cell } : null))
                        breakIndices.forEach(([br, bc]) => {
                             breakingBoard[br][bc].status = 'breaking'
                        })
                        setBoard(breakingBoard)

                        setTimeout(() => {
                            const postBreakBoard = boardState.map(gridRow => gridRow.map(cell => cell ? { ...cell } : null))
                            breakIndices.forEach(([br, bc]) => postBreakBoard[br][bc] = null)
                            const { newBoard: finalBoard } = applyGravity(postBreakBoard)
                            setBoard(finalBoard)
                            finishStep(finalBoard)
                        }, 400)
                    } else {
                        finishStep(boardState)
                    }
                }
            }

            const finishStep = (finalBoard) => {
                const isGameOver = finalBoard[ROWS - 1].some(cell => cell !== null)
                if (isGameOver) setGameOver(true)
                setNextVal(getNextVal(finalBoard))
                setIsShooting(false)
                setNewTilePos(null)
            }

            setTimeout(() => runSettleStep(nextBoard, row, col, 0), 100)
            return nextBoard
        })
    }

    const shooterStyle = getTileStyle(nextVal)
    const boardWidth = cellSize * COLS + GAP * (COLS + 1)
    const boardHeight = cellSize * ROWS + GAP * (ROWS + 1)

    if (!gameStarted && !gameOver) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24, minHeight: 500 }}>
                <div style={{ fontSize: 56 }}>🏹</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>NUMBER SHOOT</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, marginBottom: 12 }}>Shoot tiles up to merge them!</div>
                    <div style={{ padding: '8px 16px', background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', borderRadius: 12, display: 'inline-block' }}>
                        <div style={{ fontSize: 10, color: '#F1C40F', letterSpacing: 1, textTransform: 'uppercase' }}>INITIAL GOAL</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#F1C40F', fontFamily: 'Orbitron, monospace', textShadow: '0 0 10px rgba(241, 196, 15, 0.5)' }}>2048</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {hasSave && <button onClick={() => startGame(false)} style={primaryBtn}>CONTINUE</button>}
                    <button onClick={() => startGame(true)} style={hasSave ? secondaryBtn : primaryBtn}>{hasSave ? 'New Game' : 'PLAY NOW'}</button>
                </div>
                {onMenu && <button onClick={onMenu} style={secondaryBtn}>← Back</button>}
            </div>
        )
    }

    if (gameOver) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20, minHeight: 500 }}>
                <div style={{ fontSize: 64 }}>💥</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 24, fontWeight: 900, color: '#E74C3C', letterSpacing: 3 }}>GAME OVER</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, monospace' }}>SCORE: {score.toLocaleString()}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <button onClick={startGame} style={primaryBtn}>RETRY</button>
                   {onMenu && <button onClick={onMenu} style={secondaryBtn}>Lobby</button>}
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0', width: '100%' }}>
            <style>{`
                @keyframes levelUpAnim {
                    0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    30% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
                }
                @keyframes breakAnim {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0) rotate(45deg); opacity: 0; }
                }
                @keyframes mergeAnim {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.8); }
                    100% { transform: scale(1.2); opacity: 0.5; }
                }
                @keyframes spawnAnim {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', width: '90%', gap: 10 }}>
                <div style={{ flex: 1, background: '#1A1A2E', borderRadius: 10, padding: '8px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#F39C12', fontFamily: 'Orbitron, monospace' }}>{level}</div>
                    <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>LEVEL</div>
                </div>
                <div style={{ flex: 2, background: '#1A1A2E', borderRadius: 10, padding: '8px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, monospace' }}>{score.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>SCORE</div>
                </div>
                <div style={{ flex: 1, background: '#1A1A2E', borderRadius: 10, padding: '8px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: getTileStyle(goalTile).bg, fontFamily: 'Orbitron, monospace', textShadow: `0 0 10px ${getTileStyle(goalTile).bg}88` }}>{goalTile}</div>
                    <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>GOAL</div>
                </div>
            </div>

            {/* Board */}
            <div ref={boardRef} style={{ width: '94%', maxWidth: 320, background: '#0a0a16', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: boardWidth, height: boardHeight + cellSize + GAP, position: 'relative', margin: '0 auto' }}>
                    {/* Background columns */}
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div key={c} onClick={() => handleShoot(c)} style={{ position: 'absolute', top: 0, left: c * (cellSize + GAP) + GAP, width: cellSize, height: '100%', cursor: 'pointer', zIndex: 10 }} />
                    ))}

                    {/* Settled tiles */}
                    {board.map((row, r) =>
                        row.map((tile, c) => tile !== null ? (
                            <div 
                                key={tile.id} 
                                style={{ 
                                    position: 'absolute', 
                                    top: r * (cellSize + GAP) + GAP, 
                                    left: c * (cellSize + GAP) + GAP, 
                                    width: cellSize, height: cellSize,
                                    transition: 'top 0.2s cubic-bezier(0.2, 0, 0.2, 1), left 0.1s ease-out'
                                }}
                            >
                                <Tile value={tile.val} size={cellSize} isNew={newTilePos?.r === r && newTilePos?.c === c} status={tile.status} />
                            </div>
                        ) : null)
                    )}

                    {/* Level Up overlay */}
                    {showLevelUp && (
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0,0,0,0.85)',
                            padding: '20px 40px',
                            borderRadius: 16,
                            color: '#F1C40F',
                            fontFamily: 'Orbitron, monospace',
                            fontSize: 32,
                            fontWeight: 900,
                            zIndex: 100,
                            border: '2px solid #F1C40F',
                            boxShadow: '0 0 30px rgba(241, 196, 15, 0.4)',
                            animation: 'levelUpAnim 2s ease-out forwards',
                            pointerEvents: 'none',
                            textAlign: 'center',
                            width: '80%'
                        }}>
                            LEVEL UP!<br/>
                            <span style={{ fontSize: 16, color: '#fff', letterSpacing: 1 }}>NEXT GOAL: </span>
                            <span style={{ fontSize: 24, color: getTileStyle(goalTile).text === '#1A1A2E' ? getTileStyle(goalTile).bg : getTileStyle(goalTile).bg, textShadow: `0 0 10px ${getTileStyle(goalTile).bg}88` }}>{formatNumber(goalTile)}</span>
                        </div>
                    )}

                    {/* Shot Animation Piece */}
                    {shotPiece && (
                        <div style={{
                            position: 'absolute',
                            top: shotPiece.r * (cellSize + GAP) + GAP,
                            left: shotPiece.c * (cellSize + GAP) + GAP,
                            width: cellSize, height: cellSize,
                            background: getTileStyle(shotPiece.val).bg,
                            borderRadius: 6,
                            transition: 'top 0.1s linear',
                            zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 20px ${getTileStyle(shotPiece.val).bg}`
                        }}>
                             <span style={{ fontSize: Math.floor(cellSize * 0.4), fontWeight: 900, color: getTileStyle(shotPiece.val).text, fontFamily: 'Orbitron, monospace' }}>{formatNumber(shotPiece.val)}</span>
                        </div>
                    )}

                     {/* Shooter piece (at bottom) */}
                    {!isShooting && (
                        <div style={{
                            position: 'absolute',
                            top: ROWS * (cellSize + GAP) + GAP,
                            left: shooterCol * (cellSize + GAP) + GAP,
                            width: cellSize, height: cellSize,
                            background: shooterStyle.bg,
                            borderRadius: 6,
                            transition: 'left 0.1s ease',
                            zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 15px ${shooterStyle.bg}77`
                        }}>
                            <span style={{ fontSize: Math.floor(cellSize * 0.4), fontWeight: 900, color: shooterStyle.text, fontFamily: 'Orbitron, monospace' }}>{formatNumber(nextVal)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const primaryBtn = {
    background: 'linear-gradient(135deg, #3498DB, #2980B9)', color: '#fff', border: 'none', borderRadius: 14,
    padding: '16px 40px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Orbitron, monospace',
    boxShadow: '0 8px 25px rgba(52,152,219,0.3)', letterSpacing: 2
}

const secondaryBtn = {
    background: 'none', border: '1px solid #2a2a4a', color: '#6B7280', borderRadius: 12, padding: '10px 24px',
    fontSize: 13, cursor: 'pointer', letterSpacing: 1
}
