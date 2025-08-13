const fs = require('fs').promises
const path = require('path')

async function checkRawData() {
  try {
    console.log('🔍 Verificando dados brutos do Varejo Fácil...')
    
    const varejoFacilFilePath = path.join(process.cwd(), 'data', 'varejo-facil-sync.json')
    const varejoFacilData = await fs.readFile(varejoFacilFilePath, 'utf8')
    const data = JSON.parse(varejoFacilData)
    
    console.log(`📦 Total de produtos brutos: ${data.rawProducts.length}`)
    console.log(`💰 Total de preços: ${data.prices.length}`)
    
    // Mostrar alguns preços
    console.log('\n📋 Primeiros 5 preços:')
    data.prices.slice(0, 5).forEach((price, index) => {
      console.log(`   ${index + 1}. Produto ID: ${price.produtoId}, Preço: R$ ${price.precoVenda1}`)
    })
    
    // Mostrar alguns produtos brutos
    console.log('\n📋 Primeiros 3 produtos brutos:')
    data.rawProducts.slice(0, 3).forEach((product, index) => {
      console.log(`   ${index + 1}. ID: ${product.id}, Nome: ${product.descricao}`)
      console.log(`      - Código Interno: "${product.codigoInterno}"`)
      console.log(`      - ID Externo: "${product.idExterno}"`)
      console.log(`      - Seção ID: ${product.secaoId}`)
    })
    
    // Verificar se há produtos com preços
    const productsWithPrices = data.rawProducts.filter(product => {
      return data.prices.some(price => 
        price.produtoId === product.id || 
        price.idExterno === product.idExterno ||
        price.codigoInterno === product.codigoInterno
      )
    })
    
    console.log(`\n✅ Produtos brutos que têm preço: ${productsWithPrices.length}`)
    console.log(`❌ Produtos brutos sem preço: ${data.rawProducts.length - productsWithPrices.length}`)
    
    // Mostrar exemplo de produto que tem preço
    if (productsWithPrices.length > 0) {
      const productWithPrice = productsWithPrices[0]
      const price = data.prices.find(p => 
        p.produtoId === productWithPrice.id || 
        p.idExterno === productWithPrice.idExterno ||
        p.codigoInterno === productWithPrice.codigoInterno
      )
      
      console.log('\n📊 EXEMPLO - Produto que tem preço:')
      console.log('=' .repeat(50))
      console.log(`ID: ${productWithPrice.id}`)
      console.log(`Nome: ${productWithPrice.descricao}`)
      console.log(`Código Interno: "${productWithPrice.codigoInterno}"`)
      console.log(`ID Externo: "${productWithPrice.idExterno}"`)
      console.log(`Preço encontrado: R$ ${price.precoVenda1}`)
      console.log('=' .repeat(50))
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados brutos:', error)
  }
}

// Executar
checkRawData()
