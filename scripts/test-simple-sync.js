const fs = require('fs').promises
const path = require('path')

async function testSimpleSync() {
  try {
    console.log('🔍 Testando sincronização simples...')
    
    // Ler o arquivo de produtos
    const productsPath = path.join(process.cwd(), 'data', 'products.json')
    const productsData = await fs.readFile(productsPath, 'utf8')
    const products = JSON.parse(productsData)
    
    // Encontrar o produto 5290
    const product5290 = products.find(p => p.id === "5290")
    
    if (product5290) {
      console.log('\n📦 PRODUTO 5290:')
      console.log('=' .repeat(50))
      console.log(`ID: ${product5290.id}`)
      console.log(`Nome: ${product5290.name}`)
      console.log(`Preço: R$ ${product5290.price}`)
      console.log(`Preço Original: R$ ${product5290.originalPrice}`)
      console.log('=' .repeat(50))
      
      if (product5290.price === 6.9) {
        console.log('✅ PREÇO CORRETO! R$ 6.9')
      } else {
        console.log(`❌ PREÇO INCORRETO! R$ ${product5290.price} (deveria ser R$ 6.9)`)
      }
    } else {
      console.log('❌ Produto 5290 não encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar
testSimpleSync()
