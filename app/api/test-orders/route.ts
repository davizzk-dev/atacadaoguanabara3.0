import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Teste POST iniciado')
  
  try {
    console.log('📖 Tentando ler body...')
    const body = await request.json()
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({ 
      success: true,
      message: 'Teste funcionando',
      receivedData: body
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({ 
      success: false,
      error: error?.message || 'Erro no teste',
      details: error?.stack || 'Sem detalhes'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🧪 Teste GET iniciado')
  return NextResponse.json({ 
    success: true,
    message: 'Teste GET funcionando'
  })
} 