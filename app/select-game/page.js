'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GAMES = [
    {
        id: 'colorflood',
        emoji: '🌊',
        title: 'COLOR FLOOD',
        subtitle: 'Flood the board',
        description: 'Tap colors to flood-fill from the top-left. Fill the entire board before moves run out.',
        tags: ['Puzzle', 'Strategy'],
        accent: '#3498DB',
        glow: 'rgba(52,152,219,0.3)',
        border: 'rgba(52,152,219,0.25)',
        bg: 'rgba(52,152,219,0.06)',
        preview: [
            ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'],
            ['#3498DB', '#3498DB', '#9B59B6', '#2ECC71'],
            ['#2ECC71', '#9B59B6', '#9B59B6', '#E74C3C'],
            ['#F39C12', '#2ECC71', '#E74C3C', '#3498DB'],
        ],
    },
    {
        id: 'numberdrop',
        emoji: '🔢',
        title: 'NUMBER DROP',
        subtitle: 'Merge & multiply',
        description: 'Drop number tiles into a 5×8 grid. Connect matching numbers to merge them into higher values.',
        tags: ['Arcade', 'Merge'],
        accent: '#9B59B6',
        glow: 'rgba(155,89,182,0.3)',
        border: 'rgba(155,89,182,0.25)',
        bg: 'rgba(155,89,182,0.06)',
        preview: [
            ['#2B2B36', '#9B59B6', null, '#2B2B36'],
            [null, '#9B59B6', '#2B2B36', null],
            ['#E74C3C', null, '#9B59B6', '#2B2B36'],
            ['#E74C3C', '#2B2B36', null, '#9B59B6'],
        ],
        previewVals: [
            [2, 8, null, 2],
            [null, 8, 4, null],
            [32, null, 8, 4],
            [32, 2, null, 8],
        ],
    },
    {
        id: 'numbershoot',
        emoji: '🏹',
        title: 'NUMBER SHOOT',
        subtitle: 'Shoot & merge',
        description: 'Aim and shoot number tiles from the bottom. Connect matching numbers to clear space and score big.',
        tags: ['Arcade', 'Strategy'],
        accent: '#1ABC9C',
        glow: 'rgba(26,188,156,0.3)',
        border: 'rgba(26,188,156,0.25)',
        bg: 'rgba(26,188,156,0.06)',
        preview: [
            ['#2B2B36', '#1ABC9C', null, '#2B2B36'],
            [null, '#1ABC9C', '#2B2B36', null],
            ['#E74C3C', null, '#1ABC9C', '#2B2B36'],
            ['#E74C3C', '#2B2B36', null, '#1ABC9C'],
        ],
        previewVals: [
            [2, 8, null, 2],
            [null, 8, 4, null],
            [32, null, 8, 4],
            [32, 2, null, 8],
        ],
    },
]

function ColorFloodPreview({ grid }) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 3, padding: 8, background: '#0F0F1A', borderRadius: 8,
            width: 80, height: 80,
        }}>
            {grid.flat().map((color, i) => (
                <div key={i} style={{
                    borderRadius: 2, background: color || 'transparent',
                    boxShadow: color ? `0 1px 4px ${color}44` : 'none',
                }} />
            ))}
        </div>
    )
}

