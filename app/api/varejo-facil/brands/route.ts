import { NextRequest, NextResponse } from 'next/server'
import { varejoFacilClient } from '@/lib/varejo-facil-client'

// GET - Buscar marcas do Varejo Fácil
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

    console.log('🔍 Buscando marcas do Varejo Fácil com params:', params)
    
    const response = await varejoFacilClient.getBrands(params)
    
    console.log('✅ Marcas encontradas:', response.items?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar marcas do Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Criar marca no Varejo Fácil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 Criando marca no Varejo Fácil:', body)
    
    const response = await varejoFacilClient.createBrand(body)
    
    console.log('✅ Marca criada com sucesso:', response)
    
    return NextResponse.json({
      success: true,
      data: response
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar marca no Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
} 