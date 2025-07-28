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

// Executar correções
console.log('🔧 Corrigindo páginas para build estático...\n');

pagesToFix.forEach(page => {
  addDynamicExport(page);
});

console.log('\n✅ Correções concluídas!');
console.log('📝 Agora execute: pnpm build'); 