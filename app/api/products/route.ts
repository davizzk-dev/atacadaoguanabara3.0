import { NextRequest, NextResponse } from 'next/server'
import { getCatalogProducts } from '@/lib/data'

// Função para calcular similaridade entre strings (fuzzy matching)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  // Verifica se uma string contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8
  }
  
  // Verifica palavras individuais
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  
  let matches = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    
    // Obter produtos do arquivo JSON (sincronizados do Varejo Fácil)
    console.log('🔍 API: Iniciando carregamento de produtos...')
    const products = await getCatalogProducts()
    console.log(`📦 API: Produtos carregados: ${products.length}`)
    
    // Verificar se são produtos do Varejo Fácil
    if (products.length > 0) {
      const firstProduct = products[0]
      if (firstProduct.varejoFacilData) {
        console.log('✅ API: Produtos são do Varejo Fácil (products.json)')
      } else {
        console.log('⚠️ API: Produtos parecem ser do data.ts (produtos estáticos)')
      }
    }
    
    let filteredProducts = [...products]
    
    // Filtro por categoria
    if (category && category !== 'Todos') {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      )
    }
    
    // Busca simplificada e eficiente
    if (search) {
      const searchLower = search.toLowerCase().trim()
      
      console.log(`🔍 Buscando por: "${search}"`)
      
      const searchResults = filteredProducts
        .filter(product => {
          const name = (product.name || '').toLowerCase()
          const description = (product.description || '').toLowerCase()
          const category = (product.category || '').toLowerCase()
          const id = product.id.toString()
          
          // Busca simples: nome, descrição, categoria ou ID
          return name.includes(searchLower) || 
                 description.includes(searchLower) || 
                 category.includes(searchLower) || 
                 id.includes(search)
        })
        .map(product => ({
          product,
          score: 1, // Pontuação simples
          exactMatch: true
        }))
        .filter(result => result.score > 0) // Apenas resultados com pontuação
        .sort((a, b) => {
          // Ordena por pontuação (maior primeiro)
          if (b.score !== a.score) return b.score - a.score
          
          // Em caso de empate, produtos em estoque primeiro
          if (a.product.inStock !== b.product.inStock) {
            return b.product.inStock ? 1 : -1
          }
          
          // Por último, ordena por nome
          return a.product.name.localeCompare(b.product.name)
        })
        .map(result => result.product)
      
      console.log(`📊 Resultados da busca: ${searchResults.length} produtos encontrados`)
      
      // Log dos primeiros 3 resultados para debug
      if (searchResults.length > 0) {
        console.log('🔍 Primeiros resultados:')
        searchResults.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`)
        })
      }
      
      filteredProducts = searchResults
    }
    
    // Ordenar produtos: Em estoque primeiro, depois por preço, depois por nome
    filteredProducts.sort((a, b) => {
      // Prioridade 1: Produtos em estoque vêm primeiro
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      
      // Prioridade 2: Produtos com preço vêm antes dos sem preço
      if (a.price > 0 && b.price === 0) return -1
      if (a.price === 0 && b.price > 0) return 1
      
      // Prioridade 3: Ordenar por nome
      return a.name.localeCompare(b.name, 'pt-BR')
    })
    
    // Aplicar limite se especificado
    if (limit) {
      filteredProducts = filteredProducts.slice(0, parseInt(limit))
    }
    
    console.log(`📦 API retornando ${filteredProducts.length} produtos (total: ${products.length})`)
    console.log(`   - Em estoque: ${filteredProducts.filter(p => p.inStock).length}`)
    console.log(`   - Fora de estoque: ${filteredProducts.filter(p => !p.inStock).length}`)
    
    return NextResponse.json(filteredProducts)
  } catch (error) {
    console.error('Erro na busca de produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 