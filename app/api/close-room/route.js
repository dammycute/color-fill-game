import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { roomId, username } = await req.json()
    if (!roomId || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: room } = await supabase
      .from('rooms')
      .select('creator_username')
      .eq('id', roomId)
      .single()

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.creator_username !== username) {
      return NextResponse.json({ error: 'Only the creator can close this room' }, { status: 403 })
    }

    await supabase.from('rooms').update({ is_active: false }).eq('id', roomId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
