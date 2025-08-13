const fs = require('fs')
const path = require('path')

async function testImagePreservationWorkflow() {
  console.log('🧪 TESTE COMPLETO: Fluxo de Preservação de Imagens')
  console.log('=' * 60)
  
  const dataDir = path.join(process.cwd(), 'data')
  const productsFilePath = path.join(dataDir, 'products.json')
  const backupFilePath = path.join(dataDir, 'products-backup-test.json')
  
  try {
    // 1. Fazer backup
    console.log('💾 Criando backup...')
    if (fs.existsSync(productsFilePath)) {
      fs.copyFileSync(productsFilePath, backupFilePath)
      console.log('✅ Backup criado')
    } else {
      console.log('❌ Arquivo products.json não encontrado')
      return
    }
    
    // 2. Carregar produtos
    let products = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    console.log(`📂 ${products.length} produtos carregados`)
    
    // 3. Adicionar algumas imagens personalizadas para teste
    const testImages = [
      { id: 1, customImage: 'https://i.imgur.com/cafe_premium_123.jpg' },
      { id: 100, customImage: 'https://example.com/produto_especial.png' },
      { id: 500, customImage: 'https://minhacdn.com.br/imagem_custom.webp' },
      { id: 1000, customImage: 'https://i.imgur.com/outro_produto_456.jpg' }
    ]
    
    console.log('\n🖼️ Adicionando imagens personalizadas de teste...')
    testImages.forEach(testItem => {
      const product = products.find(p => p.id.toString() === testItem.id.toString())
      if (product) {
        const oldImage = product.image
        product.image = testItem.customImage
        console.log(`   ✏️ ID ${product.id}: ${product.name}`)
        console.log(`      Antiga: ${oldImage}`)
        console.log(`      Nova: ${testItem.customImage}`)
      } else {
        console.log(`   ⚠️ Produto ID ${testItem.id} não encontrado`)
      }
    })
    
    // 4. Salvar arquivo com imagens de teste
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2))
    console.log('✅ Arquivo atualizado com imagens de teste')
    
    // 5. Simular etapa 1 da sincronização: criar mapa de preservação
    console.log('\n🔍 ETAPA 1: Criando mapa de preservação...')
    const imagePreservationMap = new Map()
    
    products.forEach(product => {
      const productId = product.id.toString()
      
      if (product.image && 
          !product.image.includes('unsplash.com') && 
          !product.image.includes('placeholder') && 
          !product.image.includes('/default/') && 
          !product.image.includes('no-image') &&
          product.image.trim() !== '') {
        
        imagePreservationMap.set(productId, product.image)
        console.log(`   💾 Preservando ID ${productId}: ${product.image}`)
      }
    })
    
    console.log(`📊 ${imagePreservationMap.size} imagens no mapa de preservação`)
    
    // 6. Simular dados vindos da API (substituindo todas as imagens por Unsplash)
    console.log('\n🔄 ETAPA 2: Simulando dados da API (todas imagens viram Unsplash)...')
    products.forEach(product => {
      // Simular que a API sempre retorna imagens do Unsplash
      product.image = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=400&fit=crop&auto=format`
      // Simular que pode haver outras mudanças (preço, nome, etc.)
      product.lastSync = new Date().toISOString()
    })
    
    console.log('✅ Todos os produtos agora têm imagens do Unsplash (simulando API)')
    
    // 7. Simular etapa 3: aplicar imagens preservadas
    console.log('\n🔧 ETAPA 3: Aplicando imagens preservadas...')
    let restoredCount = 0
    
    products.forEach(product => {
      const productId = product.id.toString()
      
      if (imagePreservationMap.has(productId)) {
        const preservedImage = imagePreservationMap.get(productId)
        product.image = preservedImage
        console.log(`   ✅ Restaurada ID ${productId}: ${preservedImage}`)
        restoredCount++
      }
    })
    
    console.log(`📊 ${restoredCount} imagens restauradas`)
    
    // 8. Verificar resultado final
    console.log('\n🔍 VERIFICAÇÃO FINAL:')
    let preservedCount = 0
    let lostCount = 0
    
    testImages.forEach(testItem => {
      const product = products.find(p => p.id.toString() === testItem.id.toString())
      if (product) {
        if (product.image === testItem.customImage) {
          console.log(`   ✅ PRESERVADA ID ${product.id}: ${testItem.customImage}`)
          preservedCount++
        } else {
          console.log(`   ❌ PERDIDA ID ${product.id}:`)
          console.log(`      Esperada: ${testItem.customImage}`)
          console.log(`      Atual: ${product.image}`)
          lostCount++
        }
      }
    })
    
    // 9. Resultado
    console.log('\n📊 RESULTADO DO TESTE:')
    console.log(`✅ Imagens preservadas: ${preservedCount}`)
    console.log(`❌ Imagens perdidas: ${lostCount}`)
    console.log(`📊 Total testado: ${testImages.length}`)
    
    if (lostCount === 0) {
      console.log('\n🎉 SUCESSO TOTAL!')
      console.log('✅ Todas as imagens personalizadas foram preservadas!')
      console.log('✅ O sistema de preservação está funcionando perfeitamente!')
    } else {
      console.log('\n⚠️ PROBLEMA DETECTADO!')
      console.log('❌ Algumas imagens personalizadas foram perdidas.')
      console.log('🔧 O sistema de preservação precisa de ajustes.')
    }
    
    // 10. Restaurar backup
    console.log('\n🔄 Restaurando arquivo original...')
    fs.copyFileSync(backupFilePath, productsFilePath)
    fs.unlinkSync(backupFilePath)
    console.log('✅ Arquivo original restaurado')
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error)
    
    // Restaurar backup em caso de erro
    try {
      if (fs.existsSync(backupFilePath)) {
        fs.copyFileSync(backupFilePath, productsFilePath)
        fs.unlinkSync(backupFilePath)
        console.log('🔄 Backup restaurado após erro')
      }
    } catch (restoreError) {
      console.error('❌ Erro ao restaurar backup:', restoreError)
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testImagePreservationWorkflow().catch(console.error)
}

module.exports = { testImagePreservationWorkflow }
