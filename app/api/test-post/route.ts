import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/test-post iniciado')
  
  try {
    // Ler o body apenas uma vez
    const body = await request.json()
    console.log('✅ Body recebido:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'POST funcionou!',
      data: body 
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GET funcionou!' })
}

