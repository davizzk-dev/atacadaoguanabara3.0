// Teste simples para verificar se a API está funcionando
const http = require('http')

function testSimple() {
  console.log('🧪 Testando GET /api/admin/product-promotions...')
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/product-promotions',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
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
      console.log('✅ GET funcionou!')
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erro:', error.message)
  })

  req.end()
}

testSimple()


