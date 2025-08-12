const fs = require('fs');
const path = require('path');

// Lista de páginas que precisam ser corrigidas
const pagesToFix = [
  'app/orders/page.tsx',
  'app/profile/page.tsx',
  'app/cart/page.tsx',
  'app/page.tsx',
  'app/admin/page.tsx',
  'app/catalog/page.tsx',
  'app/favorites/page.tsx',
  'app/feedback/page.tsx',
  'app/camera-request/form/page.tsx',
  'app/camera-request/page.tsx',
  'app/about/page.tsx',
  'app/privacy/page.tsx',
  'app/cookies/page.tsx',
  'app/forgot-password/page.tsx',
  'app/register/page.tsx'
];

// Função para adicionar dynamic = 'force-dynamic' nas páginas
function addDynamicExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`Arquivo não encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se já tem export const dynamic
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✅ ${filePath} já tem dynamic export`);
      return;
    }

    // Adicionar no início do arquivo, após 'use client'
    if (content.includes("'use client'")) {
      content = content.replace(
        "'use client'",
        "'use client'\n\nexport const dynamic = 'force-dynamic'"
      );
    } else {
      content = "export const dynamic = 'force-dynamic'\n\n" + content;
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
  }
}

// Função para criar arquivo .env.local se não existir
function createEnvFile() {
  const envPath = '.env.local';
  if (!fs.existsSync(envPath)) {
    const envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Google OAuth (opcional - configure se quiser usar login Google)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=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

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Build Configuration
NEXT_PUBLIC_BUILD_MODE=production`;
  
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env.local criado');
  } else {
    console.log('✅ Arquivo .env.local já existe');
  }
}

// Função para limpar cache
function cleanCache() {
  const nextDir = '.next';
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Cache do Next.js limpo');
  } else {
    console.log('✅ Nenhum cache para limpar');
  }
}

// Executar todas as correções
console.log('🔧 Iniciando correções para build...\n');

console.log('1. Criando arquivo de ambiente...');
createEnvFile();

console.log('\n2. Limpando cache...');
cleanCache();

console.log('\n3. Corrigindo páginas...');
pagesToFix.forEach(page => {
  addDynamicExport(page);
});

console.log('\n✅ Todas as correções concluídas!');
console.log('📝 Agora execute: pnpm build'); 