import { NextRequest, NextResponse } from 'next/server'
import { readDataFile, writeDataFile } from '@/lib/database'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('�🚨🚨 RESET PASSWORD API CALLED - THIS SHOULD NOT BE CALLED FOR FIRST STEP 🚨🚨🚨')
    console.log('📍 API Route: /api/auth/reset-password')
    
    const body = await request.json()
    console.log('📨 Request body:', JSON.stringify(body, null, 2))
    
    const { email, phone, newPassword } = body

    console.log('📋 Extracted data:')
    console.log('  📧 Email:', email)
    console.log('  📱 Phone:', phone)
    console.log('  🔐 New Password:', newPassword ? `provided (${newPassword.length} chars)` : 'missing')

    if (!email || !phone || !newPassword) {
      console.log('❌ Missing required fields:', { email: !!email, phone: !!phone, newPassword: !!newPassword })
      return NextResponse.json(
        { error: 'Email, telefone e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      console.log('❌ Password too short:', newPassword.length)
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim()
    const cleanPhone = phone.replace(/\D/g, '') // Remove tudo que não for dígito
    
    console.log('🔍 Looking for user with:')
    console.log('  📧 Email:', trimmedEmail)
    console.log('  📱 Phone cleaned:', cleanPhone)

    // Verificar se o usuário existe com email e telefone
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const users = readDataFile(usersPath, [])
    
    console.log('👥 Total users found:', users.length)
    
    const userIndex = users.findIndex((u: any) => {
      const userCleanPhone = u.phone ? u.phone.replace(/\D/g, '') : ''
      return u.email === trimmedEmail && userCleanPhone === cleanPhone
    })
    
    if (userIndex === -1) {
      console.log('❌ User not found for email:', trimmedEmail, 'and phone:', cleanPhone)
      console.log('📋 Available users (first 3):')
      users.slice(0, 3).forEach((u: any, i: number) => {
        const userCleanPhone = u.phone ? u.phone.replace(/\D/g, '') : ''
        console.log(`  ${i + 1}. Email: ${u.email}, Phone: ${u.phone} (clean: ${userCleanPhone})`)
      })
      return NextResponse.json(
        { error: 'Usuário não encontrado ou dados não conferem' },
        { status: 404 }
      )
    }

    console.log('✅ User found at index:', userIndex)

    // Hash da nova senha (em produção, usar bcrypt ou similar)
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex')
    
    // Atualizar senha do usuário
    users[userIndex].password = hashedPassword
    users[userIndex].updatedAt = new Date().toISOString()
    
    writeDataFile(usersPath, users)

    console.log(`✅ Senha alterada com sucesso para email: ${trimmedEmail}`)

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