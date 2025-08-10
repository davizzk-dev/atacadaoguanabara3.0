// Script Async Varejo Fácil - Web Scraping
const fs = require('fs').promises;
const path = require('path');

// Configurações
const BASE_URL = 'https://atacadaoguanabara.varejofacil.com';
const API_KEY = '2625e98175832a17a954db9beb60306a';
const USERNAME = 'Guilherme';
const PASSWORD = '6952';

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

// Função para fazer login e obter sessão
async function getSession() {
  console.log('🔐 === OBTENDO SESSÃO ===');
  
  try {
    // 1. Acessar a página inicial
    console.log('📄 Acessando página inicial...');
    const homeResponse = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'manual'
    });

    // Extrair cookies da resposta inicial
    const setCookieHeader = homeResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      sessionCookies = setCookieHeader;
      console.log('🍪 Cookies iniciais obtidos');
    }

    // 2. Acessar página de login
    console.log('🔐 Acessando página de login...');
    const loginPageResponse = await fetch(`${BASE_URL}/app/#/login`, {
      method: 'GET',
      headers: {
        ...BROWSER_HEADERS,
        'Cookie': sessionCookies
      },
      redirect: 'manual'
    });

    // Atualizar cookies se necessário
    const loginSetCookie = loginPageResponse.headers.get('set-cookie');
    if (loginSetCookie) {
      sessionCookies = loginSetCookie;
      console.log('🍪 Cookies de login atualizados');
    }

    console.log('✅ Sessão obtida com sucesso');
    return true;

  } catch (error) {
    console.error('❌ Erro ao obter sessão:', error.message);
    return false;
  }
}

// Função para fazer web scraping de páginas
async function scrapePage(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    console.log(`🌐 Fazendo scraping: ${url}`);
    
    const headers = {
      ...BROWSER_HEADERS,
      'Cookie': sessionCookies
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual'
    });

    console.log(`📊 Status: ${response.status}`);

    if (response.ok) {
      const text = await response.text();
      console.log(`📄 HTML recebido (${text.length} chars)`);
      
      // Extrair dados do HTML
      const extractedData = extractDataFromHTML(text);
      if (extractedData) {
        return { success: true, data: extractedData };
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
  
  // Procurar por diferentes padrões de dados
  const patterns = [
    // Padrões comuns de dados JSON
    /window\.__INITIAL_STATE__\s*=\s*({.*?});/,
    /window\.products\s*=\s*(\[.*?\]);/,
    /window\.catalog\s*=\s*(\[.*?\]);/,
    /window\.inventory\s*=\s*(\[.*?\]);/,
    /window\.data\s*=\s*({.*?});/,
    /window\.app\s*=\s*({.*?});/,
    
    // Padrões de atributos data
    /data-products\s*=\s*"([^"]+)"/,
    /data-catalog\s*=\s*"([^"]+)"/,
    /data-inventory\s*=\s*"([^"]+)"/,
    
    // Padrões de variáveis
    /var\s+products\s*=\s*(\[.*?\]);/,
    /var\s+catalog\s*=\s*(\[.*?\]);/,
    /var\s+inventory\s*=\s*(\[.*?\]);/,
    
    // Padrões de objetos JSON
    /"products":\s*(\[.*?\])/,
    /"items":\s*(\[.*?\])/,
    /"catalog":\s*(\[.*?\])/,
    /"inventory":\s*(\[.*?\])/,
    
    // Padrões específicos do Vue.js
    /__NUXT__\s*=\s*({.*?});/,
    /__INITIAL_STATE__\s*=\s*({.*?});/,
    
    // Padrões de scripts inline
    /<script[^>]*>([^<]*products[^<]*)<\/script>/gi,
    /<script[^>]*>([^<]*catalog[^<]*)<\/script>/gi,
    /<script[^>]*>([^<]*inventory[^<]*)<\/script>/gi
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        let data;
        if (pattern.source.includes('data-products') || pattern.source.includes('data-catalog') || pattern.source.includes('data-inventory')) {
          data = JSON.parse(decodeURIComponent(match[1]));
        } else {
          data = JSON.parse(match[1]);
        }
        
        if (data && (Array.isArray(data) || data.items || data.products || data.catalog || data.inventory)) {
          console.log('✅ Dados extraídos do HTML');
          const items = Array.isArray(data) ? data : (data.items || data.products || data.catalog || data.inventory || []);
          return { items };
        }
      } catch (e) {
        console.log('❌ Erro ao parsear dados do HTML');
      }
    }
  }
  
  // Se não encontrou dados estruturados, tentar extrair da tabela HTML
  console.log('🔍 Tentando extrair dados de tabelas HTML...');
  const tableData = extractTableData(html);
  if (tableData) {
    return tableData;
  }
  
  return null;
}

