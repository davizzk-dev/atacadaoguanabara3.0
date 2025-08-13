// Script Async Varejo Fácil - Versão que pode ter funcionado
const fs = require('fs').promises;
const path = require('path');

// Configurações
const CONFIGS = [
  {
    name: 'Config 1 - URL Original',
    baseUrl: 'https://atacadaoguanabara.varejofacil.com',
    apiKey: '2625e98175832a17a954db9beb60306a'
  },
  {
    name: 'Config 2 - API Subdomain',
    baseUrl: 'https://api.atacadaoguanabara.varejofacil.com',
    apiKey: '2625e98175832a17a954db9beb60306a'
  },
  {
    name: 'Config 3 - Varejo Fácil API',
    baseUrl: 'https://varejofacil.com/api',
    apiKey: '2625e98175832a17a954db9beb60306a'
  },
  {
    name: 'Config 4 - Sem API Key',
    baseUrl: 'https://atacadaoguanabara.varejofacil.com',
    apiKey: null
  }
];

// Endpoints para testar
const ENDPOINTS = [
  '/v1/produto/produtos',
  '/api/produtos',
  '/api/v1/produtos',
  '/produtos',
  '/v1/produtos',
  '/api/v1/produto/produtos',
  '/rest/produtos',
  '/api/rest/produtos'
];

// Função para fazer requisição
async function makeRequest(baseUrl, endpoint, apiKey, configName) {
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    console.log(`🔍 [${configName}] ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    console.log(`📊 Status: ${response.status}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ JSON recebido: ${data.items?.length || 0} itens`);
        return { success: true, data, config: configName, endpoint };
      } else {
        const text = await response.text();
        console.log(`📄 HTML recebido (${text.length} chars)`);
        
        // Tentar extrair dados do HTML
        const extractedData = extractDataFromHTML(text);
        if (extractedData) {
          return { success: true, data: extractedData, config: configName, endpoint };
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
  // Procurar por diferentes padrões de dados
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({.*?});/,
    /window\.products\s*=\s*(\[.*?\]);/,
    /data-products\s*=\s*"([^"]+)"/,
    /var\s+products\s*=\s*(\[.*?\]);/,
    /"products":\s*(\[.*?\])/,
    /"items":\s*(\[.*?\])/
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

// Função para testar todas as combinações
async function testAllCombinations() {
  console.log('🧪 === TESTANDO TODAS AS COMBINAÇÕES ===\n');
  
  for (const config of CONFIGS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 TESTANDO: ${config.name}`);
    console.log(`${'='.repeat(60)}`);
    
    for (const endpoint of ENDPOINTS) {
      const result = await makeRequest(config.baseUrl, endpoint, config.apiKey, config.name);
      
      if (result.success) {
        console.log(`\n🎉 SUCESSO!`);
        console.log(`📋 Config: ${result.config}`);
        console.log(`🔗 Endpoint: ${result.endpoint}`);
        console.log(`📦 Itens: ${result.data.items?.length || 0}`);
        
        if (result.data.items && result.data.items.length > 0) {
          console.log(`📋 Exemplo: ${result.data.items[0].descricao || result.data.items[0].id}`);
        }
        
        return result;
      }
      
      // Pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n❌ Nenhuma combinação funcionou');
  return null;
}

// Função para sincronizar usando a configuração que funcionou
async function syncWithWorkingConfig(workingResult) {
  console.log('\n🚀 === SINCRONIZAÇÃO COM CONFIG FUNCIONANDO ===\n');
  
  const { baseUrl, apiKey } = CONFIGS.find(c => c.name === workingResult.config);
  
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

    // Buscar produtos
    const productsResult = await makeRequest(baseUrl, workingResult.endpoint, apiKey, workingResult.config);
    if (productsResult.success) {
      syncData.products = productsResult.data.items || [];
      syncData.totalProducts = syncData.products.length;
      console.log(`✅ ${syncData.totalProducts} produtos sincronizados`);
    }

    // Buscar outros dados usando o mesmo padrão
    const otherEndpoints = [
      { key: 'sections', endpoint: workingResult.endpoint.replace('produtos', 'secoes') },
      { key: 'brands', endpoint: workingResult.endpoint.replace('produtos', 'marcas') },
      { key: 'genres', endpoint: workingResult.endpoint.replace('produtos', 'generos') },
      { key: 'prices', endpoint: workingResult.endpoint.replace('produtos', 'precos') }
    ];

    for (const { key, endpoint } of otherEndpoints) {
      const result = await makeRequest(baseUrl, endpoint, apiKey, workingResult.config);
      if (result.success) {
        syncData[key] = result.data.items || [];
        syncData[`total${key.charAt(0).toUpperCase() + key.slice(1)}`] = syncData[key].length;
        console.log(`✅ ${syncData[key].length} ${key} sincronizados`);
      }
    }

    // Salvar dados
    const dataDir = path.join(__dirname, '..', 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }
    
    const filePath = path.join(dataDir, 'products.json');
    await fs.writeFile(filePath, JSON.stringify(syncData, null, 2));
    
    console.log(`\n💾 Dados salvos em: ${filePath}`);
    console.log(`📊 Resumo: ${syncData.totalProducts} produtos, ${syncData.totalSections} seções, ${syncData.totalBrands} marcas`);

    return syncData;

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    throw error;
  }
}

// Função principal
async function main() {
  const command = process.argv[2];
  
  if (command === 'test') {
    const workingResult = await testAllCombinations();
    if (workingResult) {
      console.log('\n✅ Configuração funcionando encontrada!');
      console.log(`Use: npm run async-working-sync`);
    }
  } else if (command === 'sync') {
    // Primeiro testar para encontrar configuração funcionando
    const workingResult = await testAllCombinations();
    if (workingResult) {
      await syncWithWorkingConfig(workingResult);
    } else {
      console.log('❌ Nenhuma configuração funcionou');
    }
  } else {
    console.log('Uso: node async-working.js [test|sync]');
    console.log('  test - Testar todas as combinações');
    console.log('  sync - Sincronizar com configuração funcionando');
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAllCombinations, syncWithWorkingConfig }; 