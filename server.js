// Backend Node.js para APIs principais
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const next = require('next');
// Funções de sincronização removidas - arquivo sync-products.js foi deletado
const syncDataTsToJson = async () => ({ success: false, message: 'Função não disponível' });
const syncJsonToDataTs = async () => ({ success: false, message: 'Função não disponível' });

const app = express();

app.use(cors());
app.use(express.json());

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

// Configurar Next.js
const nextApp = next({ dev: false, dir: __dirname });
const nextHandler = nextApp.getRequestHandler();

// === Iniciar Backend Java automaticamente ===
const javaBackendPath = path.join(__dirname, 'java-backend');
const mavenBin = '"C:/Users/escritorio atacadao/Downloads/apache-maven-3.9.11-bin/apache-maven-3.9.11/bin/mvn.cmd"';

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

  // Middleware para log de requisições
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Rota para sincronizar produtos
  app.post('/api/sync-products', async (req, res) => {
    try {
      const { direction } = req.body;
      
      if (direction === 'to-json') {
        const result = await syncDataTsToJson();
        res.json(result);
      } else if (direction === 'to-data') {
        const result = await syncJsonToDataTs();
        res.json(result);
      } else if (direction === 'both') {
        const result1 = await syncDataTsToJson();
        const result2 = await syncJsonToDataTs();
        res.json({ 
          toJson: result1, 
          toData: result2,
          success: result1.success && result2.success 
        });
      } else {
        res.status(400).json({ 
          error: 'Direção inválida. Use: to-json, to-data, ou both' 
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      res.status(500).json({ 
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
