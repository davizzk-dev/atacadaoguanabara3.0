const fs = require('fs').promises
const path = require('path')

async function checkSpecificPrice() {
  try {
    console.log('🔍 Verificando preço específico para produto 5290...')
    
    const varejoFacilFilePath = path.join(process.cwd(), 'data', 'varejo-facil-sync.json')
    const varejoFacilData = await fs.readFile(varejoFacilFilePath, 'utf8')
    const data = JSON.parse(varejoFacilData)
    
    console.log(`📦 Total de produtos: ${data.rawProducts.length}`)
    console.log(`💰 Total de preços: ${data.prices.length}`)
    
    // Verificar se há um preço com produtoId = 5290
    const priceFor5290 = data.prices.find(p => p.produtoId === 5290)
    
    if (priceFor5290) {
      console.log(`\n✅ PREÇO ENCONTRADO PARA PRODUTO 5290:`)
      console.log(`   ProdutoId: ${priceFor5290.produtoId}`)
      console.log(`   Preço: R$ ${priceFor5290.precoVenda1}`)
      console.log(`   ID Externo: "${priceFor5290.idExterno}"`)
      console.log(`   Código Interno: "${priceFor5290.codigoInterno}"`)
    } else {
      console.log(`\n❌ NENHUM PREÇO ENCONTRADO PARA PRODUTO 5290`)
      
      // Verificar se há preços com produtoId próximo
      console.log(`\n🔍 VERIFICANDO PREÇOS PRÓXIMOS:`)
      for (let i = 5285; i <= 5295; i++) {
        const price = data.prices.find(p => p.produtoId === i)
        if (price) {
          console.log(`   ProdutoId ${i}: R$ ${price.precoVenda1}`)
        }
      }
    }
    
    // Mostrar alguns preços para entender a estrutura
    console.log(`\n📋 PRIMEIROS 10 PREÇOS:`)
    data.prices.slice(0, 10).forEach((price, index) => {
      console.log(`   ${index + 1}. ProdutoId: ${price.produtoId}, Preço: R$ ${price.precoVenda1}`)
    })
    
    // Verificar se há preços com valores específicos
    console.log(`\n🔍 VERIFICANDO PREÇOS COM VALOR 6.90:`)
    const pricesWith690 = data.prices.filter(p => p.precoVenda1 === 6.90)
    console.log(`   Encontrados: ${pricesWith690.length} preços com valor R$ 6.90`)
    
    if (pricesWith690.length > 0) {
      pricesWith690.slice(0, 5).forEach((price, index) => {
        console.log(`   ${index + 1}. ProdutoId: ${price.produtoId}, ID Externo: "${price.idExterno}"`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar preço específico:', error)
  }
}

// Executar
checkSpecificPrice()
