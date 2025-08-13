const http = require('http')

function testDirect() {
  console.log('🧪 Teste direto via HTTP...')
  
  // Teste GET primeiro
  console.log('\n1️⃣ Testando GET /api/admin/promotions...')
  
  const getOptions = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/promotions',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  const getReq = http.request(getOptions, (res) => {
    console.log('✅ GET Status:', res.statusCode)
    console.log('✅ GET Headers:', res.headers)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('✅ GET Response:', data.substring(0, 200) + '...')
      
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
    console.log('\n2️⃣ Testando POST /api/admin/promotions...')
    
    const postData = JSON.stringify({
      title: 'Teste Direto',
      description: 'Teste via HTTP direto',
      products: [],
      discount: 10,
      discountType: 'percentage'
    })
    
    const postOptions = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/admin/promotions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const postReq = http.request(postOptions, (res) => {
      console.log('✅ POST Status:', res.statusCode)
      console.log('✅ POST Headers:', res.headers)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('✅ POST Response:', data)
        console.log('\n🎉 Teste direto concluído!')
      })
    })
    
    postReq.on('error', (error) => {
      console.log('❌ POST Error:', error.message)
      console.log('\n🎉 Teste direto concluído!')
    })
    
    postReq.write(postData)
    postReq.end()
  }
}

testDirect()

