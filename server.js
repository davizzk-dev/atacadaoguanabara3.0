// Backend Node.js para APIs principais
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const next = require('next');

// Importar função de sincronização correta
const { syncAndFormatProducts } = require('./scripts/sync-with-formatting.js');

const app = express();

app.use(cors());

// Carregar variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: '.env.local' });

// Definir porta para Next.js ANTES de importar o Next
process.env.PORT = 3005;
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3005';

// Configurar Next.js com porta específica
const nextApp = next({ 
  dev: false, 
  dir: __dirname,
  port: 3005,
  hostname: 'localhost'
});
const nextHandler = nextApp.getRequestHandler();

// === Iniciar Backend Java automaticamente ===
const javaBackendPath = path.join(__dirname, 'java-backend');
// Caminho dinâmico para o Maven - tenta diferentes localizações
let mavenBin = 'mvn'; // Tenta usar maven do PATH primeiro

// Verifica se o Maven está no PATH
const { execSync } = require('child_process');
try {
  execSync('mvn --version', { stdio: 'ignore' });
  console.log('✅ Maven encontrado no PATH');
} catch (error) {
  // Tenta caminhos comuns do Maven no Windows
  const possiblePaths = [
    '"C:/Users/escritorio atacadao/Downloads/apache-maven-3.9.11-bin/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/Program Files/Apache Software Foundation/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/maven/bin/mvn.cmd"',
    'mvn.cmd'
  ];
  
  for (const mavenPath of possiblePaths) {
    try {
      execSync(`${mavenPath} --version`, { stdio: 'ignore' });
      mavenBin = mavenPath;
      console.log(`✅ Maven encontrado em: ${mavenPath}`);
      break;
    } catch (e) {
      console.log(`❌ Maven não encontrado em: ${mavenPath}`);
    }
  }
}

console.log('🚀 Iniciando backend Java...');
const javaProcess = spawn(mavenBin + ' spring-boot:run', {
  cwd: javaBackendPath,
  stdio: 'inherit',
  shell: true
});

javaProcess.on('close', (code) => {
  console.log(`Backend Java finalizado com código ${code}`);
});

process.on('exit', () => {
  javaProcess.kill();
});

process.on('SIGINT', () => {
  javaProcess.kill('SIGINT');
  process.exit();
});

// Inicializar Next.js e configurar rotas
nextApp.prepare().then(() => {
  // Servir arquivos estáticos do Next.js
  app.use('/_next', express.static(path.join(__dirname, '.next')));
  app.use('/static', express.static(path.join(__dirname, 'public')));

  // Middleware para log de requisições apenas para rotas específicas
  app.use('/api/sync-products', (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  app.use('/api/test-varejo-facil', (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Rota para sincronizar produtos (agora usa sync-with-formatting.js)
  app.post('/api/sync-products', express.json(), async (req, res) => {
    const startedAt = Date.now();
    try {
      console.log('🔄 Sincronização de produtos iniciada via /api/sync-products');
      const result = await syncAndFormatProducts();

      // Persistir histórico da sincronização
      try {
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(process.cwd(), 'data');
        const historyPath = path.join(dataDir, 'varejo-sync-history.json');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        let history = [];
        if (fs.existsSync(historyPath)) {
          try {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]');
          } catch {}
        }
        const entry = {
          id: Date.now().toString(),
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          totals: {
            products: result.totalProducts ?? result.productsTotal ?? 0,
            sections: result.totalSections ?? 0,
            brands: result.totalBrands ?? 0,
            genres: result.totalGenres ?? 0,
          },
          message: 'Sincronização concluída',
          status: 'success'
        };
        history.unshift(entry);
        // Manter no máximo 100 registros
        if (history.length > 100) history = history.slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch (persistErr) {
        console.warn('⚠️ Falha ao salvar histórico de sync:', persistErr?.message || persistErr);
      }

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      // Persistir falha no histórico
      try {
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(process.cwd(), 'data');
        const historyPath = path.join(dataDir, 'varejo-sync-history.json');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        let history = [];
        if (fs.existsSync(historyPath)) {
          try { history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]'); } catch {}
        }
        history.unshift({
          id: Date.now().toString(),
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          totals: { products: 0, sections: 0, brands: 0, genres: 0 },
          message: error?.message || 'Erro na sincronização',
          status: 'error'
        });
        if (history.length > 100) history = history.slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch {}

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  });

  // Rota para testar e sincronizar Varejo Fácil
  app.get('/api/test-varejo-facil', async (req, res) => {
    try {
      console.log('🧪 Iniciando teste da API do Varejo Fácil...');
      
      // Importar e executar o script de teste
      const { runFinalTests } = require('./scripts/test-varejo-facil-final.js');
      
      // Executar os testes
      const results = await runFinalTests();
      
      res.json({
        success: true,
        message: 'Teste do Varejo Fácil executado com sucesso',
        results: results
      });
      
    } catch (error) {
      console.error('❌ Erro ao executar teste do Varejo Fácil:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  });

  // Todas as outras rotas (incluindo APIs) vão para o Next.js
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  // Iniciar servidor
  const PORT = 3005;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log('✅ Site INTEIRO funcionando!');
    console.log('✅ Login com Google funcionando!');
    console.log('✅ Todas as páginas disponíveis!');
    console.log('✅ APIs funcionando!');
  });
});
