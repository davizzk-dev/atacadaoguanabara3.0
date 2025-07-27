const fs = require('fs')
const path = require('path')

// Criar diretório data se não existir
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Dados de exemplo para produtos
const products = [
  {
    id: '1',
    name: 'Banana Prata',
    price: 4.99,
    originalPrice: 6.99,
    image: '/images/products/banana.jpg',
    category: 'fruits',
    description: 'Banana prata fresca e saborosa',
    inStock: true,
    rating: 4.5,
    reviews: 128
  },
  {
    id: '2',
    name: 'Maçã Gala',
    price: 8.99,
    image: '/images/products/apple.jpg',
    category: 'fruits',
    description: 'Maçã gala doce e crocante',
    inStock: true,
    rating: 4.8,
    reviews: 95
  },
  {
    id: '3',
    name: 'Alface Crespa',
    price: 2.99,
    image: '/images/products/lettuce.jpg',
    category: 'vegetables',
    description: 'Alface crespa fresca',
    inStock: true,
    rating: 4.2,
    reviews: 67
  }
]

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