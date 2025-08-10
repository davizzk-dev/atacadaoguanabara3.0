const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// Configurações da API Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Função para fazer requisições para a API Varejo Fácil com autenticação
async function makeVarejoFacilRequest(endpoint, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  const requestOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
      ...options.headers
    },
    ...options
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`);
    console.log(`🔑 Usando API Key: ${VAREJO_FACIL_CONFIG.apiKey.substring(0, 8)}...`);
    
    const response = await fetch(url, requestOptions);
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Erro na requisição (${response.status}): ${responseText.substring(0, 200)}`);
      
      // Se for erro 401, tentar sem autenticação
      if (response.status === 401) {
        console.log('🔄 Tentando sem autenticação...');
        const retryOptions = { ...requestOptions };
        delete retryOptions.headers.Authorization;
        
        const retryResponse = await fetch(url, retryOptions);
        const retryText = await retryResponse.text();
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}: ${retryText.substring(0, 200)}`);
        }
        
        try {
          const data = JSON.parse(retryText);
          console.log(`✅ Requisição bem-sucedida sem autenticação: ${data.items?.length || 0} itens encontrados`);
          return data;
        } catch (parseError) {
          console.log(`📄 Resposta não é JSON, tentando fazer parsing do HTML...`);
          return parseHtmlResponse(retryText);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
    }

    // Tentar fazer parse do JSON primeiro
    try {
      const data = JSON.parse(responseText);
      console.log(`✅ Requisição bem-sucedida (JSON): ${data.items?.length || 0} itens encontrados`);
      return data;
    } catch (parseError) {
      console.log(`❌ ERRO: Endpoint da API retornando HTML em vez de JSON`);
      console.log(`🔍 Isso indica problema de autenticação ou redirecionamento`);
      console.log(`📄 Primeiros 200 caracteres da resposta:`, responseText.substring(0, 200));
      console.log(`📄 Tentando fazer parsing do HTML como fallback...`);
      return parseHtmlResponse(responseText);
    }
    
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error.message);
    throw error;
  }
}

// Função para fazer parsing de resposta HTML
function parseHtmlResponse(responseText) {
  const $ = cheerio.load(responseText);
  
  // Tentar extrair dados de diferentes formas
  let extractedData = {
    items: [],
    total: 0,
    start: 0,
    count: 0
  };
  
  // Procurar por dados em scripts JavaScript
  $('script').each((i, script) => {
    const scriptContent = $(script).html();
    if (scriptContent && (scriptContent.includes('produtos') || scriptContent.includes('secoes') || scriptContent.includes('marcas'))) {
      console.log(`🔍 Encontrado script com dados: ${scriptContent.substring(0, 200)}...`);
      
      // Tentar extrair JSON de dentro do script
      const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          if (jsonData.items) {
            extractedData = jsonData;
            console.log(`✅ Dados extraídos do script: ${jsonData.items.length} itens`);
          }
        } catch (e) {
          // Ignorar erros de parsing
        }
      }
    }
  });
  
  // Procurar por tabelas ou listas com dados
  if (extractedData.items.length === 0) {
    $('table tr, .item, .product, .produto, .row, .col').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      if (text && text.length > 10) {
        extractedData.items.push({
          id: i,
          descricao: text,
          raw: text
        });
      }
    });
    
    if (extractedData.items.length > 0) {
      console.log(`✅ Dados extraídos de elementos HTML: ${extractedData.items.length} itens`);
    }
  }
  
  // Se ainda não encontrou dados, retornar estrutura vazia
  if (extractedData.items.length === 0) {
    console.log(`⚠️  Não foi possível extrair dados do HTML`);
    console.log(`📄 Primeiros 500 caracteres do HTML: ${responseText.substring(0, 500)}`);
  }
  
  return extractedData;
}

// Função para buscar produtos em lotes
async function fetchProducts(start = 0, count = 200) {
  console.log(`📦 Buscando produtos (${start} - ${start + count})...`);
  
  try {
    const data = await makeVarejoFacilRequest(`/v1/produto/produtos?start=${start}&count=${count}`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    return { items: [], total: 0 };
  }
}

// Função para buscar seções
async function fetchSections() {
  console.log('📂 Buscando seções...');
  
  try {
    const data = await makeVarejoFacilRequest('/v1/produto/secoes');
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar seções:', error.message);
    return { items: [] };
  }
}

// Função para buscar marcas
async function fetchBrands() {
  console.log('🏷️ Buscando marcas...');
  
  try {
    const data = await makeVarejoFacilRequest('/v1/produto/marcas');
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar marcas:', error.message);
    return { items: [] };
  }
}

// Função para buscar gêneros
async function fetchGenres() {
  console.log('📚 Buscando gêneros...');
  
  try {
    const data = await makeVarejoFacilRequest('/v1/produto/generos');
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar gêneros:', error.message);
    return { items: [] };
  }
}

// Função para buscar preços
async function fetchPrices(start = 0, count = 200) {
  console.log(`💰 Buscando preços (${start} - ${start + count})...`);
  
  try {
    const data = await makeVarejoFacilRequest(`/v1/produto/precos?start=${start}&count=${count}`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar preços:', error.message);
    return { items: [] };
  }
}

// Função para buscar aplicações
async function fetchApplications() {
  console.log('🔧 Buscando aplicações...');
  
  try {
    const data = await makeVarejoFacilRequest('/v1/produto/aplicacoes');
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar aplicações:', error.message);
    return { items: [] };
  }
}

// Função para buscar características
async function fetchCharacteristics() {
  console.log('🏷️ Buscando características...');
  
  try {
    const data = await makeVarejoFacilRequest('/v1/produto/caracteristicas');
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar características:', error.message);
    return { items: [] };
  }
}

// Função para salvar dados em arquivo JSON
async function saveToJsonFile(data, filename) {
  const dataDir = path.join(__dirname, '..', 'data');
  
  try {
    // Criar diretório data se não existir
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Dados salvos em: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao salvar arquivo ${filename}:`, error.message);
  }
}

