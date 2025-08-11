// Script para testar se o Google OAuth está configurado corretamente

console.log('🔍 Verificando configuração do Google OAuth...\n')

// 1. Verificar se arquivo .env.local existe
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
console.log('📁 Verificando arquivo .env.local...')

if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado')
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  console.log('📄 Conteúdo do .env.local:')
  console.log(envContent)
  
  // Verificar se as variáveis estão definidas
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  console.log('\n🔧 Variáveis encontradas:')
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=')
      console.log(`  ${key}: ${value ? '✅ Definida' : '❌ Vazia'}`)
    }
  })
  
} else {
  console.log('❌ Arquivo .env.local não encontrado!')
}

// 2. Verificar se NextAuth está instalado
console.log('\n📦 Verificando NextAuth...')
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
  if (packageJson.dependencies['next-auth']) {
    console.log('✅ NextAuth instalado:', packageJson.dependencies['next-auth'])
  } else {
    console.log('❌ NextAuth não encontrado no package.json')
  }
} catch (error) {
  console.log('❌ Erro ao ler package.json:', error.message)
}

// 3. Verificar se arquivo de configuração existe
const authPath = path.join(process.cwd(), 'app', 'api', 'auth', '[...nextauth]', 'route.ts')
console.log('\n🔐 Verificando arquivo de configuração NextAuth...')
if (fs.existsSync(authPath)) {
  console.log('✅ Arquivo de configuração NextAuth encontrado')
} else {
  console.log('❌ Arquivo de configuração NextAuth não encontrado')
}

console.log('\n🚀 Próximos passos:')
console.log('1. Reinicie o servidor: pnpm dev')
console.log('2. Acesse: http://localhost:3005/api/test-env')
console.log('3. Teste o login: http://localhost:3005/login')
console.log('4. Clique em "Continuar com Google"')
