import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { roomId, username } = await req.json()
    if (!roomId || !username) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const supabase = createServerClient()
    
    // Remote the player from 'players' table
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('room_id', roomId)
      .eq('username', username)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Leave room error:', err)
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 })
  }
}
