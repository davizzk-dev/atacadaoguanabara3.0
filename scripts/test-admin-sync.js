// Script para testar a sincronização completa do admin
const BASE_URL = 'http://localhost:3005'

async function testAdminSync() {
  console.log('🧪 Testando sincronização completa do admin...')
  
  try {
    // 1. Testar API de sincronização do Varejo Fácil
    console.log('\n📦 Testando sincronização do Varejo Fácil...')
    const syncResponse = await fetch(`${BASE_URL}/api/sync-varejo-facil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json()
      console.log('✅ Sincronização bem-sucedida!')
      console.log(`   - Produtos sincronizados: ${syncData.data.totalProducts}`)
      console.log(`   - Seções: ${syncData.data.totalSections}`)
      console.log(`   - Marcas: ${syncData.data.totalBrands}`)
      console.log(`   - Gêneros: ${syncData.data.totalGenres}`)
      console.log(`   - Preços: ${syncData.data.totalPrices}`)
    } else {
      console.log('❌ Erro na sincronização:', syncResponse.status)
      const errorText = await syncResponse.text()
      console.log('Erro:', errorText)
    }
    
    // 2. Testar API de estatísticas do admin
    console.log('\n📊 Testando API de estatísticas...')
    const statsResponse = await fetch(`${BASE_URL}/api/admin/stats`)
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      console.log('✅ Estatísticas carregadas!')
      console.log(`   - Total de produtos: ${statsData.data.totalProducts}`)
      console.log(`   - Total de pedidos: ${statsData.data.totalOrders}`)
      console.log(`   - Total de usuários: ${statsData.data.totalUsers}`)
      console.log(`   - Total de feedbacks: ${statsData.data.totalFeedbacks}`)
      console.log(`   - Solicitações de câmera: ${statsData.data.totalCameraRequests}`)
      console.log(`   - Solicitações de retorno: ${statsData.data.totalReturnRequests}`)
      console.log(`   - Receita total: R$ ${statsData.data.totalRevenue.toFixed(2)}`)
    } else {
      console.log('❌ Erro ao carregar estatísticas:', statsResponse.status)
    }
    
    // 3. Testar API de produtos
    console.log('\n🛍️ Testando API de produtos...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json()
      console.log('✅ Produtos carregados!')
      console.log(`   - Total de produtos: ${productsData.products?.length || 0}`)
      
      if (productsData.products && productsData.products.length > 0) {
        const firstProduct = productsData.products[0]
        console.log(`   - Primeiro produto: ${firstProduct.name}`)
        console.log(`   - Preço: R$ ${firstProduct.price}`)
        console.log(`   - Categoria: ${firstProduct.category}`)
      }
    } else {
      console.log('❌ Erro ao carregar produtos:', productsResponse.status)
    }
    
    // 4. Testar APIs de feedback, câmera e retornos
    console.log('\n📝 Testando APIs de feedback, câmera e retornos...')
    
    const apis = [
      { name: 'Feedback', url: '/api/feedback' },
      { name: 'Câmera', url: '/api/camera-requests' },
      { name: 'Retornos', url: '/api/return-requests' }
    ]
    
    for (const api of apis) {
      try {
        const response = await fetch(`${BASE_URL}${api.url}`)
        if (response.ok) {
          const data = await response.json()
          const count = Array.isArray(data) ? data.length : (data.data?.length || 0)
          console.log(`   ✅ ${api.name}: ${count} itens`)
        } else {
          console.log(`   ❌ ${api.name}: Erro ${response.status}`)
        }
      } catch (error) {
        console.log(`   ❌ ${api.name}: ${error.message}`)
      }
    }
    
    // 5. Testar status da sincronização
    console.log('\n🔄 Testando status da sincronização...')
    const statusResponse = await fetch(`${BASE_URL}/api/sync-varejo-facil`)
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('✅ Status da sincronização:')
      console.log(`   - Última sincronização: ${statusData.data.lastSync || 'Nunca'}`)
      console.log(`   - Total de produtos: ${statusData.data.totalProducts}`)
      console.log(`   - Tem produtos: ${statusData.data.hasProducts}`)
      console.log(`   - Tem dados do Varejo Fácil: ${statusData.data.hasVarejoFacilData}`)
    } else {
      console.log('❌ Erro ao obter status:', statusResponse.status)
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar o teste se o script for chamado diretamente
if (require.main === module) {
  testAdminSync()
}

module.exports = { testAdminSync } 