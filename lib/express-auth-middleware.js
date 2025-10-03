const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Função para detectar se é uma requisição AJAX/API
function isApiRequest(req) {
  const acceptHeader = req.headers.accept || '';
  const contentType = req.headers['content-type'] || '';
  
  return (
    acceptHeader.includes('application/json') ||
    contentType.includes('application/json') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest'
  );
}

// Função para verificar se o usuário é admin
function isAdmin(email) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const user = users.find(u => u.email === email);
    return user?.role === 'admin';
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

// Middleware de autenticação para Express
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Se é uma requisição de API, retorna JSON
      if (isApiRequest(req)) {
        return res.status(401).json({ 
          error: 'Token de autenticação necessário',
          redirect: '/catalog'
        });
      }
      // Se é navegador, redireciona para o catálogo
      return res.redirect(302, '/catalog');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'atacadao_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token inválido:', error);
    // Se é uma requisição de API, retorna JSON
    if (isApiRequest(req)) {
      return res.status(401).json({ 
        error: 'Token inválido',
        redirect: '/catalog'
      });
    }
    // Se é navegador, redireciona para o catálogo
    return res.redirect(302, '/catalog');
  }
}

// Middleware de autorização para admin
function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Se é uma requisição de API, retorna JSON
      if (isApiRequest(req)) {
        return res.status(401).json({ 
          error: 'Token de autenticação necessário',
          redirect: '/catalog'
        });
      }
      // Se é navegador, redireciona para o catálogo
      return res.redirect(302, '/catalog');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'atacadao_jwt_secret');
    
    if (!isAdmin(decoded.email)) {
      // Se é uma requisição de API, retorna JSON
      if (isApiRequest(req)) {
        return res.status(403).json({ 
          error: 'Acesso negado. Privilégios de administrador necessários.',
          redirect: '/catalog'
        });
      }
      // Se é navegador, redireciona para o catálogo
      return res.redirect(302, '/catalog');
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token inválido:', error);
    // Se é uma requisição de API, retorna JSON
    if (isApiRequest(req)) {
      return res.status(401).json({ 
        error: 'Token inválido',
        redirect: '/catalog'
      });
    }
    // Se é navegador, redireciona para o catálogo
    return res.redirect(302, '/catalog');
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  isAdmin,
  isApiRequest
};
