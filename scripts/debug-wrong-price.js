const fs = require('fs').promises
const path = require('path')

async function debugWrongPrice() {
  try {
    console.log('🔍 Debugando preço errado do produto ID 5290...')
    
    const varejoFacilFilePath = path.join(process.cwd(), 'data', 'varejo-facil-sync.json')
    const varejoFacilData = await fs.readFile(varejoFacilFilePath, 'utf8')
    const data = JSON.parse(varejoFacilData)
    
    // Encontrar o produto ID 5290
    const product = data.rawProducts.find(p => p.id === 5290)
    if (!product) {
      console.log('❌ Produto ID 5290 não encontrado')
      return
    }
    
    console.log('\n📦 PRODUTO ID 5290:')
    console.log('=' .repeat(50))
    console.log(`ID: ${product.id}`)
    console.log(`Nome: ${product.descricao}`)
    console.log(`Código Interno: "${product.codigoInterno}"`)
    console.log(`ID Externo: "${product.idExterno}"`)
    console.log(`Seção ID: ${product.secaoId}`)
    console.log('=' .repeat(50))
    
    // Mostrar TODOS os preços que correspondem ao idExterno "undefined"
    const allPricesWithUndefined = data.prices.filter(p => p.idExterno === "undefined")
    console.log(`\n📋 TODOS os preços com idExterno "undefined" (${allPricesWithUndefined.length}):`)
    allPricesWithUndefined.slice(0, 10).forEach((price, index) => {
      console.log(`   ${index + 1}. ProdutoId: ${price.produtoId}, Preço: R$ ${price.precoVenda1}`)
    })
    
    // Mostrar o preço específico que está sendo usado
    const priceUsed = data.prices.find(p => p.idExterno === product.idExterno)
    console.log(`\n💰 PREÇO QUE ESTÁ SENDO USADO:`)
    console.log(`   ProdutoId: ${priceUsed.produtoId}, Preço: R$ ${priceUsed.precoVenda1}`)
    
    // Verificar se há outros preços para o mesmo produto
    console.log(`\n🔍 VERIFICANDO OUTROS PREÇOS PARA O PRODUTO:`)
    
    // Buscar por produtoId
    const priceByProductId = data.prices.find(p => p.produtoId === 5290)
    if (priceByProductId) {
      console.log(`   ✅ Encontrado por produtoId: R$ ${priceByProductId.precoVenda1}`)
    } else {
      console.log(`   ❌ Nenhum preço encontrado por produtoId 5290`)
    }
    
    // Buscar por código interno
    const priceByCode = data.prices.find(p => p.codigoInterno === product.codigoInterno)
    if (priceByCode) {
      console.log(`   ✅ Encontrado por código interno: R$ ${priceByCode.precoVenda1}`)
    } else {
      console.log(`   ❌ Nenhum preço encontrado por código interno`)
    }
    
    // Mostrar todos os preços que têm produtoId próximo (para ver se há um padrão)
    console.log(`\n📋 PREÇOS COM PRODUTOID PRÓXIMO (5280-5300):`)
    const nearbyPrices = data.prices.filter(p => p.produtoId >= 5280 && p.produtoId <= 5300)
    nearbyPrices.forEach((price, index) => {
      console.log(`   ${index + 1}. ProdutoId: ${price.produtoId}, Preço: R$ ${price.precoVenda1}, ID Externo: "${price.idExterno}"`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao debugar preço errado:', error)
  }
}

// Executar
debugWrongPrice()
