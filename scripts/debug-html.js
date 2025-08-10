// Script para debugar o HTML retornado pela API do Varejo Fácil

// Configurações da API Varejo Fácil
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
};

// Função para fazer requisição e capturar HTML
async function captureHTML(endpoint, method = 'GET', headers = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`,
      ...headers
    }
  };

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`);
    console.log(`📋 Headers:`, requestOptions.headers);
    
    const response = await fetch(url, requestOptions);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📋 Location: ${response.headers.get('location')}`);
    console.log(`📋 Set-Cookie: ${response.headers.get('set-cookie')}`);
    
    const responseText = await response.text();
    
    // Salvar HTML em arquivo para análise
    const fs = require('fs').promises;
    const path = require('path');
    
    const debugDir = path.join(__dirname, 'debug');
    try {
      await fs.mkdir(debugDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }
    
    const fileName = `debug_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    const filePath = path.join(debugDir, fileName);
    
    await fs.writeFile(filePath, responseText);
    console.log(`💾 HTML salvo em: ${filePath}`);
    
    // Analisar o HTML
    analyzeHTML(responseText, endpoint);
    
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      text: responseText,
      filePath
    };
    
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error.message);
    return { error: error.message };
  }
}

// Função para analisar o HTML
function analyzeHTML(html, endpoint) {
  console.log(`\n🔍 === ANÁLISE DO HTML PARA ${endpoint} ===`);
  
  // Verificar se é uma página de login
  if (html.includes('login') || html.includes('Login') || html.includes('LOGIN')) {
    console.log('🔐 PÁGINA DE LOGIN DETECTADA!');
  }
  
  // Verificar se é uma página de erro
  if (html.includes('error') || html.includes('Error') || html.includes('ERROR')) {
    console.log('❌ PÁGINA DE ERRO DETECTADA!');
  }
  
  // Verificar se é uma página de redirecionamento
  if (html.includes('redirect') || html.includes('Redirect') || html.includes('REDIRECT')) {
    console.log('🔄 PÁGINA DE REDIRECIONAMENTO DETECTADA!');
  }
  
  // Verificar se é uma página de manutenção
  if (html.includes('maintenance') || html.includes('Maintenance') || html.includes('manutenção')) {
    console.log('🔧 PÁGINA DE MANUTENÇÃO DETECTADA!');
  }
  
  // Extrair título da página
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    console.log(`📄 Título da página: ${titleMatch[1]}`);
  }
  
  // Extrair meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    console.log(`📝 Descrição: ${descMatch[1]}`);
  }
  
  // Verificar se há formulários
  const forms = html.match(/<form[^>]*>/gi);
  if (forms) {
    console.log(`📋 Formulários encontrados: ${forms.length}`);
    forms.forEach((form, index) => {
      const actionMatch = form.match(/action=["']([^"']+)["']/i);
      const methodMatch = form.match(/method=["']([^"']+)["']/i);
      console.log(`   Form ${index + 1}: ${methodMatch ? methodMatch[1] : 'GET'} -> ${actionMatch ? actionMatch[1] : 'sem action'}`);
    });
  }
  
  // Verificar se há links
  const links = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
  if (links) {
    console.log(`🔗 Links encontrados: ${links.length}`);
    // Mostrar primeiros 5 links
    links.slice(0, 5).forEach((link, index) => {
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      const textMatch = link.match(/>([^<]+)</);
      console.log(`   Link ${index + 1}: ${hrefMatch ? hrefMatch[1] : 'sem href'} - ${textMatch ? textMatch[1].trim() : 'sem texto'}`);
    });
  }
  
  // Verificar se há scripts
  const scripts = html.match(/<script[^>]*>/gi);
  if (scripts) {
    console.log(`📜 Scripts encontrados: ${scripts.length}`);
  }
  
  // Verificar se há mensagens de erro específicas
  const errorMessages = [
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Access Denied',
    'Authentication Required',
    'API Key',
    'Token',
    'Session',
    'Cookie'
  ];
  
  errorMessages.forEach(msg => {
    if (html.includes(msg)) {
      console.log(`⚠️ Mensagem de erro encontrada: ${msg}`);
    }
  });
  
  // Mostrar primeiras 500 caracteres do HTML
  console.log(`\n📄 Primeiros 500 caracteres do HTML:`);
  console.log(html.substring(0, 500));
  
  console.log(`\n📊 Tamanho total do HTML: ${html.length} caracteres`);
}

// Função para testar diferentes endpoints
async function testEndpoints() {
  console.log('🚀 === TESTE DE CAPTURA DE HTML ===\n');
  
  const endpoints = [
    '/v1/produto/produtos',
    '/v1/produto/secoes',
    '/v1/produto/marcas',
    '/v1/produto/generos',
    '/v1/produto/precos',
    '/api/produtos',
    '/api/v1/produtos',
    '/produtos',
    '/', // Página inicial
    '/login', // Possível página de login
    '/api', // Possível endpoint de API
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 TESTANDO: ${endpoint}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await captureHTML(endpoint);
    
    if (result.error) {
      console.log(`❌ Erro: ${result.error}`);
    } else {
      console.log(`✅ Status: ${result.status}`);
      console.log(`📋 Content-Type: ${result.contentType}`);
    }
    
    // Pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Função para testar diferentes métodos de autenticação
async function testAuthMethods() {
  console.log('\n🔐 === TESTE DE MÉTODOS DE AUTENTICAÇÃO ===\n');
  
  const endpoint = '/v1/produto/produtos';
  
  const authMethods = [
    {
      name: 'Bearer Token',
      headers: {
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    },
    {
      name: 'API Key Header',
      headers: {
        'X-API-Key': VAREJO_FACIL_CONFIG.apiKey
      }
    },
    {
      name: 'Sem Autenticação',
      headers: {}
    },
    {
      name: 'User Agent Personalizado',
      headers: {
        'User-Agent': 'AtacadaoGuanabara/1.0',
        'Authorization': `Bearer ${VAREJO_FACIL_CONFIG.apiKey}`
      }
    }
  ];

  for (const method of authMethods) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔐 TESTANDO: ${method.name}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await captureHTML(endpoint, 'GET', method.headers);
    
    if (result.error) {
      console.log(`❌ Erro: ${result.error}`);
    } else {
      console.log(`✅ Status: ${result.status}`);
    }
    
    // Pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Função principal
async function main() {
  console.log('🔍 === DEBUG HTML - API VAREJO FÁCIL ===\n');
  
  try {
    // Testar diferentes endpoints
    await testEndpoints();
    
    // Testar diferentes métodos de autenticação
    await testAuthMethods();
    
    console.log('\n✅ Análise concluída!');
    console.log('📁 Verifique os arquivos HTML salvos na pasta scripts/debug/');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  captureHTML,
  analyzeHTML,
  testEndpoints,
  testAuthMethods
}; 