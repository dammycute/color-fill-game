'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ColorFloodGame from '@/components/ColorFloodGame'
import NumberDropGame from '@/components/NumberDrop'
import NumberShootGame from '@/components/NumberShoot'

export default function SoloGamePage() {
    const { game } = useParams()
    const router = useRouter()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!['colorflood', 'numberdrop', 'numbershoot'].includes(game)) {
            router.push('/')
            return
        }
        setTimeout(() => setVisible(true), 50)
    }, [game])

    const handleMenu = () => {
        router.push('/select-game')
    }

    // Fake solo room context for ColorFloodGame compatibility
    const soloRoomCode = 'SOLO00'
    const soloRoomId = null
    const soloUsername = 'You'

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 30%, rgba(52,152,219,0.06) 0%, transparent 50%), #0F0F1A',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
        }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(26,26,46,0.8)', backdropFilter: 'blur(8px)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => router.push('/select-game')} style={{
                        background: 'none', border: 'none', color: '#4B5563',
                        fontSize: 13, cursor: 'pointer',
                    }}>← Games</button>
                    <div style={{
                        width: 1, height: 16, background: 'rgba(255,255,255,0.08)',
                    }} />
                    <span style={{
                        fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700,
                        color: '#fff', letterSpacing: 2,
                    }}>
                        {game === 'colorflood' ? '🌊 COLOR FLOOD' : 
                         game === 'numbershoot' ? '🏹 NUMBER SHOOT' : '🔢 NUMBER DROP'}
                    </span>
                </div>
                <div style={{
                    background: 'rgba(46,204,113,0.08)',
                    border: '1px solid rgba(46,204,113,0.15)',
                    borderRadius: 20, padding: '4px 12px',
                    fontSize: 10, color: '#2ECC71',
                    fontFamily: 'Orbitron, monospace', fontWeight: 700, letterSpacing: 1,
                }}>
                    🎮 SOLO
                </div>
            </div>

            {/* Game area */}
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
                <div style={{
                    background: '#1A1A2E', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden', minHeight: 500,
                }}>
                    {game === 'colorflood' && (
                        <ColorFloodGame
                            roomCode={soloRoomCode}
                            roomId={soloRoomId}
                            username={soloUsername}
                            onLevelComplete={null}
                            onMenu={handleMenu}
                            isSolo={true}
                        />
                    )}
                    {game === 'numberdrop' && (
                        <NumberDropGame
                            onMenu={handleMenu}
                            isSolo={true}
                        />
                    )}
                    {game === 'numbershoot' && (
                        <NumberShootGame
                            onMenu={handleMenu}
                            isSolo={true}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}