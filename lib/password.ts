import crypto from 'crypto'

/**
 * Sistema de hash de senhas consistente para todo o projeto
 * Usar em: login, registro, reset de senha
 */

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(plainPassword)
  return hashedInput === hashedPassword
}

// Para compatibilidade com senhas já existentes (sem hash)
export function isPasswordHashed(password: string): boolean {
  // Senhas SHA256 têm exatamente 64 caracteres hexadecimais
  return /^[a-f0-9]{64}$/i.test(password)
}

export function handlePasswordLogin(inputPassword: string, storedPassword: string): boolean {
  // Se a senha armazenada já está hasheada
  if (isPasswordHashed(storedPassword)) {
    return verifyPassword(inputPassword, storedPassword)
  }
  
  // Se a senha armazenada ainda não está hasheada (compatibilidade)
  return inputPassword === storedPassword
}
