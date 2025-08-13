// Script para fazer login no Varejo Fácil e capturar cookies de sessão

const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a',
  credentials: {
    username: 'Guilherme',
    password: '6952'
  }
}

// Função para fazer login e capturar cookies
async function loginAndGetCookies() {
  console.log('🔐 Fazendo login no Varejo Fácil...')
  
  try {
    // Primeiro, vamos tentar acessar a página de login para obter cookies iniciais
    console.log('📋 Obtendo cookies iniciais...')
    const initialResponse = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}/login`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    console.log(`📊 Status inicial: ${initialResponse.status}`)
    const cookies = initialResponse.headers.get('set-cookie')
    console.log(`🍪 Cookies iniciais: ${cookies}`)
    
    // Agora vamos tentar fazer login
    console.log('🔑 Tentando fazer login...')
    const loginResponse = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        username: VAREJO_FACIL_CONFIG.credentials.username,
        password: VAREJO_FACIL_CONFIG.credentials.password
      })
    })
    
    console.log(`📊 Status do login: ${loginResponse.status}`)
    const loginCookies = loginResponse.headers.get('set-cookie')
    console.log(`🍪 Cookies do login: ${loginCookies}`)
    
    const loginText = await loginResponse.text()
    console.log(`📋 Resposta do login: ${loginText.substring(0, 500)}`)
    
    return {
      initialCookies: cookies,
      loginCookies: loginCookies,
      success: loginResponse.ok
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error.message)
    return { success: false, error: error.message }
  }
}

// Função para testar API com cookies
async function testApiWithCookies(cookies) {
  console.log('\n🧪 Testando API com cookies...')
  
  try {
    const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}/v1/produto/produtos?count=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookies || '',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    })
    
    console.log(`📊 Status da API: ${response.status}`)
    const contentType = response.headers.get('content-type')
    console.log(`📋 Content-Type: ${contentType}`)
    
    const text = await response.text()
    console.log(`📋 Resposta (primeiros 500 chars): ${text.substring(0, 500)}`)
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text)
        console.log('✅ Resposta JSON válida!')
        console.log(`📊 Total de produtos: ${json.total || json.items?.length || 0}`)
        return json
      } catch (e) {
        console.log('❌ Resposta não é JSON válido')
        return null
      }
    } else {
      console.log('❌ Resposta não é JSON')
      return null
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
    return null
  }
}

// Função para tentar diferentes endpoints de login
async function tryDifferentLoginEndpoints() {
  console.log('\n🔍 Tentando diferentes endpoints de login...')
  
  const loginEndpoints = [
    '/api/auth/login',
    '/api/login',
    '/auth/login',
    '/login',
    '/api/v1/auth/login',
    '/api/v1/login'
  ]
  
  for (const endpoint of loginEndpoints) {
    console.log(`\n🔗 Testando: ${endpoint}`)
    
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify({
          username: VAREJO_FACIL_CONFIG.credentials.username,
          password: VAREJO_FACIL_CONFIG.credentials.password
        })
      })
      
      console.log(`📊 Status: ${response.status}`)
      const text = await response.text()
      console.log(`📋 Resposta: ${text.substring(0, 300)}`)
      
      if (response.ok) {
        console.log(`✅ Endpoint ${endpoint} funcionou!`)
        return { endpoint, response: text }
      }
      
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} falhou: ${error.message}`)
    }
  }
  
  return null
}

// Função principal
async function runLoginTests() {
  console.log('🔐 Iniciando testes de login do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`👤 Usuário: ${VAREJO_FACIL_CONFIG.credentials.username}`)
  
  // Tentar diferentes endpoints de login
  const loginResult = await tryDifferentLoginEndpoints()
  
  if (loginResult) {
    console.log(`\n✅ Login bem-sucedido no endpoint: ${loginResult.endpoint}`)
    
    // Testar API com o resultado do login
    const apiResult = await testApiWithCookies()
    
    if (apiResult) {
      console.log('\n🎉 API funcionando com login!')
      return apiResult
    }
  } else {
    console.log('\n❌ Nenhum endpoint de login funcionou')
  }
  
  // Tentar método alternativo
  console.log('\n🔄 Tentando método alternativo...')
  const cookiesResult = await loginAndGetCookies()
  
  if (cookiesResult.success) {
    const apiResult = await testApiWithCookies(cookiesResult.loginCookies)
    if (apiResult) {
      console.log('\n🎉 API funcionando com cookies!')
      return apiResult
    }
  }
  
  console.log('\n❌ Não foi possível fazer login ou acessar a API')
  return null
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runLoginTests().catch(console.error)
}

module.exports = {
  runLoginTests,
  loginAndGetCookies,
  testApiWithCookies,
  tryDifferentLoginEndpoints
} 