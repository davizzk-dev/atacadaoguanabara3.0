// Teste das APIs corrigidas
console.log('🧪 Testando APIs corrigidas...\n');

// Teste do feedback
fetch('http://localhost:3005/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@teste.com',
    type: 'sugestao',
    rating: 5,
    message: 'Teste de feedback via script'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Feedback:', data.success ? 'FUNCIONANDO' : 'ERRO');
  console.log('   Data:', data);
})
.catch(error => {
  console.log('❌ API Feedback:', 'ERRO', error.message);
});

// Teste de câmera requests
fetch('http://localhost:3005/api/camera-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Maria Santos',
    phone: '11999887766',
    rg: '123456789',
    cause: 'Teste',
    moment: 'Manhã',
    period: 'hoje',
    additionalInfo: 'Teste de solicitação'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Camera Requests:', data.success !== false ? 'FUNCIONANDO' : 'ERRO');
})
.catch(error => {
  console.log('❌ API Camera Requests:', 'ERRO', error.message);
});

// Teste de return requests
fetch('http://localhost:3005/api/return-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: 'ORD123',
    userName: 'Carlos Oliveira',
    userEmail: 'carlos@teste.com',
    reason: 'Produto defeituoso',
    description: 'Teste de devolução'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Return Requests:', data.success !== false ? 'FUNCIONANDO' : 'ERRO');
})
.catch(error => {
  console.log('❌ API Return Requests:', 'ERRO', error.message);
});

// Teste de analytics/visitors
fetch('http://localhost:3005/api/analytics/visitors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    page: '/test',
    userAgent: 'Test Script'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Analytics/Visitors:', data.success ? 'FUNCIONANDO' : 'ERRO');
})
.catch(error => {
  console.log('❌ API Analytics/Visitors:', 'ERRO', error.message);
});

console.log('\n🔍 Aguardando resultados dos testes...');
