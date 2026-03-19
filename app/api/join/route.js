import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { code, username } = await req.json()

    if (!code || !username) {
      return NextResponse.json({ error: 'Room code and username are required' }, { status: 400 })
    }

    const cleanUsername = username.trim()
    const cleanCode = code.trim().toUpperCase()

    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be 2–20 characters' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found. Check the code and try again.' }, { status: 404 })
    }

    if (!room.is_active) {
      return NextResponse.json({ error: 'This room has been closed by the creator.' }, { status: 410 })
    }

    if (new Date(room.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This room has expired.' }, { status: 410 })
    }

    // Check username uniqueness in room
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', room.id)
      .eq('username', cleanUsername)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'That username is already taken in this room. Choose another.' }, { status: 409 })
    }

    // Add player
    const { error: joinError } = await supabase
      .from('players')
      .insert({ room_id: room.id, username: cleanUsername })

    if (joinError) {
      // Handle race condition (unique constraint)
      if (joinError.code === '23505') {
        return NextResponse.json({ error: 'That username is already taken in this room.' }, { status: 409 })
      }
      throw joinError
    }

    return NextResponse.json({
      roomId: room.id,
      username: cleanUsername,
      code: room.code,
      creatorUsername: room.creator_username,
    })
  } catch (err) {
    console.error('Join room error:', err)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
