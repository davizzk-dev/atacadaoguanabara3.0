// Teste simples para API de promoções
const http = require('http')

function testPromoAPI() {
  console.log('🧪 Testando API de promoções...')
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/promotions',
    method: 'GET'
  }

  const req = http.request(options, (res) => {
    console.log('📥 Status:', res.statusCode)
    console.log('📥 Headers:', res.headers)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('📥 Response:', data)
      if (res.statusCode === 200) {
        console.log('✅ GET funcionou!')
      } else {
        console.log('❌ GET falhou!')
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erro:', error.message)
  })

  req.end()
}

testPromoAPI()
