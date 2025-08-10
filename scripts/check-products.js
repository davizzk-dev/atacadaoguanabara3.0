const fs = require('fs').promises
const path = require('path')

async function checkProductsFile() {
  try {
    console.log('🔍 Verificando arquivo products.json...')
    
    const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
    
    // Verificar se o arquivo existe
    try {
      await fs.access(productsFilePath)
      console.log('✅ Arquivo products.json encontrado')
    } catch (error) {
      console.log('❌ Arquivo products.json não encontrado')
      return
    }
    
    // Ler o arquivo
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    console.log(`📄 Tamanho do arquivo: ${productsData.length} caracteres`)
    
    // Fazer parse do JSON
    const products = JSON.parse(productsData)
    console.log(`📦 Produtos parseados: ${products.length}`)
    
    // Verificar se é um array
    if (!Array.isArray(products)) {
      console.error('❌ Arquivo não contém um array válido')
      return
    }
    
    // Mostrar alguns produtos de exemplo
    if (products.length > 0) {
      console.log('\n📋 Primeiros 5 produtos:')
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}) - R$ ${product.price}`)
      })
      
      console.log(`\n📊 Resumo:`)
      console.log(`   - Total de produtos: ${products.length}`)
      console.log(`   - Categorias únicas: ${[...new Set(products.map(p => p.category))].length}`)
      console.log(`   - Produtos com preço > 0: ${products.filter(p => p.price > 0).length}`)
      console.log(`   - Produtos com imagem: ${products.filter(p => p.image).length}`)
    } else {
      console.log('⚠️ Arquivo está vazio')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar arquivo:', error)
  }
}

// Executar verificação
checkProductsFile()
