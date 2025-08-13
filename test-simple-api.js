const axios = require('axios')

async function testSimpleAPI() {
  try {
    console.log('🧪 Testando API simples...')
    
    const baseURL = 'http://localhost:3005'
    
    // Teste 1: GET simples
    console.log('\n1️⃣ Testando GET /api/test-simple...')
    try {
      const response = await axios.get(`${baseURL}/api/test-simple`)
      console.log('✅ GET simples:', response.status, response.data.success)
    } catch (error) {
      console.log('❌ GET simples falhou:', error.response?.status, error.response?.data)
    }
    
    // Teste 2: POST simples
    console.log('\n2️⃣ Testando POST /api/test-simple...')
    const testData = {
      message: 'Teste simples',
      number: 123,
      array: [1, 2, 3]
    }
    
    try {
      const response = await axios.post(`${baseURL}/api/test-simple`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      })
      console.log('✅ POST simples:', response.status, response.data.success)
      console.log('📝 Dados recebidos:', response.data.receivedData)
    } catch (error) {
      console.log('❌ POST simples falhou:', error.response?.status, error.response?.data)
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Timeout na requisição')
      }
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testSimpleAPI()

