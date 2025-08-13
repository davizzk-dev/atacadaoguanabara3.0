// Usar fetch nativo do Node.js (disponível nas versões mais recentes)

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
    const response = await fetch(url, config)
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return await response.text()
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${endpoint}:`, error.message)
    throw error
  }
}

// Função para testar seções
async function testSections() {
  console.log('\n📂 Testando endpoint de seções...')
  try {
    const sections = await makeVarejoFacilRequest('/v1/produto/secoes?count=10')
    console.log('✅ Seções obtidas com sucesso!')
    console.log(`📊 Total de seções: ${sections.total || sections.items?.length || 0}`)
    if (sections.items && sections.items.length > 0) {
      console.log('📋 Primeiras seções:')
      sections.items.slice(0, 3).forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.descricao} (ID: ${section.id})`)
      })
    }
    return sections
  } catch (error) {
    console.error('❌ Falha ao obter seções:', error.message)
    return null
  }
}

// Função para testar produtos
async function testProducts() {
  console.log('\n📦 Testando endpoint de produtos...')
  try {
    const products = await makeVarejoFacilRequest('/v1/produto/produtos?count=10')
    console.log('✅ Produtos obtidos com sucesso!')
    console.log(`📊 Total de produtos: ${products.total || products.items?.length || 0}`)
    console.log('📋 Resposta completa:', JSON.stringify(products, null, 2))
    if (products.items && products.items.length > 0) {
      console.log('📋 Primeiros produtos:')
      products.items.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.descricao} (ID: ${product.id})`)
      })
    } else {
      console.log('⚠️ Nenhum produto encontrado na resposta')
    }
    return products
  } catch (error) {
    console.error('❌ Falha ao obter produtos:', error.message)
    return null
  }
}

// Função para testar marcas
async function testBrands() {
  console.log('\n🏷️ Testando endpoint de marcas...')
  try {
    const brands = await makeVarejoFacilRequest('/v1/produto/marcas?count=10')
    console.log('✅ Marcas obtidas com sucesso!')
    console.log(`📊 Total de marcas: ${brands.total || brands.items?.length || 0}`)
    if (brands.items && brands.items.length > 0) {
      console.log('📋 Primeiras marcas:')
      brands.items.slice(0, 3).forEach((brand, index) => {
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
  console.log('\n📚 Testando endpoint de gêneros...')
  try {
    const genres = await makeVarejoFacilRequest('/v1/produto/generos?count=10')
    console.log('✅ Gêneros obtidos com sucesso!')
    console.log(`📊 Total de gêneros: ${genres.total || genres.items?.length || 0}`)
    if (genres.items && genres.items.length > 0) {
      console.log('📋 Primeiros gêneros:')
      genres.items.slice(0, 3).forEach((genre, index) => {
        console.log(`   ${index + 1}. ${genre.descricao} (ID: ${genre.id})`)
      })
    }
    return genres
  } catch (error) {
    console.error('❌ Falha ao obter gêneros:', error.message)
    return null
  }
}

// Função para testar preços
async function testPrices() {
  console.log('\n💰 Testando endpoint de preços...')
  try {
    const prices = await makeVarejoFacilRequest('/v1/produto/precos?count=10')
    console.log('✅ Preços obtidos com sucesso!')
    console.log(`📊 Total de preços: ${prices.total || prices.items?.length || 0}`)
    if (prices.items && prices.items.length > 0) {
      console.log('📋 Primeiros preços:')
      prices.items.slice(0, 3).forEach((price, index) => {
        console.log(`   ${index + 1}. Produto ID: ${price.produtoId} - Preço: R$ ${price.precoVenda1}`)
      })
    }
    return prices
  } catch (error) {
    console.error('❌ Falha ao obter preços:', error.message)
    return null
  }
}

// Função para testar aplicações
async function testApplications() {
  console.log('\n🔧 Testando endpoint de aplicações...')
  try {
    const applications = await makeVarejoFacilRequest('/v1/produto/aplicacoes?count=10')
    console.log('✅ Aplicações obtidas com sucesso!')
    console.log(`📊 Total de aplicações: ${applications.total || applications.items?.length || 0}`)
    if (applications.items && applications.items.length > 0) {
      console.log('📋 Primeiras aplicações:')
      applications.items.slice(0, 3).forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.descricao} (ID: ${app.id})`)
      })
    }
    return applications
  } catch (error) {
    console.error('❌ Falha ao obter aplicações:', error.message)
    return null
  }
}

// Função para testar características
async function testCharacteristics() {
  console.log('\n🏷️ Testando endpoint de características...')
  try {
    const characteristics = await makeVarejoFacilRequest('/v1/produto/caracteristicas?count=10')
    console.log('✅ Características obtidas com sucesso!')
    console.log(`📊 Total de características: ${characteristics.total || characteristics.items?.length || 0}`)
    if (characteristics.items && characteristics.items.length > 0) {
      console.log('📋 Primeiras características:')
      characteristics.items.slice(0, 3).forEach((char, index) => {
        console.log(`   ${index + 1}. ${char.descricao} (ID: ${char.id})`)
      })
    }
    return characteristics
  } catch (error) {
    console.error('❌ Falha ao obter características:', error.message)
    return null
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('🧪 Iniciando testes da API do Varejo Fácil...')
  console.log(`🔗 Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}`)
  console.log(`🔑 API Key: ${VAREJO_FACIL_CONFIG.apiKey}`)
  
  const results = {
    sections: null,
    products: null,
    brands: null,
    genres: null,
    prices: null,
    applications: null,
    characteristics: null
  }

  // Executar todos os testes
  results.sections = await testSections()
  results.products = await testProducts()
  results.brands = await testBrands()
  results.genres = await testGenres()
  results.prices = await testPrices()
  results.applications = await testApplications()
  results.characteristics = await testCharacteristics()

  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES')
  console.log('====================')
  
  const successfulTests = Object.values(results).filter(result => result !== null).length
  const totalTests = Object.keys(results).length
  
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${totalTests}`)
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result !== null ? '✅' : '❌'
    console.log(`${status} ${testName}: ${result !== null ? 'SUCESSO' : 'FALHA'}`)
  })

  if (successfulTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.')
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique a configuração da API.')
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  runAllTests,
  testSections,
  testProducts,
  testBrands,
  testGenres,
  testPrices,
  testApplications,
  testCharacteristics
} 