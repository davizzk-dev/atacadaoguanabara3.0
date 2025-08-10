const fs = require('fs').promises
const path = require('path')

// Configurações da API do Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a',
  endpoints: {
    products: '/v1/produto/produtos',
    sections: '/v1/produto/secoes',
    brands: '/v1/produto/marcas',
    genres: '/v1/produto/generos',
    prices: '/v1/produto/precos',
    applications: '/v1/produto/aplicacoes',
    characteristics: '/v1/produto/caracteristicas',
    mix: '/v1/produto/mix',
    families: '/v1/produto/familias',
    auxiliaryCodes: '/v1/produto/codigos-auxiliares'
  }
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
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error)
    throw error
  }
}

// Função para buscar produtos
async function fetchProducts(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.start) searchParams.append('start', params.start.toString())
  if (params.count) searchParams.append('count', params.count.toString())

  const queryString = searchParams.toString()
  const endpoint = `${VAREJO_FACIL_CONFIG.endpoints.products}${queryString ? `?${queryString}` : ''}`
  
  return makeVarejoFacilRequest(endpoint)
}

// Função para buscar seções
async function fetchSections(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.start) searchParams.append('start', params.start.toString())
  if (params.count) searchParams.append('count', params.count.toString())

  const queryString = searchParams.toString()
  const endpoint = `${VAREJO_FACIL_CONFIG.endpoints.sections}${queryString ? `?${queryString}` : ''}`
  
  return makeVarejoFacilRequest(endpoint)
}

// Função para buscar marcas
async function fetchBrands(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.start) searchParams.append('start', params.start.toString())
  if (params.count) searchParams.append('count', params.count.toString())

  const queryString = searchParams.toString()
  const endpoint = `${VAREJO_FACIL_CONFIG.endpoints.brands}${queryString ? `?${queryString}` : ''}`
  
  return makeVarejoFacilRequest(endpoint)
}

// Função para buscar preços
async function fetchPrices(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.start) searchParams.append('start', params.start.toString())
  if (params.count) searchParams.append('count', params.count.toString())

  const queryString = searchParams.toString()
  const endpoint = `${VAREJO_FACIL_CONFIG.endpoints.prices}${queryString ? `?${queryString}` : ''}`
  
  return makeVarejoFacilRequest(endpoint)
}

// Função para salvar dados em arquivo JSON
async function saveToJsonFile(data, filename) {
  const dataDir = path.join(__dirname, '..', 'data')
  
  // Criar diretório se não existir
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
  
  const filePath = path.join(dataDir, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✅ Dados salvos em: ${filePath}`)
}

// Função principal de sincronização
async function syncVarejoFacilData() {
  console.log('🔄 Iniciando sincronização com Varejo Fácil...')
  
  try {
    // Buscar produtos
    console.log('📦 Buscando produtos...')
    const productsResponse = await fetchProducts({ count: 1000 })
    await saveToJsonFile(productsResponse, 'varejo-facil-products.json')
    console.log(`✅ ${productsResponse.items?.length || 0} produtos encontrados`)

    // Buscar seções
    console.log('📂 Buscando seções...')
    const sectionsResponse = await fetchSections({ count: 1000 })
    await saveToJsonFile(sectionsResponse, 'varejo-facil-sections.json')
    console.log(`✅ ${sectionsResponse.items?.length || 0} seções encontradas`)

    // Buscar marcas
    console.log('🏷️ Buscando marcas...')
    const brandsResponse = await fetchBrands({ count: 1000 })
    await saveToJsonFile(brandsResponse, 'varejo-facil-brands.json')
    console.log(`✅ ${brandsResponse.items?.length || 0} marcas encontradas`)

    // Buscar preços
    console.log('💰 Buscando preços...')
    const pricesResponse = await fetchPrices({ count: 1000 })
    await saveToJsonFile(pricesResponse, 'varejo-facil-prices.json')
    console.log(`✅ ${pricesResponse.items?.length || 0} preços encontrados`)

    // Criar arquivo de resumo
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: productsResponse.items?.length || 0,
      totalSections: sectionsResponse.items?.length || 0,
      totalBrands: brandsResponse.items?.length || 0,
      totalPrices: pricesResponse.items?.length || 0,
      status: 'success'
    }
    
    await saveToJsonFile(summary, 'varejo-facil-sync-summary.json')
    
    console.log('🎉 Sincronização concluída com sucesso!')
    console.log(`📊 Resumo: ${summary.totalProducts} produtos, ${summary.totalSections} seções, ${summary.totalBrands} marcas, ${summary.totalPrices} preços`)
    
    return summary
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error)
    
    const errorSummary = {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    }
    
    await saveToJsonFile(errorSummary, 'varejo-facil-sync-error.json')
    throw error
  }
}

// Função para sincronização contínua
async function startContinuousSync(intervalMinutes = 30) {
  console.log(`🔄 Iniciando sincronização contínua (intervalo: ${intervalMinutes} minutos)`)
  
  // Executar sincronização inicial
  await syncVarejoFacilData()
  
  // Configurar sincronização periódica
  setInterval(async () => {
    console.log(`\n🔄 Executando sincronização programada...`)
    try {
      await syncVarejoFacilData()
    } catch (error) {
      console.error('❌ Erro na sincronização programada:', error)
    }
  }, intervalMinutes * 60 * 1000)
  
  console.log(`⏰ Próxima sincronização em ${intervalMinutes} minutos`)
}

// Função para sincronização única
async function runSingleSync() {
  try {
    await syncVarejoFacilData()
    process.exit(0)
  } catch (error) {
    console.error('❌ Falha na sincronização:', error)
    process.exit(1)
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2)

if (args.includes('--continuous') || args.includes('-c')) {
  const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 30
  startContinuousSync(interval)
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔄 Script de Sincronização Varejo Fácil

Uso:
  node setup-auto-sync.js                    # Sincronização única
  node setup-auto-sync.js --continuous       # Sincronização contínua (30 min)
  node setup-auto-sync.js -c --interval=60   # Sincronização contínua (60 min)
  node setup-auto-sync.js --help             # Mostrar esta ajuda

Opções:
  --continuous, -c        Executar sincronização contínua
  --interval=<minutos>    Intervalo em minutos para sincronização contínua
  --help, -h             Mostrar esta ajuda

Arquivos gerados:
  - varejo-facil-products.json
  - varejo-facil-sections.json
  - varejo-facil-brands.json
  - varejo-facil-prices.json
  - varejo-facil-sync-summary.json
  - varejo-facil-sync-error.json (em caso de erro)
`)
} else {
  runSingleSync()
}

module.exports = {
  syncVarejoFacilData,
  startContinuousSync,
  runSingleSync
} 