function NumberDropPreview({ colors, vals }) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 3, padding: 8, background: '#0F0F1A', borderRadius: 8,
            width: 80, height: 80,
        }}>
            {colors.flat().map((color, i) => {
                const val = vals.flat()[i]
                return (
                    <div key={i} style={{
                        borderRadius: 2,
                        background: color || 'rgba(255,255,255,0.03)',
                        border: color ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {val && <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', opacity: 0.9 }}>{val}</span>}
                    </div>
                )
            })}
        </div>
    )
}

export default function SelectGamePage() {
    const router = useRouter()
    const [mode, setMode] = useState(null)
    const [hovered, setHovered] = useState(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const m = sessionStorage.getItem('play_mode')
        if (!m) { router.push('/'); return }
        setMode(m)
        setTimeout(() => setVisible(true), 50)
    }, [])

    const handleGameSelect = (gameId) => {
        sessionStorage.setItem('selected_game', gameId)
        if (mode === 'solo') {
            router.push(`/solo/${gameId}`)
        } else {
            // Group mode — go to create or join
            router.push(`/room/create?game=${gameId}`)
        }
    }

    const modeLabel = mode === 'solo' ? '🎮 SOLO PLAY' : '👥 GROUP PLAY'
    const modeColor = mode === 'solo' ? '#2ECC71' : '#3498DB'

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 30% 40%, rgba(52,152,219,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(155,89,182,0.06) 0%, transparent 55%), #0F0F1A',
            padding: 24,
        }}>
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 28, maxWidth: 440, width: '100%',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
                {/* Back + mode badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <button onClick={() => router.push('/')} style={{
                        background: 'none', border: 'none', color: '#4B5563',
                        fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        ← Back
                    </button>
                    <div style={{
                        background: mode === 'solo' ? 'rgba(46,204,113,0.08)' : 'rgba(52,152,219,0.08)',
                        border: `1px solid ${mode === 'solo' ? 'rgba(46,204,113,0.2)' : 'rgba(52,152,219,0.2)'}`,
                        borderRadius: 20, padding: '4px 12px',
                        fontSize: 10, color: modeColor,
                        fontFamily: 'Orbitron, monospace', fontWeight: 700, letterSpacing: 1,
                    }}>
                        {modeLabel}
                    </div>
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: 'clamp(22px, 6vw, 30px)',
                        fontWeight: 900, color: '#fff', letterSpacing: '0.15em',
                    }}>
                        SELECT GAME
                    </div>
                    <div style={{ fontSize: 12, color: '#4B5563', marginTop: 6, letterSpacing: 1 }}>
                        {mode === 'solo' ? 'Play at your own pace' : 'Create or join a room to compete'}
                    </div>
                </div>

                {/* Game cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                    {GAMES.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => handleGameSelect(game.id)}
                            onMouseEnter={() => setHovered(game.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: hovered === game.id ? game.bg : '#1A1A2E',
                                border: `1px solid ${hovered === game.id ? game.border : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 18,
                                padding: '18px 20px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 16,
                                width: '100%', textAlign: 'left',
                                transition: 'all 0.2s ease',
                                transform: hovered === game.id ? 'translateY(-2px)' : 'translateY(0)',
                                boxShadow: hovered === game.id ? `0 10px 32px ${game.glow}` : '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            {/* Preview */}
                            <div style={{ flexShrink: 0 }}>
                                {game.id === 'colorflood'
                                    ? <ColorFloodPreview grid={game.preview} />
                                    : <NumberDropPreview colors={game.preview} vals={game.previewVals} />
                                }
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 18 }}>{game.emoji}</span>
                                    <span style={{
                                        fontFamily: 'Orbitron, monospace',
                                        fontSize: 13, fontWeight: 900,
                                        color: '#fff', letterSpacing: 2,
                                    }}>{game.title}</span>
                                </div>
                                <div style={{ fontSize: 11, color: game.accent, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
                                    {game.subtitle}
                                </div>
                                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                                    {game.description}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    {game.tags.map(tag => (
                                        <span key={tag} style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 6, padding: '2px 8px',
                                            fontSize: 10, color: '#4B5563', fontWeight: 600, letterSpacing: 0.5,
                                        }}>{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                color: hovered === game.id ? game.accent : '#374151',
                                fontSize: 20, flexShrink: 0, transition: 'color 0.2s ease',
                            }}>→</div>
                        </button>
                    ))}
                </div>

                {/* If group mode, show join room option */}
                {mode === 'group' && (
                    <div style={{
                        width: '100%', textAlign: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        paddingTop: 20,
                    }}>
                        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 12 }}>
                            Already have a room code?
                        </div>
                        <button
                            onClick={() => router.push('/room/join')}
                            style={{
                                background: '#1A1A2E', color: '#D1D5DB',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 12, padding: '12px 28px',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                letterSpacing: 2, fontFamily: 'Orbitron, monospace',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(52,152,219,0.35)'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#D1D5DB' }}
                        >
                            → JOIN A ROOM
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}