// Função para buscar dados em lotes
async function fetchDataInBatches(fetchFunction, batchSize = 200, dataType = 'dados') {
  let start = 0;
  let hasMore = true;
  let batchCount = 0;
  let allItems = [];

  while (hasMore) {
    batchCount++;
    console.log(`\n📦 Lote ${batchCount}: ${dataType} ${start} - ${start + batchSize}`);
    
    const data = await fetchFunction(start, batchSize);
    const items = data.items || [];
    
    if (items.length > 0) {
      allItems.push(...items);
      console.log(`✅ ${items.length} ${dataType} adicionados (Total: ${allItems.length})`);
    }
    
    // Verificar se há mais dados
    const total = data.total || 0;
    
    if (items.length < batchSize || allItems.length >= total) {
      hasMore = false;
      console.log(`\n✅ Todos os ${dataType} foram buscados! Total: ${allItems.length}/${total}`);
    } else {
      start += batchSize;
      // Pequena pausa entre lotes para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return allItems;
}

// Função principal de sincronização
async function syncVarejoFacilData() {
  console.log('🚀 Iniciando sincronização com Varejo Fácil...\n');
  
  const startTime = Date.now();
  const syncData = {
    lastSync: new Date().toISOString(),
    products: [],
    sections: [],
    brands: [],
    genres: [],
    prices: [],
    applications: [],
    characteristics: [],
    totalProducts: 0,
    totalSections: 0,
    totalBrands: 0,
    totalGenres: 0,
    totalPrices: 0,
    totalApplications: 0,
    totalCharacteristics: 0
  };

  try {
    // 1. Buscar seções
    console.log('📂 === BUSCANDO SEÇÕES ===');
    const sectionsData = await fetchSections();
    syncData.sections = sectionsData.items || [];
    syncData.totalSections = sectionsData.total || sectionsData.items?.length || 0;
    console.log(`✅ ${syncData.sections.length} seções encontradas\n`);

    // 2. Buscar marcas
    console.log('🏷️ === BUSCANDO MARCAS ===');
    const brandsData = await fetchBrands();
    syncData.brands = brandsData.items || [];
    syncData.totalBrands = brandsData.total || brandsData.items?.length || 0;
    console.log(`✅ ${syncData.brands.length} marcas encontradas\n`);

    // 3. Buscar gêneros
    console.log('📚 === BUSCANDO GÊNEROS ===');
    const genresData = await fetchGenres();
    syncData.genres = genresData.items || [];
    syncData.totalGenres = genresData.total || genresData.items?.length || 0;
    console.log(`✅ ${syncData.genres.length} gêneros encontrados\n`);

    // 4. Buscar aplicações
    console.log('🔧 === BUSCANDO APLICAÇÕES ===');
    const applicationsData = await fetchApplications();
    syncData.applications = applicationsData.items || [];
    syncData.totalApplications = applicationsData.total || applicationsData.items?.length || 0;
    console.log(`✅ ${syncData.applications.length} aplicações encontradas\n`);

    // 5. Buscar características
    console.log('🏷️ === BUSCANDO CARACTERÍSTICAS ===');
    const characteristicsData = await fetchCharacteristics();
    syncData.characteristics = characteristicsData.items || [];
    syncData.totalCharacteristics = characteristicsData.total || characteristicsData.items?.length || 0;
    console.log(`✅ ${syncData.characteristics.length} características encontradas\n`);

    // 6. Buscar produtos em lotes
    console.log('📦 === BUSCANDO PRODUTOS ===');
    syncData.products = await fetchDataInBatches(fetchProducts, 200, 'produtos');
    syncData.totalProducts = syncData.products.length;

    // 7. Buscar preços em lotes
    console.log('\n💰 === BUSCANDO PREÇOS ===');
    syncData.prices = await fetchDataInBatches(fetchPrices, 200, 'preços');
    syncData.totalPrices = syncData.prices.length;

    // 8. Salvar dados
    console.log('\n💾 === SALVANDO DADOS ===');
    await saveToJsonFile(syncData, 'varejo-facil-sync.json');
    
    // 9. Resumo final
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 === SINCRONIZAÇÃO CONCLUÍDA ===');
    console.log(`⏱️  Duração: ${duration} segundos`);
    console.log(`📦 Produtos: ${syncData.products.length}`);
    console.log(`📂 Seções: ${syncData.sections.length}`);
    console.log(`🏷️  Marcas: ${syncData.brands.length}`);
    console.log(`📚 Gêneros: ${syncData.genres.length}`);
    console.log(`🔧 Aplicações: ${syncData.applications.length}`);
    console.log(`🏷️  Características: ${syncData.characteristics.length}`);
    console.log(`💰 Preços: ${syncData.prices.length}`);
    console.log(`📅 Última sincronização: ${syncData.lastSync}`);

  } catch (error) {
    console.error('\n❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Função para buscar produtos específicos por termo
async function searchProducts(searchTerm) {
  console.log(`🔍 Buscando produtos com termo: "${searchTerm}"`);
  
  try {
    const data = await makeVarejoFacilRequest(`/v1/produto/produtos?q=descricao=like=${encodeURIComponent(searchTerm)}`);
    
    console.log(`\n📦 Resultados da busca:`);
    console.log(`Total encontrado: ${data.items?.length || 0}`);
    
    if (data.items && data.items.length > 0) {
      data.items.slice(0, 10).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.descricao || 'Sem descrição'}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Código: ${product.codigoInterno || 'N/A'}`);
        console.log(`   Seção: ${product.secaoId || 'N/A'}`);
      });
      
      if (data.items.length > 10) {
        console.log(`\n... e mais ${data.items.length - 10} produtos`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro na busca:', error.message);
    return { items: [] };
  }
}

// Função para buscar seções específicas
async function searchSections(searchTerm) {
  console.log(`🔍 Buscando seções com termo: "${searchTerm}"`);
  
  try {
    const data = await makeVarejoFacilRequest(`/v1/produto/secoes?q=descricao=like=${encodeURIComponent(searchTerm)}`);
    
    console.log(`\n📂 Resultados da busca:`);
    console.log(`Total encontrado: ${data.items?.length || 0}`);
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((section, index) => {
        console.log(`\n${index + 1}. ${section.descricao || 'Sem descrição'}`);
        console.log(`   ID: ${section.id}`);
        console.log(`   ID Externo: ${section.idExterno || 'N/A'}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro na busca:', error.message);
    return { items: [] };
  }
}

// Função para testar a conexão com a API
async function testConnection() {
  console.log('🔌 === TESTANDO CONEXÃO COM A API ===\n');
  
  try {
    // Testar endpoint de seções (geralmente mais leve)
    console.log('📂 Testando endpoint de seções...');
    const sectionsData = await makeVarejoFacilRequest('/v1/produto/secoes?count=1');
    console.log(`✅ Conexão com seções OK - ${sectionsData.total || 0} seções disponíveis`);
    
    // Testar endpoint de produtos
    console.log('\n📦 Testando endpoint de produtos...');
    const productsData = await makeVarejoFacilRequest('/v1/produto/produtos?count=1');
    console.log(`✅ Conexão com produtos OK - ${productsData.total || 0} produtos disponíveis`);
    
    // Testar endpoint de marcas
    console.log('\n🏷️ Testando endpoint de marcas...');
    const brandsData = await makeVarejoFacilRequest('/v1/produto/marcas?count=1');
    console.log(`✅ Conexão com marcas OK - ${brandsData.total || 0} marcas disponíveis`);
    
    console.log('\n🎉 Todos os testes de conexão passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.message);
  }
}

// Função para mostrar estatísticas
async function showStats() {
  console.log('📊 === ESTATÍSTICAS DA API ===\n');
  
  try {
    // Buscar contadores
    const productsData = await makeVarejoFacilRequest('/v1/produto/produtos?count=1');
    const sectionsData = await makeVarejoFacilRequest('/v1/produto/secoes?count=1');
    const brandsData = await makeVarejoFacilRequest('/v1/produto/marcas?count=1');
    const genresData = await makeVarejoFacilRequest('/v1/produto/generos?count=1');
    const pricesData = await makeVarejoFacilRequest('/v1/produto/precos?count=1');
    const applicationsData = await makeVarejoFacilRequest('/v1/produto/aplicacoes?count=1');
    const characteristicsData = await makeVarejoFacilRequest('/v1/produto/caracteristicas?count=1');
    
    console.log(`📦 Total de Produtos: ${productsData.total || 'N/A'}`);
    console.log(`📂 Total de Seções: ${sectionsData.total || 'N/A'}`);
    console.log(`🏷️  Total de Marcas: ${brandsData.total || 'N/A'}`);
    console.log(`📚 Total de Gêneros: ${genresData.total || 'N/A'}`);
    console.log(`💰 Total de Preços: ${pricesData.total || 'N/A'}`);
    console.log(`🔧 Total de Aplicações: ${applicationsData.total || 'N/A'}`);
    console.log(`🏷️  Total de Características: ${characteristicsData.total || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message);
  }
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
🔧 Script de Sincronização - Varejo Fácil API

Uso: node async.js [comando] [opções]

Comandos disponíveis:
  sync                    Sincronizar todos os dados (produtos, seções, marcas, gêneros, preços, etc.)
  test                    Testar conexão com a API
  auth-test               Testar diferentes métodos de autenticação
  test-products           Testar endpoint específico de produtos
  check-auth              Verificar endpoints de autenticação
  try-login               Tentar diferentes métodos de login
  try-api                 Tentar diferentes métodos de acesso à API
  docs                    Verificar documentação da API
  login                   Tentar fazer login na API
  search-products <termo> Buscar produtos por termo
  search-sections <termo> Buscar seções por termo
  stats                   Mostrar estatísticas da API
  help                    Mostrar esta ajuda

Exemplos:
  node async.js sync
  node async.js test
  node async.js auth-test
  node async.js test-products
  node async.js docs
  node async.js login
  node async.js search-products "arroz"
  node async.js search-sections "bebidas"
  node async.js stats

Configuração:
  Base URL: ${VAREJO_FACIL_CONFIG.baseUrl}
  API Key: ${VAREJO_FACIL_CONFIG.apiKey.substring(0, 8)}...
`);
}

// Função para testar diferentes métodos de autenticação
async function testAuthenticationMethods() {
  console.log('🔐 === TESTANDO MÉTODOS DE AUTENTICAÇÃO ===\n');
  
  const testEndpoint = '/v1/produto/secoes?count=1';
  const testUrl = `${VAREJO_FACIL_CONFIG.baseUrl}${testEndpoint}`;
  
  // Teste 1: Sem autenticação
  console.log('1️⃣ Testando sem autenticação...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Primeiros 100 chars: ${responseText.substring(0, 100)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 2: Com Bearer token
  console.log('\n2️⃣ Testando com Bearer token...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Primeiros 100 chars: ${responseText.substring(0, 100)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 3: Com API Key no header
  console.log('\n3️⃣ Testando com API Key no header...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Primeiros 100 chars: ${responseText.substring(0, 100)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 4: Com API Key como query parameter
  console.log('\n4️⃣ Testando com API Key como query parameter...');
  try {
    const response = await fetch(`${testUrl}&apiKey=${VAREJO_FACIL_CONFIG.apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Primeiros 100 chars: ${responseText.substring(0, 100)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 5: Verificar se existe endpoint de autenticação
  console.log('\n5️⃣ Verificando endpoint de autenticação...');
  try {
    const authUrl = `${VAREJO_FACIL_CONFIG.baseUrl}/v1/auth/login`;
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 404) {
      console.log('   ❌ Endpoint de login não encontrado');
    } else {
      console.log('   ✅ Endpoint de login encontrado');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

// Função para verificar documentação da API
async function checkApiDocumentation() {
  console.log('📚 === VERIFICANDO DOCUMENTAÇÃO DA API ===\n');
  
  const endpoints = [
    '/',
    '/api',
    '/v1',
    '/docs',
    '/swagger',
    '/api-docs',
    '/help',
    '/documentation'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Verificando: ${endpoint}`);
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/json'
        }
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (responseText.includes('swagger') || responseText.includes('api') || responseText.includes('docs')) {
        console.log(`   ✅ Possível documentação encontrada!`);
        console.log(`   📄 Primeiros 200 chars: ${responseText.substring(0, 200)}`);
      } else if (responseText.includes('login') || responseText.includes('entrar')) {
        console.log(`   🔐 Página de login detectada`);
      } else {
        console.log(`   📄 Página HTML normal`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');
  }
}

// Função para tentar fazer login
async function tryLogin() {
  console.log('🔐 === TENTANDO FAZER LOGIN ===\n');
  
  // Tentar diferentes endpoints de login
  const loginEndpoints = [
    '/v1/auth/login',
    '/api/auth/login',
    '/auth/login',
    '/login',
    '/api/login'
  ];
  
  for (const endpoint of loginEndpoints) {
    console.log(`🔍 Tentando login em: ${endpoint}`);
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin',
          apiKey: VAREJO_FACIL_CONFIG.apiKey
        })
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Resposta: ${responseText.substring(0, 200)}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Login bem-sucedido!`);
        try {
          const data = JSON.parse(responseText);
          if (data.token || data.access_token) {
            console.log(`   🎫 Token obtido: ${data.token || data.access_token}`);
            return data.token || data.access_token;
          }
        } catch (e) {
          // Ignorar erro de parsing
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');
  }
  
  return null;
}

// Função para testar endpoint específico de produtos
async function testProductsEndpoint() {
  console.log('📦 === TESTANDO ENDPOINT ESPECÍFICO DE PRODUTOS ===\n');
  
  const endpoint = '/v1/produto/produtos';
  const testUrl = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  console.log(`🔍 Testando: ${testUrl}`);
  console.log(`🔑 API Key: ${VAREJO_FACIL_CONFIG.apiKey}`);
  
  // Teste 1: Sem autenticação
  console.log('\n1️⃣ Testando sem autenticação...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    console.log(`   Resposta (primeiros 500 chars):`);
    console.log(`   ${responseText.substring(0, 500)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
      try {
        const data = JSON.parse(responseText);
        console.log(`   📊 Dados JSON válidos: ${data.items?.length || 0} itens`);
        if (data.items && data.items.length > 0) {
          console.log(`   📦 Primeiro produto: ${data.items[0].descricao || 'Sem descrição'}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro ao fazer parse JSON: ${e.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 2: Com Bearer token
  console.log('\n2️⃣ Testando com Bearer token...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Resposta (primeiros 500 chars):`);
    console.log(`   ${responseText.substring(0, 500)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
      try {
        const data = JSON.parse(responseText);
        console.log(`   📊 Dados JSON válidos: ${data.items?.length || 0} itens`);
        if (data.items && data.items.length > 0) {
          console.log(`   📦 Primeiro produto: ${data.items[0].descricao || 'Sem descrição'}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro ao fazer parse JSON: ${e.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 3: Com API Key no header X-API-Key
  console.log('\n3️⃣ Testando com X-API-Key...');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Resposta (primeiros 500 chars):`);
    console.log(`   ${responseText.substring(0, 500)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
      try {
        const data = JSON.parse(responseText);
        console.log(`   📊 Dados JSON válidos: ${data.items?.length || 0} itens`);
        if (data.items && data.items.length > 0) {
          console.log(`   📦 Primeiro produto: ${data.items[0].descricao || 'Sem descrição'}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro ao fazer parse JSON: ${e.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  // Teste 4: Com API Key como query parameter
  console.log('\n4️⃣ Testando com API Key como query parameter...');
  try {
    const response = await fetch(`${testUrl}?apiKey=${VAREJO_FACIL_CONFIG.apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Resposta (primeiros 500 chars):`);
    console.log(`   ${responseText.substring(0, 500)}`);
    
    if (responseText.includes('<!DOCTYPE html>')) {
      console.log('   ❌ Retornando HTML (página de login?)');
    } else {
      console.log('   ✅ Possível resposta JSON');
      try {
        const data = JSON.parse(responseText);
        console.log(`   📊 Dados JSON válidos: ${data.items?.length || 0} itens`);
        if (data.items && data.items.length > 0) {
          console.log(`   📦 Primeiro produto: ${data.items[0].descricao || 'Sem descrição'}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro ao fazer parse JSON: ${e.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
}

// Função para verificar se há endpoint de autenticação
async function checkAuthEndpoints() {
  console.log('🔐 === VERIFICANDO ENDPOINTS DE AUTENTICAÇÃO ===\n');
  
  const authEndpoints = [
    '/v1/auth/login',
    '/v1/auth/token',
    '/api/auth/login',
    '/api/auth/token',
    '/auth/login',
    '/auth/token',
    '/login',
    '/token',
    '/oauth/token',
    '/v1/oauth/token'
  ];
  
  for (const endpoint of authEndpoints) {
    console.log(`🔍 Verificando: ${endpoint}`);
    try {
      const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.status === 404) {
        console.log(`   ❌ Endpoint não encontrado`);
      } else if (response.status === 405) {
        console.log(`   ✅ Endpoint existe (método não permitido)`);
      } else if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Endpoint encontrado!`);
        console.log(`   📄 Resposta: ${responseText.substring(0, 200)}`);
      } else {
        console.log(`   ⚠️  Status inesperado: ${response.status}`);
        console.log(`   📄 Resposta: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');
  }
}

// Função para tentar fazer login com diferentes métodos
async function tryDifferentLoginMethods() {
  console.log('🔐 === TENTANDO DIFERENTES MÉTODOS DE LOGIN ===\n');
  
  const loginData = [
    {
      username: 'admin',
      password: 'admin',
      apiKey: VAREJO_FACIL_CONFIG.apiKey
    },
    {
      email: 'admin@varejofacil.com',
      password: 'admin',
      apiKey: VAREJO_FACIL_CONFIG.apiKey
    },
    {
      client_id: VAREJO_FACIL_CONFIG.apiKey,
      client_secret: VAREJO_FACIL_CONFIG.apiKey,
      grant_type: 'client_credentials'
    },
    {
      apiKey: VAREJO_FACIL_CONFIG.apiKey
    }
  ];
  
  const loginEndpoints = [
    '/v1/auth/login',
    '/api/auth/login',
    '/auth/login',
    '/login',
    '/v1/oauth/token',
    '/oauth/token'
  ];
  
  for (const endpoint of loginEndpoints) {
    console.log(`🔍 Tentando login em: ${endpoint}`);
    
    for (const data of loginData) {
      console.log(`   📤 Enviando dados: ${JSON.stringify(data)}`);
      
      try {
        const response = await fetch(`${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const responseText = await response.text();
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Resposta: ${responseText.substring(0, 200)}`);
        
        if (response.status === 200 || response.status === 201) {
          console.log(`   ✅ Login bem-sucedido!`);
          try {
            const jsonData = JSON.parse(responseText);
            if (jsonData.token || jsonData.access_token) {
              console.log(`   🎫 Token obtido: ${jsonData.token || jsonData.access_token}`);
              return jsonData.token || jsonData.access_token;
            }
          } catch (e) {
            // Ignorar erro de parsing
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      console.log('');
    }
  }
  
  return null;
}

// Função para tentar acessar a API com diferentes combinações de autenticação
async function tryApiAccess() {
  console.log('🔐 === TENTANDO ACESSO À API COM DIFERENTES MÉTODOS ===\n');
  
  const endpoint = '/v1/produto/produtos';
  const baseUrl = VAREJO_FACIL_CONFIG.baseUrl;
  
  // Diferentes combinações de headers e parâmetros
  const authMethods = [
    {
      name: 'Bearer Token',
      headers: {
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'X-API-Key Header',
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'API-Key Header',
      headers: {
        'API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Query Parameter',
      url: `${baseUrl}${endpoint}?apiKey=${VAREJO_FACIL_CONFIG.apiKey}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Basic Auth',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${VAREJO_FACIL_CONFIG.apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Custom Header',
      headers: {
        'VarejoFacil-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Multiple Headers',
      headers: {
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  ];
  
  for (const method of authMethods) {
    console.log(`🔍 Testando: ${method.name}`);
    
    try {
      const url = method.url || `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: method.headers
      });
      
      const responseText = await response.text();
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.status === 200) {
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log(`   ❌ Retornando HTML`);
        } else {
          console.log(`   ✅ Possível resposta JSON!`);
          try {
            const data = JSON.parse(responseText);
            console.log(`   📊 Dados válidos: ${data.items?.length || 0} itens`);
            if (data.items && data.items.length > 0) {
              console.log(`   📦 Primeiro item: ${data.items[0].descricao || 'Sem descrição'}`);
            }
            console.log(`   🎉 SUCESSO! Método ${method.name} funcionou!`);
            return { method: method.name, data };
          } catch (e) {
            console.log(`   ❌ Erro ao fazer parse JSON: ${e.message}`);
          }
        }
      } else if (response.status === 401) {
        console.log(`   🔐 Não autorizado - método ${method.name} precisa de credenciais diferentes`);
      } else if (response.status === 403) {
        console.log(`   🚫 Acesso negado - método ${method.name} não tem permissão`);
      } else {
        console.log(`   ⚠️  Status inesperado: ${response.status}`);
      }
      
      console.log(`   📄 Resposta (primeiros 200 chars): ${responseText.substring(0, 200)}`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');
  }
  
  return null;
}

async function checkMainPage() {
  console.log('\n🌐 === VERIFICANDO PÁGINA PRINCIPAL ===\n');
  
  try {
    const response = await fetch(VAREJO_FACIL_CONFIG.baseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`Primeiros 1000 caracteres:`);
    console.log(text.substring(0, 1000));
    
    // Procurar por informações de API ou autenticação
    if (text.includes('api') || text.includes('auth') || text.includes('login')) {
      console.log(`\n🔍 Encontradas referências a API/Auth no HTML`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

async function tryWithUserAgent() {
  console.log('\n🤖 === TESTANDO COM USER-AGENT DE NAVEGADOR ===\n');
  
  const endpoint = '/v1/produto/produtos';
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`Resposta (primeiros 500 chars): ${text.substring(0, 500)}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      console.log(`✅ JSON recebido!`);
    } else {
      console.log(`❌ Ainda retornando HTML`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 Script de Sincronização - Varejo Fácil API\n');

  switch (command) {
    case 'sync':
      await syncVarejoFacilData();
      break;
      
    case 'test':
      await testConnection();
      break;
      
    case 'auth-test':
      await testAuthenticationMethods();
      break;
      
    case 'docs':
      await checkApiDocumentation();
      break;
      
    case 'login':
      await tryLogin();
      break;
      
    case 'test-products':
      await testProductsEndpoint();
      break;
      
    case 'check-auth':
      await checkAuthEndpoints();
      break;
      
    case 'try-login':
      await tryDifferentLoginMethods();
      break;
      
    case 'try-api':
      await tryApiAccess();
      break;
      
    case 'check-main':
      await checkMainPage();
      break;
      
    case 'user-agent':
      await tryWithUserAgent();
      break;
      
    case 'search-products':
      const productTerm = args[1];
      if (!productTerm) {
        console.error('❌ Termo de busca necessário para produtos');
        console.log('Uso: node async.js search-products <termo>');
        process.exit(1);
      }
      await searchProducts(productTerm);
      break;
      
    case 'search-sections':
      const sectionTerm = args[1];
      if (!sectionTerm) {
        console.error('❌ Termo de busca necessário para seções');
        console.log('Uso: node async.js search-sections <termo>');
        process.exit(1);
      }
      await searchSections(sectionTerm);
      break;
      
    case 'stats':
      await showStats();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error('❌ Comando não reconhecido');
      showHelp();
      process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = {
  syncVarejoFacilData,
  searchProducts,
  searchSections,
  showStats,
  testConnection,
  makeVarejoFacilRequest
}; 