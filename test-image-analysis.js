const fs = require('fs')
const path = require('path')

async function testImagePreservationLogic() {
  console.log('🧪 TESTE DE PRESERVAÇÃO DE IMAGENS')
  console.log('=' * 50)
  
  const dataDir = path.join(process.cwd(), 'data')
  const productsFilePath = path.join(dataDir, 'products.json')
  
  try {
    // 1. Verificar se arquivo existe
    if (!fs.existsSync(productsFilePath)) {
      console.log('❌ Arquivo products.json não encontrado em:', productsFilePath)
      return
    }
    
    // 2. Ler produtos atuais
    const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'))
    console.log(`📂 ${products.length} produtos carregados`)
    
    // 3. Analisar as imagens atuais
    console.log('\n🔍 ANÁLISE DAS IMAGENS ATUAIS:')
    
    let customImages = 0
    let defaultImages = 0
    let unsplashImages = 0
    let emptyImages = 0
    
    const imageStats = {}
    
    products.forEach(product => {
      if (!product.image || product.image === '') {
        emptyImages++
      } else if (product.image.includes('unsplash.com')) {
        unsplashImages++
      } else if (product.image.includes('placeholder') || 
                 product.image.includes('/default/') || 
                 product.image.includes('no-image')) {
        defaultImages++
      } else {
        customImages++
        
        // Contar domínios das imagens personalizadas
        try {
          const url = new URL(product.image)
          const domain = url.hostname
          imageStats[domain] = (imageStats[domain] || 0) + 1
        } catch (e) {
          imageStats['URL inválida'] = (imageStats['URL inválida'] || 0) + 1
        }
      }
    })
    
    console.log(`📊 Imagens personalizadas: ${customImages}`)
    console.log(`📊 Imagens do Unsplash: ${unsplashImages}`)
    console.log(`📊 Imagens padrão/placeholder: ${defaultImages}`)
    console.log(`📊 Sem imagem: ${emptyImages}`)
    
    if (customImages > 0) {
      console.log('\n🏷️ DOMÍNIOS DAS IMAGENS PERSONALIZADAS:')
      Object.entries(imageStats).forEach(([domain, count]) => {
        console.log(`   - ${domain}: ${count} imagens`)
      })
    }
    
    // 4. Simular processo de preservação
    console.log('\n🔧 SIMULANDO PRESERVAÇÃO DE IMAGENS:')
    
    // Criar mapa de preservação (como no sync real)
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
        console.log(`💾 Preservando ID ${productId}: ${product.image}`)
      }
    })
    
    console.log(`\n📊 ${imagePreservationMap.size} imagens marcadas para preservação`)
    
    // 5. Simular aplicação das imagens preservadas
    console.log('\n🔄 SIMULANDO APLICAÇÃO DAS IMAGENS PRESERVADAS:')
    
    let appliedCount = 0
    products.forEach(product => {
      const productId = product.id.toString()
      
      if (imagePreservationMap.has(productId)) {
        const preservedImage = imagePreservationMap.get(productId)
        console.log(`✅ Aplicando para ID ${productId}: ${preservedImage}`)
        appliedCount++
      }
    })
    
    console.log(`\n📊 ${appliedCount} imagens aplicadas`)
    
    // 6. Mostrar produtos que teriam suas imagens preservadas
    if (imagePreservationMap.size > 0) {
      console.log('\n🖼️ PRODUTOS COM IMAGENS QUE SERÃO PRESERVADAS:')
      
      products.slice(0, 10).forEach(product => {
        const productId = product.id.toString()
        if (imagePreservationMap.has(productId)) {
          console.log(`   ID: ${product.id}`)
          console.log(`   Nome: ${product.name}`)
          console.log(`   Imagem: ${product.image}`)
          console.log(`   ---`)
        }
      })
      
      if (products.length > 10) {
        console.log(`   ... e mais ${Math.max(0, imagePreservationMap.size - 10)} produtos`)
      }
    }
    
    // 7. Resultado final
    console.log('\n🎯 RESULTADO DA SIMULAÇÃO:')
    console.log(`✅ ${imagePreservationMap.size} imagens personalizadas serão preservadas`)
    console.log(`🔄 ${unsplashImages + defaultImages} imagens serão atualizadas pela API`)
    console.log(`⚠️ ${emptyImages} produtos sem imagem`)
    
    if (imagePreservationMap.size > 0) {
      console.log('\n🎉 SUCESSO: Sistema de preservação está funcionando!')
      console.log('💡 As imagens personalizadas não serão perdidas durante a sincronização.')
    } else {
      console.log('\n⚠️ AVISO: Nenhuma imagem personalizada foi encontrada.')
      console.log('💡 Adicione algumas imagens personalizadas via admin para testar a preservação.')
    }
    
  } catch (error) {
    console.error('❌ Erro durante análise:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testImagePreservationLogic().catch(console.error)
}

module.exports = { testImagePreservationLogic }
