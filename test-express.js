const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

// Rota de teste simples
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'GET funcionando!' })
})

app.post('/test', (req, res) => {
  res.json({ success: true, message: 'POST funcionando!', data: req.body })
})

// Iniciar servidor na porta 3006
const PORT = 3006
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express rodando na porta ${PORT}`)
  
  // Testar automaticamente
  setTimeout(async () => {
    try {
      console.log('\n🧪 Testando servidor Express...')
      
      // Teste GET
      const getResponse = await axios.get(`http://localhost:${PORT}/test`)
      console.log('✅ GET Express:', getResponse.status, getResponse.data.success)
      
      // Teste POST
      const postResponse = await axios.post(`http://localhost:${PORT}/test`, {
        message: 'Teste Express'
      })
      console.log('✅ POST Express:', postResponse.status, postResponse.data.success)
      
      console.log('🎉 Teste Express concluído com sucesso!')
      process.exit(0)
      
    } catch (error) {
      console.error('❌ Erro no teste Express:', error.message)
      process.exit(1)
    }
  }, 1000)
})

