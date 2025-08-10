import { NextRequest, NextResponse } from 'next/server'
import { saveProductToFile, updateProductInFile, deleteProductFromFile, getAllProductsFromFile, products as defaultProducts, syncProductsToFile } from '@/lib/data'

// Função wrapper para capturar erros
const handleApiError = (error: any, operation: string) => {
  console.error(`❌ Erro em ${operation}:`, error)
  
  // Se for um erro de sistema de arquivos, retornar erro específico
  if (error.code === 'ENOENT') {
    return NextResponse.json({
      error: 'Arquivo de produtos não encontrado',
      details: 'O sistema não conseguiu acessar o arquivo de produtos',
      success: false
    }, { status: 500 })
  }
  
  if (error.code === 'EACCES') {
    return NextResponse.json({
      error: 'Permissão negada para acessar arquivo de produtos',
      details: 'O sistema não tem permissão para ler/escrever o arquivo',
      success: false
    }, { status: 500 })
  }
  
  return NextResponse.json({
    error: `Erro interno do servidor em ${operation}`,
    details: error instanceof Error ? error.message : 'Erro desconhecido',
    success: false
  }, { status: 500 })
}

export async function GET() {
  try {
    console.log('🔍 Buscando produtos...')
    let products = await getAllProductsFromFile()
    
    // Se não há produtos no arquivo, usar os produtos padrão do data.ts
    if (!products || products.length === 0) {
      console.log('📦 Nenhum produto encontrado no arquivo, usando produtos padrão')
      products = defaultProducts.map(product => ({
        ...product,
        inStock: product.stock > 0,
        rating: product.rating || 0,
        reviews: product.reviews || 0
      }))
      
      // Sincronizar produtos padrão para o arquivo
      try {
        await syncProductsToFile()
      } catch (syncError) {
        console.error('⚠️ Erro ao sincronizar produtos, mas continuando...', syncError)
      }
    }
    
    console.log(`✅ ${products.length} produtos carregados com sucesso`)
    return NextResponse.json(products)
  } catch (error) {
    return handleApiError(error, 'buscar produtos')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Recebendo requisição para criar produto...')
    
    // Verificar se o corpo da requisição está vazio
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({
        error: 'Content-Type deve ser application/json',
        success: false
      }, { status: 400 })
    }
    
    let productData
    try {
      const text = await request.text()
      productData = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        error: 'Dados JSON inválidos',
        details: 'O corpo da requisição deve ser um JSON válido',
        success: false
      }, { status: 400 })
    }
    
    console.log('📦 Dados do produto recebidos:', productData)
    
    // Validar dados obrigatórios
    if (!productData.name || !productData.price || !productData.category) {
      console.log('❌ Dados obrigatórios faltando:', { 
        name: !!productData.name, 
        price: !!productData.price, 
        category: !!productData.category 
      })
      return NextResponse.json({
        error: 'Nome, preço e categoria são obrigatórios',
        success: false
      }, { status: 400 })
    }
    
    console.log('💾 Salvando produto no arquivo...')
    const result = await saveProductToFile(productData)
    console.log('📊 Resultado do salvamento:', result)
    
    if (result.success) {
      console.log('✅ Produto criado com sucesso')
      const response = NextResponse.json({
        message: result.message,
        product: productData,
        success: true
      })
      
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      
      return response
    } else {
      console.log('❌ Erro ao salvar produto:', result.message)
      return NextResponse.json({
        error: result.message,
        success: false
      }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, 'criar produto')
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Recebendo requisição para atualizar produto...')
    
    // Verificar se o corpo da requisição está vazio
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({
        error: 'Content-Type deve ser application/json',
        success: false
      }, { status: 400 })
    }
    
    let productData
    try {
      const text = await request.text()
      productData = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        error: 'Dados JSON inválidos',
        details: 'O corpo da requisição deve ser um JSON válido',
        success: false
      }, { status: 400 })
    }
    
    console.log('📦 Dados do produto para atualização:', productData)
    
    if (!productData.id) {
      console.log('❌ ID do produto não fornecido')
      return NextResponse.json({
        error: 'ID do produto é obrigatório',
        success: false
      }, { status: 400 })
    }
    
    console.log('💾 Atualizando produto no arquivo...')
    const result = await updateProductInFile(productData.id, productData)
    console.log('📊 Resultado da atualização:', result)
    
    if (result.success) {
      console.log('✅ Produto atualizado com sucesso')
      const response = NextResponse.json({
        message: result.message,
        product: productData,
        success: true
      })
      
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      
      return response
    } else {
      console.log('❌ Erro ao atualizar produto:', result.message)
      return NextResponse.json({
        error: result.message,
        success: false
      }, { status: 404 })
    }
  } catch (error) {
    return handleApiError(error, 'atualizar produto')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Recebendo requisição para deletar produto...')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    console.log('🆔 ID do produto para deletar:', id)
    
    if (!id) {
      console.log('❌ ID do produto não fornecido')
      return NextResponse.json({
        error: 'ID do produto é obrigatório',
        success: false
      }, { status: 400 })
    }
    
    console.log('💾 Deletando produto do arquivo...')
    const result = await deleteProductFromFile(id)
    console.log('📊 Resultado da exclusão:', result)
    
    if (result.success) {
      console.log('✅ Produto deletado com sucesso')
      return NextResponse.json({
        message: result.message,
        success: true
      })
    } else {
      console.log('❌ Erro ao deletar produto:', result.message)
      return NextResponse.json({
        error: result.message,
        success: false
      }, { status: 404 })
    }
  } catch (error) {
    return handleApiError(error, 'deletar produto')
  }
} 