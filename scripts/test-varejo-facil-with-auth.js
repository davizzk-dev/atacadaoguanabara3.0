// Script para testar a API do Varejo Fácil com autenticação completa

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
    
    console.log(`📊 Status da autenticação: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Autenticação bem-sucedida!')
      console.log('📋 Resposta:', JSON.stringify(result, null, 2))
      return result
    } else {
      const errorText = await response.text()
      console.error('❌ Falha na autenticação:', errorText)
      return null
    }
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message)
    return null
  }
}

// Função para fazer requisições autenticadas
async function makeAuthenticatedRequest(endpoint, authResult, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Usar o token de autenticação se disponível
  if (authResult && authResult.accessToken) {
    headers['Authorization'] = `Bearer ${authResult.accessToken}`
  } else if (authResult && authResult.id) {
    headers['Authorization'] = `Bearer ${authResult.id}`
  } else if (authResult && authResult.token) {
    headers['Authorization'] = `Bearer ${authResult.token}`
  } else {
    headers['Authorization'] = `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
  }

  const config = {
    ...options,
    headers
  }

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`)
    console.log(`📋 Headers:`, headers)
    
    const response = await fetch(url, config)
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    console.log(`📋 Content-Type: ${contentType}`)
    
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

// Função para testar produtos
async function testProducts(authResult) {
  console.log('\n📦 Testando endpoint de produtos...')
  try {
    const products = await makeAuthenticatedRequest('/v1/produto/produtos?count=10', authResult)
    console.log(`📊 Total de produtos: ${products.total || products.items?.length || 0}`)
    if (products.items && products.items.length > 0) {
      console.log('📋 Primeiros produtos:')
      products.items.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.descricao} (ID: ${product.id})`)
      })
    } else {
      console.log('⚠️ Nenhum produto encontrado')
    }
    return products
  } catch (error) {
    console.error('❌ Falha ao obter produtos:', error.message)
    return null
  }
}

// Função para testar seções
async function testSections(authResult) {
  console.log('\n📂 Testando endpoint de seções...')
  try {
    const sections = await makeAuthenticatedRequest('/v1/produto/secoes?count=10', authResult)
    console.log(`📊 Total de seções: ${sections.total || sections.items?.length || 0}`)
    if (sections.items && sections.items.length > 0) {
      console.log('📋 Primeiras seções:')
      sections.items.slice(0, 3).forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.descricao} (ID: ${section.id})`)
      })
    } else {
      console.log('⚠️ Nenhuma seção encontrada')
    }
    return sections
  } catch (error) {
    console.error('❌ Falha ao obter seções:', error.message)
    return null
  }
}

// Função para testar marcas
async function testBrands(authResult) {
  console.log('\n🏷️ Testando endpoint de marcas...')
  try {
    const brands = await makeAuthenticatedRequest('/v1/produto/marcas?count=10', authResult)
    console.log(`📊 Total de marcas: ${brands.total || brands.items?.length || 0}`)
    if (brands.items && brands.items.length > 0) {
      console.log('📋 Primeiras marcas:')
      brands.items.slice(0, 3).forEach((brand, index) => {
        console.log(`   ${index + 1}. ${brand.descricao} (ID: ${brand.id})`)
      })
    } else {
      console.log('⚠️ Nenhuma marca encontrada')
    }
    return brands
  } catch (error) {
    console.error('❌ Falha ao obter marcas:', error.message)
    return null
  }
}

// Função para testar gêneros
async function testGenres(authResult) {
  console.log('\n🎭 Testando endpoint de gêneros...')
  try {
    const genres = await makeAuthenticatedRequest('/v1/produto/generos?count=10', authResult)
    console.log(`📊 Total de gêneros: ${genres.total || genres.items?.length || 0}`)
    if (genres.items && genres.items.length > 0) {
      console.log('📋 Primeiros gêneros:')
      genres.items.slice(0, 3).forEach((genre, index) => {
        console.log(`   ${index + 1}. ${genre.descricao} (ID: ${genre.id})`)
      })
    } else {
      console.log('⚠️ Nenhum gênero encontrado')
    }
    return genres
  } catch (error) {
    console.error('❌ Falha ao obter gêneros:', error.message)
    return null
  }
}

// Função principal
async function runAuthenticatedTests() {
  console.log('🧪 Iniciando testes com autenticação da API do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`👤 Usuário: ${VAREJO_FACIL_CONFIG.credentials.username}`)
  
  // Fazer autenticação primeiro
  const authResult = await authenticate()
  
  if (!authResult) {
    console.log('❌ Falha na autenticação. Abortando testes.')
    return
  }
  
  console.log('\n🎉 Autenticação bem-sucedida! Iniciando testes da API...')
  
  // Executar testes
  const results = {
    products: null,
    sections: null,
    brands: null,
    genres: null
  }
  
  results.products = await testProducts(authResult)
  results.sections = await testSections(authResult)
  results.brands = await testBrands(authResult)
  results.genres = await testGenres(authResult)
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES')
  console.log('====================')
  
  const successfulTests = Object.values(results).filter(result => result !== null).length
  const totalTests = Object.keys(results).length
  
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${totalTests}`)
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result !== null ? '✅' : '❌'
    const total = result?.total || result?.items?.length || 0
    console.log(`${status} ${testName}: ${result !== null ? `SUCESSO (${total} itens)` : 'FALHA'}`)
  })
  
  if (successfulTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.')
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique a configuração da API.')
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runAuthenticatedTests().catch(console.error)
}

module.exports = {
  runAuthenticatedTests,
  authenticate,
  testProducts,
  testSections,
  testBrands,
  testGenres
} 