import { NextRequest, NextResponse } from 'next/server'
import { varejoFacilClient } from '@/lib/varejo-facil-client'
import { promises as fs } from 'fs'
import path from 'path'

// Função para formatar produto do Varejo Fácil para o formato do catálogo
function formatProductForCatalog(varejoProduct: any, prices: any[] = [], sections: any[] = [], brands: any[] = [], genres: any[] = []) {
  // Encontrar preço do produto
  const productPrice = prices.find(p => p.produtoId === varejoProduct.id)
  const price = productPrice?.precoVenda1 || 0
  
  // Encontrar seção
  const section = sections.find(s => s.id === varejoProduct.secaoId)
  const category = section?.descricao || 'GERAL'
  
  // Encontrar marca
  const brand = brands.find(b => b.id === varejoProduct.marcaId)
  const brandName = brand?.descricao || 'Sem marca'
  
  // Encontrar gênero
  const genre = genres.find(g => g.id === varejoProduct.generoId)
  const genreName = genre?.descricao || ''
  
  // Gerar imagem placeholder se não existir
  const image = varejoProduct.imagem || `https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80`
  
  // Gerar tags baseadas na descrição
  const tags = [
    ...(category ? [category.toLowerCase()] : []),
    ...(brandName ? [brandName.toLowerCase()] : []),
    ...(genreName ? [genreName.toLowerCase()] : []),
    'varejo-facil'
  ].filter(Boolean)

  return {
    id: varejoProduct.id.toString(),
    name: varejoProduct.descricao || 'Produto sem nome',
    price: parseFloat(price) || 0,
    originalPrice: parseFloat(price) || 0,
    image: image,
    category: category,
    description: varejoProduct.descricaoReduzida || varejoProduct.descricao || 'Descrição não disponível',
    stock: varejoProduct.estoqueDoProduto?.[0]?.estoqueMaximo || 10,
    inStock: true,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 100) + 10,
    brand: brandName,
    unit: varejoProduct.unidadeDeVenda || 'un',
    tags: tags,
    // Dados adicionais do Varejo Fácil
    varejoFacilData: {
      codigoInterno: varejoProduct.codigoInterno,
      idExterno: varejoProduct.idExterno,
      secaoId: varejoProduct.secaoId,
      marcaId: varejoProduct.marcaId,
      generoId: varejoProduct.generoId,
      grupoId: varejoProduct.grupoId,
      subgrupoId: varejoProduct.subgrupoId,
      unidadeDeCompra: varejoProduct.unidadeDeCompra,
      unidadeDeTransferencia: varejoProduct.unidadeDeTransferencia,
      pesoBruto: varejoProduct.pesoBruto,
      pesoLiquido: varejoProduct.pesoLiquido,
      altura: varejoProduct.altura,
      largura: varejoProduct.largura,
      comprimento: varejoProduct.comprimento,
      ativoNoEcommerce: varejoProduct.ativoNoEcommerce,
      dataInclusao: varejoProduct.dataInclusao,
      dataAlteracao: varejoProduct.dataAlteracao
    }
  }
}

