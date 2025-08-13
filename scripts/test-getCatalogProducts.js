const { getCatalogProducts } = require('../lib/data')

async function testGetCatalogProducts() {
  try {
    console.log('🧪 Testando getCatalogProducts...')
    
    const products = await getCatalogProducts()
    console.log(`📦 Produtos retornados: ${products.length}`)
    
    if (products.length > 0) {
      console.log('\n📋 Primeiros 5 produtos:')
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
      })
      
      // Verificar se são produtos do Varejo Fácil
      const firstProduct = products[0]
      if (firstProduct.varejoFacilData) {
        console.log('\n✅ Produtos são do Varejo Fácil (products.json)')
        console.log(`   - Código interno: ${firstProduct.varejoFacilData.codigoInterno}`)
        console.log(`   - Seção ID: ${firstProduct.varejoFacilData.secaoId}`)
      } else {
        console.log('\n⚠️ Produtos parecem ser do data.ts (produtos estáticos)')
        console.log('   - Verificando se tem propriedades do data.ts...')
        console.log(`   - Tem originalPrice: ${!!firstProduct.originalPrice}`)
        console.log(`   - Tem rating: ${!!firstProduct.rating}`)
        console.log(`   - Tem stock: ${!!firstProduct.stock}`)
      }
    } else {
      console.log('⚠️ Nenhum produto retornado')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar getCatalogProducts:', error)
  }
}

// Executar teste
testGetCatalogProducts()
