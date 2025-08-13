const fs = require('fs').promises
const path = require('path')

async function showProduct() {
  try {
    console.log('🔍 Mostrando produtos específicos...')
    
    const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    const products = JSON.parse(productsData)
    
    console.log(`📦 Total de produtos: ${products.length}`)
    
    // Encontrar um produto COM preço
    const productWithPrice = products.find(p => p.price > 0)
    
    // Encontrar um produto SEM preço
    const productWithoutPrice = products.find(p => p.price === 0)
    
    if (productWithPrice) {
      console.log('\n✅ PRODUTO COM PREÇO:')
      console.log('=' .repeat(50))
      console.log(JSON.stringify(productWithPrice, null, 2))
      console.log('=' .repeat(50))
    }
    
    if (productWithoutPrice) {
      console.log('\n❌ PRODUTO SEM PREÇO:')
      console.log('=' .repeat(50))
      console.log(JSON.stringify(productWithoutPrice, null, 2))
      console.log('=' .repeat(50))
    }
    
    // Mostrar também os dados do Varejo Fácil de um produto
    if (productWithPrice && productWithPrice.varejoFacilData) {
      console.log('\n📊 DADOS DO VAREJO FÁCIL (produto com preço):')
      console.log('=' .repeat(50))
      console.log(JSON.stringify(productWithPrice.varejoFacilData, null, 2))
      console.log('=' .repeat(50))
    }
    
  } catch (error) {
    console.error('❌ Erro ao mostrar produtos:', error)
  }
}

// Executar
showProduct()
