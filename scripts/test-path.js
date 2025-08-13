const path = require('path')
const fs = require('fs').promises

async function testPath() {
  try {
    console.log('🧪 Testando caminho do arquivo...')
    
    const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
    console.log('📂 Caminho completo:', productsFilePath)
    
    // Verificar se o arquivo existe
    try {
      await fs.access(productsFilePath)
      console.log('✅ Arquivo products.json encontrado')
      
      // Ler o arquivo
      const productsData = await fs.readFile(productsFilePath, 'utf8')
      console.log(`📄 Tamanho do arquivo: ${productsData.length} caracteres`)
      
      // Fazer parse do JSON
      const products = JSON.parse(productsData)
      console.log(`📦 Produtos parseados: ${products.length}`)
      
      if (products.length > 0) {
        console.log('\n📋 Primeiros 3 produtos:')
        products.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
        })
      }
      
    } catch (error) {
      console.log('❌ Erro ao acessar arquivo:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar teste
testPath()
