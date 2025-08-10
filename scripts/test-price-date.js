const axios = require('axios')

// Configuração do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

async function testPriceDate() {
  try {
    console.log('🔍 Testando limitação de data na API de preços...')
    
    const varejoFacilClient = axios.create({
      baseURL: VAREJO_FACIL_CONFIG.baseUrl,
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    // Testar diferentes parâmetros de data
    const testEndpoints = [
      '/api/v1/produto/precos',
      '/api/v1/produto/precos?dataInicio=2024-01-01',
      '/api/v1/produto/precos?dataInicio=2024-01-01&dataFim=2024-12-31',
      '/api/v1/produto/precos?dataInicio=2025-01-01',
      '/api/v1/produto/precos?dataInicio=2025-01-01&dataFim=2025-12-31',
      '/api/v1/produto/precos?dataAlteracao=2025-01-01',
      '/api/v1/produto/precos?dataAlteracao=2025-08-01',
      '/api/v1/produto/precos?ativo=true',
      '/api/v1/produto/precos?ativo=false'
    ]
    
    for (const endpoint of testEndpoints) {
      console.log(`\n🔍 Testando: ${endpoint}`)
      try {
        const response = await varejoFacilClient.get(endpoint)
        console.log(`   Status: ${response.status}`)
        console.log(`   Total de preços: ${response.data.items ? response.data.items.length : response.data.length}`)
        
        if (response.data.items && response.data.items.length > 0) {
          const firstPrice = response.data.items[0]
          console.log(`   Primeiro preço: ProdutoId ${firstPrice.produtoId}, R$ ${firstPrice.precoVenda1}`)
          
          // Verificar se tem campos de data
          if (firstPrice.dataAlteracao) {
            console.log(`   Data alteração: ${firstPrice.dataAlteracao}`)
          }
          if (firstPrice.dataInclusao) {
            console.log(`   Data inclusão: ${firstPrice.dataInclusao}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
      }
    }
    
    // Verificar se há preços mais recentes
    console.log('\n🔍 Verificando preços mais recentes...')
    try {
      const response = await varejoFacilClient.get('/api/v1/produto/precos?count=1000')
      if (response.data.items && response.data.items.length > 0) {
        const prices = response.data.items
        
        // Ordenar por data de alteração (se existir)
        const pricesWithDate = prices.filter(p => p.dataAlteracao)
        if (pricesWithDate.length > 0) {
          pricesWithDate.sort((a, b) => new Date(b.dataAlteracao) - new Date(a.dataAlteracao))
          console.log(`   Preço mais recente: ProdutoId ${pricesWithDate[0].produtoId}, R$ ${pricesWithDate[0].precoVenda1}, Data: ${pricesWithDate[0].dataAlteracao}`)
          console.log(`   Preço mais antigo: ProdutoId ${pricesWithDate[pricesWithDate.length-1].produtoId}, R$ ${pricesWithDate[pricesWithDate.length-1].precoVenda1}, Data: ${pricesWithDate[pricesWithDate.length-1].dataAlteracao}`)
        }
        
        // Verificar se há preços com produtoId alto
        const highIdPrices = prices.filter(p => p.produtoId > 5000)
        console.log(`   Preços com ID > 5000: ${highIdPrices.length}`)
        if (highIdPrices.length > 0) {
          highIdPrices.slice(0, 5).forEach((price, index) => {
            console.log(`     ${index + 1}. ProdutoId ${price.produtoId}, R$ ${price.precoVenda1}`)
          })
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status || error.message}`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
testPriceDate()
