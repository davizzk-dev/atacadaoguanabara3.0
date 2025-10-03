import { NextRequest, NextResponse } from 'next/server'
import { readDataFile } from '@/lib/database'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥🔥🔥 FORGOT PASSWORD API CALLED - THIS IS THE CORRECT API 🔥🔥🔥')
    console.log('📍 API Route: /api/auth/forgot-password')
    
    let body
    try {
      body = await request.json()
      console.log('📨 Request body:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.log('❌ Error parsing JSON:', parseError)
      return NextResponse.json(
        { error: 'Formato de dados inválido' },
        { status: 400 }
      )
    }
    
    const { email } = body || {}

    if (!email || email.trim() === '') {
      console.log('❌ Email not provided or empty:', email)
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim()
    console.log('🔍 Looking for email:', trimmedEmail)

    // Verificar se o email existe no sistema
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    console.log('📂 Users path:', usersPath)
    
    const users = readDataFile(usersPath, [])
    console.log('👥 Total users found:', users.length)
    
    const user = users.find((u: any) => u.email === trimmedEmail)
    if (!user) {
      console.log('❌ User not found for email:', trimmedEmail)
      console.log('📋 Available emails (first 5):')
      users.slice(0, 5).forEach((u: any, i: number) => {
        console.log(`  ${i + 1}. Email: ${u.email}`)
      })
      return NextResponse.json(
        { error: 'Email não encontrado no sistema' },
        { status: 404 }
      )
    }

    console.log(`✅ Email confirmado: ${trimmedEmail}`)

    return NextResponse.json({
      message: 'Email confirmado com sucesso',
      email: trimmedEmail
    })

  } catch (error) {
    console.error('Erro na recuperação de senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 