import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🚀 DEBUG POST iniciado')
  
  try {
    console.log('📝 Tentando ler body...')
    const body = await request.json()
    console.log('✅ Body lido com sucesso:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'DEBUG POST funcionou!',
      receivedData: body
    })
    
  } catch (error) {
    console.error('❌ Erro no DEBUG POST:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

