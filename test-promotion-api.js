const axios = require('axios')

async function testPromotionAPI() {
  try {
    console.log('🧪 Testando API de promoções via HTTP...')
    
    const baseURL = 'http://localhost:3005'
    
    // Teste 1: GET promoções
    console.log('\n1️⃣ Testando GET /api/admin/promotions...')
    try {
      const response = await axios.get(`${baseURL}/api/admin/promotions`)
      console.log('✅ GET promoções:', response.status, response.data.success)
    } catch (error) {
      console.log('❌ GET promoções falhou:', error.response?.status, error.response?.data)
    }
    
    // Teste 2: POST promoção
    console.log('\n2️⃣ Testando POST /api/admin/promotions...')
    const testPromotion = {
      title: 'Teste API',
      name: 'Teste API',
      description: 'Descrição de teste da API',
      type: 'promotion',
      products: [{ id: '1', name: 'Produto Teste' }],
      discount: 15,
      discountType: 'percentage',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    }
    
    try {
      const response = await axios.post(`${baseURL}/api/admin/promotions`, testPromotion, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      })
      console.log('✅ POST promoção:', response.status, response.data.success)
      console.log('🎁 ID da promoção:', response.data.data?.id)
    } catch (error) {
      console.log('❌ POST promoção falhou:', error.response?.status, error.response?.data)
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Timeout na requisição')
      }
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testPromotionAPI()

