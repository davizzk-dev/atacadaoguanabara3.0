const http = require('http')

function testPromotionsTest() {
  console.log('🧪 Teste API promotions-test...')
  
  // Teste GET primeiro
  console.log('\n1️⃣ Testando GET /api/promotions-test...')
  
  const getOptions = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/promotions-test',
    method: 'GET'
  }
  
  const getReq = http.request(getOptions, (res) => {
    console.log('✅ GET Status:', res.statusCode)
    
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
    console.log('\n2️⃣ Testando POST /api/promotions-test...')
    
    const postOptions = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/promotions-test',
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
        console.log('\n🎉 Teste promotions-test concluído!')
      })
    })
    
    postReq.on('error', (error) => {
      console.log('❌ POST Error:', error.message)
      console.log('\n🎉 Teste promotions-test concluído!')
    })
    
    postReq.end()
  }
}

testPromotionsTest()

