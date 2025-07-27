// Backend Node.js para APIs principais
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// === Iniciar Backend Java automaticamente (corrigido para espaços no caminho) ===
const javaBackendPath = path.join(__dirname, 'java-backend');
const mavenBin = '"C:/Users/escritorio atacadao/Downloads/apache-maven-3.9.11-bin/apache-maven-3.9.11/bin/mvn.cmd"';

console.log('Iniciando backend Java...');
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

// Função para garantir que o arquivo existe
function ensureDataFile(filePath, defaultData = []) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

// Função para ler dados
function readDataFile(filePath, defaultData = []) {
  try {
    ensureDataFile(filePath, defaultData);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error);
    return defaultData;
  }
}

// Função para escrever dados
function writeDataFile(filePath, data) {
  try {
    ensureDataFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Erro ao escrever arquivo ${filePath}:`, error);
  }
}

// Caminhos dos arquivos de dados
const usersPath = path.join(__dirname, 'data', 'users.json');
const productsPath = path.join(__dirname, 'data', 'products.json');
const ordersPath = path.join(__dirname, 'data', 'orders.json');
const cameraRequestsPath = path.join(__dirname, 'data', 'camera-requests.json');
const feedbackPath = path.join(__dirname, 'data', 'feedback.json');
const productPromotionsPath = path.join(__dirname, 'data', 'product-promotions.json');
const verificationCodesPath = path.join(__dirname, 'data', 'verification-codes.json');

// Função para gerar código aleatório de 6 dígitos
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para simular envio de email
async function sendEmail(to, code) {
  try {
    console.log(`📧 Email simulado enviado para: ${to}`);
    console.log(`🔐 Código de verificação: ${code}`);
    console.log(`📝 Assunto: Recuperação de Senha - Atacadão Guanabara`);
    console.log(`📄 Conteúdo: Seu código de verificação é: ${code}. Este código expira em 10 minutos.`);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Rotas de autenticação
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validações
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const users = readDataFile(usersPath);

    // Verificar se email já existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criar novo usuário
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone.replace(/\D/g, ''),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      orders: 0
    };

    users.push(newUser);
    writeDataFile(usersPath, users);

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se é admin
    if (email === 'admin' && password === 'atacadaoguanabaraadmin123secreto') {
      return res.json({
        id: 'admin',
        name: 'Administrador',
        email: 'admin',
        role: 'admin'
      });
    }

    const users = readDataFile(usersPath);
    
    // Hash da senha para comparação (igual ao sistema de reset)
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const user = users.find(u => u.email === email && u.password === hashedPassword);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// APIs Admin
app.get('/api/admin/stats', (req, res) => {
  try {
    const products = readDataFile(productsPath);
    const orders = readDataFile(ordersPath);
    const users = readDataFile(usersPath);
    const cameraRequests = readDataFile(cameraRequestsPath);
    const feedback = readDataFile(feedbackPath);

    const stats = {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingCameraRequests: cameraRequests.filter(req => req.status === 'pending').length,
      pendingFeedback: feedback.filter(f => f.status === 'pending').length,
      productsByCategory: {},
      ordersByStatus: {},
      monthlyRevenue: []
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const users = readDataFile(usersPath);
    const orders = readDataFile(ordersPath);

    const usersWithOrders = users.map(user => {
      const userOrders = orders.filter(order => order.userId === user.id);
      return {
        ...user,
        orders: userOrders.length,
        totalSpent: userOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        lastOrder: userOrders.length > 0 ? userOrders[0].createdAt : null,
        isClient: userOrders.length >= 2
      };
    });

    res.json(usersWithOrders);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/products', (req, res) => {
  try {
    const products = readDataFile(productsPath);
    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/camera-requests', (req, res) => {
  try {
    const requests = readDataFile(cameraRequestsPath);
    res.json(requests);
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/feedback', (req, res) => {
  try {
    const feedback = readDataFile(feedbackPath);
    res.json(feedback);
  } catch (error) {
    console.error('Erro ao listar feedback:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas para promoções de produtos
app.get('/api/admin/product-promotions', (req, res) => {
  try {
    const promotions = readDataFile(productPromotionsPath, []);
    res.json(promotions);
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/product-promotions', (req, res) => {
  try {
    const promotions = readDataFile(productPromotionsPath, []);
    const body = req.body;
    
    const newPromotion = {
      id: Date.now().toString(),
      productId: body.productId,
      productName: body.productName,
      originalPrice: parseFloat(body.originalPrice),
      newPrice: parseFloat(body.newPrice),
      discount: Math.round(((parseFloat(body.originalPrice) - parseFloat(body.newPrice)) / parseFloat(body.originalPrice)) * 100),
      image: body.image,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    };
    
    promotions.push(newPromotion);
    writeDataFile(productPromotionsPath, promotions);
    
    res.status(201).json(newPromotion);
  } catch (error) {
    console.error('Erro ao criar promoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/product-promotions', (req, res) => {
  try {
    const promotions = readDataFile(productPromotionsPath, []);
    const body = req.body;
    
    const index = promotions.findIndex(p => p.id === body.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    promotions[index] = {
      ...promotions[index],
      ...body,
      discount: body.originalPrice && body.newPrice 
        ? Math.round(((body.originalPrice - body.newPrice) / body.originalPrice) * 100)
        : promotions[index].discount,
    };
    
    writeDataFile(productPromotionsPath, promotions);
    res.json(promotions[index]);
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/product-promotions', (req, res) => {
  try {
    const { id } = req.query;
    const promotions = readDataFile(productPromotionsPath, []);
    
    if (!id) {
      return res.status(400).json({ error: 'ID da promoção é obrigatório' });
    }
    
    const filteredPromotions = promotions.filter(p => p.id !== id);
    
    if (filteredPromotions.length === promotions.length) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    writeDataFile(productPromotionsPath, filteredPromotions);
    res.json({ message: 'Promoção removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover promoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// APIs de dados
app.post('/api/camera-requests', (req, res) => {
  try {
    const requests = readDataFile(cameraRequestsPath, [])
    const newRequest = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    requests.push(newRequest)
    writeDataFile(cameraRequestsPath, requests)
    res.status(201).json(newRequest)
  } catch (error) {
    console.error('Erro ao criar solicitação:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.post('/api/feedback', (req, res) => {
  try {
    const feedback = readDataFile(feedbackPath, [])
    const newFeedback = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    feedback.push(newFeedback)
    writeDataFile(feedbackPath, feedback)
    res.status(201).json(newFeedback)
  } catch (error) {
    console.error('Erro ao criar feedback:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.post('/api/orders', (req, res) => {
  try {
    const orders = readDataFile(ordersPath, [])
    const newOrder = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: req.body.status || 'pending'
    }
    orders.push(newOrder)
    writeDataFile(ordersPath, orders)
    res.status(201).json(newOrder)
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.get('/api/orders', (req, res) => {
  try {
    const orders = readDataFile(ordersPath, [])
    const { userId, userEmail } = req.query
    
    console.log('🔍 API /api/orders chamada')
    console.log('📝 Query params:', { userId, userEmail })
    console.log('📊 Total de pedidos no arquivo:', orders.length)
    
    // Se userId for fornecido, filtrar apenas os pedidos desse usuário
    if (userId) {
      let userOrders
      
      // Se for usuário guest com email específico, filtrar por email
      if (userId.startsWith('guest_') && userEmail) {
        userOrders = orders.filter(order => 
          order.userId === userId || (order.userId === 'guest' && order.userEmail === userEmail)
        )
      } else {
        userOrders = orders.filter(order => order.userId === userId)
      }
      
      console.log('✅ Pedidos filtrados para usuário:', userId)
      console.log('📦 Pedidos encontrados:', userOrders.length)
      
      res.json(userOrders)
    } else {
      // Se não for fornecido userId, retornar todos (para admin)
      console.log('⚠️ Nenhum userId fornecido, retornando todos os pedidos')
    res.json(orders)
    }
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Rotas de recuperação de senha
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o email existe no sistema
    const users = readDataFile(usersPath, []);
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'Email não encontrado no sistema' });
    }

    // Gerar código de verificação
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Salvar código no arquivo de códigos de verificação
    const codes = readDataFile(verificationCodesPath, []);
    
    // Remover códigos antigos para este email
    const filteredCodes = codes.filter(c => c.email !== email);
    
    // Adicionar novo código
    const newCode = {
      email,
      code,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
    
    filteredCodes.push(newCode);
    writeDataFile(verificationCodesPath, filteredCodes);

    // Enviar email
    const emailSent = await sendEmail(email, code);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Erro ao enviar email. Tente novamente.' });
    }

    console.log(`✅ Código de verificação enviado para: ${email}`);

    res.json({
      message: 'Código de verificação enviado com sucesso',
      email: email
    });

  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    // Ler códigos de verificação
    const codes = readDataFile(verificationCodesPath, []);
    
    // Encontrar o código para este email
    const verificationCode = codes.find(c => c.email === email && c.code === code);
    
    if (!verificationCode) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    // Verificar se o código não expirou
    const now = new Date();
    const expiresAt = new Date(verificationCode.expiresAt);
    
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    console.log(`✅ Código verificado com sucesso para: ${email}`);

    res.json({
      message: 'Código verificado com sucesso',
      email: email
    });

  } catch (error) {
    console.error('Erro na verificação do código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se o código ainda é válido
    const codes = readDataFile(verificationCodesPath, []);
    
    const verificationCode = codes.find(c => c.email === email && c.code === code);
    
    if (!verificationCode) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    // Verificar se o código não expirou
    const now = new Date();
    const expiresAt = new Date(verificationCode.expiresAt);
    
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    // Atualizar a senha do usuário
    const users = readDataFile(usersPath, []);
    
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Hash da nova senha (em produção, usar bcrypt ou similar)
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    
    // Atualizar senha do usuário
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    
    writeDataFile(usersPath, users);

    // Remover o código usado
    const updatedCodes = codes.filter(c => !(c.email === email && c.code === code));
    writeDataFile(verificationCodesPath, updatedCodes);

    console.log(`✅ Senha alterada com sucesso para: ${email}`);

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === Proxy para backend Java com autenticação automática ===
let javaJwtToken = null;
const JAVA_BASE_URL = 'http://localhost:8080';
const JAVA_ADMIN_USER = 'admin';
const JAVA_ADMIN_PASS = 'atacadaoguanabaraadmin123secreto';

// Função para autenticar no backend Java e obter JWT
async function getJavaJwtToken() {
  if (javaJwtToken) return javaJwtToken;
  try {
    const response = await axios.post(`${JAVA_BASE_URL}/api/auth/login`, {
      username: JAVA_ADMIN_USER,
      password: JAVA_ADMIN_PASS
    });
    if (response.data && response.data.token) {
      javaJwtToken = response.data.token;
      return javaJwtToken;
    }
  } catch (err) {
    console.error('Erro ao autenticar no backend Java:', err.response?.data || err.message);
    return null;
  }
}

// Middleware para proxy Java
async function proxyJava(req, res, next) {
  const token = await getJavaJwtToken();
  if (!token) return res.status(500).json({ error: 'Falha ao autenticar no backend Java' });
  try {
    const javaRes = await axios({
      method: req.method,
      url: `${JAVA_BASE_URL}${req.originalUrl.replace('/api/proxy/java', '/api')}`,
      headers: {
        Authorization: `Bearer ${token}`,
        ...req.headers,
      },
      data: req.body,
      params: req.query,
    });
    res.status(javaRes.status).json(javaRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
}

app.use('/api/proxy/java', proxyJava);

// Proxy especial para PDF mensal
app.get('/api/proxy/java/admin/report/monthly', async (req, res) => {
  const token = await getJavaJwtToken();
  if (!token) return res.status(500).json({ error: 'Falha ao autenticar no backend Java' });
  try {
    const javaRes = await axios({
      method: 'GET',
      url: `${JAVA_BASE_URL}/api/admin/report/monthly`,
      headers: {
        Authorization: `Bearer ${token}`,
        ...req.headers,
      },
      responseType: 'arraybuffer',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-mensal.pdf"');
    res.send(javaRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

// Servir arquivos estáticos do Next.js
app.use('/_next', express.static(path.join(__dirname, '.next')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Rota para servir o frontend Next.js
app.get('*', (req, res) => {
  // Se for uma rota da API, não servir o frontend
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint não encontrado' });
  }
  
  // Tentar servir arquivos específicos do build
  const buildPath = path.join(__dirname, '.next/server/app');
  const requestedPath = req.path === '/' ? '/index.html' : req.path + '.html';
  const filePath = path.join(buildPath, requestedPath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Fallback para SPA - sempre servir index.html
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback para desenvolvimento
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Atacadão Guanabara</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; }
              .header { background: #ff6b35; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .button { background: #ff6b35; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
              .code { background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏪 Atacadão Guanabara</h1>
                <p>Servidor rodando na porta 3005</p>
              </div>
              <div class="content">
                <h2>Status do Sistema</h2>
                <p>✅ Servidor Express funcionando</p>
                <p>✅ APIs configuradas</p>
                <p>⚠️ Para ver o site completo com estilos, execute:</p>
                <div class="code">npm run dev</div>
                <p>Em outro terminal, execute:</p>
                <div class="code">node server.js</div>
                <br>
                <button class="button" onclick="window.open('http://localhost:3000', '_blank')">
                  Abrir Next.js Dev (porta 3000)
                </button>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  }
});

// Iniciar servidor
  const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
  console.log('⚠️ Para desenvolvimento completo, execute "npm run dev" em outro terminal');
  });
