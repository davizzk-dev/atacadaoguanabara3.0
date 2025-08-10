// Teste POST para API de promoções
const http = require('http')

function testPromoPost() {
  console.log('🧪 Testando POST /api/admin/product-promotions...')
  
  const postData = JSON.stringify({
    productId: '123',
    productName: 'Produto Teste',
    originalPrice: 100.00,
    newPrice: 80.00,
    isActive: true,
    image: null,
    validUntil: null
  })

  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/product-promotions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
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
      try {
        const jsonData = JSON.parse(data)
        if (res.statusCode === 200 && jsonData.success) {
          console.log('✅ POST funcionou!')
          console.log('📦 Dados retornados:', jsonData.data)
        } else {
          console.log('❌ POST falhou!')
          console.log('❌ Erro:', jsonData.error)
        }
      } catch (e) {
        console.log('❌ Erro ao parsear resposta:', e.message)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Erro:', error.message)
  })

  req.write(postData)
  req.end()
}

testPromoPost()
