import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock log para NextAuth
    const response = NextResponse.json({
      success: true,
      logs: []
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro no log:', error)
    return NextResponse.json({
      success: false,
      logs: []
    }, { status: 200 }) // Sempre retornar 200 para logs
  }
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (e) {
      body = {}
    }

    // Apenas acknowledge o log
    const response = NextResponse.json({
      success: true,
      message: 'Log registrado'
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro ao registrar log:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 200 }) // Sempre retornar 200 para logs
  }
}
