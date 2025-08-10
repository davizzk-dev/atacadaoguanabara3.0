import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar promoções
export async function GET() {
  console.log('🎁 GET /api/promo iniciado')
  
  return NextResponse.json({
    success: true,
    data: [],
    message: 'GET promo funcionando!'
  })
}

// POST - Criar promoção
export async function POST() {
  console.log('🚀 POST /api/promo iniciado')
  
  try {
    console.log('✅ Retornando resposta simples...')
    
    // Retornar resposta simples sem criar objeto
    return NextResponse.json({
      success: true,
      message: 'POST promo funcionando!',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro no POST:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