// Função para extrair dados de tabelas HTML
function extractTableData(html) {
  try {
    // Procurar por tabelas com produtos
    const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    if (tableMatches) {
      console.log(`📋 Encontradas ${tableMatches.length} tabelas`);
      
      const products = [];
      
      for (const table of tableMatches) {
        // Procurar por linhas da tabela
        const rowMatches = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        if (rowMatches) {
          for (const row of rowMatches) {
            // Procurar por células
            const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (cellMatches && cellMatches.length > 2) {
              const product = {
                id: products.length + 1,
                descricao: cellMatches[0]?.replace(/<[^>]*>/g, '').trim() || '',
                preco: cellMatches[1]?.replace(/<[^>]*>/g, '').trim() || '',
                categoria: cellMatches[2]?.replace(/<[^>]*>/g, '').trim() || ''
              };
              products.push(product);
            }
          }
        }
      }
      
      if (products.length > 0) {
        console.log(`✅ Extraídos ${products.length} produtos de tabelas`);
        return { items: products };
      }
    }
  } catch (e) {
    console.log('❌ Erro ao extrair dados de tabelas');
  }
  
  return null;
}

// Função para buscar produtos via web scraping
async function getProducts() {
  console.log('\n📦 === BUSCANDO PRODUTOS (WEB SCRAPING) ===');
  
  // Tentar diferentes páginas que podem conter produtos
  const pages = [
    '/',
    '/app/#/produtos',
    '/app/#/catalogo',
    '/app/#/inventory',
    '/produtos',
    '/catalogo',
    '/inventory',
    '/app/#/',
    '/app/#/home',
    '/app/#/dashboard'
  ];

  for (const page of pages) {
    console.log(`\n🔍 Tentando página: ${page}`);
    const result = await scrapePage(page);
    
    if (result.success) {
      console.log(`✅ Sucesso com ${page}`);
      return result.data;
    }
    
    // Pausa entre tentativas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('❌ Nenhuma página funcionou');
  return { items: [] };
}

// Função para buscar seções via web scraping
async function getSections() {
  console.log('\n📂 === BUSCANDO SEÇÕES (WEB SCRAPING) ===');
  const result = await scrapePage('/app/#/secoes');
  return result.success ? result.data : { items: [] };
}

// Função para buscar marcas via web scraping
async function getBrands() {
  console.log('\n🏷️ === BUSCANDO MARCAS (WEB SCRAPING) ===');
  const result = await scrapePage('/app/#/marcas');
  return result.success ? result.data : { items: [] };
}

// Função para buscar gêneros via web scraping
async function getGenres() {
  console.log('\n📚 === BUSCANDO GÊNEROS (WEB SCRAPING) ===');
  const result = await scrapePage('/app/#/generos');
  return result.success ? result.data : { items: [] };
}

// Função para buscar preços via web scraping
async function getPrices() {
  console.log('\n💰 === BUSCANDO PREÇOS (WEB SCRAPING) ===');
  const result = await scrapePage('/app/#/precos');
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
  console.log('🚀 === SINCRONIZAÇÃO VAREJO FÁCIL (WEB SCRAPING) ===\n');
  
  try {
    const startTime = Date.now();
    
    // Obter sessão primeiro
    const sessionResult = await getSession();
    if (!sessionResult) {
      console.log('❌ Não foi possível obter sessão');
      return;
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
  console.log('🧪 === TESTE DE WEB SCRAPING ===\n');
  
  try {
    // Obter sessão
    const sessionResult = await getSession();
    if (!sessionResult) {
      console.log('❌ Não foi possível obter sessão');
      return;
    }
    
    // Testar scraping da página inicial
    console.log('\n🔍 Testando scraping da página inicial...');
    const result = await scrapePage('/');
    
    if (result.success) {
      console.log('✅ Web scraping funcionou!');
      console.log(`📦 ${result.data.items?.length || 0} produtos encontrados`);
    } else {
      console.log('❌ Web scraping não funcionou');
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
  console.log('Uso: node async-web-scraping.js [test|sync]');
  console.log('  test - Testar web scraping');
  console.log('  sync - Sincronizar dados via web scraping');
}

module.exports = { sync, test, getSession }; 