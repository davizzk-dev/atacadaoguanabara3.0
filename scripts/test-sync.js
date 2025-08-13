const fs = require('fs').promises;
const path = require('path');

// Configurações da API Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
};

// Função para fazer requisições para a API Varejo Fácil
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
    
    const response = await fetch(url, requestOptions);
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na requisição (${response.status}): ${errorText.substring(0, 200)}`);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ Requisição bem-sucedida: ${data.items?.length || 0} itens encontrados`);
      return data;
    } else {
      const text = await response.text();
      console.log(`📄 Resposta não é JSON: ${text.substring(0, 200)}`);
      return { items: [], total: 0 };
    }
    
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error.message);
    throw error;
  }
}

// Função para testar a conexão com a API
async function testConnection() {
  console.log('🧪 === TESTANDO CONEXÃO COM API VAREJO FÁCIL ===\n');
  
  try {
    // Testar endpoint de produtos
    console.log('📦 Testando endpoint de produtos...');
    const productsData = await makeVarejoFacilRequest('/v1/produto/produtos');
    console.log(`✅ Produtos encontrados: ${productsData.items?.length || 0}`);
    console.log(`📊 Total de produtos: ${productsData.total || 0}\n`);

    // Testar endpoint de seções
    console.log('📂 Testando endpoint de seções...');
    const sectionsData = await makeVarejoFacilRequest('/v1/produto/secoes');
    console.log(`✅ Seções encontradas: ${sectionsData.items?.length || 0}\n`);

    // Testar endpoint de marcas
    console.log('🏷️ Testando endpoint de marcas...');
    const brandsData = await makeVarejoFacilRequest('/v1/produto/marcas');
    console.log(`✅ Marcas encontradas: ${brandsData.items?.length || 0}\n`);

    // Testar endpoint de gêneros
    console.log('📚 Testando endpoint de gêneros...');
    const genresData = await makeVarejoFacilRequest('/v1/produto/generos');
    console.log(`✅ Gêneros encontrados: ${genresData.items?.length || 0}\n`);

    // Testar endpoint de preços
    console.log('💰 Testando endpoint de preços...');
    const pricesData = await makeVarejoFacilRequest('/v1/produto/precos');
    console.log(`✅ Preços encontrados: ${pricesData.items?.length || 0}\n`);

    console.log('🎉 Todos os testes de conexão passaram!');
    return true;

  } catch (error) {
    console.error('❌ Erro nos testes de conexão:', error.message);
    return false;
  }
}

// Função para testar a sincronização completa
async function testCompleteSync() {
  console.log('\\n🔄 === TESTANDO SINCRONIZAÇÃO COMPLETA ===\\n');
  
  try {
    console.log('📦 Buscando todos os produtos...');
    
    const productsData = await makeVarejoFacilRequest('/v1/produto/produtos');
    const items = productsData.items || [];
    
    if (items.length > 0) {
      console.log(`✅ ${items.length} produtos encontrados`);
      
      // Mostrar exemplo do primeiro produto
      console.log(`📋 Exemplo de produto:`);
      console.log(`   - ID: ${items[0].id}`);
      console.log(`   - Descrição: ${items[0].descricao}`);
      console.log(`   - Código: ${items[0].codigoInterno}`);
    } else {
      console.log('❌ Nenhum produto encontrado');
    }

    console.log(`\\n🎉 Teste de sincronização completa concluído!`);
    console.log(`📊 Total de produtos: ${items.length}`);
    return true;

  } catch (error) {
    console.error('❌ Erro no teste de sincronização completa:', error.message);
    return false;
  }
}

// Função para testar a API local
async function testLocalAPI() {
  console.log('\\n🔧 === TESTANDO API LOCAL ===\\n');
  
  try {
    // Testar se o servidor está rodando
    const response = await fetch('http://localhost:3005/api/sync-varejo-facil', {
      method: 'GET'
    });
    
    console.log(`📊 Status da API local: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API local funcionando:', data);
      return true;
    } else {
      console.log('❌ API local não está respondendo corretamente');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com API local:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando na porta 3005');
    return false;
  }
}

// Função para verificar se o arquivo products.json existe
async function checkProductsFile() {
  console.log('\\n📁 === VERIFICANDO ARQUIVO PRODUCTS.JSON ===\\n');
  
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const productsFilePath = path.join(dataDir, 'products.json');
    
    try {
      const fileContent = await fs.readFile(productsFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      console.log(`✅ Arquivo products.json encontrado!`);
      console.log(`📅 Última sincronização: ${data.lastSync || 'N/A'}`);
      console.log(`📦 Produtos: ${data.totalProducts || 0}`);
      console.log(`📂 Seções: ${data.totalSections || 0}`);
      console.log(`🏷️ Marcas: ${data.totalBrands || 0}`);
      console.log(`📚 Gêneros: ${data.totalGenres || 0}`);
      console.log(`💰 Preços: ${data.totalPrices || 0}`);
      
      return true;
    } catch (fileError) {
      console.log(`❌ Arquivo products.json não encontrado ou inválido`);
      console.log(`📁 Caminho: ${productsFilePath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar arquivo products.json:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de sincronização do Varejo Fácil...\\n');
  
  const startTime = Date.now();
  
  // Testar API local primeiro
  const localApiOk = await testLocalAPI();
  
  if (localApiOk) {
    // Testar conexão com API externa
    const connectionOk = await testConnection();
    
    if (connectionOk) {
      // Testar sincronização completa
      const syncOk = await testCompleteSync();
      
      if (syncOk) {
        // Verificar arquivo products.json
        await checkProductsFile();
      }
    }
  } else {
    console.log('\\n💡 Para testar a API local, certifique-se de que o servidor está rodando:');
    console.log('   npm run dev (para desenvolvimento)');
    console.log('   npm run server (para produção)');
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`\\n⏱️ Tempo total dos testes: ${duration} segundos`);
  console.log('\\n🎯 Para executar a sincronização completa, use o painel de admin ou execute:');
  console.log('   npm run sync-varejo-facil');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testConnection,
  testCompleteSync,
  checkProductsFile
}; 