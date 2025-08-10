const axios = require('axios')

async function testPostSimple() {
  try {
    console.log('🧪 Testando POST simples...')
    
    const baseURL = 'http://localhost:3005'
    
    // Teste GET
    console.log('\n1️⃣ Testando GET /api/test-post...')
    try {
      const response = await axios.get(`${baseURL}/api/test-post`)
      console.log('✅ GET test-post:', response.status, response.data.success)
    } catch (error) {
      console.log('❌ GET test-post falhou:', error.response?.status, error.response?.data)
    }
    
    // Teste POST
    console.log('\n2️⃣ Testando POST /api/test-post...')
    const testData = { message: 'Teste simples' }
    
    try {
      const response = await axios.post(`${baseURL}/api/test-post`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      })
      console.log('✅ POST test-post:', response.status, response.data.success)
      console.log('📝 Dados recebidos:', response.data.receivedData)
    } catch (error) {
      console.log('❌ POST test-post falhou:')
      console.log('   Status:', error.response?.status)
      console.log('   Data:', error.response?.data)
      console.log('   Message:', error.message)
      console.log('   Code:', error.code)
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testPostSimple()

