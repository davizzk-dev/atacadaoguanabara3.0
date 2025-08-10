const fs = require('fs').promises
const path = require('path')

async function debugPrice() {
  try {
    console.log('🔍 Debugando preço do produto ID 5290...')
    
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
    
    // Procurar preço por produtoId
    const priceByProductId = data.prices.find(p => p.produtoId === product.id)
    console.log(`\n🔍 Busca por produtoId (${product.id}):`)
    console.log(`   Resultado: ${priceByProductId ? `R$ ${priceByProductId.precoVenda1}` : 'NÃO ENCONTRADO'}`)
    
    // Procurar preço por idExterno
    const priceByExternalId = data.prices.find(p => p.idExterno === product.idExterno)
    console.log(`\n🔍 Busca por idExterno ("${product.idExterno}"):`)
    console.log(`   Resultado: ${priceByExternalId ? `R$ ${priceByExternalId.precoVenda1}` : 'NÃO ENCONTRADO'}`)
    
    // Procurar preço por código interno
    const priceByCode = data.prices.find(p => p.codigoInterno === product.codigoInterno)
    console.log(`\n🔍 Busca por código interno ("${product.codigoInterno}"):`)
    console.log(`   Resultado: ${priceByCode ? `R$ ${priceByCode.precoVenda1}` : 'NÃO ENCONTRADO'}`)
    
    // Mostrar todos os preços que têm produtoId = 5290
    const allPricesForProduct = data.prices.filter(p => p.produtoId === 5290)
    console.log(`\n📋 Todos os preços para produtoId 5290:`)
    allPricesForProduct.forEach((price, index) => {
      console.log(`   ${index + 1}. Preço: R$ ${price.precoVenda1}, ID Externo: "${price.idExterno}", Código: "${price.codigoInterno}"`)
    })
    
    // Mostrar alguns preços para entender a estrutura
    console.log(`\n📋 Primeiros 3 preços da API:`)
    data.prices.slice(0, 3).forEach((price, index) => {
      console.log(`   ${index + 1}. ProdutoId: ${price.produtoId}, Preço: R$ ${price.precoVenda1}`)
      console.log(`      - ID Externo: "${price.idExterno}"`)
      console.log(`      - Código Interno: "${price.codigoInterno}"`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao debugar preço:', error)
  }
}

// Executar
debugPrice()
