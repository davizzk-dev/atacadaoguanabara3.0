import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any)
    return NextResponse.json(session ?? { user: null, expires: null }, { status: 200 })
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return NextResponse.json({ user: null, expires: null }, { status: 200 })
  }
}

export async function POST() {
  // NextAuth client may POST here to update session; return 200 OK
  return NextResponse.json({ success: true }, { status: 200 })
}
