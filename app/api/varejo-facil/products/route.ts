import { NextRequest, NextResponse } from 'next/server'
import { varejoFacilClient } from '@/lib/varejo-facil-client'

// GET - Buscar produtos do Varejo Fácil
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sort = searchParams.get('sort')
    const start = searchParams.get('start')
    const count = searchParams.get('count')

    const params: any = {}
    if (q) params.q = q
    if (sort) params.sort = sort
    if (start) params.start = parseInt(start)
    if (count) params.count = parseInt(count)

    console.log('🔍 Buscando produtos do Varejo Fácil com params:', params)
    
    const response = await varejoFacilClient.getProducts(params)
    
    console.log('✅ Produtos encontrados:', response.items?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos do Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Criar produto no Varejo Fácil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 Criando produto no Varejo Fácil:', body)
    
    const response = await varejoFacilClient.createProduct(body)
    
    console.log('✅ Produto criado com sucesso:', response)
    
    return NextResponse.json({
      success: true,
      data: response
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar produto no Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
} 