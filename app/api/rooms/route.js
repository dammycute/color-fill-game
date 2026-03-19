import { createServerClient } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/gameLogic'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { username } = await req.json()
    if (!username || username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
    }

    const supabase = createServerClient()
    let code, attempts = 0

    // Generate unique code
    do {
      code = generateRoomCode()
      const { data } = await supabase.from('rooms').select('id').eq('code', code).single()
      if (!data) break
      attempts++
    } while (attempts < 10)

    // Create room
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ code, creator_username: username.trim(), expires_at: expiresAt })
      .select()
      .single()

    if (roomError) throw roomError

    // Add creator as player
    await supabase.from('players').insert({ room_id: room.id, username: username.trim() })

    return NextResponse.json({ code: room.code, roomId: room.id })
  } catch (err) {
    console.error('Create room error:', err)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')?.toUpperCase()
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    const supabase = createServerClient()
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id)

    return NextResponse.json({ ...room, playerCount: count || 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
