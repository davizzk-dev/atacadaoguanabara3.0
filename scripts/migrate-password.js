/**
 * Script para migrar senhas n�o criptografadas para criptografadas
 * Execute: node scripts/migrate-passwords.js
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function isPasswordHashed(password) {
  return /^[a-f0-9]{64}$/i.test(password)
}

async function migratePasswords() {
  console.log('?? MIGRA��O DE SENHAS')
  console.log('=' .repeat(40))
  
  const usersPath = path.join(process.cwd(), 'data', 'users.json')
  
  if (!fs.existsSync(usersPath)) {
    console.log('? Arquivo users.json n�o encontrado')
    return
  }
  
  try {
    const data = fs.readFileSync(usersPath, 'utf-8')
    const users = JSON.parse(data)
    
    console.log(`?? Total de usu�rios: ${users.length}`)
    
    let migratedCount = 0
    let alreadyHashedCount = 0
    
    users.forEach((user, index) => {
      if (user.password && !isPasswordHashed(user.password)) {
        const originalPassword = user.password
        const hashedPassword = hashPassword(user.password)
        
        users[index].password = hashedPassword
        migratedCount++
        
        console.log(`? Migrado: ${user.email} (${originalPassword} -> ${hashedPassword.substring(0, 10)}...)`)
      } else if (isPasswordHashed(user.password)) {
        alreadyHashedCount++
        console.log(`??  J� criptografada: ${user.email}`)
      }
    })
    
    if (migratedCount > 0) {
      // Fazer backup
      const backupPath = usersPath + '.backup.' + Date.now()
      fs.writeFileSync(backupPath, data)
      console.log(`?? Backup criado: ${backupPath}`)
      
      // Salvar arquivo atualizado
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
      console.log('?? Arquivo atualizado!')
    }
    
    console.log('\n?? RESUMO:')
    console.log(`? Senhas migradas: ${migratedCount}`)
    console.log(`??  J� criptografadas: ${alreadyHashedCount}`)
    console.log(`?? Total: ${users.length}`)
    
    if (migratedCount > 0) {
      console.log('\n?? MIGRA��O CONCLU�DA!')
      console.log('??  IMPORTANTE: Teste o login com as senhas originais')
    } else {
      console.log('\n? Nenhuma migra��o necess�ria!')
    }
    
  } catch (error) {
    console.error('? Erro na migra��o:', error.message)
  }
}

if (require.main === module) {
  migratePasswords()
}

module.exports = { migratePasswords }
