const axios = require('axios')

// Configuração do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

async function testPriceQuery() {
  try {
    console.log('🔍 Testando busca de preços usando queries (parâmetro q)...')
    
    const varejoFacilClient = axios.create({
      baseURL: VAREJO_FACIL_CONFIG.baseUrl,
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    // Testar diferentes queries para encontrar o produto 5290
    const testQueries = [
      'produtoId==5290',
      'produtoId=5290',
      'produtoId:5290',
      'produtoId==5290;precoVenda1>0',
      'produtoId==5290;precoVenda1>0;ativo==true',
      'id==5290',
      'id=5290',
      'id:5290',
      'idExterno==undefined',
      'idExterno=undefined',
      'codigoInterno==        ',
      'codigoInterno=        ',
      'codigoInterno:        ',
      'produtoId==5290;idExterno==undefined',
      'produtoId==5290;codigoInterno==        ',
      'produtoId==5290;precoVenda1>0;ativo==true;origem==CADASTRO'
    ]
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testando query: "${query}"`)
      try {
        const response = await varejoFacilClient.get(`/api/v1/produto/precos?q=${encodeURIComponent(query)}`)
        console.log(`   Status: ${response.status}`)
        console.log(`   Total de preços: ${response.data.items ? response.data.items.length : response.data.length}`)
        
        if (response.data.items && response.data.items.length > 0) {
          const firstPrice = response.data.items[0]
          console.log(`   Primeiro preço: ProdutoId ${firstPrice.produtoId}, R$ ${firstPrice.precoVenda1}`)
          console.log(`   ID Externo: "${firstPrice.idExterno}"`)
          console.log(`   Código Interno: "${firstPrice.codigoInterno}"`)
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
      }
    }
    
    // Testar buscar todos os preços e filtrar localmente
    console.log('\n🔍 Buscando todos os preços e filtrando localmente...')
    try {
      const response = await varejoFacilClient.get('/api/v1/produto/precos?count=1000')
      if (response.data.items && response.data.items.length > 0) {
        const prices = response.data.items
        
        // Buscar preço do produto 5290
        const price5290 = prices.find(p => p.produtoId === 5290)
        if (price5290) {
          console.log(`   ✅ Preço encontrado para produto 5290: R$ ${price5290.precoVenda1}`)
        } else {
          console.log(`   ❌ Nenhum preço encontrado para produto 5290`)
        }
        
        // Buscar preços com idExterno "undefined"
        const pricesWithUndefined = prices.filter(p => p.idExterno === "undefined")
        console.log(`   Preços com idExterno "undefined": ${pricesWithUndefined.length}`)
        
        // Buscar preços com código interno "        "
        const pricesWithEmptyCode = prices.filter(p => p.codigoInterno === "        ")
        console.log(`   Preços com código interno vazio: ${pricesWithEmptyCode.length}`)
        
        // Mostrar alguns preços próximos ao 5290
        const nearbyPrices = prices.filter(p => p.produtoId >= 5285 && p.produtoId <= 5295)
        console.log(`   Preços próximos (5285-5295): ${nearbyPrices.length}`)
        nearbyPrices.forEach(price => {
          console.log(`     - ProdutoId ${price.produtoId}: R$ ${price.precoVenda1}`)
        })
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
testPriceQuery()
