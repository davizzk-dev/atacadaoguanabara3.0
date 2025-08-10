const http = require('http')

function testPromo() {
  console.log('🧪 Teste API promo...')
  
  // Teste GET primeiro
  console.log('\n1️⃣ Testando GET /api/promo...')
  
  const getOptions = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/promo',
    method: 'GET'
  }
  
  const getReq = http.request(getOptions, (res) => {
    console.log('✅ GET Status:', res.statusCode)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('✅ GET Response:', data)
      
      // Agora testar POST
      testPost()
    })
  })
  
  getReq.on('error', (error) => {
    console.log('❌ GET Error:', error.message)
    testPost()
  })
  
  getReq.end()
  
  function testPost() {
    console.log('\n2️⃣ Testando POST /api/promo...')
    
    const postOptions = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/promo',
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
        console.log('\n🎉 Teste promo concluído!')
      })
    })
    
    postReq.on('error', (error) => {
      console.log('❌ POST Error:', error.message)
      console.log('\n🎉 Teste promo concluído!')
    })
    
    postReq.end()
  }
}

testPromo()

