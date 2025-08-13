const fs = require('fs')

async function testAdminSearch() {
  console.log('🧪 TESTE: Busca no Admin de Produtos')
  console.log('=' * 50)
  
  try {
    // Ler produtos do arquivo
    const productsPath = './data/products.json'
    if (!fs.existsSync(productsPath)) {
      console.log('❌ Arquivo products.json não encontrado')
      return
    }
    
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'))
    console.log(`📦 ${products.length} produtos carregados`)
    
    // Simular a função de filtro melhorada do admin
    function searchProducts(searchTerm, selectedCategory = 'all') {
      return products.filter(product => {
        if (!searchTerm || searchTerm === '') return selectedCategory === 'all' || product.category === selectedCategory
        
        const searchLower = searchTerm.toLowerCase().trim()
        const searchWords = searchLower.split(' ').filter(word => word.length > 0)
        
        // Criar texto completo do produto para busca
        const productText = [
          product.name?.toLowerCase() || '',
          product.brand?.toLowerCase() || '',
          product.category?.toLowerCase() || '',
          product.description?.toLowerCase() || '',
          product.id?.toString() || '',
          product.tags?.join(' ')?.toLowerCase() || ''
        ].join(' ')
        
        // Verificar se contém o termo completo
        const containsFullTerm = productText.includes(searchLower)
        
        // Verificar se contém todas as palavras da busca
        const containsAllWords = searchWords.every(word => productText.includes(word))
        
        // Match se contém o termo completo OU todas as palavras
        const matchesSearch = containsFullTerm || containsAllWords
        
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
        
        return matchesSearch && matchesCategory
      })
    }
    
    // Testes de busca
    const testCases = [
      'arroz',
      'ARROZ',
      'coca',
      'cola',
      'coca cola',
      'refrigerante',
      'açúcar',
      'cafe',
      'tradicional',
      '1276',
      'união',
      'mercearia',
      'produto inexistente xyz123'
    ]
    
    console.log('\n🔍 RESULTADOS DOS TESTES:')
    console.log('-' * 50)
    
    testCases.forEach(searchTerm => {
      const results = searchProducts(searchTerm)
      console.log(`\n📝 Busca: "${searchTerm}"`)
      console.log(`   Resultados: ${results.length}`)
      
      if (results.length > 0) {
        // Mostrar primeiros 3 resultados
        results.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - ${product.category}`)
        })
        
        if (results.length > 3) {
          console.log(`   ... e mais ${results.length - 3} produtos`)
        }
      } else {
        console.log('   ❌ Nenhum produto encontrado')
      }
    })
    
    // Teste específico para "arroz"
    console.log('\n🍚 TESTE ESPECÍFICO - "arroz":')
    const arrozResults = searchProducts('arroz')
    
    if (arrozResults.length > 0) {
      console.log(`✅ Encontrou ${arrozResults.length} produtos com "arroz"`)
      arrozResults.forEach(product => {
        console.log(`   - ${product.name} (${product.brand || 'Sem marca'})`)
      })
    } else {
      console.log('❌ Nenhum arroz encontrado - PROBLEMA!')
      
      // Debug: procurar produtos que contenham arroz no nome
      const manualArrozSearch = products.filter(p => 
        p.name?.toLowerCase().includes('arroz')
      )
      
      console.log('\n🔍 Debug - busca manual por "arroz":')
      console.log(`Encontrados ${manualArrozSearch.length} produtos manualmente:`)
      manualArrozSearch.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id})`)
      })
    }
    
    console.log('\n📊 RESUMO DO TESTE:')
    console.log(`✅ Sistema de busca do admin testado`)
    console.log(`📦 ${products.length} produtos disponíveis`)
    console.log(`🔍 ${testCases.length} termos testados`)
    
    const successfulSearches = testCases.filter(term => searchProducts(term).length > 0)
    console.log(`✅ ${successfulSearches.length}/${testCases.length} buscas retornaram resultados`)
    
    if (searchProducts('arroz').length > 0) {
      console.log('🎉 SUCESSO: Busca por "arroz" funcionando!')
    } else {
      console.log('⚠️ PROBLEMA: Busca por "arroz" não está funcionando!')
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error)
  }
}

// Executar teste
if (require.main === module) {
  testAdminSearch().catch(console.error)
}

module.exports = { testAdminSearch }
