// Script para testar todas as APIs e identificar problemas
const BASE_URL = 'http://localhost:3005' // Porta correta

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    console.log(`🔍 Testando ${method} ${endpoint}...`)
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${endpoint}: OK`)
      return { success: true, data }
    } else {
      const errorText = await response.text()
      console.log(`❌ ${endpoint}: ${response.status} - ${errorText}`)
      return { success: false, status: response.status, error: errorText }
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: Erro de rede - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testAllAPIs() {
  console.log('🧪 Testando todas as APIs...')
  console.log(`🌐 Base URL: ${BASE_URL}`)
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  }
  
  // Lista de APIs para testar
  const apis = [
    // APIs básicas
    { endpoint: '/api/auth/session', method: 'GET', name: 'Auth Session' },
    { endpoint: '/api/orders', method: 'GET', name: 'Orders' },
    { endpoint: '/api/products', method: 'GET', name: 'Products' },
    { endpoint: '/api/users', method: 'GET', name: 'Users' },
    
    // APIs de feedback, câmera e retornos
    { endpoint: '/api/feedback', method: 'GET', name: 'Feedback' },
    { endpoint: '/api/camera-requests', method: 'GET', name: 'Camera Requests' },
    { endpoint: '/api/return-requests', method: 'GET', name: 'Return Requests' },
    
    // APIs de analytics
    { endpoint: '/api/analytics/visitors', method: 'GET', name: 'Analytics Visitors' },
    
    // APIs do Varejo Fácil
    { endpoint: '/api/varejo-facil/products?count=5', method: 'GET', name: 'Varejo Fácil Products' },
    { endpoint: '/api/varejo-facil/sections?count=5', method: 'GET', name: 'Varejo Fácil Sections' },
    { endpoint: '/api/varejo-facil/brands?count=5', method: 'GET', name: 'Varejo Fácil Brands' },
    { endpoint: '/api/varejo-facil/genres?count=5', method: 'GET', name: 'Varejo Fácil Genres' },
    
    // APIs de admin
    { endpoint: '/api/admin/stats', method: 'GET', name: 'Admin Stats' },
    
    // API de sincronização (apenas GET para status)
    { endpoint: '/api/sync-varejo-facil', method: 'GET', name: 'Sync Status' }
  ]
  
  console.log('\n📋 Testando APIs...')
  
  for (const api of apis) {
    const result = await testAPI(api.endpoint, api.method)
    
    if (result.success) {
      results.success++
    } else {
      results.failed++
    }
    
    results.details.push({
      name: api.name,
      endpoint: api.endpoint,
      method: api.method,
      ...result
    })
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Resumo
  console.log('\n📊 RESUMO DOS TESTES')
  console.log('====================')
  console.log(`✅ Sucessos: ${results.success}`)
  console.log(`❌ Falhas: ${results.failed}`)
  console.log(`📈 Taxa de sucesso: ${((results.success / (results.success + results.failed)) * 100).toFixed(1)}%`)
  
  // Detalhes das falhas
  if (results.failed > 0) {
    console.log('\n❌ APIS COM PROBLEMAS:')
    results.details
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.endpoint}`)
        console.log(`     Status: ${r.status || 'Erro de rede'}`)
        console.log(`     Erro: ${r.error}`)
      })
  }
  
  // APIs funcionando
  console.log('\n✅ APIS FUNCIONANDO:')
  results.details
    .filter(r => r.success)
    .forEach(r => {
      console.log(`   - ${r.name}: ${r.endpoint}`)
    })
  
  return results
}

// Teste específico da sincronização
async function testSync() {
  console.log('\n🔄 Testando sincronização completa...')
  
  try {
    const result = await testAPI('/api/sync-varejo-facil', 'POST', {})
    
    if (result.success) {
      console.log('✅ Sincronização bem-sucedida!')
      console.log(`   - Produtos: ${result.data.data.totalProducts}`)
      console.log(`   - Seções: ${result.data.data.totalSections}`)
      console.log(`   - Marcas: ${result.data.data.totalBrands}`)
      console.log(`   - Gêneros: ${result.data.data.totalGenres}`)
    } else {
      console.log('❌ Sincronização falhou!')
      console.log(`   - Status: ${result.status}`)
      console.log(`   - Erro: ${result.error}`)
    }
    
    return result
  } catch (error) {
    console.log('❌ Erro ao testar sincronização:', error.message)
    return { success: false, error: error.message }
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes das APIs...')
  
  // Teste geral das APIs
  const apiResults = await testAllAPIs()
  
  // Teste específico da sincronização
  const syncResult = await testSync()
  
  console.log('\n🎉 Testes concluídos!')
  
  return {
    apis: apiResults,
    sync: syncResult
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests, testAllAPIs, testSync } 