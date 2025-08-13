const axios = require('axios')
const fs = require('fs').promises
const path = require('path')

// Configuração do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

// Função para fazer requisições para o Varejo Fácil
async function makeVarejoFacilRequest(endpoint, options = {}) {
  try {
    const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
    console.log(`🔍 Fazendo requisição para: ${url}`)
    
    const response = await axios({
      method: options.method || 'GET',
      url: url,
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: options.data,
      params: options.params
    })
    
    console.log(`📊 Status: ${response.status}`)
    
    if (response.data) {
      console.log('✅ Resposta JSON válida!')
      return response.data
    } else {
      throw new Error('Resposta vazia')
    }
  } catch (error) {
    console.error(`❌ Erro na requisição: ${error.message}`)
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Data: ${JSON.stringify(error.response.data)}`)
    }
    throw error
  }
}

// Função para buscar preços usando queries específicas
async function getPricesWithQueries() {
  try {
    console.log('💰 Buscando preços usando queries específicas...')
    
    const allPrices = []
    
    // Buscar preços por ranges de produtoId
    const ranges = [
      { start: 1, end: 1000 },
      { start: 1001, end: 2000 },
      { start: 2001, end: 3000 },
      { start: 3001, end: 4000 },
      { start: 4001, end: 5000 },
      { start: 5001, end: 6000 },
      { start: 6001, end: 7000 }
    ]
    
    for (const range of ranges) {
      console.log(`\n🔍 Buscando preços entre ${range.start} e ${range.end}...`)
      
      try {
        const query = `produtoId>=${range.start};produtoId<=${range.end}`
        const response = await makeVarejoFacilRequest('/api/v1/produto/precos', {
          params: { q: query, count: 1000 }
        })
        
        if (response.items && response.items.length > 0) {
          console.log(`   ✅ Encontrados ${response.items.length} preços`)
          allPrices.push(...response.items)
        } else {
          console.log(`   ⚠️ Nenhum preço encontrado neste range`)
        }
      } catch (error) {
        console.log(`   ❌ Erro no range ${range.start}-${range.end}: ${error.message}`)
      }
    }
    
    // Buscar especificamente o produto 5290
    console.log('\n🔍 Buscando especificamente o produto 5290...')
    try {
      const response = await makeVarejoFacilRequest('/api/v1/produto/precos', {
        params: { q: 'produtoId==5290' }
      })
      
      if (response.items && response.items.length > 0) {
        console.log(`   ✅ Produto 5290 encontrado: R$ ${response.items[0].precoVenda1}`)
        // Adicionar se não estiver na lista
        const existingIndex = allPrices.findIndex(p => p.produtoId === 5290)
        if (existingIndex === -1) {
          allPrices.push(response.items[0])
          console.log('   ✅ Produto 5290 adicionado à lista')
        }
      } else {
        console.log('   ❌ Produto 5290 não encontrado')
      }
    } catch (error) {
      console.log(`   ❌ Erro ao buscar produto 5290: ${error.message}`)
    }
    
    console.log(`\n📊 Total de preços encontrados: ${allPrices.length}`)
    
    // Verificar se o produto 5290 está na lista
    const price5290 = allPrices.find(p => p.produtoId === 5290)
    if (price5290) {
      console.log(`✅ Produto 5290 na lista: R$ ${price5290.precoVenda1}`)
    } else {
      console.log('❌ Produto 5290 não está na lista')
    }
    
    return allPrices
    
  } catch (error) {
    console.error('❌ Erro ao buscar preços com queries:', error)
    return []
  }
}

// Função principal
async function syncWithQueries() {
  try {
    console.log('🔄 Iniciando sincronização com queries...')
    
    // Buscar preços usando queries
    const prices = await getPricesWithQueries()
    
    if (prices.length > 0) {
      console.log(`\n💾 Salvando ${prices.length} preços...`)
      
      const data = {
        prices: prices,
        lastSync: new Date().toISOString(),
        totalPrices: prices.length
      }
      
      const filePath = path.join(process.cwd(), 'data', 'prices-with-queries.json')
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      
      console.log(`✅ Preços salvos em: ${filePath}`)
      
      // Verificar produto 5290
      const price5290 = prices.find(p => p.produtoId === 5290)
      if (price5290) {
        console.log(`\n🎉 PRODUTO 5290 ENCONTRADO!`)
        console.log(`   Preço: R$ ${price5290.precoVenda1}`)
        console.log(`   ID Externo: "${price5290.idExterno}"`)
        console.log(`   Código Interno: "${price5290.codigoInterno}"`)
      } else {
        console.log('\n❌ Produto 5290 ainda não encontrado')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
  }
}

// Executar
syncWithQueries()
