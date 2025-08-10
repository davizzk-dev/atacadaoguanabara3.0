const fs = require('fs').promises
const path = require('path')

async function checkPrices() {
  try {
    console.log('🔍 Analisando produtos com e sem preço...')
    
    const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    const products = JSON.parse(productsData)
    
    console.log(`📦 Total de produtos: ${products.length}`)
    
    // Separar produtos com e sem preço
    const productsWithPrice = products.filter(p => p.price > 0)
    const productsWithoutPrice = products.filter(p => p.price === 0)
    
    console.log(`✅ Produtos com preço: ${productsWithPrice.length}`)
    console.log(`❌ Produtos sem preço: ${productsWithoutPrice.length}`)
    
    // Mostrar alguns produtos com preço
    if (productsWithPrice.length > 0) {
      console.log('\n📋 Primeiros 5 produtos COM preço:')
      productsWithPrice.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
      })
    }
    
    // Mostrar alguns produtos sem preço
    if (productsWithoutPrice.length > 0) {
      console.log('\n📋 Primeiros 5 produtos SEM preço:')
      productsWithoutPrice.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
      })
    }
    
    // Análise por categoria
    console.log('\n📊 Análise por categoria:')
    const categoryAnalysis = {}
    
    products.forEach(product => {
      const category = product.category || 'Sem categoria'
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = { total: 0, withPrice: 0, withoutPrice: 0 }
      }
      
      categoryAnalysis[category].total++
      if (product.price > 0) {
        categoryAnalysis[category].withPrice++
      } else {
        categoryAnalysis[category].withoutPrice++
      }
    })
    
    Object.entries(categoryAnalysis).forEach(([category, stats]) => {
      const percentage = ((stats.withPrice / stats.total) * 100).toFixed(1)
      console.log(`   ${category}: ${stats.withPrice}/${stats.total} (${percentage}% com preço)`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao analisar produtos:', error)
  }
}

// Executar análise
checkPrices()
