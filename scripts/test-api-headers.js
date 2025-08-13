// Script para testar diferentes headers de autenticação

const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a',
  credentials: {
    username: 'Guilherme',
    password: '6952'
  }
}

// Função para fazer autenticação
async function authenticate() {
  console.log('🔐 Fazendo autenticação...')
  
  try {
    const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: VAREJO_FACIL_CONFIG.credentials.username,
        password: VAREJO_FACIL_CONFIG.credentials.password
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Autenticação bem-sucedida!')
      return result
    } else {
      console.error('❌ Falha na autenticação:', response.status)
      return null
    }
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message)
    return null
  }
}

// Função para testar diferentes headers de autenticação
async function testAuthHeaders(authResult, endpoint) {
  console.log(`\n🔍 Testando diferentes headers para: ${endpoint}`)
  
  const headerVariations = [
    // Bearer token
    { 'Authorization': `Bearer ${authResult.accessToken}` },
    { 'Authorization': `Bearer ${authResult.accessToken}`, 'Accept': 'application/json' },
    { 'Authorization': `Bearer ${authResult.accessToken}`, 'Content-Type': 'application/json' },
    
    // API Key
    { 'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}` },
    { 'X-API-Key': VAREJO_FACIL_CONFIG.apiKey },
    { 'api-key': VAREJO_FACIL_CONFIG.apiKey },
    
    // Token sem Bearer
    { 'Authorization': authResult.accessToken },
    { 'X-Auth-Token': authResult.accessToken },
    { 'token': authResult.accessToken },
    
    // Combinações
    { 'Authorization': `Bearer ${authResult.accessToken}`, 'X-API-Key': VAREJO_FACIL_CONFIG.apiKey },
    { 'Authorization': `Bearer ${authResult.accessToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' }
  ]
  
  for (let i = 0; i < headerVariations.length; i++) {
    const headers = headerVariations[i]
    console.log(`\n🔗 Testando variação ${i + 1}:`, Object.keys(headers).join(', '))
    
    try {
      const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}?count=5`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })
      
      console.log(`📊 Status: ${response.status}`)
      const contentType = response.headers.get('content-type')
      console.log(`📋 Content-Type: ${contentType}`)
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const json = await response.json()
        console.log(`✅ Variação ${i + 1} funcionou!`)
        console.log(`📊 Total: ${json.total || json.items?.length || 0}`)
        if (json.items && json.items.length > 0) {
          console.log('📋 Primeiros itens:')
          json.items.slice(0, 2).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.descricao || item.nome || 'Sem descrição'} (ID: ${item.id})`)
          })
        }
        return { headers: Object.keys(headers), result: json }
      } else if (response.ok) {
        const text = await response.text()
        console.log(`⚠️ Variação ${i + 1} retornou status 200 mas não é JSON`)
        console.log(`📋 Resposta (primeiros 100 chars): ${text.substring(0, 100)}`)
      } else {
        console.log(`❌ Variação ${i + 1} falhou com status ${response.status}`)
      }
      
    } catch (error) {
      console.log(`❌ Variação ${i + 1} falhou: ${error.message}`)
    }
  }
  
  return null
}

// Função principal
async function runHeaderTests() {
  console.log('🧪 Iniciando testes de headers de autenticação...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  
  // Fazer autenticação primeiro
  const authResult = await authenticate()
  
  if (!authResult) {
    console.log('❌ Falha na autenticação. Abortando testes.')
    return
  }
  
  console.log('\n🎉 Autenticação bem-sucedida! Iniciando testes de headers...')
  
  // Testar diferentes endpoints
  const endpoints = [
    '/api/v1/produto/produtos',
    '/api/v1/produto/secoes',
    '/api/v1/produto/marcas'
  ]
  
  const results = {}
  
  for (const endpoint of endpoints) {
    const result = await testAuthHeaders(authResult, endpoint)
    results[endpoint] = result
  }
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES')
  console.log('====================')
  
  Object.entries(results).forEach(([endpoint, result]) => {
    const status = result !== null ? '✅' : '❌'
    const headers = result ? result.headers.join(', ') : 'Nenhum'
    console.log(`${status} ${endpoint}: ${result !== null ? `FUNCIONOU (${headers})` : 'FALHOU'}`)
  })
  
  const successfulTests = Object.values(results).filter(result => result !== null).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n✅ Testes bem-sucedidos: ${successfulTests}/${totalTests}`)
  
  if (successfulTests > 0) {
    console.log('\n🎉 Encontramos headers funcionais!')
  } else {
    console.log('\n⚠️ Nenhum header funcionou. Verifique a documentação da API.')
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runHeaderTests().catch(console.error)
}

module.exports = {
  runHeaderTests,
  testAuthHeaders
} 