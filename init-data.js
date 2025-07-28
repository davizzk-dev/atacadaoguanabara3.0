const fs = require('fs')
const path = require('path')

// Criar diretório data se não existir
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Dados de exemplo para produtos


// Dados de exemplo para usuários
const users = [
  {
    id: 'admin',
    name: 'Administrador',
    email: 'admin',
    phone: '85985147067',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    orders: 0
  }
]

// Dados de exemplo para pedidos
const orders = []

// Dados de exemplo para solicitações de câmera
const cameraRequests = []

// Dados de exemplo para feedback
const feedback = []

// Salvar arquivos
fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2))
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2))
fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify(orders, null, 2))
fs.writeFileSync(path.join(dataDir, 'camera-requests.json'), JSON.stringify(cameraRequests, null, 2))
fs.writeFileSync(path.join(dataDir, 'feedback.json'), JSON.stringify(feedback, null, 2))

console.log('✅ Dados de teste inicializados com sucesso!')
console.log('📁 Arquivos criados em:', dataDir)
console.log('👤 Usuário admin: admin/admin123')
console.log('🚀 Execute: node server.js') 