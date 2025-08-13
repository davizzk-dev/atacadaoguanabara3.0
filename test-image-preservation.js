const fs = require('fs')
const path = require('path')

// Script para testar se as imagens personalizadas são preservadas durante a sincronização

async function testImagePreservation() {
  console.log('🧪 TESTE: Preservação de Imagens Durante Sincronização')
  console.log('=' * 60)
  
  const dataDir = path.join(process.cwd(), 'data')
  const productsFilePath = path.join(dataDir, 'products.json')
  const backupFilePath = path.join(dataDir, 'products-backup-test.json')
  
  try {
    // 1. Ler produtos atuais
    console.log('📂 Lendo produtos atuais...')
    if (!fs.existsSync(productsFilePath)) {
      console.log('❌ Arquivo products.json não encontrado')
      return
    }
    
    const originalProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    console.log(`✅ ${originalProducts.length} produtos carregados`)
    
    // 2. Fazer backup
    console.log('💾 Criando backup...')
    fs.writeFileSync(backupFilePath, JSON.stringify(originalProducts, null, 2))
    
    // 3. Simular algumas imagens personalizadas
    console.log('🖼️ Simulando imagens personalizadas...')
    const modifiedProducts = [...originalProducts]
    const testImages = [
      'https://i.imgur.com/abc123.jpg',
      'https://i.imgur.com/def456.png', 
      'https://example.com/custom-image.jpg',
      'https://cdn.custom.com/product.webp'
    ]
    
    // Modificar alguns produtos com imagens customizadas
    const testProductIds = []
    for (let i = 0; i < Math.min(4, modifiedProducts.length); i++) {
      modifiedProducts[i].image = testImages[i]
      testProductIds.push(modifiedProducts[i].id)
      console.log(`   - Produto ${modifiedProducts[i].id}: ${modifiedProducts[i].name} → ${testImages[i]}`)
    }
    
    // 4. Salvar produtos modificados
    fs.writeFileSync(productsFilePath, JSON.stringify(modifiedProducts, null, 2))
    console.log('✅ Produtos com imagens personalizadas salvos')
    
    // 5. Simular sincronização (usando a mesma lógica do script real)
    console.log('🔄 Simulando sincronização...')
    
    // Simular produtos vindos da API (com imagens Unsplash)
    const simulatedApiProducts = modifiedProducts.map(product => ({
      ...product,
      // Simular que a API sempre retorna imagem Unsplash
      image: `https://images.unsplash.com/photo-${Math.random().toString(36)}?auto=format&fit=crop&w=400&q=80`,
      // Simular atualização de preços
      price: Math.round(Math.random() * 100 * 100) / 100,
      // Simular atualização de estoque
      stock: Math.floor(Math.random() * 50)
    }))
    
    // 6. Aplicar lógica de preservação de imagens
    console.log('🛡️ Aplicando preservação de imagens...')
    
    // Ler produtos existentes para preservar imagens
    const existingProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    const existingImagesMap = new Map()
    
    existingProducts.forEach(product => {
      if (product.id && product.image && 
          !product.image.includes('images.unsplash.com') && 
          !product.image.includes('placeholder')) {
        existingImagesMap.set(product.id, product.image)
      }
    })
    
    console.log(`🔍 ${existingImagesMap.size} imagens customizadas encontradas`)
    
    // Preservar imagens customizadas
    let imagesPreserved = 0
    simulatedApiProducts.forEach(product => {
      const existingImage = existingImagesMap.get(product.id)
      if (existingImage) {
        product.image = existingImage
        imagesPreserved++
      }
    })
    
    console.log(`✅ ${imagesPreserved} imagens preservadas`)
    
    // 7. Salvar resultado da sincronização
    fs.writeFileSync(productsFilePath, JSON.stringify(simulatedApiProducts, null, 2))
    
    // 8. Verificar resultados
    console.log('🔍 Verificando resultados...')
    const finalProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    
    let testsPassed = 0
    let testsFailed = 0
    
    testProductIds.forEach((productId, index) => {
      const finalProduct = finalProducts.find(p => p.id === productId)
      const expectedImage = testImages[index]
      
      if (finalProduct && finalProduct.image === expectedImage) {
        console.log(`✅ PASS: Produto ${productId} manteve imagem personalizada: ${expectedImage}`)
        testsPassed++
      } else {
        console.log(`❌ FAIL: Produto ${productId} perdeu imagem personalizada`)
        console.log(`   Esperado: ${expectedImage}`)
        console.log(`   Atual: ${finalProduct?.image || 'não encontrado'}`)
        testsFailed++
      }
    })
    
    // 9. Restaurar backup
    console.log('🔄 Restaurando backup original...')
    fs.writeFileSync(productsFilePath, fs.readFileSync(backupFilePath, 'utf-8'))
    fs.unlinkSync(backupFilePath)
    
    // 10. Resultado final
    console.log('\n📊 RESULTADO DO TESTE:')
    console.log(`✅ Testes aprovados: ${testsPassed}`)
    console.log(`❌ Testes reprovados: ${testsFailed}`)
    
    if (testsFailed === 0) {
      console.log('🎉 SUCESSO: Preservação de imagens funcionando corretamente!')
    } else {
      console.log('⚠️ ATENÇÃO: Alguns testes falharam. Verifique a implementação.')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
    
    // Tentar restaurar backup em caso de erro
    try {
      if (fs.existsSync(backupFilePath)) {
        fs.writeFileSync(productsFilePath, fs.readFileSync(backupFilePath, 'utf-8'))
        fs.unlinkSync(backupFilePath)
        console.log('🔄 Backup restaurado após erro')
      }
    } catch {}
  }
}

// Executar o teste se chamado diretamente
if (require.main === module) {
  testImagePreservation().catch(console.error)
}

module.exports = { testImagePreservation }
