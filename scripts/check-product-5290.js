const fs = require('fs').promises
const path = require('path')

async function checkProduct5290() {
  try {
    console.log('🔍 Verificando especificamente o produto 5290...')
    
    // Ler dados do Varejo Fácil
    const varejoFacilFilePath = path.join(process.cwd(), 'data', 'varejo-facil-sync.json')
    const varejoFacilData = await fs.readFile(varejoFacilFilePath, 'utf8')
    const data = JSON.parse(varejoFacilData)
    
    // Encontrar o produto 5290
    const product = data.rawProducts.find(p => p.id === 5290)
    if (!product) {
      console.log('❌ Produto 5290 não encontrado na lista de produtos')
      return
    }
    
    console.log('\n📦 PRODUTO 5290:')
    console.log('=' .repeat(50))
    console.log(`ID: ${product.id}`)
    console.log(`Nome: ${product.descricao}`)
    console.log(`Código Interno: "${product.codigoInterno}"`)
    console.log(`ID Externo: "${product.idExterno}"`)
    console.log(`Seção ID: ${product.secaoId}`)
    console.log('=' .repeat(50))
    
    // Buscar preço do produto 5290
    const price = data.prices.find(p => p.produtoId === 5290)
    if (price) {
      console.log('\n💰 PREÇO ENCONTRADO:')
      console.log('=' .repeat(50))
      console.log(`ProdutoId: ${price.produtoId}`)
      console.log(`Preço: R$ ${price.precoVenda1}`)
      console.log(`ID Externo: "${price.idExterno}"`)
      console.log(`Código Interno: "${price.codigoInterno}"`)
      console.log('=' .repeat(50))
    } else {
      console.log('\n❌ PREÇO NÃO ENCONTRADO')
      console.log('=' .repeat(50))
      console.log('O produto 5290 não tem preço na lista de preços')
      console.log('=' .repeat(50))
    }
    
    // Verificar se há preços próximos
    console.log('\n🔍 VERIFICANDO PREÇOS PRÓXIMOS:')
    const nearbyPrices = data.prices.filter(p => p.produtoId >= 5285 && p.produtoId <= 5295)
    console.log(`Preços encontrados entre 5285-5295: ${nearbyPrices.length}`)
    nearbyPrices.forEach(price => {
      console.log(`   - ProdutoId ${price.produtoId}: R$ ${price.precoVenda1}`)
    })
    
    // Verificar se há preços com idExterno "undefined"
    const pricesWithUndefined = data.prices.filter(p => p.idExterno === "undefined")
    console.log(`\nPreços com idExterno "undefined": ${pricesWithUndefined.length}`)
    
    // Verificar se há preços com código interno vazio
    const pricesWithEmptyCode = data.prices.filter(p => p.codigoInterno === "        ")
    console.log(`Preços com código interno vazio: ${pricesWithEmptyCode.length}`)
    
  } catch (error) {
    console.error('❌ Erro ao verificar produto 5290:', error)
  }
}

// Executar
checkProduct5290()
