import { NextRequest, NextResponse } from 'next/server'
import { products } from '@/lib/data'
import { getAllProductsFromFile } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    // Carregar produtos do arquivo JSON (produtos dinâmicos)
    let allProducts = []
    try {
      allProducts = await getAllProductsFromFile()
      console.log('📦 Produtos carregados do arquivo JSON:', allProducts.length)
    } catch (error) {
      console.error('❌ Erro ao carregar produtos do JSON, usando produtos estáticos:', error)
      allProducts = products
    }
    
    if (!search) {
      return NextResponse.json(allProducts) // Retorna todos os produtos se não houver busca
    }
    
    const searchLower = search.toLowerCase()
    const searchWords = searchLower.split(' ').filter(word => word.length > 0)
    
    const filteredProducts = allProducts.filter((product: any) => {
      const productText = [
        product.name.toLowerCase(),
        (product.brand?.toLowerCase() || ''),
        product.category.toLowerCase(),
        (product.description?.toLowerCase() || ''),
        (product.tags?.join(' ').toLowerCase() || '')
      ].join(' ')
      
      // Busca exata
      if (productText.includes(searchLower)) {
        return true
      }
      
      // Busca por palavras individuais
      return searchWords.some(word => productText.includes(word))
    })
    
    // Ordenar por relevância
    const scoredProducts = filteredProducts.map((product: any) => {
      let score = 0
      const productText = [
        product.name.toLowerCase(),
        (product.brand?.toLowerCase() || ''),
        product.category.toLowerCase(),
        (product.description?.toLowerCase() || ''),
        (product.tags?.join(' ').toLowerCase() || '')
      ].join(' ')
      
      // Pontuação por posição da busca no nome
      if (product.name.toLowerCase().startsWith(searchLower)) {
        score += 100
      } else if (product.name.toLowerCase().includes(searchLower)) {
        score += 50
      }
      
      // Pontuação por marca
      if (product.brand?.toLowerCase().includes(searchLower)) {
        score += 30
      }
      
      // Pontuação por categoria
      if (product.category.toLowerCase().includes(searchLower)) {
        score += 20
      }
      
      // Pontuação por palavras individuais
      searchWords.forEach(word => {
        if (productText.includes(word)) {
          score += 10
        }
      })
      
      return { ...product, _score: score }
    })
    
    // Ordenar por pontuação (maior primeiro)
    scoredProducts.sort((a: any, b: any) => b._score - a._score)
    
    // Remover a pontuação antes de retornar
    const result = scoredProducts.map(({ _score, ...product }: any) => product)
    
    console.log(`Busca por "${search}" retornou ${result.length} produtos`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro na busca de produtos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 