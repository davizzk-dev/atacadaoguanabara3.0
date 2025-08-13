const axios = require('axios')

// Configuração do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

async function testPriceAPI() {
  try {
    console.log('🔍 Testando API de preços do Varejo Fácil...')
    
    const varejoFacilClient = axios.create({
      baseURL: VAREJO_FACIL_CONFIG.baseUrl,
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    // Testar diferentes endpoints de preços
    const testEndpoints = [
      '/api/v1/produto/precos',
      '/api/v1/produto/precos?count=10000',
      '/api/v1/produto/precos?start=0&count=10000',
      '/api/v1/produto/precos?produtoId=5290',
      '/api/v1/produto/precos?codigoInterno=        ',
      '/api/v1/produto/precos?idExterno=undefined'
    ]
    
    for (const endpoint of testEndpoints) {
      console.log(`\n🔍 Testando: ${endpoint}`)
      try {
        const response = await varejoFacilClient.get(endpoint)
        console.log(`   Status: ${response.status}`)
        console.log(`   Total de preços: ${response.data.items ? response.data.items.length : response.data.length}`)
        
        if (response.data.items && response.data.items.length > 0) {
          console.log(`   Primeiro preço: ProdutoId ${response.data.items[0].produtoId}, R$ ${response.data.items[0].precoVenda1}`)
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
      }
    }
    
    // Testar buscar preços por produto específico
    console.log('\n🔍 Testando busca por produto específico...')
    try {
      const productResponse = await varejoFacilClient.get('/api/v1/produto/produtos?produtoId=5290')
      if (productResponse.data.items && productResponse.data.items.length > 0) {
        const product = productResponse.data.items[0]
        console.log(`   Produto encontrado: ${product.descricao}`)
        console.log(`   ID: ${product.id}, Código Interno: "${product.codigoInterno}", ID Externo: "${product.idExterno}"`)
      }
    } catch (error) {
      console.log(`   ❌ Erro ao buscar produto: ${error.response?.status || error.message}`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
testPriceAPI()
