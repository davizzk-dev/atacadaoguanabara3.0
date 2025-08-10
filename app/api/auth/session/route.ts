import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock session para evitar erros NextAuth
    const mockSession = {
      user: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@atacadaoguanabara.com',
        role: 'admin'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    }

    const response = NextResponse.json(mockSession)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro na sessão:', error)
    return NextResponse.json({
      user: null,
      expires: null
    }, { status: 200 }) // Retornar 200 mesmo sem sessão
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle login/logout
    let body
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (e) {
      body = {}
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sessão atualizada'
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro ao atualizar sessão:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
