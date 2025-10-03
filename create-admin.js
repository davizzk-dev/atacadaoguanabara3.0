const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

const dataPath = join(process.cwd(), 'data', 'users.json')

// Ler usuários existentes
let users = []
try {
  const data = readFileSync(dataPath, 'utf-8')
  users = JSON.parse(data)
} catch (error) {
  console.log('Criando arquivo de usuários...')
  users = []
}

// Verificar se já existe admin@atacadao.com
const adminExists = users.find(u => u.email === 'admin@atacadao.com')

if (!adminExists) {
  // Criar usuário admin
  const adminUser = {
    id: 'admin-atacadao',
    name: 'Administrador Sistema',
    email: 'admin@atacadao.com',
    phone: '85999999999',
    password: hashPassword('123456'),
    address: {
      street: 'Rua Admin',
      number: '123',
      complement: '',
      neighborhood: 'Centro',
      city: 'Fortaleza',
      state: 'CE',
      zipCode: '60000000',
      reference: ''
    },
    role: 'admin',
    createdAt: new Date().toISOString(),
    orders: 0
  }
  
  users.push(adminUser)
  
  // Salvar
  writeFileSync(dataPath, JSON.stringify(users, null, 2))
  
  console.log('? Usuário admin criado com sucesso!')
  console.log('?? Email: admin@atacadao.com')
  console.log('?? Senha: 123456')
} else {
  console.log('??  Usuário admin já existe: admin@atacadao.com')
}
