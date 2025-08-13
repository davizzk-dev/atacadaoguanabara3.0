// Script para testar diferentes variações dos endpoints da API

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

// Função para testar diferentes variações de endpoints
async function testEndpointVariations(authResult, baseEndpoint) {
  console.log(`\n🔍 Testando variações do endpoint: ${baseEndpoint}`)
  
  const variations = [
    baseEndpoint,
    `/api${baseEndpoint}`,
    `/api/v1${baseEndpoint}`,
    `${baseEndpoint.replace('/v1/', '/')}`,
    `${baseEndpoint.replace('/v1/', '/api/')}`,
    `${baseEndpoint.replace('/v1/', '/api/v1/')}`
  ]
  
  for (const endpoint of variations) {
    console.log(`\n🔗 Testando: ${endpoint}`)
    
    try {
      const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}?count=5`
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authResult.accessToken}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      })
      
      console.log(`📊 Status: ${response.status}`)
      const contentType = response.headers.get('content-type')
      console.log(`📋 Content-Type: ${contentType}`)
      
      const text = await response.text()
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text)
          console.log(`✅ Endpoint ${endpoint} funcionou!`)
          console.log(`📊 Total: ${json.total || json.items?.length || 0}`)
          if (json.items && json.items.length > 0) {
            console.log('📋 Primeiros itens:')
            json.items.slice(0, 2).forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.descricao || item.nome || 'Sem descrição'} (ID: ${item.id})`)
            })
          }
          return { endpoint, result: json }
        } catch (e) {
          console.log(`❌ Endpoint ${endpoint} retornou HTML em vez de JSON`)
        }
      } else if (response.ok) {
        console.log(`⚠️ Endpoint ${endpoint} retornou status 200 mas não é JSON`)
        console.log(`📋 Resposta (primeiros 200 chars): ${text.substring(0, 200)}`)
      } else {
        console.log(`❌ Endpoint ${endpoint} falhou com status ${response.status}`)
      }
      
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} falhou: ${error.message}`)
    }
  }
  
  return null
}

// Função principal
async function runEndpointTests() {
  console.log('🧪 Iniciando testes de variações de endpoints da API...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  
  // Fazer autenticação primeiro
  const authResult = await authenticate()
  
  if (!authResult) {
    console.log('❌ Falha na autenticação. Abortando testes.')
    return
  }
  
  console.log('\n🎉 Autenticação bem-sucedida! Iniciando testes de endpoints...')
  
  // Testar diferentes endpoints
  const endpoints = [
    '/v1/produto/produtos',
    '/v1/produto/secoes',
    '/v1/produto/marcas',
    '/v1/produto/generos'
  ]
  
  const results = {}
  
  for (const endpoint of endpoints) {
    const result = await testEndpointVariations(authResult, endpoint)
    results[endpoint] = result
  }
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES')
  console.log('====================')
  
  Object.entries(results).forEach(([endpoint, result]) => {
    const status = result !== null ? '✅' : '❌'
    const workingEndpoint = result ? result.endpoint : 'Nenhum'
    console.log(`${status} ${endpoint}: ${result !== null ? `FUNCIONOU (${workingEndpoint})` : 'FALHOU'}`)
  })
  
  const successfulTests = Object.values(results).filter(result => result !== null).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n✅ Testes bem-sucedidos: ${successfulTests}/${totalTests}`)
  
  if (successfulTests > 0) {
    console.log('\n🎉 Encontramos endpoints funcionais!')
  } else {
    console.log('\n⚠️ Nenhum endpoint funcionou. Verifique a documentação da API.')
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runEndpointTests().catch(console.error)
}

module.exports = {
  runEndpointTests,
  testEndpointVariations
} 