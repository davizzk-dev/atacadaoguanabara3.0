// Teste simples para API
const http = require('http')

function testAPI() {
  console.log('🧪 Testando API /api/test-product-promo...')
  
  const postData = JSON.stringify({
    test: 'dados',
    message: 'teste'
  })

  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/test-product-promo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = http.request(options, (res) => {
    console.log('📥 Status:', res.statusCode)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('📥 Response:', data)
      if (res.statusCode === 200) {
        console.log('✅ API funcionou!')
      } else {
        console.log('❌ API falhou!')
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erro:', error.message)
  })

  req.write(postData)
  req.end()
}

testAPI()
