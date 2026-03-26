import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { roomId, username, level, movesUsed, stars } = await req.json()

    if (!roomId || !username || !level || !movesUsed || !stars) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify room is still active
    const { data: room } = await supabase
      .from('rooms')
      .select('is_active, expires_at')
      .eq('id', roomId)
      .single()

    if (!room || !room.is_active || new Date(room.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Room is no longer active' }, { status: 410 })
    }

    // Upsert score — keep best per player per level (most stars, fewest moves)
    const { data: existing } = await supabase
      .from('scores')
      .select('id, stars, moves_used')
      .eq('room_id', roomId)
      .eq('username', username)
      .eq('level', level)
      .single()

    if (existing) {
      // Only update if this attempt is better
      const isBetter = stars > existing.stars || (stars === existing.stars && movesUsed < existing.moves_used)
      if (isBetter) {
        await supabase
          .from('scores')
          .update({ moves_used: movesUsed, stars, completed_at: new Date().toISOString() })
          .eq('id', existing.id)
      }
    } else {
      await supabase
        .from('scores')
        .insert({ room_id: roomId, username, level, moves_used: movesUsed, stars })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Score submit error:', err)
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')
    const username = searchParams.get('username')

    if (!roomId || !username) {
      return NextResponse.json({ error: 'Missing roomId or username' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data } = await supabase
      .from('scores')
      .select('level')
      .eq('room_id', roomId)
      .eq('username', username)
      .order('level', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ maxLevel: data?.level || 0 })
  } catch {
    return NextResponse.json({ maxLevel: 0 })
  }
}
