import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/database'

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}
