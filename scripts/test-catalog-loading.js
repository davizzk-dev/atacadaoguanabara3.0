const { getCatalogProducts, getDynamicCategories } = require('../lib/data')

async function testCatalogLoading() {
  try {
    console.log('🧪 Testando carregamento do catálogo...')
    
    // Testar carregamento de produtos
    console.log('\n📦 Carregando produtos...')
    const products = await getCatalogProducts()
    console.log(`✅ Produtos carregados: ${products.length}`)
    
    if (products.length > 0) {
      console.log('\n📋 Primeiros 5 produtos:')
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
      })
      
      // Verificar se são produtos do Varejo Fácil ou do data.ts
      const firstProduct = products[0]
      if (firstProduct.varejoFacilData) {
        console.log('\n✅ Produtos são do Varejo Fácil (products.json)')
        console.log(`   - Código interno: ${firstProduct.varejoFacilData.codigoInterno}`)
        console.log(`   - Seção ID: ${firstProduct.varejoFacilData.secaoId}`)
      } else {
        console.log('\n⚠️ Produtos parecem ser do data.ts (produtos estáticos)')
      }
    }
    
    // Testar carregamento de categorias
    console.log('\n📂 Carregando categorias...')
    const categories = await getDynamicCategories()
    console.log(`✅ Categorias carregadas: ${categories.length}`)
    console.log('📋 Categorias:', categories.slice(0, 10))
    
  } catch (error) {
    console.error('❌ Erro ao testar carregamento:', error)
  }
}

// Executar teste
testCatalogLoading()
