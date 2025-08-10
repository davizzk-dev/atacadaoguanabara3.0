const http = require('http')

function testPostAny() {
  console.log('🧪 Teste POST para qualquer API...')
  
  // Teste POST para /api/test-simple (que sabemos que funciona)
  console.log('\n1️⃣ Testando POST /api/test-simple...')
  
  const postOptions = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/test-simple',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  const postReq = http.request(postOptions, (res) => {
    console.log('✅ POST Status:', res.statusCode)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('✅ POST Response:', data)
      console.log('\n🎉 Teste concluído!')
    })
  })
  
  postReq.on('error', (error) => {
    console.log('❌ POST Error:', error.message)
    console.log('\n🎉 Teste concluído!')
  })
  
  postReq.end()
}

testPostAny()

