// Script para testar autenticação da API do Varejo Fácil

// Configurações da API do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

// Função para fazer requisições para a API do Varejo Fácil
async function makeVarejoFacilRequest(endpoint, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
    ...options.headers
  }

  const config = {
    ...options,
    headers: defaultHeaders
  }

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`)
    console.log(`📋 Headers:`, defaultHeaders)
    
    const response = await fetch(url, config)
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    console.log(`📋 Content-Type: ${contentType}`)
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      const text = await response.text()
      console.log(`📋 Resposta (primeiros 500 chars):`, text.substring(0, 500))
      return text
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${endpoint}:`, error.message)
    throw error
  }
}

// Testar diferentes formatos de autenticação
async function testDifferentAuthMethods() {
  console.log('🧪 Testando diferentes métodos de autenticação...')
  
  const endpoint = '/v1/produto/produtos?count=5'
  
  // Teste 1: Bearer token
  console.log('\n1️⃣ Testando Bearer token...')
  try {
    const result1 = await makeVarejoFacilRequest(endpoint, {
      headers: {
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    })
    console.log('✅ Bearer token funcionou')
  } catch (error) {
    console.log('❌ Bearer token falhou:', error.message)
  }
  
  // Teste 2: API Key no header
  console.log('\n2️⃣ Testando API Key no header...')
  try {
    const result2 = await makeVarejoFacilRequest(endpoint, {
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey
      }
    })
    console.log('✅ API Key no header funcionou')
  } catch (error) {
    console.log('❌ API Key no header falhou:', error.message)
  }
  
  // Teste 3: API Key como query parameter
  console.log('\n3️⃣ Testando API Key como query parameter...')
  try {
    const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}&apiKey=${VAREJO_FACIL_CONFIG.apiKey}`
    console.log(`🔍 URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    const text = await response.text()
    console.log(`📋 Resposta (primeiros 300 chars):`, text.substring(0, 300))
    
    if (response.ok && text.includes('"items"')) {
      console.log('✅ API Key como query parameter funcionou')
    } else {
      console.log('❌ API Key como query parameter falhou')
    }
  } catch (error) {
    console.log('❌ API Key como query parameter falhou:', error.message)
  }
  
  // Teste 4: Sem autenticação
  console.log('\n4️⃣ Testando sem autenticação...')
  try {
    const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
    console.log(`🔍 URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    const text = await response.text()
    console.log(`📋 Resposta (primeiros 300 chars):`, text.substring(0, 300))
    
    if (response.ok && text.includes('"items"')) {
      console.log('✅ Sem autenticação funcionou')
    } else {
      console.log('❌ Sem autenticação falhou')
    }
  } catch (error) {
    console.log('❌ Sem autenticação falhou:', error.message)
  }
}

// Testar endpoint de login se existir
async function testLoginEndpoint() {
  console.log('\n🔐 Testando endpoint de login...')
  
  try {
    const loginData = {
      username: 'Guilherme',
      password: '6952'
    }
    
    const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    const result = await response.text()
    console.log(`📋 Resposta:`, result.substring(0, 500))
    
    if (response.ok) {
      console.log('✅ Login funcionou')
      return result
    } else {
      console.log('❌ Login falhou')
    }
  } catch (error) {
    console.log('❌ Login falhou:', error.message)
  }
}

// Função principal
async function runAuthTests() {
  console.log('🔐 Iniciando testes de autenticação da API do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`🔑 API Key: ${VAREJO_FACIL_CONFIG.apiKey}`)
  
  await testDifferentAuthMethods()
  await testLoginEndpoint()
  
  console.log('\n📊 Testes de autenticação concluídos!')
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runAuthTests().catch(console.error)
}

module.exports = {
  runAuthTests,
  testDifferentAuthMethods,
  testLoginEndpoint
} 