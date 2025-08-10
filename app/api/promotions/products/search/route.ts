import { NextRequest, NextResponse } from 'next/server'
import { getCatalogProducts } from '@/lib/data'

// GET - Buscar produtos para adicionar em promoções
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('🔍 Buscando produtos para promoção:', { search, limit })

    // Obter todos os produtos
    const products = await getCatalogProducts()
    
    if (!search) {
      // Se não há busca, retornar primeiros produtos
      return NextResponse.json({
        success: true,
        data: products.slice(0, limit).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          brand: product.brand,
          unit: product.unit,
          description: product.description,
          varejoFacilData: product.varejoFacilData
        }))
      })
    }

    // Busca simplificada
    const searchLower = search.toLowerCase().trim()
    
    console.log(`🔍 Busca de promoção: "${search}"`)
    
    const sortedProducts = products
      .filter(product => {
        const name = (product.name || '').toLowerCase()
        const description = (product.description || '').toLowerCase()
        const category = (product.category || '').toLowerCase()
        const id = product.id.toString()
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               category.includes(searchLower) || 
               id.includes(search)
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    // Limitar resultados e retornar apenas campos necessários
    const results = sortedProducts.slice(0, limit).map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      description: product.description,
      varejoFacilData: {
        codigoInterno: product.varejoFacilData?.codigoInterno,
        idExterno: product.varejoFacilData?.idExterno,
        secaoId: product.varejoFacilData?.secaoId,
        marcaId: product.varejoFacilData?.marcaId,
        generoId: product.varejoFacilData?.generoId
      }
    }))

    console.log(`✅ Encontrados ${results.length} produtos para "${search}"`)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos para promoção:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
