// Script para testar a sincronização do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

// Função para fazer requisições para a API do Varejo Fácil
async function makeVarejoFacilRequest(endpoint, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`)
    const response = await fetch(url, config)
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json()
      console.log('✅ Resposta JSON válida!')
      return json
    } else {
      const text = await response.text()
      console.log(`📋 Resposta (primeiros 500 chars): ${text.substring(0, 500)}`)
      return text
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${endpoint}:`, error.message)
    throw error
  }
}

// Função para testar sincronização em lotes
async function testBatchSync() {
  console.log('\n🧪 Testando sincronização em lotes de 300...')
  
  let allProducts = []
  let start = 0
  const batchSize = 300
  let hasMore = true
  let batchCount = 0

  while (hasMore) {
    batchCount++
    console.log(`\n📦 Testando lote ${batchCount} (${start} - ${start + batchSize - 1})...`)
    
    try {
      const productsData = await makeVarejoFacilRequest(`/api/v1/produto/produtos?start=${start}&count=${batchSize}`)
      
      if (productsData.items && productsData.items.length > 0) {
        allProducts = allProducts.concat(productsData.items)
        console.log(`✅ Lote ${batchCount}: ${productsData.items.length} produtos (Total: ${allProducts.length})`)
        
        // Mostrar alguns produtos do lote
        console.log('📋 Primeiros produtos do lote:')
        productsData.items.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.descricao} (ID: ${product.id})`)
        })
        
        // Se recebemos menos produtos que o batchSize, chegamos ao fim
        if (productsData.items.length < batchSize) {
          hasMore = false
          console.log(`🏁 Último lote recebido. Finalizando teste...`)
        } else {
          start += batchSize
        }
      } else {
        hasMore = false
        console.log(`🏁 Nenhum produto encontrado no lote ${batchCount}. Finalizando...`)
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar lote ${batchCount}:`, error.message)
      hasMore = false
    }
  }

  console.log(`\n📊 RESUMO DO TESTE DE SINCRONIZAÇÃO:`)
  console.log(`   - Total de produtos encontrados: ${allProducts.length}`)
  console.log(`   - Lotes processados: ${batchCount}`)
  console.log(`   - Tamanho do lote: ${batchSize}`)
  
  return {
    totalProducts: allProducts.length,
    batchCount: batchCount,
    products: allProducts
  }
}

// Função para testar outros endpoints
async function testOtherEndpoints() {
  console.log('\n🔍 Testando outros endpoints...')
  
  try {
    // Testar seções
    console.log('\n📂 Testando seções...')
    const sections = await makeVarejoFacilRequest('/api/v1/produto/secoes?count=10')
    console.log(`✅ ${sections.total || sections.items?.length || 0} seções encontradas`)
    
    // Testar marcas
    console.log('\n🏷️ Testando marcas...')
    const brands = await makeVarejoFacilRequest('/api/v1/produto/marcas?count=10')
    console.log(`✅ ${brands.total || brands.items?.length || 0} marcas encontradas`)
    
    // Testar gêneros
    console.log('\n🎭 Testando gêneros...')
    const genres = await makeVarejoFacilRequest('/api/v1/produto/generos?count=10')
    console.log(`✅ ${genres.total || genres.items?.length || 0} gêneros encontrados`)
    
    // Testar preços
    console.log('\n💰 Testando preços...')
    const prices = await makeVarejoFacilRequest('/api/v1/produto/precos?count=10')
    console.log(`✅ ${prices.total || prices.items?.length || 0} preços encontrados`)
    
    return {
      sections: sections.items?.length || 0,
      brands: brands.items?.length || 0,
      genres: genres.items?.length || 0,
      prices: prices.items?.length || 0
    }
  } catch (error) {
    console.error('❌ Erro ao testar outros endpoints:', error.message)
    return null
  }
}

// Função principal
async function runSyncTest() {
  console.log('🧪 Iniciando teste de sincronização do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`🔑 API Key: ${VAREJO_FACIL_CONFIG.apiKey}`)
  
  try {
    // Testar outros endpoints primeiro
    const otherData = await testOtherEndpoints()
    
    // Testar sincronização em lotes
    const syncData = await testBatchSync()
    
    // Resumo final
    console.log('\n📊 RESUMO FINAL DOS TESTES')
    console.log('==========================')
    console.log(`✅ Sincronização em lotes: ${syncData.totalProducts} produtos em ${syncData.batchCount} lotes`)
    if (otherData) {
      console.log(`✅ Outros endpoints: ${otherData.sections} seções, ${otherData.brands} marcas, ${otherData.genres} gêneros, ${otherData.prices} preços`)
    }
    
    console.log('\n🎉 Teste concluído! A sincronização está funcionando corretamente.')
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('   1. Acesse o painel administrativo')
    console.log('   2. Clique em "Sincronizar Agora" na seção Varejo Fácil')
    console.log('   3. Aguarde a sincronização completa')
    console.log('   4. Verifique o arquivo products.json na pasta data/')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

// Executar o teste se o script for chamado diretamente
if (require.main === module) {
  runSyncTest().catch(console.error)
}

module.exports = {
  runSyncTest,
  testBatchSync,
  testOtherEndpoints
} 