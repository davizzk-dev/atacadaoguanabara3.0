// Script Async Varejo Fácil - Versão Simples
const fs = require('fs').promises;
const path = require('path');

// Configurações
const BASE_URL = 'https://atacadaoguanabara.varejofacil.com';
const API_KEY = '2625e98175832a17a954db9beb60306a';

// Função para fazer requisição
async function fetchData(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    console.log(`🔍 Fazendo requisição: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`📊 Status: ${response.status}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ JSON recebido: ${data.items?.length || 0} itens`);
        return data;
      } else {
        const text = await response.text();
        console.log(`📄 HTML recebido (${text.length} chars)`);
        
        // Se for HTML, pode ser que a API esteja em outro lugar
        // Vamos tentar extrair dados do HTML se possível
        return extractDataFromHTML(text);
      }
    } else {
      console.log(`❌ Erro HTTP: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro na requisição: ${error.message}`);
    return null;
  }
}

// Função para extrair dados do HTML (se necessário)
function extractDataFromHTML(html) {
  console.log('🔍 Tentando extrair dados do HTML...');
  
  // Procurar por dados JSON no HTML
  const jsonMatches = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
  if (jsonMatches) {
    try {
      const data = JSON.parse(jsonMatches[1]);
      console.log('✅ Dados encontrados no HTML');
      return data;
    } catch (e) {
      console.log('❌ Erro ao parsear JSON do HTML');
    }
  }
  
  // Procurar por outros padrões de dados
  const dataMatches = html.match(/data-products\s*=\s*"([^"]+)"/);
  if (dataMatches) {
    try {
      const decoded = decodeURIComponent(dataMatches[1]);
      const data = JSON.parse(decoded);
      console.log('✅ Dados encontrados em atributo data');
      return data;
    } catch (e) {
      console.log('❌ Erro ao parsear dados do atributo');
    }
  }
  
  console.log('❌ Nenhum dado encontrado no HTML');
  return null;
}

// Função para buscar produtos
async function getProducts() {
  console.log('\n📦 === BUSCANDO PRODUTOS ===');
  
  // Tentar diferentes endpoints
  const endpoints = [
    '/v1/produto/produtos',
    '/api/produtos',
    '/api/v1/produtos',
    '/produtos',
    '/v1/produtos',
    '/api/v1/produto/produtos'
  ];

  for (const endpoint of endpoints) {
    const data = await fetchData(endpoint);
    if (data && (data.items || data.products)) {
      console.log(`✅ Produtos encontrados via ${endpoint}`);
      return data;
    }
  }
  
  console.log('❌ Nenhum endpoint funcionou para produtos');
  return { items: [] };
}

// Função para buscar seções
async function getSections() {
  console.log('\n📂 === BUSCANDO SEÇÕES ===');
  const data = await fetchData('/v1/produto/secoes');
  return data || { items: [] };
}

// Função para buscar marcas
async function getBrands() {
  console.log('\n🏷️ === BUSCANDO MARCAS ===');
  const data = await fetchData('/v1/produto/marcas');
  return data || { items: [] };
}

// Função para buscar gêneros
async function getGenres() {
  console.log('\n📚 === BUSCANDO GÊNEROS ===');
  const data = await fetchData('/v1/produto/generos');
  return data || { items: [] };
}

// Função para buscar preços
async function getPrices() {
  console.log('\n💰 === BUSCANDO PREÇOS ===');
  const data = await fetchData('/v1/produto/precos');
  return data || { items: [] };
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

// Função principal
async function sync() {
  console.log('🚀 === SINCRONIZAÇÃO VAREJO FÁCIL ===\n');
  
  try {
    const startTime = Date.now();
    
    // Buscar todos os dados
    const [products, sections, brands, genres, prices] = await Promise.all([
      getProducts(),
      getSections(),
      getBrands(),
      getGenres(),
      getPrices()
    ]);

    // Preparar dados para salvar
    const syncData = {
      lastSync: new Date().toISOString(),
      products: products.items || products.products || [],
      sections: sections.items || [],
      brands: brands.items || [],
      genres: genres.items || [],
      prices: prices.items || [],
      totalProducts: (products.items || products.products || []).length,
      totalSections: (sections.items || []).length,
      totalBrands: (brands.items || []).length,
      totalGenres: (genres.items || []).length,
      totalPrices: (prices.items || []).length
    };

    // Salvar dados
    await saveData(syncData);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n🎉 === SINCRONIZAÇÃO CONCLUÍDA ===');
    console.log(`⏱️ Tempo: ${duration} segundos`);
    console.log(`📦 Produtos: ${syncData.totalProducts}`);
    console.log(`📂 Seções: ${syncData.totalSections}`);
    console.log(`🏷️ Marcas: ${syncData.totalBrands}`);
    console.log(`📚 Gêneros: ${syncData.totalGenres}`);
    console.log(`💰 Preços: ${syncData.totalPrices}`);

    return syncData;

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    throw error;
  }
}

// Função para testar
async function test() {
  console.log('🧪 === TESTE DE CONEXÃO ===\n');
  
  try {
    const data = await fetchData('/v1/produto/produtos');
    
    if (data) {
      console.log('✅ Conexão funcionando!');
      if (data.items) {
        console.log(`📦 ${data.items.length} produtos encontrados`);
        if (data.items.length > 0) {
          console.log(`📋 Exemplo: ${data.items[0].descricao || data.items[0].id}`);
        }
      }
    } else {
      console.log('❌ Conexão falhou');
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar baseado no comando
const command = process.argv[2];

if (command === 'test') {
  test();
} else if (command === 'sync') {
  sync();
} else {
  console.log('Uso: node async-varejo-facil-simple.js [test|sync]');
  console.log('  test - Testar conexão');
  console.log('  sync - Sincronizar dados');
}

module.exports = { sync, test, fetchData }; 