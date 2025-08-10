import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      success: true, 
      message: 'API de teste funcionando',
      received: body
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro: ' + (error as Error).message 
    }, { status: 500 })
  }
} 