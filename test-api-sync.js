const axios = require('axios');

async function testSyncAPI() {
  try {
    console.log('🧪 Testando API de sincronização...');
    
    const response = await axios.post('http://localhost:3005/api/sync-varejo-facil', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('✅ Sucesso:', response.data);
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log('❌ Erro:', error.response.data);
    }
  }
}

testSyncAPI(); 