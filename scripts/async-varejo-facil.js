// Script Async para Varejo Fácil - Versão Simplificada
const fs = require('fs').promises;
const path = require('path');

// Configurações
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
};

// Função para fazer requisição simples
async function makeRequest(endpoint, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  const requestOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
      ...options.headers
    }
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    console.log(`🌐 Fazendo requisição: ${url}`);
    const response = await fetch(url, requestOptions);
    
    console.log(`📊 Status: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(`📄 Resposta não é JSON: ${text.substring(0, 200)}`);
      return { success: false, error: 'Resposta não é JSON', text };
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para buscar produtos
async function getProducts() {
  console.log('📦 Buscando produtos...');
  
  // Tentar diferentes endpoints
  const endpoints = [
    '/v1/produto/produtos',
    '/api/produtos',
    '/api/v1/produtos',
    '/produtos'
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Tentando: ${endpoint}`);
    const result = await makeRequest(endpoint);
    
    if (result.success && result.data) {
      console.log(`✅ Sucesso com ${endpoint}`);
      return result.data;
    }
  }
  
  throw new Error('Nenhum endpoint funcionou');
}

// Função para buscar seções
async function getSections() {
  console.log('📂 Buscando seções...');
  const result = await makeRequest('/v1/produto/secoes');
  return result.success ? result.data : { items: [] };
}

// Função para buscar marcas
async function getBrands() {
  console.log('🏷️ Buscando marcas...');
  const result = await makeRequest('/v1/produto/marcas');
  return result.success ? result.data : { items: [] };
}

// Função para buscar gêneros
async function getGenres() {
  console.log('📚 Buscando gêneros...');
  const result = await makeRequest('/v1/produto/generos');
  return result.success ? result.data : { items: [] };
}

// Função para buscar preços
async function getPrices() {
  console.log('💰 Buscando preços...');
  const result = await makeRequest('/v1/produto/precos');
  return result.success ? result.data : { items: [] };
}

// Função para salvar dados
async function saveData(data) {
  const dataDir = path.join(__dirname, '..', 'data');
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Diretório já existe
  }
  
  const filePath = path.join(dataDir, 'products.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  
  console.log(`💾 Dados salvos em: ${filePath}`);
}

// Função principal de sincronização
async function syncVarejoFacil() {
  console.log('🚀 Iniciando sincronização do Varejo Fácil...\n');
  
  try {
    const syncData = {
      lastSync: new Date().toISOString(),
      products: [],
      sections: [],
      brands: [],
      genres: [],
      prices: [],
      totalProducts: 0,
      totalSections: 0,
      totalBrands: 0,
      totalGenres: 0,
      totalPrices: 0
    };

    // Buscar todos os dados
    const [products, sections, brands, genres, prices] = await Promise.all([
      getProducts(),
      getSections(),
      getBrands(),
      getGenres(),
      getPrices()
    ]);

    // Processar produtos
    if (products && products.items) {
      syncData.products = products.items;
      syncData.totalProducts = products.items.length;
      console.log(`✅ ${syncData.totalProducts} produtos encontrados`);
    }

    // Processar seções
    if (sections && sections.items) {
      syncData.sections = sections.items;
      syncData.totalSections = sections.items.length;
      console.log(`✅ ${syncData.totalSections} seções encontradas`);
    }

    // Processar marcas
    if (brands && brands.items) {
      syncData.brands = brands.items;
      syncData.totalBrands = brands.items.length;
      console.log(`✅ ${syncData.totalBrands} marcas encontradas`);
    }

    // Processar gêneros
    if (genres && genres.items) {
      syncData.genres = genres.items;
      syncData.totalGenres = genres.items.length;
      console.log(`✅ ${syncData.totalGenres} gêneros encontrados`);
    }

    // Processar preços
    if (prices && prices.items) {
      syncData.prices = prices.items;
      syncData.totalPrices = prices.items.length;
      console.log(`✅ ${syncData.totalPrices} preços encontrados`);
    }

    // Salvar dados
    await saveData(syncData);

    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - Produtos: ${syncData.totalProducts}`);
    console.log(`   - Seções: ${syncData.totalSections}`);
    console.log(`   - Marcas: ${syncData.totalBrands}`);
    console.log(`   - Gêneros: ${syncData.totalGenres}`);
    console.log(`   - Preços: ${syncData.totalPrices}`);

    return syncData;

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    throw error;
  }
}

// Função para testar conexão
async function testConnection() {
  console.log('🧪 Testando conexão com Varejo Fácil...\n');
  
  try {
    const result = await makeRequest('/v1/produto/produtos');
    
    if (result.success) {
      console.log('✅ Conexão funcionando!');
      console.log(`📦 Produtos encontrados: ${result.data.items?.length || 0}`);
      return true;
    } else {
      console.log('❌ Conexão falhou');
      console.log(`📄 Resposta: ${result.text?.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testConnection();
      break;
    case 'sync':
      await syncVarejoFacil();
      break;
    default:
      console.log('Uso: node async-varejo-facil.js [test|sync]');
      console.log('  test - Testar conexão');
      console.log('  sync - Sincronizar dados');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncVarejoFacil,
  testConnection,
  makeRequest
}; 