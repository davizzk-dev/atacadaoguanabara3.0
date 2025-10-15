import { NextRequest, NextResponse } from 'next/server'
import { updateProductInFile, getProductsFromFile } from '@/lib/data'

// PUT - Atualizar produto específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Clone request para evitar "Response body disturbed"
    let updateData
    try {
      const text = await request.text()
      updateData = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Erro ao fazer parse do body:', e)
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos no body da requisição'
      }, { status: 400 })
    }

    console.log('🔄 Atualizando produto:', id, updateData)

    // Usar a função que salva nos dois arquivos (products.json e products2.json)
    const result = await updateProductInFile(id, {
      ...updateData,
      updatedAt: new Date().toISOString()
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 404 })
    }

    console.log('✅ Produto atualizado com sucesso:', id)

    // Carregar o produto atualizado para retornar
    const products = await getProductsFromFile()
    const updatedProduct = products.find((p: any) => p.id.toString() === id)

    const response = NextResponse.json({
      success: true,
      data: updatedProduct || updateData
    })
    
    // Evitar cache para prevenir problemas de request body
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// DELETE - Excluir produto específico  
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log('🗑️ Deletando produto:', id)

    // Buscar produto antes de deletar
    const products = await getProductsFromFile()
    const product = products.find((p: any) => p.id.toString() === id)

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Produto não encontrado'
      }, { status: 404 })
    }

    // Usar função de delete que funciona nos dois arquivos
    const { deleteProductFromFile } = await import('@/lib/data')
    const result = await deleteProductFromFile(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }

    console.log('✅ Produto deletado com sucesso:', id)

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso',
      data: product
    })

  } catch (error: any) {
    console.error('❌ Erro ao deletar produto:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// GET - Buscar produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log('🔍 Buscando produto:', id)

    const products = await getProductsFromFile()
    const product = products.find((p: any) => p.id.toString() === id)

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Produto não encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: product
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar produto:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
