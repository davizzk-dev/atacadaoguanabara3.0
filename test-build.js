const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Testando configuração do projeto...\n');

// 1. Verificar se o arquivo .env.local existe
if (!fs.existsSync('.env.local')) {
  console.log('❌ Arquivo .env.local não encontrado');
  console.log('📝 Execute: node fix-build-errors.js');
  process.exit(1);
}

// 2. Verificar se as dependências estão instaladas
try {
  console.log('📦 Verificando dependências...');
  execSync('pnpm list next-auth', { stdio: 'pipe' });
  console.log('✅ NextAuth instalado');
} catch (error) {
  console.log('❌ NextAuth não encontrado');
  console.log('📝 Execute: pnpm install');
  process.exit(1);
}

// 3. Verificar se o cache foi limpo
if (fs.existsSync('.next')) {
  console.log('🗑️  Cache do Next.js encontrado, limpando...');
  fs.rmSync('.next', { recursive: true, force: true });
  console.log('✅ Cache limpo');
}

// 4. Tentar fazer o build
console.log('\n🔨 Iniciando build de teste...');
try {
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('\n✅ Build concluído com sucesso!');
  console.log('🚀 O projeto está pronto para ser usado no outro PC');
} catch (error) {
  console.log('\n❌ Erro no build');
  console.log('📝 Verifique os erros acima e execute as correções necessárias');
  process.exit(1);
} 