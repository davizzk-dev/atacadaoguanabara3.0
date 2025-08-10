const axios = require('axios')

async function testDebug() {
  try {
    console.log('🧪 Testando API de debug...')
    
    const baseURL = 'http://localhost:3005'
    
    // Teste GET
    console.log('\n1️⃣ Testando GET /api/debug...')
    try {
      const response = await axios.get(`${baseURL}/api/debug`)
      console.log('✅ GET debug:', response.status, response.data.success)
      console.log('📝 Info:', response.data.nodeVersion, response.data.platform)
    } catch (error) {
      console.log('❌ GET debug falhou:', error.response?.status, error.response?.data)
    }
    
    // Teste POST
    console.log('\n2️⃣ Testando POST /api/debug...')
    const testData = { message: 'Teste debug' }
    
    try {
      const response = await axios.post(`${baseURL}/api/debug`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      })
      console.log('✅ POST debug:', response.status, response.data.success)
      console.log('📝 Dados recebidos:', response.data.receivedData)
    } catch (error) {
      console.log('❌ POST debug falhou:')
      console.log('   Status:', error.response?.status)
      console.log('   Data:', error.response?.data)
      console.log('   Message:', error.message)
    }
    
    console.log('\n🎉 Teste debug concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testDebug()

