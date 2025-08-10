const fs = require('fs/promises')
const path = require('path')

async function testPromotionAPI() {
  try {
    console.log('🧪 Testando API de promoções...')
    
    const promotionsFilePath = path.join(process.cwd(), 'data', 'promotions.json')
    
    // Testar se o arquivo existe
    try {
      await fs.access(promotionsFilePath)
      console.log('✅ Arquivo promotions.json existe')
    } catch (error) {
      console.log('❌ Arquivo promotions.json não existe, criando...')
      await fs.writeFile(promotionsFilePath, JSON.stringify([], null, 2))
      console.log('✅ Arquivo promotions.json criado')
    }
    
    // Ler arquivo
    const promotionsData = await fs.readFile(promotionsFilePath, 'utf8')
    const promotions = JSON.parse(promotionsData) || []
    console.log(`📊 Promoções existentes: ${promotions.length}`)
    
    // Testar criação de promoção
    const testPromotion = {
      id: `test_${Date.now()}`,
      title: 'Teste',
      name: 'Teste',
      description: 'Descrição de teste',
      type: 'promotion',
      products: [{ id: '1', name: 'Produto Teste' }],
      discount: 10,
      discountType: 'percentage',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('🎁 Criando promoção de teste...')
    promotions.push(testPromotion)
    
    await fs.writeFile(promotionsFilePath, JSON.stringify(promotions, null, 2))
    console.log('✅ Promoção de teste criada com sucesso!')
    
    // Verificar se foi salva
    const newData = await fs.readFile(promotionsFilePath, 'utf8')
    const newPromotions = JSON.parse(newData)
    console.log(`📊 Promoções após teste: ${newPromotions.length}`)
    
    console.log('🎉 Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testPromotionAPI()

