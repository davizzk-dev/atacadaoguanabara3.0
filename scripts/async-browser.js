// Script Async Varejo Fácil - Simulando Navegador Real
const fs = require('fs').promises;
const path = require('path');

// Configurações
const BASE_URL = 'https://atacadaoguanabara.varejofacil.com';
const API_KEY = '2625e98175832a17a954db9beb60306a';

// Headers que simulam um navegador real
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0'
};

// Headers para API (quando necessário)
const API_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'DNT': '1',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
};

// Função para fazer requisição simulando navegador
async function fetchLikeBrowser(endpoint, useApiHeaders = false) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = useApiHeaders ? API_HEADERS : BROWSER_HEADERS;
  
  try {
    console.log(`🌐 Fazendo requisição: ${url}`);
    console.log(`📋 Headers: ${useApiHeaders ? 'API' : 'Browser'}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual' // Não seguir redirecionamentos automaticamente
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Location: ${response.headers.get('location')}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    // Se foi redirecionado, tentar seguir manualmente
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log(`🔄 Redirecionado para: ${location}`);
        return await followRedirect(location, useApiHeaders);
      }
    }

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ JSON recebido: ${data.items?.length || 0} itens`);
        return { success: true, data };
      } else {
        const text = await response.text();
        console.log(`📄 HTML recebido (${text.length} chars)`);
        
        // Verificar se é página de login
        if (text.includes('login') || text.includes('Login') || text.includes('LOGIN')) {
          console.log('🔐 Página de login detectada!');
          return { success: false, error: 'Redirecionado para login' };
        }
        
        // Tentar extrair dados do HTML
        const extractedData = extractDataFromHTML(text);
        if (extractedData) {
          return { success: true, data: extractedData };
        }
      }
    } else {
      console.log(`❌ HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
  
  return { success: false };
}

// Função para seguir redirecionamento manualmente
async function followRedirect(location, useApiHeaders) {
  try {
    console.log(`🔄 Seguindo redirecionamento: ${location}`);
    
    const headers = useApiHeaders ? API_HEADERS : BROWSER_HEADERS;
    
    const response = await fetch(location, {
      method: 'GET',
      headers,
      redirect: 'manual'
    });

    console.log(`📊 Status após redirecionamento: ${response.status}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const text = await response.text();
        const extractedData = extractDataFromHTML(text);
        if (extractedData) {
          return { success: true, data: extractedData };
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro no redirecionamento: ${error.message}`);
  }
  
  return { success: false };
}

// Função para extrair dados do HTML
function extractDataFromHTML(html) {
  console.log('🔍 Tentando extrair dados do HTML...');
  
  // Procurar por diferentes padrões de dados
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({.*?});/,
    /window\.products\s*=\s*(\[.*?\]);/,
    /data-products\s*=\s*"([^"]+)"/,
    /var\s+products\s*=\s*(\[.*?\]);/,
    /"products":\s*(\[.*?\])/,
    /"items":\s*(\[.*?\])/,
    /window\.app\s*=\s*({.*?});/,
    /window\.data\s*=\s*({.*?});/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        let data;
        if (pattern.source.includes('data-products')) {
          data = JSON.parse(decodeURIComponent(match[1]));
        } else {
          data = JSON.parse(match[1]);
        }
        
        if (data && (Array.isArray(data) || data.items || data.products)) {
          console.log('✅ Dados extraídos do HTML');
          return { items: Array.isArray(data) ? data : (data.items || data.products || []) };
        }
      } catch (e) {
        console.log('❌ Erro ao parsear dados do HTML');
      }
    }
  }
  
  return null;
}

// Função para buscar produtos
async function getProducts() {
  console.log('\n📦 === BUSCANDO PRODUTOS ===');
  
  // Tentar diferentes abordagens
  const attempts = [
    { endpoint: '/v1/produto/produtos', useApi: true },
    { endpoint: '/api/produtos', useApi: true },
    { endpoint: '/produtos', useApi: false },
    { endpoint: '/v1/produtos', useApi: false },
    { endpoint: '/', useApi: false }, // Página inicial
    { endpoint: '/catalogo', useApi: false },
    { endpoint: '/produtos/catalogo', useApi: false }
  ];

  for (const attempt of attempts) {
    console.log(`\n🔍 Tentativa: ${attempt.endpoint} (${attempt.useApi ? 'API' : 'Browser'})`);
    const result = await fetchLikeBrowser(attempt.endpoint, attempt.useApi);
    
    if (result.success) {
      console.log(`✅ Sucesso com ${attempt.endpoint}`);
      return result.data;
    }
    
    // Pausa entre tentativas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('❌ Nenhuma tentativa funcionou');
  return { items: [] };
}

// Função para buscar seções
async function getSections() {
  console.log('\n📂 === BUSCANDO SEÇÕES ===');
  const result = await fetchLikeBrowser('/v1/produto/secoes', true);
  return result.success ? result.data : { items: [] };
}

// Função para buscar marcas
async function getBrands() {
  console.log('\n🏷️ === BUSCANDO MARCAS ===');
  const result = await fetchLikeBrowser('/v1/produto/marcas', true);
  return result.success ? result.data : { items: [] };
}

// Função para buscar gêneros
async function getGenres() {
  console.log('\n📚 === BUSCANDO GÊNEROS ===');
  const result = await fetchLikeBrowser('/v1/produto/generos', true);
  return result.success ? result.data : { items: [] };
}

// Função para buscar preços
async function getPrices() {
  console.log('\n💰 === BUSCANDO PREÇOS ===');
  const result = await fetchLikeBrowser('/v1/produto/precos', true);
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

// Função principal
async function sync() {
  console.log('🚀 === SINCRONIZAÇÃO VAREJO FÁCIL (BROWSER) ===\n');
  
  try {
    const startTime = Date.now();
    
    // Buscar produtos primeiro (mais importante)
    const products = await getProducts();
    
    // Preparar dados para salvar
    const syncData = {
      lastSync: new Date().toISOString(),
      products: products.items || products.products || [],
      sections: [],
      brands: [],
      genres: [],
      prices: [],
      totalProducts: (products.items || products.products || []).length,
      totalSections: 0,
      totalBrands: 0,
      totalGenres: 0,
      totalPrices: 0
    };

    console.log(`✅ ${syncData.totalProducts} produtos encontrados`);

    // Se encontrou produtos, tentar buscar outros dados
    if (syncData.totalProducts > 0) {
      console.log('\n🔄 Buscando dados adicionais...');
      
      const [sections, brands, genres, prices] = await Promise.all([
        getSections(),
        getBrands(),
        getGenres(),
        getPrices()
      ]);

      syncData.sections = sections.items || [];
      syncData.brands = brands.items || [];
      syncData.genres = genres.items || [];
      syncData.prices = prices.items || [];
      
      syncData.totalSections = syncData.sections.length;
      syncData.totalBrands = syncData.brands.length;
      syncData.totalGenres = syncData.genres.length;
      syncData.totalPrices = syncData.prices.length;
    }

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
  console.log('🧪 === TESTE DE CONEXÃO (BROWSER) ===\n');
  
  try {
    // Testar página inicial primeiro
    console.log('🔍 Testando página inicial...');
    const homeResult = await fetchLikeBrowser('/', false);
    
    if (homeResult.success) {
      console.log('✅ Página inicial acessível');
    } else {
      console.log('❌ Página inicial não acessível');
    }
    
    // Testar produtos
    console.log('\n🔍 Testando produtos...');
    const productsResult = await fetchLikeBrowser('/v1/produto/produtos', true);
    
    if (productsResult.success) {
      console.log('✅ API de produtos funcionando!');
      console.log(`📦 ${productsResult.data.items?.length || 0} produtos encontrados`);
    } else {
      console.log('❌ API de produtos não funcionou');
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
  console.log('Uso: node async-browser.js [test|sync]');
  console.log('  test - Testar conexão simulando navegador');
  console.log('  sync - Sincronizar dados simulando navegador');
}

module.exports = { sync, test, fetchLikeBrowser }; 