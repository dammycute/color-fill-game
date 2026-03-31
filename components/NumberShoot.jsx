'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const COLS = 5
const ROWS = 8
const GAP = 4

// Extended color palette — unique colors well beyond 2048
const TILE_COLORS = {
    2: { bg: '#2B2B3E', text: '#B8B4CC' },
    4: { bg: '#363550', text: '#D0CCEE' },
    8: { bg: '#7B3FA0', text: '#FFFFFF' },   // purple
    16: { bg: '#9B59B6', text: '#FFFFFF' },
    32: { bg: '#C0392B', text: '#FFFFFF' },   // red
    64: { bg: '#E74C3C', text: '#FFFFFF' },
    128: { bg: '#D35400', text: '#FFFFFF' },   // orange
    256: { bg: '#E67E22', text: '#FFFFFF' },
    512: { bg: '#27AE60', text: '#FFFFFF' },   // green
    1024: { bg: '#2ECC71', text: '#FFFFFF' },
    2048: { bg: '#F1C40F', text: '#1A1A2E' },   // gold
    4096: { bg: '#F39C12', text: '#1A1A2E' },
    8192: { bg: '#16A085', text: '#FFFFFF' },   // teal
    16384: { bg: '#1ABC9C', text: '#FFFFFF' },
    32768: { bg: '#2471A3', text: '#FFFFFF' },   // ocean blue
    65536: { bg: '#3498DB', text: '#FFFFFF' },
    131072: { bg: '#E91E63', text: '#FFFFFF' },  // hot pink
    262144: { bg: '#FF4081', text: '#FFFFFF' },
    524288: { bg: '#FF6F00', text: '#FFFFFF' },  // amber
    1048576: { bg: '#FFAB00', text: '#1A1A2E' },
}

function getTileStyle(val) {
    // For very large values cycle through a vibrant set
    if (TILE_COLORS[val]) return TILE_COLORS[val]
    const vibrant = [
        { bg: '#00BCD4', text: '#fff' },
        { bg: '#7C4DFF', text: '#fff' },
        { bg: '#FF5252', text: '#fff' },
        { bg: '#64DD17', text: '#1A1A2E' },
        { bg: '#FF6D00', text: '#fff' },
        { bg: '#AA00FF', text: '#fff' },
    ]
    const logVal = Math.log2(val)
    return vibrant[Math.floor(logVal) % vibrant.length]
}

