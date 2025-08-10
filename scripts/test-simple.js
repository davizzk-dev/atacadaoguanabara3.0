console.log('🧪 Testando import das funções...')

try {
  // Tentar importar as funções
  const data = require('../lib/data')
  console.log('✅ Import bem-sucedido')
  console.log('📋 Funções disponíveis:', Object.keys(data))
  
  // Testar getCatalogProducts
  if (data.getCatalogProducts) {
    console.log('✅ getCatalogProducts disponível')
  } else {
    console.log('❌ getCatalogProducts não encontrada')
  }
  
} catch (error) {
  console.error('❌ Erro no import:', error.message)
}
