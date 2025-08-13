// Script para testar diferentes endpoints de autenticação

const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a',
  credentials: {
    username: 'Guilherme',
    password: '6952'
  }
}

// Função para testar diferentes endpoints de autenticação
async function testAuthEndpoints() {
  console.log('🔍 Testando diferentes endpoints de autenticação...')
  
  const authEndpoints = [
    '/auth',
    '/api/auth',
    '/api/v1/auth',
    '/api/auth/login',
    '/api/v1/auth/login',
    '/login',
    '/api/login',
    '/api/v1/login'
  ]
  
  for (const endpoint of authEndpoints) {
    console.log(`\n🔗 Testando: ${endpoint}`)
    
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: VAREJO_FACIL_CONFIG.credentials.username,
          password: VAREJO_FACIL_CONFIG.credentials.password
        })
      })
      
      console.log(`📊 Status: ${response.status}`)
      const contentType = response.headers.get('content-type')
      console.log(`📋 Content-Type: ${contentType}`)
      
      const text = await response.text()
      console.log(`📋 Resposta (primeiros 300 chars): ${text.substring(0, 300)}`)
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text)
          console.log(`✅ Endpoint ${endpoint} funcionou!`)
          console.log('📋 JSON:', JSON.stringify(json, null, 2))
          return { endpoint, result: json }
        } catch (e) {
          console.log(`❌ Endpoint ${endpoint} retornou HTML em vez de JSON`)
        }
      } else if (response.ok) {
        console.log(`⚠️ Endpoint ${endpoint} retornou status 200 mas não é JSON`)
      } else {
        console.log(`❌ Endpoint ${endpoint} falhou com status ${response.status}`)
      }
      
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} falhou: ${error.message}`)
    }
  }
  
  return null
}

// Função para testar se a API precisa de autenticação
async function testApiWithoutAuth() {
  console.log('\n🧪 Testando API sem autenticação...')
  
  const endpoints = [
    '/v1/produto/produtos?count=5',
    '/v1/produto/secoes?count=5',
    '/v1/produto/marcas?count=5'
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n🔗 Testando: ${endpoint}`)
    
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
        }
      })
      
      console.log(`📊 Status: ${response.status}`)
      const contentType = response.headers.get('content-type')
      console.log(`📋 Content-Type: ${contentType}`)
      
      const text = await response.text()
      console.log(`📋 Resposta (primeiros 300 chars): ${text.substring(0, 300)}`)
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text)
          console.log(`✅ Endpoint ${endpoint} funcionou sem autenticação!`)
          console.log(`📊 Total: ${json.total || json.items?.length || 0}`)
          return { endpoint, result: json }
        } catch (e) {
          console.log(`❌ Endpoint ${endpoint} retornou HTML em vez de JSON`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} falhou: ${error.message}`)
    }
  }
  
  return null
}

// Função principal
async function runAuthTests() {
  console.log('🔐 Iniciando testes de endpoints de autenticação...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`👤 Usuário: ${VAREJO_FACIL_CONFIG.credentials.username}`)
  
  // Testar diferentes endpoints de autenticação
  const authResult = await testAuthEndpoints()
  
  if (authResult) {
    console.log(`\n🎉 Autenticação bem-sucedida no endpoint: ${authResult.endpoint}`)
  } else {
    console.log('\n❌ Nenhum endpoint de autenticação funcionou')
  }
  
  // Testar API sem autenticação
  const apiResult = await testApiWithoutAuth()
  
  if (apiResult) {
    console.log(`\n🎉 API funcionando sem autenticação no endpoint: ${apiResult.endpoint}`)
  } else {
    console.log('\n❌ API não funcionou sem autenticação')
  }
  
  console.log('\n📊 Testes concluídos!')
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runAuthTests().catch(console.error)
}

module.exports = {
  runAuthTests,
  testAuthEndpoints,
  testApiWithoutAuth
} 