function formatNumber(num) {
    if (num < 1000) return num.toString()
    const suffixes = ['', 'K', 'M', 'B', 'T', 'aa', 'bb', 'cc']
    const exp = Math.floor(Math.log10(num) / 3)
    const shortValue = (num / Math.pow(1000, exp)).toFixed(exp > 0 ? 1 : 0)
    return (shortValue.endsWith('.0') ? shortValue.slice(0, -2) : shortValue) + (suffixes[exp] || '?')
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

// ── 1/8 rule: spawn tiles up to 1/8 of current max ──────────────────────────
function randomVal(rng, maxTile = 2) {
    const threshold = Math.max(8, maxTile / 8)   // ← 1/8 rule
    const minVal = Math.max(2, threshold / 16)

    const options = []
    let current = minVal
    while (current <= threshold) {
        let weight = 1
        if (current === minVal) weight = 6
        else if (current === minVal * 2) weight = 3
        else if (current === minVal * 4) weight = 2
        for (let i = 0; i < weight; i++) options.push(current)
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
    let bestGroup = null
    let bestSize = 1
    let bestContainsNewest = false
    const checked = new Set()

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === null) continue
            const key = `${r},${c}`
            if (checked.has(key)) continue
            const group = findConnectedGroup(board, r, c)
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

    return { bestGroup, bestContainsNewest }
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

// ── Tile component ────────────────────────────────────────────────────────────
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
    const label = formatNumber(value)

    // Dynamic font size based on label length and cell size
    const basePx = size * 0.44
    const fontPx = label.length > 4
        ? Math.floor(basePx * 0.52)
        : label.length > 3
            ? Math.floor(basePx * 0.65)
            : label.length > 2
                ? Math.floor(basePx * 0.82)
                : Math.floor(basePx)

    return (
        <div style={{
            width: size, height: size,
            background: style.bg,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 6px ${style.bg}88`,
            transform: popped ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s ease',
            animation: status === 'breaking' ? 'breakAnim 0.4s forwards' : status === 'merging' ? 'mergeAnim 0.3s forwards' : isNew ? 'spawnAnim 0.2s forwards' : 'none',
            overflow: 'hidden',
        }}>
            <span style={{
                fontSize: fontPx,
                fontWeight: 900,
                color: style.text,
                fontFamily: 'Orbitron, monospace',
                letterSpacing: label.length > 3 ? 0 : '0.02em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
            }}>{label}</span>
        </div>
    )
}

// ── Coin Shop Modal ───────────────────────────────────────────────────────────
const SHOP_ITEMS = [
    {
        id: 'clear_row',
        emoji: '💣',
        label: 'CLEAR ROW',
        desc: 'Blasts the bottom row',
        cost: 50,
        color: '#E74C3C',
    },
    {
        id: 'reshuffle',
        emoji: '🔀',
        label: 'RESHUFFLE',
        desc: 'Re-roll your next tile',
        cost: 30,
        color: '#3498DB',
    },
    {
        id: 'double_merge',
        emoji: '⚡',
        label: 'DOUBLE MERGE',
        desc: 'Next merge scores ×2',
        cost: 80,
        color: '#F39C12',
    },
    {
        id: 'remove_tile',
        emoji: '✂️',
        label: 'REMOVE TILE',
        desc: 'Tap any tile to remove it',
        cost: 60,
        color: '#9B59B6',
    },
]

function CoinShop({ coins, onBuy, onClose, activePowerup }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#1A1A2E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: '24px 20px',
                width: 'min(340px, 92vw)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                animation: 'fadeInScale 0.25s ease forwards',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>
                        COIN SHOP
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(241,196,15,0.12)', borderRadius: 20,
                        padding: '4px 12px', border: '1px solid rgba(241,196,15,0.25)',
                    }}>
                        <span style={{ fontSize: 14 }}>🪙</span>
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 900, color: '#F1C40F' }}>{coins}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {SHOP_ITEMS.map(item => {
                        const canAfford = coins >= item.cost
                        const isActive = activePowerup === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => canAfford && onBuy(item)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    background: isActive ? `rgba(${item.id === 'clear_row' ? '231,76,60' : item.id === 'reshuffle' ? '52,152,219' : item.id === 'double_merge' ? '243,156,18' : '155,89,182'},0.15)` : '#0F0F1A',
                                    border: `1px solid ${isActive ? item.color + '88' : canAfford ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
                                    borderRadius: 12, padding: '12px 14px',
                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                    opacity: canAfford ? 1 : 0.45,
                                    transition: 'all 0.15s ease',
                                    width: '100%', textAlign: 'left',
                                }}
                            >
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 900,
                                        color: isActive ? item.color : '#fff', letterSpacing: 1.5, marginBottom: 2,
                                    }}>{item.label} {isActive && '(ACTIVE)'}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{item.desc}</div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    background: 'rgba(241,196,15,0.1)',
                                    border: '1px solid rgba(241,196,15,0.2)',
                                    borderRadius: 8, padding: '4px 10px', flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: 11 }}>🪙</span>
                                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 900, color: '#F1C40F' }}>{item.cost}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <button onClick={onClose} style={{
                    marginTop: 16, width: '100%',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '10px', color: '#6B7280',
                    fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                }}>CLOSE</button>
            </div>
        </div>
    )
}

