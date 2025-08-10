const axios = require('axios')

// Configuração do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

async function testPriceById() {
  try {
    console.log('🔍 Testando busca de preço por ID específico...')
    
    const varejoFacilClient = axios.create({
      baseURL: VAREJO_FACIL_CONFIG.baseUrl,
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    // Testar buscar preço do produto 5290
    console.log('\n🔍 Testando preço do produto 5290...')
    try {
      const response = await varejoFacilClient.get('/api/v1/produto/precos/5290')
      console.log(`   Status: ${response.status}`)
      console.log(`   Preço encontrado: R$ ${response.data.precoVenda1}`)
      console.log(`   ProdutoId: ${response.data.produtoId}`)
      console.log(`   ID Externo: "${response.data.idExterno}"`)
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
    }
    
    // Testar alguns produtos que sabemos que têm preço
    const testIds = [1, 2, 3, 68, 212, 428]
    
    for (const id of testIds) {
      console.log(`\n🔍 Testando preço do produto ${id}...`)
      try {
        const response = await varejoFacilClient.get(`/api/v1/produto/precos/${id}`)
        console.log(`   Status: ${response.status}`)
        console.log(`   Preço: R$ ${response.data.precoVenda1}`)
        console.log(`   ProdutoId: ${response.data.produtoId}`)
      } catch (error) {
        console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
      }
    }
    
    // Testar buscar todos os preços com paginação
    console.log('\n🔍 Testando busca de todos os preços com paginação...')
    let allPrices = []
    let start = 0
    const count = 100
    
    while (true) {
      try {
        const response = await varejoFacilClient.get(`/api/v1/produto/precos?start=${start}&count=${count}`)
        console.log(`   Lote ${start/count + 1}: ${response.data.items.length} preços`)
        
        if (response.data.items.length === 0) {
          break
        }
        
        allPrices = allPrices.concat(response.data.items)
        start += count
        
        // Verificar se há produtos com ID alto
        const highIdPrices = response.data.items.filter(p => p.produtoId > 5000)
        if (highIdPrices.length > 0) {
          console.log(`   ✅ Encontrados preços com ID > 5000: ${highIdPrices.length}`)
          highIdPrices.forEach(price => {
            console.log(`      - ProdutoId ${price.produtoId}: R$ ${price.precoVenda1}`)
          })
        }
        
        // Parar se não há mais preços
        if (response.data.items.length < count) {
          break
        }
        
      } catch (error) {
        console.log(`   ❌ Erro no lote ${start/count + 1}: ${error.response?.status || error.message}`)
        break
      }
    }
    
    console.log(`\n📊 Total de preços encontrados: ${allPrices.length}`)
    
    // Verificar se há preços para produtos com ID alto
    const highIdPrices = allPrices.filter(p => p.produtoId > 5000)
    console.log(`📊 Preços com ID > 5000: ${highIdPrices.length}`)
    
    if (highIdPrices.length > 0) {
      console.log('📋 Produtos com ID alto que têm preço:')
      highIdPrices.slice(0, 10).forEach((price, index) => {
        console.log(`   ${index + 1}. ProdutoId ${price.produtoId}: R$ ${price.precoVenda1}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
testPriceById()
