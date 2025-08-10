const fetch = require('node-fetch')

async function testAPI() {
  try {
    console.log('🧪 Testando API /api/products...')
    
    // Testar a API local
    const response = await fetch('http://localhost:3000/api/products')
    
    if (response.ok) {
      const products = await response.json()
      console.log(`✅ API retornou ${products.length} produtos`)
      
      if (products.length > 0) {
        console.log('\n📋 Primeiros 5 produtos da API:')
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
        }
      }
    } else {
      console.error(`❌ Erro na API: ${response.status}`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
  }
}

// Executar teste
testAPI() 