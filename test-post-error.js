const axios = require('axios')

async function testPostError() {
  try {
    console.log('🧪 Testando erro específico do POST...')
    
    const baseURL = 'http://localhost:3005'
    
    // Teste POST com captura de erro detalhada
    console.log('\n📤 Enviando POST para /api/test-simple...')
    const testData = {
      message: 'Teste de erro',
      number: 123
    }
    
    try {
      const response = await axios.post(`${baseURL}/api/test-simple`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      })
      console.log('✅ POST funcionou:', response.status, response.data)
    } catch (error) {
      console.log('❌ POST falhou com erro:')
      console.log('   Status:', error.response?.status)
      console.log('   Status Text:', error.response?.statusText)
      console.log('   Data:', error.response?.data)
      console.log('   Headers:', error.response?.headers)
      console.log('   Message:', error.message)
      console.log('   Code:', error.code)
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testPostError()

