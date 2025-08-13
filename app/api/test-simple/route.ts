import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'GET funcionou!' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('✅ POST recebido:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'POST funcionou!',
      data: body 
    })
  } catch (error) {
    console.error('❌ Erro no POST:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno' 
    }, { status: 500 })
  }
} 