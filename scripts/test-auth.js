// Usar fetch global (disponível no Node.js 18+)

// Configurações da API Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
};

// Função para testar diferentes métodos de autenticação
async function testAuthMethods() {
  console.log('🔐 === TESTANDO MÉTODOS DE AUTENTICAÇÃO ===\n');
  
  const endpoint = '/v1/produto/produtos';
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  const authMethods = [
    {
      name: 'Bearer Token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    },
    {
      name: 'API Key Header',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey
      }
    },
    {
      name: 'API Key Query Parameter',
      url: `${url}&apiKey=${VAREJO_FACIL_CONFIG.apiKey}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Sem Autenticação',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'User Agent Personalizado',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AtacadaoGuanabara/1.0',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    }
  ];

  for (const method of authMethods) {
    console.log(`🔍 Testando: ${method.name}`);
    
    try {
      const response = await fetch(method.url || url, {
        method: 'GET',
        headers: method.headers
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
      
      const responseText = await response.text();
      const isJson = responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
      
      if (isJson) {
        try {
          const data = JSON.parse(responseText);
          console.log(`✅ JSON válido! Itens: ${data.items?.length || 0}`);
          if (data.items && data.items.length > 0) {
            console.log(`📦 Exemplo: ${data.items[0].descricao || data.items[0].id}`);
          }
        } catch (parseError) {
          console.log(`❌ JSON inválido: ${responseText.substring(0, 100)}...`);
        }
      } else {
        console.log(`📄 HTML/Texto: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('---\n');
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Função para testar diferentes endpoints
async function testEndpoints() {
  console.log('🔗 === TESTANDO DIFERENTES ENDPOINTS ===\n');
  
  const endpoints = [
    '/v1/produto/produtos',
    '/v1/produto/secoes',
    '/v1/produto/marcas',
    '/v1/produto/generos',
    '/v1/produto/precos',
    '/v1/produto/aplicacoes',
    '/v1/produto/caracteristicas',
    '/api/produtos', // Possível endpoint alternativo
    '/api/v1/produtos', // Possível endpoint alternativo
    '/produtos', // Possível endpoint alternativo
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testando endpoint: ${endpoint}`);
    
    try {
      const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseText = await response.text();
        const isJson = responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
        
        if (isJson) {
          try {
            const data = JSON.parse(responseText);
            console.log(`✅ JSON válido! Itens: ${data.items?.length || 0}`);
          } catch (parseError) {
            console.log(`❌ JSON inválido`);
          }
        } else {
          console.log(`📄 HTML/Texto retornado`);
        }
      } else {
        console.log(`❌ Erro HTTP: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('---\n');
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Função para testar diferentes URLs base
async function testBaseUrls() {
  console.log('🌐 === TESTANDO DIFERENTES URLs BASE ===\n');
  
  const baseUrls = [
    'https://atacadaoguanabara.varejofacil.com',
    'https://api.atacadaoguanabara.varejofacil.com',
    'https://varejofacil.com/api',
    'https://atacadaoguanabara.varejofacil.com/api',
  ];

  for (const baseUrl of baseUrls) {
    console.log(`🔍 Testando URL base: ${baseUrl}`);
    
    try {
      const url = `${baseUrl}/v1/produto/produtos`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseText = await response.text();
        const isJson = responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
        
        if (isJson) {
          console.log(`✅ JSON válido encontrado!`);
        } else {
          console.log(`📄 HTML/Texto retornado`);
        }
      } else {
        console.log(`❌ Erro HTTP: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('---\n');
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
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

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de autenticação da API Varejo Fácil...\\n');
  
  const startTime = Date.now();
  
  // Testar API local primeiro
  await testLocalAPI();
  
  // Testar métodos de autenticação
  await testAuthMethods();
  
  // Testar diferentes endpoints
  await testEndpoints();
  
  // Testar diferentes URLs base
  await testBaseUrls();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`\\n⏱️ Tempo total dos testes: ${duration} segundos`);
  console.log('\\n💡 Dicas:');
  console.log('1. Verifique se a API Key está correta');
  console.log('2. Verifique se a URL base está correta');
  console.log('3. Verifique se a API está ativa');
  console.log('4. Verifique se há restrições de IP');
  console.log('5. Entre em contato com o suporte do Varejo Fácil');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAuthMethods,
  testEndpoints,
  testBaseUrls
}; 