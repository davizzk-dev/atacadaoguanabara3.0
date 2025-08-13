async function testPromoPost() {
  console.log('🧪 Testando POST /api/admin/promotions...')
  
  try {
    const promoData = {
      title: 'Promoção Teste POST',
      description: 'Descrição da promoção teste',
      type: 'promotion',
      discountType: 'percentage',
      discount: 15,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      products: []
    }
a
    console.log('📤 Enviando dados:', promoData)

    const response = await fetch('http://localhost:3005/api/admin/promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promoData)
    })

    console.log('📥 Status:', response.status)
    console.log('📥 Headers:', Object.fromEntries(response.headers.entries()))

    const result = await response.text()
    console.log('📥 Response:', result)

    if (response.ok) {
      console.log('✅ POST funcionou!')
    } else {
      console.log('❌ POST falhou!')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testPromoPost()
