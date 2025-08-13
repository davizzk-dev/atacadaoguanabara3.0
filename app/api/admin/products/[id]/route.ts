import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json')

// Função para carregar produtos
const loadProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.log('Arquivo de produtos não encontrado, retornando array vazio')
    return []
  }
}

// Função para salvar produtos
const saveProducts = async (products: any[]) => {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2))
}

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

    let products = await loadProducts()
    const productIndex = products.findIndex((p: any) => p.id.toString() === id)

    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Produto não encontrado'
      }, { status: 404 })
    }

    // Atualizar produto
    products[productIndex] = {
      ...products[productIndex],
      ...updateData,
      id: products[productIndex].id, // Manter o ID original
      updatedAt: new Date().toISOString()
    }

    await saveProducts(products)

    console.log('✅ Produto atualizado com sucesso:', id)

    const response = NextResponse.json({
      success: true,
      data: products[productIndex]
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

    let products = await loadProducts()
    const productIndex = products.findIndex((p: any) => p.id.toString() === id)

    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Produto não encontrado'
      }, { status: 404 })
    }

    // Remover produto
    const deletedProduct = products.splice(productIndex, 1)[0]
    await saveProducts(products)

    console.log('✅ Produto deletado com sucesso:', id)

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso',
      data: deletedProduct
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

    const products = await loadProducts()
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
