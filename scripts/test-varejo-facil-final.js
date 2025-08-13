// Script final para testar a API do Varejo Fácil com configuração correta

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

// Função para testar produtos
async function testProducts() {
  console.log('\n📦 Testando endpoint de produtos...')
  try {
    const products = await makeVarejoFacilRequest('/api/v1/produto/produtos?count=10')
    console.log(`📊 Total de produtos: ${products.total || products.items?.length || 0}`)
    if (products.items && products.items.length > 0) {
      console.log('📋 Primeiros produtos:')
      products.items.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.descricao} (ID: ${product.id})`)
      })
    }
    return products
  } catch (error) {
    console.error('❌ Falha ao obter produtos:', error.message)
    return null
  }
}

// Função para testar seções
async function testSections() {
  console.log('\n📂 Testando endpoint de seções...')
  try {
    const sections = await makeVarejoFacilRequest('/api/v1/produto/secoes?count=20')
    console.log(`📊 Total de seções: ${sections.total || sections.items?.length || 0}`)
    if (sections.items && sections.items.length > 0) {
      console.log('📋 Todas as seções:')
      sections.items.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.descricao} (ID: ${section.id})`)
      })
    }
    return sections
  } catch (error) {
    console.error('❌ Falha ao obter seções:', error.message)
    return null
  }
}

// Função para testar marcas
async function testBrands() {
  console.log('\n🏷️ Testando endpoint de marcas...')
  try {
    const brands = await makeVarejoFacilRequest('/api/v1/produto/marcas?count=20')
    console.log(`📊 Total de marcas: ${brands.total || brands.items?.length || 0}`)
    if (brands.items && brands.items.length > 0) {
      console.log('📋 Todas as marcas:')
      brands.items.forEach((brand, index) => {
        console.log(`   ${index + 1}. ${brand.descricao} (ID: ${brand.id})`)
      })
    }
    return brands
  } catch (error) {
    console.error('❌ Falha ao obter marcas:', error.message)
    return null
  }
}

// Função para testar gêneros
async function testGenres() {
  console.log('\n🎭 Testando endpoint de gêneros...')
  try {
    const genres = await makeVarejoFacilRequest('/api/v1/produto/generos?count=20')
    console.log(`📊 Total de gêneros: ${genres.total || genres.items?.length || 0}`)
    if (genres.items && genres.items.length > 0) {
      console.log('📋 Primeiros gêneros:')
      genres.items.slice(0, 10).forEach((genre, index) => {
        console.log(`   ${index + 1}. ${genre.descricao} (ID: ${genre.id})`)
      })
    }
    return genres
  } catch (error) {
    console.error('❌ Falha ao obter gêneros:', error.message)
    return null
  }
}

// Função para testar grupos
async function testGroups() {
  console.log('\n📁 Testando endpoint de grupos...')
  try {
    const groups = await makeVarejoFacilRequest('/api/v1/produto/grupos?count=20')
    console.log(`📊 Total de grupos: ${groups.total || groups.items?.length || 0}`)
    if (groups.items && groups.items.length > 0) {
      console.log('📋 Primeiros grupos:')
      groups.items.slice(0, 10).forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.descricao} (ID: ${group.id})`)
      })
    }
    return groups
  } catch (error) {
    console.error('❌ Falha ao obter grupos:', error.message)
    return null
  }
}

// Função principal
async function runFinalTests() {
  console.log('🧪 Iniciando testes finais da API do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`🔑 API Key: ${VAREJO_FACIL_CONFIG.apiKey}`)
  
  // Executar testes
  const results = {
    products: null,
    sections: null,
    brands: null,
    genres: null,
    groups: null
  }
  
  results.products = await testProducts()
  results.sections = await testSections()
  results.brands = await testBrands()
  results.genres = await testGenres()
  results.groups = await testGroups()
  
  // Resumo final
  console.log('\n📊 RESUMO FINAL DOS TESTES')
  console.log('==========================')
  
  const successfulTests = Object.values(results).filter(result => result !== null).length
  const totalTests = Object.keys(results).length
  
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${totalTests}`)
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result !== null ? '✅' : '❌'
    const total = result?.total || result?.items?.length || 0
    console.log(`${status} ${testName}: ${result !== null ? `${total} itens` : 'FALHA'}`)
  })
  
  if (successfulTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram! A API está funcionando perfeitamente.')
    console.log('\n📈 DADOS DISPONÍVEIS:')
    console.log(`   📦 Produtos: ${results.products?.total || 0}`)
    console.log(`   📂 Seções: ${results.sections?.total || 0}`)
    console.log(`   🏷️ Marcas: ${results.brands?.total || 0}`)
    console.log(`   🎭 Gêneros: ${results.genres?.total || 0}`)
    console.log(`   📁 Grupos: ${results.groups?.total || 0}`)
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique a configuração da API.')
  }
  
  // Retornar resultados para uso na API
  return {
    success: successfulTests === totalTests,
    successfulTests,
    totalTests,
    data: {
      products: {
        total: results.products?.total || 0,
        items: results.products?.items?.length || 0,
        success: results.products !== null
      },
      sections: {
        total: results.sections?.total || 0,
        items: results.sections?.items?.length || 0,
        success: results.sections !== null
      },
      brands: {
        total: results.brands?.total || 0,
        items: results.brands?.items?.length || 0,
        success: results.brands !== null
      },
      genres: {
        total: results.genres?.total || 0,
        items: results.genres?.items?.length || 0,
        success: results.genres !== null
      },
      groups: {
        total: results.groups?.total || 0,
        items: results.groups?.items?.length || 0,
        success: results.groups !== null
      }
    },
    rawResults: results
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runFinalTests().catch(console.error)
}

module.exports = {
  runFinalTests,
  testProducts,
  testSections,
  testBrands,
  testGenres,
  testGroups
} 