// ── Main Game ─────────────────────────────────────────────────────────────────
export default function NumberShootGame({ roomCode = 'SOLO_SHOOT', onMenu }) {
    const rngRef = useRef(null)
    const idRef = useRef(0)
    const nextId = useCallback(() => { idRef.current += 1; return `t-${idRef.current}` }, [])

    const [board, setBoard] = useState(createBoard)
    const [coins, setCoins] = useState(0)           // ← coins replace score
    const [level, setLevel] = useState(1)
    const [goalTile, setGoalTile] = useState(2048)
    const [showLevelUp, setShowLevelUp] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [nextVal, setNextVal] = useState(2)
    const [shooterCol, setShooterCol] = useState(2)
    const [isShooting, setIsShooting] = useState(false)
    const [shotPiece, setShotPiece] = useState(null)
    const [newTilePos, setNewTilePos] = useState(null)
    const [cellSize, setCellSize] = useState(52)
    const [showShop, setShowShop] = useState(false)
    const [activePowerup, setActivePowerup] = useState(null)   // e.g. 'remove_tile'
    const [doubleMergeActive, setDoubleMergeActive] = useState(false)
    const [floatingCoins, setFloatingCoins] = useState([])     // [{id,amount,x,y}]
    const boardRef = useRef(null)
    const floatId = useRef(0)

    const initRng = useCallback((seed) => { rngRef.current = makeRng(seed) }, [])
    const getNextVal = useCallback((currentBoard) => {
        if (!rngRef.current) return 2
        return randomVal(rngRef.current, getMaxTile(currentBoard))
    }, [])

    // Level-up detector
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
            const t = setTimeout(() => setShowLevelUp(false), 2000)
            return () => clearTimeout(t)
        }
    }, [showLevelUp])

    // Board sizing
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

    // Persistence
    const SOLO_SAVE_KEY = 'NUMBER_SHOOT_SOLO_DATA_' + roomCode
    useEffect(() => {
        if (!gameStarted || gameOver || roomCode !== 'SOLO_SHOOT') return
        const data = { board, coins, level, goalTile, nextVal, idCounter: idRef.current, timestamp: Date.now() }
        localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify(data))
    }, [board, coins, level, goalTile, nextVal, gameStarted, gameOver])

    useEffect(() => {
        if (gameOver && roomCode === 'SOLO_SHOOT') localStorage.removeItem(SOLO_SAVE_KEY)
    }, [gameOver])

    const [hasSave, setHasSave] = useState(false)
    useEffect(() => {
        if (roomCode === 'SOLO_SHOOT') {
            const saved = localStorage.getItem(SOLO_SAVE_KEY)
            if (saved) setHasSave(true)
        }
    }, [roomCode])

    function resumeGame() {
        const saved = localStorage.getItem(SOLO_SAVE_KEY)
        if (saved) {
            try {
                const data = JSON.parse(saved)
                initRng(roomCode + data.timestamp)
                setBoard(data.board)
                setCoins(data.coins || 0)
                setLevel(data.level)
                setGoalTile(data.goalTile)
                setNextVal(data.nextVal)
                idRef.current = data.idCounter || 1000
                setGameStarted(true)
            } catch { startGame(true) }
        }
    }

    function startGame(fresh = true) {
        if (!fresh && hasSave) { resumeGame(); return }
        initRng(roomCode + Date.now())
        const newBoard = createBoard()
        for (let c = 0; c < COLS; c++) {
            const count = 2 + Math.floor(Math.random() * 3)
            for (let r = 0; r < count; r++) {
                const val = [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)]
                newBoard[r][c] = { id: nextId(), val, status: 'idle' }
            }
        }
        setBoard(newBoard)
        setCoins(0)
        setLevel(1)
        setGoalTile(2048)
        setShowLevelUp(false)
        setGameOver(false)
        setNextVal(getNextVal(newBoard))
        setShooterCol(2)
        setIsShooting(false)
        setShotPiece(null)
        setActivePowerup(null)
        setDoubleMergeActive(false)
        setFloatingCoins([])
        setGameStarted(true)
    }

    // ── Coin float animation helper ───────────────────────────────────────────
    function spawnFloatingCoin(amount, boardColIdx) {
        if (!boardRef.current) return
        const rect = boardRef.current.getBoundingClientRect()
        const x = rect.left + (boardColIdx + 0.5) * (cellSize + GAP)
        const y = rect.top + rect.height * 0.4
        const id = floatId.current++
        setFloatingCoins(prev => [...prev, { id, amount, x, y }])
        setTimeout(() => setFloatingCoins(prev => prev.filter(f => f.id !== id)), 900)
    }

    // ── Shop handlers ─────────────────────────────────────────────────────────
    function handleBuy(item) {
        if (coins < item.cost) return
        setCoins(c => c - item.cost)

        if (item.id === 'reshuffle') {
            setNextVal(getNextVal(board))
            setShowShop(false)
            return
        }
        if (item.id === 'clear_row') {
            setBoard(prev => {
                const nb = prev.map(r => [...r])
                nb[ROWS - 1] = Array(COLS).fill(null)
                const { newBoard } = applyGravity(nb)
                return newBoard
            })
            setShowShop(false)
            return
        }
        if (item.id === 'double_merge') {
            setDoubleMergeActive(true)
            setShowShop(false)
            return
        }
        if (item.id === 'remove_tile') {
            setActivePowerup('remove_tile')
            setShowShop(false)
            return
        }
    }

    // Tap tile to remove (when remove_tile powerup active)
    function handleTileTap(r, c) {
        if (activePowerup !== 'remove_tile') return
        setBoard(prev => {
            const nb = prev.map(row => [...row])
            nb[r][c] = null
            const { newBoard } = applyGravity(nb)
            return newBoard
        })
        setActivePowerup(null)
    }

    // ── Shoot ─────────────────────────────────────────────────────────────────
    const handleShoot = useCallback((targetCol) => {
        if (!gameStarted || gameOver || isShooting || activePowerup) return
        
        // Ensure col is a valid number, default to current shooterCol if not provided
        const col = (typeof targetCol === 'number') ? targetCol : shooterCol
        setShooterCol(col)

        // Find landing row (top-down stacking: fills from top)
        let landRow = -1
        for (let r = 0; r < ROWS; r++) {
            if (board[r][col] === null) {
                landRow = r
                break
            }
        }
        if (landRow === -1) { setGameOver(true); return }

        setIsShooting(true)
        setShotPiece({ r: ROWS, c: col, val: nextVal, id: nextId() })

        setTimeout(() => {
            setShotPiece(p => ({ ...p, r: landRow }))
            setTimeout(() => { finalizeShot(landRow, col, nextVal) }, 100)
        }, 50)
    }, [gameStarted, gameOver, isShooting, board, shooterCol, nextVal, nextId, activePowerup])

    function finalizeShot(row, col, value) {
        setShotPiece(null)
        setNewTilePos({ r: row, c: col })

        setBoard(prev => {
            const nextBoard = prev.map(r => [...r])
            nextBoard[row][col] = { id: nextId(), val: value, status: 'idle' }

            const runSettleStep = (boardState, r, c, iter, pendingCoins) => {
                const { bestGroup, bestContainsNewest } = settleBoardOnce(boardState, r, c)

                if (bestGroup && iter < 30) {
                    const mergingBoard = boardState.map(gr => gr.map(cell => cell ? { ...cell } : null))
                    bestGroup.forEach(([gr, gc]) => { if (mergingBoard[gr][gc]) mergingBoard[gr][gc].status = 'merging' })
                    setBoard(mergingBoard)

                    setTimeout(() => {
                        const postMergeBoard = boardState.map(gr => gr.map(cell => cell ? { ...cell } : null))
                        const val = postMergeBoard[bestGroup[0][0]][bestGroup[0][1]].val
                        const mergedVal = val * Math.pow(2, bestGroup.length - 1)

                        // ── Coin reward: only when goal (or better) is reached!
                        let coinReward = 0
                        if (mergedVal >= goalTile) {
                            coinReward = 150 * (doubleMergeActive ? 2 : 1)
                            spawnFloatingCoin(coinReward, col)
                        }
                        const newPendingCoins = pendingCoins + coinReward

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
                        bestGroup.forEach(([gr, gc]) => postMergeBoard[gr][gc] = null)
                        postMergeBoard[resultR][resultC] = { id: nextId(), val: mergedVal, status: 'idle' }
                        setNewTilePos({ r: resultR, c: resultC })
                        if (doubleMergeActive) setDoubleMergeActive(false)

                        const { newBoard: gravityBoard } = applyGravity(postMergeBoard)
                        setBoard(gravityBoard)
                        setTimeout(() => runSettleStep(gravityBoard, resultR, resultC, iter + 1, newPendingCoins), 200)
                    }, 250)
                } else {
                    // Check game over: if column is full (tile in bottom row)
                    const over = boardState[ROWS - 1].some(cell => cell !== null)
                    if (over) {
                        setGameOver(true)
                    } else {
                        setCoins(s => s + pendingCoins)
                    }
                    setNextVal(getNextVal(boardState))
                    setIsShooting(false)
                    setNewTilePos(null)
                }
            }

            setTimeout(() => runSettleStep(nextBoard, row, col, 0, 0), 100)
            return nextBoard
        })
    }

    const shooterStyle = getTileStyle(nextVal)
    const boardWidth = cellSize * COLS + GAP * (COLS + 1)
    const boardHeight = cellSize * ROWS + GAP * (ROWS + 1)

    // ── Home screen ───────────────────────────────────────────────────────────
    if (!gameStarted && !gameOver) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 24, minHeight: 500 }}>
                <div style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>🏹</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>NUMBER SHOOT</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, marginBottom: 12 }}>Shoot tiles up. Merge to earn coins. Spend wisely!</div>
                    <div style={{ padding: '8px 16px', background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', borderRadius: 12, display: 'inline-block' }}>
                        <div style={{ fontSize: 10, color: '#F1C40F', letterSpacing: 1, textTransform: 'uppercase' }}>INITIAL GOAL</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#F1C40F', fontFamily: 'Orbitron, monospace' }}>2048</div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                    {hasSave && <button onClick={() => startGame(false)} style={primaryBtn}>CONTINUE</button>}
                    <button onClick={() => startGame(true)} style={hasSave ? secondaryBtn : primaryBtn}>{hasSave ? 'New Game' : 'PLAY NOW'}</button>
                </div>
                {onMenu && <button onClick={onMenu} style={{ ...secondaryBtn, marginTop: 4 }}>← Back</button>}
            </div>
        )
    }

    // ── Game over screen ──────────────────────────────────────────────────────
    if (gameOver) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 20, minHeight: 500, animation: 'fadeInScale 0.35s ease forwards' }}>
                <div style={{ fontSize: 64 }}>💥</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 24, fontWeight: 900, color: '#E74C3C', letterSpacing: 3 }}>GAME OVER</div>
                <div style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    background: 'rgba(241,196,15,0.08)', borderRadius: 12,
                    padding: '14px 24px', border: '1px solid rgba(241,196,15,0.2)',
                }}>
                    <span style={{ fontSize: 24 }}>🪙</span>
                    <div>
                        <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: 2, fontWeight: 700 }}>COINS EARNED</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#F1C40F', fontFamily: 'Orbitron, monospace' }}>{coins}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={startGame} style={primaryBtn}>RETRY</button>
                    {onMenu && <button onClick={onMenu} style={secondaryBtn}>Lobby</button>}
                </div>
            </div>
        )
    }

    // ── Active game ───────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0', width: '100%' }}>
            <style>{`
                @keyframes levelUpAnim {
                    0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
                }
                @keyframes breakAnim { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0) rotate(45deg); opacity: 0; } }
                @keyframes mergeAnim { 0% { transform: scale(1); } 50% { transform: scale(0.8); } 100% { transform: scale(1.2); opacity: 0.5; } }
                @keyframes spawnAnim { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes coinFloat { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(1.3); } }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
            `}</style>

            {/* Shop modal */}
            {showShop && (
                <CoinShop
                    coins={coins}
                    onBuy={handleBuy}
                    onClose={() => setShowShop(false)}
                    activePowerup={activePowerup}
                />
            )}

            {/* Floating coin rewards */}
            {floatingCoins.map(f => (
                <div key={f.id} style={{
                    position: 'fixed', left: f.x, top: f.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 500, pointerEvents: 'none',
                    animation: 'coinFloat 0.9s ease forwards',
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: 'rgba(241,196,15,0.15)',
                    border: '1px solid rgba(241,196,15,0.4)',
                    borderRadius: 20, padding: '3px 8px',
                }}>
                    <span style={{ fontSize: 10 }}>🪙</span>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 900, color: '#F1C40F' }}>+{f.amount}</span>
                </div>
            ))}

            {/* Header: compact 3-column layout */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                width: '90%', gap: 8, alignItems: 'stretch',
            }}>
                {/* Level */}
                <div style={{ background: '#1A1A2E', borderRadius: 10, padding: '7px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#F39C12', fontFamily: 'Orbitron, monospace', lineHeight: 1 }}>{level}</div>
                    <div style={{ fontSize: 8, color: '#4B5563', letterSpacing: 1, marginTop: 2 }}>LEVEL</div>
                </div>

                {/* Coins — tappable to open shop */}
                <button
                    onClick={() => setShowShop(true)}
                    style={{
                        background: doubleMergeActive ? 'rgba(243,156,18,0.15)' : 'rgba(241,196,15,0.08)',
                        borderRadius: 10, padding: '7px 10px', textAlign: 'center',
                        border: `1px solid ${doubleMergeActive ? 'rgba(243,156,18,0.4)' : 'rgba(241,196,15,0.2)'}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>🪙</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#F1C40F', fontFamily: 'Orbitron, monospace', lineHeight: 1 }}>{coins}</span>
                    </div>
                    <div style={{ fontSize: 8, color: doubleMergeActive ? '#F39C12' : '#4B5563', letterSpacing: 1, marginTop: 2 }}>
                        {doubleMergeActive ? '⚡ DOUBLE' : 'TAP SHOP'}
                    </div>
                </button>

                {/* Goal */}
                <div style={{
                    background: '#1A1A2E', borderRadius: 10, padding: '7px 10px', textAlign: 'center',
                    border: `1px solid ${getTileStyle(goalTile).bg}33`,
                }}>
                    <div style={{
                        fontSize: 16, fontWeight: 900,
                        color: getTileStyle(goalTile).bg,
                        fontFamily: 'Orbitron, monospace', lineHeight: 1,
                        textShadow: `0 0 8px ${getTileStyle(goalTile).bg}66`,
                    }}>{formatNumber(goalTile)}</div>
                    <div style={{ fontSize: 8, color: '#4B5563', letterSpacing: 1, marginTop: 2 }}>GOAL</div>
                </div>
            </div>

            {/* Powerup banner */}
            {activePowerup === 'remove_tile' && (
                <div style={{
                    background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.4)',
                    borderRadius: 10, padding: '8px 16px', fontSize: 12, color: '#9B59B6',
                    fontFamily: 'Orbitron, monospace', letterSpacing: 1, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 8,
                    animation: 'pulse-glow 1.5s ease-in-out infinite',
                }}>
                    ✂️ TAP ANY TILE TO REMOVE IT
                    <button onClick={() => setActivePowerup(null)} style={{
                        background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14, padding: 0,
                    }}>✕</button>
                </div>
            )}

            {/* Board */}
            <div
                ref={boardRef}
                style={{
                    width: '94%', maxWidth: 320,
                    background: '#0a0a16', borderRadius: 12,
                    border: `1px solid ${activePowerup === 'remove_tile' ? 'rgba(155,89,182,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                }}
            >
                <div style={{ width: boardWidth, height: boardHeight + cellSize + GAP, position: 'relative', margin: '0 auto' }}>
                    {/* Column tap zones */}
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div
                            key={c}
                            onClick={() => handleShoot(c)}
                            style={{
                                position: 'absolute', top: 0,
                                left: c * (cellSize + GAP) + GAP,
                                width: cellSize, height: '100%',
                                cursor: 'pointer', zIndex: 10,
                            }}
                        />
                    ))}

                    {/* Settled tiles */}
                    {board.map((row, r) =>
                        row.map((tile, c) => tile !== null ? (
                            <div
                                key={tile.id}
                                onClick={() => activePowerup === 'remove_tile' && handleTileTap(r, c)}
                                style={{
                                    position: 'absolute',
                                    top: r * (cellSize + GAP) + GAP,
                                    left: c * (cellSize + GAP) + GAP,
                                    width: cellSize, height: cellSize,
                                    transition: 'top 0.2s cubic-bezier(0.2,0,0.2,1), left 0.1s ease-out',
                                    cursor: activePowerup === 'remove_tile' ? 'crosshair' : 'default',
                                    zIndex: 15,
                                }}
                            >
                                <Tile
                                    value={tile.val}
                                    size={cellSize}
                                    isNew={newTilePos?.r === r && newTilePos?.c === c}
                                    status={tile.status}
                                />
                            </div>
                        ) : null)
                    )}

                    {/* Level-up overlay */}
                    {showLevelUp && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            background: 'rgba(0,0,0,0.88)',
                            padding: '18px 32px', borderRadius: 14,
                            color: '#F1C40F', fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900,
                            zIndex: 100, border: '2px solid #F1C40F',
                            boxShadow: '0 0 30px rgba(241,196,15,0.4)',
                            animation: 'levelUpAnim 2s ease-out forwards',
                            pointerEvents: 'none', textAlign: 'center', width: '80%',
                        }}>
                            LEVEL UP!<br />
                            <span style={{ fontSize: 14, color: '#fff', letterSpacing: 1 }}>NEXT GOAL: </span>
                            <span style={{ fontSize: 20, color: getTileStyle(goalTile).bg }}>{formatNumber(goalTile)}</span>
                        </div>
                    )}

                    {/* Shot animation piece */}
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
                            boxShadow: `0 0 20px ${getTileStyle(shotPiece.val).bg}`,
                        }}>
                            <span style={{
                                fontSize: Math.floor(cellSize * 0.4), fontWeight: 900,
                                color: getTileStyle(shotPiece.val).text, fontFamily: 'Orbitron, monospace',
                            }}>{formatNumber(shotPiece.val)}</span>
                        </div>
                    )}

                    {/* Shooter tile at bottom */}
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
                            boxShadow: `0 0 15px ${shooterStyle.bg}77`,
                            overflow: 'hidden',
                        }}>
                            <span style={{
                                fontSize: (() => {
                                    const lbl = formatNumber(nextVal)
                                    const base = cellSize * 0.4
                                    return lbl.length > 4 ? Math.floor(base * 0.52) : lbl.length > 3 ? Math.floor(base * 0.65) : Math.floor(base)
                                })(),
                                fontWeight: 900, color: shooterStyle.text, fontFamily: 'Orbitron, monospace',
                            }}>{formatNumber(nextVal)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 24, fontSize: 11, color: '#4B5563', letterSpacing: 1.2, fontWeight: 700, fontFamily: 'Orbitron, monospace' }}>
                TAP COLUMN TO SHOOT
            </div>
        </div>
    )
}

const primaryBtn = {
    background: 'linear-gradient(135deg, #3498DB, #2980B9)', color: '#fff', border: 'none', borderRadius: 14,
    padding: '16px 40px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'Orbitron, monospace',
    boxShadow: '0 8px 25px rgba(52,152,219,0.3)', letterSpacing: 2,
}
const secondaryBtn = {
    background: 'none', border: '1px solid #2a2a4a', color: '#6B7280', borderRadius: 12, padding: '10px 24px',
    fontSize: 13, cursor: 'pointer', letterSpacing: 1,
}