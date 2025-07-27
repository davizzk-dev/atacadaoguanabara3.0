import { NextRequest, NextResponse } from 'next/server'
import { readDataFile, writeDataFile } from '@/lib/database'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o código ainda é válido
    const codesPath = path.join(process.cwd(), 'data', 'verification-codes.json')
    const codes = readDataFile(codesPath, [])
    
    const verificationCode = codes.find((c: any) => c.email === email && c.code === code)
    
    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      )
    }

    // Verificar se o código não expirou
    const now = new Date()
    const expiresAt = new Date(verificationCode.expiresAt)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Atualizar a senha do usuário
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const users = readDataFile(usersPath, [])
    
    const userIndex = users.findIndex((u: any) => u.email === email)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Hash da nova senha (em produção, usar bcrypt ou similar)
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex')
    
    // Atualizar senha do usuário
    users[userIndex].password = hashedPassword
    users[userIndex].updatedAt = new Date().toISOString()
    
    writeDataFile(usersPath, users)

    // Remover o código usado
    const updatedCodes = codes.filter((c: any) => !(c.email === email && c.code === code))
    writeDataFile(codesPath, updatedCodes)

    console.log(`✅ Senha alterada com sucesso para: ${email}`)

    return NextResponse.json({
      message: 'Senha alterada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 