/**
 * Teste direto da API de recupera��o de senha
 * Execute: node scripts/test-forgot-password-api.js
 */

// Para vers�es mais antigas do Node.js
if (!globalThis.fetch) {
  const { default: fetch } = require('node-fetch')
  globalThis.fetch = fetch
}

async function testForgotPasswordAPI() {
  console.log('?? TESTE DA API DE RECUPERA��O DE SENHA')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch('https://atacadaoguanabara.com/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'davikalebe20020602@gmail.com' // Email de teste
      })
    })
    
    const data = await response.json()
    
    console.log('\n?? Resposta da API:')
    console.log(`Status: ${response.status}`)
    console.log('Dados:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n? API funcionando!')
      console.log('?? Email seria enviado se o email existisse no sistema')
      console.log('\n?? Para testar com email real:')
      console.log('1. Registre um usu�rio no sistema primeiro')
      console.log('2. Use o email registrado no teste')
      console.log('3. Ou acesse: http://localhost:3005/forgot-password')
    } else {
      console.log('\n??  Resposta da API:')
      console.log(`Erro: ${data.error}`)
      
      if (data.error.includes('n�o encontrado')) {
        console.log('\n? Isso � normal! O email de teste n�o existe no sistema.')
        console.log('?? Para testar completamente:')
        console.log('1. Acesse: http://localhost:3005/register')
        console.log('2. Registre um usu�rio')
        console.log('3. Teste a recupera��o com esse email')
      }
    }
    
  } catch (error) {
    console.log('\n? Erro na requisi��o:', error.message)
    console.log('\n?? Certifique-se de que o servidor est� rodando:')
    console.log('pnpm dev')
  }
}

// Executar teste
if (require.main === module) {
  testForgotPasswordAPI()
    .then(() => {
      console.log('\n?? Teste finalizado!')
    })
    .catch(error => {
      console.error('? Erro:', error.message)
    })
}

module.exports = { testForgotPasswordAPI }
