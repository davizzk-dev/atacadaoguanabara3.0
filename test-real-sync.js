const fs = require('fs')
const path = require('path')

// Importar a função real de sincronização
const { syncAndFormatProducts } = require('./scripts/sync-with-formatting.js')

async function testRealSync() {
  console.log('🧪 TESTE REAL: Preservação com Sincronização Completa')
  console.log('=' * 60)
  
  const dataDir = path.join(process.cwd(), 'data')
  const productsFilePath = path.join(dataDir, 'products.json')
  const backupFilePath = path.join(dataDir, 'products-backup-real-test.json')
  
  try {
    // 1. Fazer backup do arquivo atual
    console.log('💾 Criando backup dos produtos atuais...')
    if (fs.existsSync(productsFilePath)) {
      fs.copyFileSync(productsFilePath, backupFilePath)
      console.log('✅ Backup criado')
    } else {
      console.log('❌ Arquivo products.json não encontrado')
      return
    }
    
    // 2. Ler produtos atuais
    const originalProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    console.log(`📂 ${originalProducts.length} produtos no arquivo atual`)
    
    // 3. Simular algumas imagens personalizadas nos primeiros produtos
    console.log('🖼️ Adicionando imagens personalizadas de teste...')
    const testProducts = [...originalProducts]
    const testImageMappings = []
    
    for (let i = 0; i < Math.min(3, testProducts.length); i++) {
      const customImage = `https://i.imgur.com/test${i + 1}_${Date.now()}.jpg`
      testProducts[i].image = customImage
      testImageMappings.push({
        id: testProducts[i].id,
        name: testProducts[i].name,
        image: customImage
      })
      console.log(`   - ID ${testProducts[i].id}: ${testProducts[i].name} → ${customImage}`)
    }
    
    // 4. Salvar produtos com imagens de teste
    fs.writeFileSync(productsFilePath, JSON.stringify(testProducts, null, 2))
    console.log('✅ Produtos com imagens de teste salvos')
    
    // 5. Executar sincronização real
    console.log('🔄 Executando sincronização real...')
    console.log('⚠️ ATENÇÃO: Isso fará uma sincronização completa com a API!')
    console.log('⏰ Aguarde, pode demorar alguns minutos...')
    
    try {
      const syncResult = await syncAndFormatProducts()
      console.log('✅ Sincronização concluída:', syncResult.success ? 'SUCESSO' : 'FALHA')
      
      if (syncResult.success) {
        console.log(`📊 ${syncResult.totalProducts} produtos sincronizados`)
      }
    } catch (syncError) {
      console.error('❌ Erro durante sincronização:', syncError.message)
      console.log('🔄 Restaurando backup por causa do erro...')
      fs.copyFileSync(backupFilePath, productsFilePath)
      return
    }
    
    // 6. Verificar se as imagens foram preservadas
    console.log('🔍 Verificando preservação de imagens...')
    const syncedProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    
    let preservedCount = 0
    let lostCount = 0
    
    testImageMappings.forEach(testMapping => {
      const syncedProduct = syncedProducts.find(p => p.id.toString() === testMapping.id.toString())
      
      if (syncedProduct) {
        if (syncedProduct.image === testMapping.image) {
          console.log(`✅ PRESERVADA: ID ${testMapping.id} - ${testMapping.image}`)
          preservedCount++
        } else {
          console.log(`❌ PERDIDA: ID ${testMapping.id}`)
          console.log(`   Esperado: ${testMapping.image}`)
          console.log(`   Atual: ${syncedProduct.image}`)
          lostCount++
        }
      } else {
        console.log(`❌ PRODUTO NÃO ENCONTRADO: ID ${testMapping.id}`)
        lostCount++
      }
    })
    
    // 7. Resultado
    console.log('\n📊 RESULTADO DO TESTE REAL:')
    console.log(`✅ Imagens preservadas: ${preservedCount}`)
    console.log(`❌ Imagens perdidas: ${lostCount}`)
    console.log(`📊 Total testado: ${testImageMappings.length}`)
    
    if (lostCount === 0) {
      console.log('🎉 SUCESSO: Todas as imagens foram preservadas!')
    } else {
      console.log('⚠️ ATENÇÃO: Algumas imagens foram perdidas.')
      console.log('🔧 Verifique os logs de sincronização acima para mais detalhes.')
    }
    
    // 8. Restaurar backup
    console.log('🔄 Restaurando produtos originais...')
    fs.copyFileSync(backupFilePath, productsFilePath)
    fs.unlinkSync(backupFilePath)
    console.log('✅ Produtos originais restaurados')
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error)
    
    // Tentar restaurar backup
    try {
      if (fs.existsSync(backupFilePath)) {
        fs.copyFileSync(backupFilePath, productsFilePath)
        fs.unlinkSync(backupFilePath)
        console.log('🔄 Backup restaurado após erro')
      }
    } catch {}
  }
}

// Executar o teste se chamado diretamente
if (require.main === module) {
  console.log('⚠️ ESTE TESTE IRÁ FAZER UMA SINCRONIZAÇÃO REAL COM A API!')
  console.log('⚠️ Tem certeza que deseja continuar? (Ctrl+C para cancelar)')
  
  setTimeout(() => {
    testRealSync().catch(console.error)
  }, 3000)
}

module.exports = { testRealSync }