// POST - Sincronizar dados do Varejo Fácil e salvar no products.json
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização completa do Varejo Fácil...')
    
    // 1. Buscar seções
    console.log('📂 Buscando seções...')
    const sectionsData = await varejoFacilClient.getSections({ count: 100 })
    const sections = sectionsData.items || []
    console.log(`✅ ${sections.length} seções encontradas`)

    // 2. Buscar marcas
    console.log('🏷️ Buscando marcas...')
    const brandsData = await varejoFacilClient.getBrands({ count: 100 })
    const brands = brandsData.items || []
    console.log(`✅ ${brands.length} marcas encontradas`)

    // 3. Buscar gêneros
    console.log('📚 Buscando gêneros...')
    const genresData = await varejoFacilClient.getGenres({ count: 100 })
    const genres = genresData.items || []
    console.log(`✅ ${genres.length} gêneros encontrados`)

    // 4. Buscar todos os preços
    console.log('💰 Buscando preços...')
    const pricesData = await varejoFacilClient.getPrices({ count: 1000 })
    const prices = pricesData.items || []
    console.log(`✅ ${prices.length} preços encontrados`)

    // 5. Buscar produtos em lotes de 300
    console.log('📦 Buscando produtos em lotes de 300...')
    let allProducts: any[] = []
    let start = 0
    const batchSize = 300
    let hasMore = true

    while (hasMore) {
      console.log(`📦 Buscando lote ${Math.floor(start / batchSize) + 1} (${start} - ${start + batchSize - 1})...`)
      
      try {
        const productsData = await varejoFacilClient.getProducts({ 
          start: start, 
          count: batchSize 
        })
        
        if (productsData.items && productsData.items.length > 0) {
          allProducts = allProducts.concat(productsData.items)
          console.log(`✅ Lote ${Math.floor(start / batchSize) + 1}: ${productsData.items.length} produtos`)
          
          // Se recebemos menos produtos que o batchSize, chegamos ao fim
          if (productsData.items.length < batchSize) {
            hasMore = false
          } else {
            start += batchSize
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar lote ${Math.floor(start / batchSize) + 1}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total de produtos encontrados: ${allProducts.length}`)

    // 6. Formatar produtos para o catálogo
    console.log('🔄 Formatando produtos para o catálogo...')
    const formattedProducts = allProducts.map(product => 
      formatProductForCatalog(product, prices, sections, brands, genres)
    )

    // 7. Salvar no products.json
    console.log('💾 Salvando produtos formatados no products.json...')
    const dataDir = path.join(process.cwd(), 'data')
    
    // Criar diretório data se não existir
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      console.log('Diretório data já existe')
    }
    
    const productsFilePath = path.join(dataDir, 'products.json')
    await fs.writeFile(productsFilePath, JSON.stringify(formattedProducts, null, 2))
    
    // 8. Salvar dados completos do Varejo Fácil
    const varejoFacilData = {
      lastSync: new Date().toISOString(),
      totalProducts: formattedProducts.length,
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalPrices: prices.length,
      sections: sections,
      brands: brands,
      genres: genres,
      prices: prices,
      rawProducts: allProducts
    }
    
    const varejoFacilFilePath = path.join(dataDir, 'varejo-facil-sync.json')
    await fs.writeFile(varejoFacilFilePath, JSON.stringify(varejoFacilData, null, 2))
    
    console.log(`✅ Sincronização concluída!`)
    console.log(`📊 Resumo:`)
    console.log(`   - Produtos formatados: ${formattedProducts.length}`)
    console.log(`   - Seções: ${sections.length}`)
    console.log(`   - Marcas: ${brands.length}`)
    console.log(`   - Gêneros: ${genres.length}`)
    console.log(`   - Preços: ${prices.length}`)
    console.log(`   - Arquivo salvo: ${productsFilePath}`)
    console.log(`   - Dados completos: ${varejoFacilFilePath}`)

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: formattedProducts.length,
        totalSections: sections.length,
        totalBrands: brands.length,
        totalGenres: genres.length,
        totalPrices: prices.length,
        lastSync: varejoFacilData.lastSync,
        products: formattedProducts.slice(0, 10), // Primeiros 10 produtos para preview
        sections: sections.slice(0, 10),
        brands: brands.slice(0, 10)
      },
      message: `Sincronização concluída! ${formattedProducts.length} produtos sincronizados.`
    })

  } catch (error: any) {
    console.error('❌ Erro durante a sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error.stack
    }, { status: 500 })
  }
}

// GET - Obter status da última sincronização
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const productsFilePath = path.join(dataDir, 'products.json')
    const varejoFacilFilePath = path.join(dataDir, 'varejo-facil-sync.json')
    
    let productsData = { length: 0 }
    let varejoFacilData = { 
      lastSync: null, 
      totalProducts: 0,
      totalSections: 0,
      totalBrands: 0,
      totalGenres: 0,
      totalPrices: 0
    }
    
    try {
      const productsContent = await fs.readFile(productsFilePath, 'utf-8')
      productsData = JSON.parse(productsContent)
    } catch (error) {
      console.log('Arquivo products.json não encontrado')
    }
    
    try {
      const varejoFacilContent = await fs.readFile(varejoFacilFilePath, 'utf-8')
      varejoFacilData = JSON.parse(varejoFacilContent)
    } catch (error) {
      console.log('Arquivo varejo-facil-sync.json não encontrado')
    }
    
    return NextResponse.json({
      success: true,
      data: {
        lastSync: varejoFacilData.lastSync,
        totalProducts: productsData.length || varejoFacilData.totalProducts || 0,
        totalSections: varejoFacilData.totalSections || 0,
        totalBrands: varejoFacilData.totalBrands || 0,
        totalGenres: varejoFacilData.totalGenres || 0,
        totalPrices: varejoFacilData.totalPrices || 0,
        hasProducts: productsData.length > 0,
        hasVarejoFacilData: !!varejoFacilData.lastSync
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao obter status da sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
} 