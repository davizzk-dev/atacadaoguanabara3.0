import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de teste funcionando!'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Dados recebidos na API de teste:', body)
    
    return NextResponse.json({
      success: true,
      data: {
        id: Date.now().toString(),
        message: 'Teste funcionando!',
        receivedData: body
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro no teste'
    }, { status: 500 })
  }
}
