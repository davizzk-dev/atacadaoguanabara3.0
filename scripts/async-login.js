// Script Async Varejo Fácil - Com Login
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

// Variável para armazenar cookies de sessão
let sessionCookies = '';

// Função para fazer login
async function login() {
  console.log('🔐 === TENTANDO LOGIN ===');
  
  try {
    // Primeiro, acessar a página de login para obter cookies iniciais
    console.log('📄 Acessando página de login...');
    const loginPageResponse = await fetch(`${BASE_URL}/app/#/login`, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'manual'
    });

    // Extrair cookies da resposta
    const setCookieHeader = loginPageResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      sessionCookies = setCookieHeader;
      console.log('🍪 Cookies iniciais obtidos');
    }

    // Tentar diferentes métodos de login
    const loginMethods = [
      {
        name: 'API Key como Query Parameter',
        url: `${BASE_URL}/api/produtos?apiKey=${API_KEY}`,
        headers: { ...BROWSER_HEADERS, 'Accept': 'application/json' }
      },
      {
        name: 'API Key como Header X-API-Key',
        url: `${BASE_URL}/api/produtos`,
        headers: { 
          ...BROWSER_HEADERS, 
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      },
      {
        name: 'API Key como Header Authorization Bearer',
        url: `${BASE_URL}/api/produtos`,
        headers: { 
          ...BROWSER_HEADERS, 
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      },
      {
        name: 'API Key como Header Authorization Basic',
        url: `${BASE_URL}/api/produtos`,
        headers: { 
          ...BROWSER_HEADERS, 
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`
        }
      }
    ];

    for (const method of loginMethods) {
      console.log(`\n🔍 Tentando: ${method.name}`);
      
      const response = await fetch(method.url, {
        method: 'GET',
        headers: method.headers,
        redirect: 'manual'
      });

      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ Login funcionou com ${method.name}!`);
          console.log(`📦 ${data.items?.length || 0} produtos encontrados`);
          return { success: true, method: method.name, data };
        }
      } else if (response.status === 401) {
        console.log('❌ 401 Unauthorized - método não funcionou');
      } else if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        console.log(`🔄 Redirecionado para: ${location}`);
      }
    }

    console.log('❌ Nenhum método de login funcionou');
    return { success: false };

  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para fazer requisição com sessão
async function fetchWithSession(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    console.log(`🌐 Fazendo requisição: ${url}`);
    
    const headers = {
      ...BROWSER_HEADERS,
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'X-API-Key': API_KEY
    };

    if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual'
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ JSON recebido: ${data.items?.length || 0} itens`);
        return { success: true, data };
      } else {
        const text = await response.text();
        console.log(`📄 HTML recebido (${text.length} chars)`);
        
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

// Função para extrair dados do HTML
function extractDataFromHTML(html) {
  console.log('🔍 Tentando extrair dados do HTML...');
  
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
  
  // Se já temos dados do login, usar eles
  if (global.loginData && global.loginData.success) {
    console.log('✅ Usando dados do login bem-sucedido');
    return global.loginData.data;
  }
  
  // Tentar diferentes endpoints
  const endpoints = [
    '/api/produtos',
    '/api/v1/produtos',
    '/api/v1/produto/produtos',
    '/rest/produtos',
    '/api/rest/produtos'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Tentando: ${endpoint}`);
    const result = await fetchWithSession(endpoint);
    
    if (result.success) {
      console.log(`✅ Sucesso com ${endpoint}`);
      return result.data;
    }
    
    // Pausa entre tentativas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('❌ Nenhum endpoint funcionou');
  return { items: [] };
}

// Função para buscar seções
async function getSections() {
  console.log('\n📂 === BUSCANDO SEÇÕES ===');
  const result = await fetchWithSession('/api/secoes');
  return result.success ? result.data : { items: [] };
}

// Função para buscar marcas
async function getBrands() {
  console.log('\n🏷️ === BUSCANDO MARCAS ===');
  const result = await fetchWithSession('/api/marcas');
  return result.success ? result.data : { items: [] };
}

// Função para buscar gêneros
async function getGenres() {
  console.log('\n📚 === BUSCANDO GÊNEROS ===');
  const result = await fetchWithSession('/api/generos');
  return result.success ? result.data : { items: [] };
}

// Função para buscar preços
async function getPrices() {
  console.log('\n💰 === BUSCANDO PREÇOS ===');
  const result = await fetchWithSession('/api/precos');
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
  console.log('🚀 === SINCRONIZAÇÃO VAREJO FÁCIL (COM LOGIN) ===\n');
  
  try {
    const startTime = Date.now();
    
    // Tentar fazer login primeiro
    const loginResult = await login();
    global.loginData = loginResult;
    
    if (loginResult.success) {
      console.log(`✅ Login bem-sucedido com: ${loginResult.method}`);
    } else {
      console.log('⚠️ Login não funcionou, tentando sem sessão...');
    }
    
    // Buscar produtos
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
  console.log('🧪 === TESTE DE LOGIN ===\n');
  
  try {
    const loginResult = await login();
    
    if (loginResult.success) {
      console.log('✅ Login funcionou!');
      console.log(`📋 Método: ${loginResult.method}`);
      console.log(`📦 ${loginResult.data.items?.length || 0} produtos encontrados`);
    } else {
      console.log('❌ Login não funcionou');
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
  console.log('Uso: node async-login.js [test|sync]');
  console.log('  test - Testar login');
  console.log('  sync - Sincronizar dados com login');
}

module.exports = { sync, test, login }; 