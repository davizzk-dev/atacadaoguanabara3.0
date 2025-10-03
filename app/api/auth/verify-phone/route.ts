import { NextRequest, NextResponse } from 'next/server'
import { readDataFile } from '@/lib/database'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Verify phone API called')
    const body = await request.json()
    console.log('📨 Request body:', body)
    
    const { email, phone } = body

    if (!email || !phone) {
      console.log('❌ Email or phone not provided')
      return NextResponse.json(
        { error: 'Email e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim()
    const cleanPhone = phone.replace(/\D/g, '') // Remove tudo que não for dígito
    
    console.log('🔍 Looking for:')
    console.log('  📧 Email:', trimmedEmail)
    console.log('  📱 Phone original:', phone)
    console.log('  📱 Phone cleaned:', cleanPhone)

    // Verificar se o usuário existe com esse email e telefone
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    console.log('📂 Users path:', usersPath)
    
    const users = readDataFile(usersPath, [])
    console.log('👥 Total users found:', users.length)
    
    const user = users.find((u: any) => {
      const userCleanPhone = u.phone ? u.phone.replace(/\D/g, '') : ''
      return u.email === trimmedEmail && userCleanPhone === cleanPhone
    })
    
    if (!user) {
      console.log('❌ User not found for email:', trimmedEmail, 'and phone:', cleanPhone)
      console.log('📋 Available users (first 3):')
      users.slice(0, 3).forEach((u: any, i: number) => {
        const userCleanPhone = u.phone ? u.phone.replace(/\D/g, '') : ''
        console.log(`  ${i + 1}. Email: ${u.email}, Phone: ${u.phone} (clean: ${userCleanPhone})`)
      })
      return NextResponse.json(
        { error: 'Número de telefone não confere com o email informado' },
        { status: 404 }
      )
    }

    console.log(`✅ Telefone confirmado para email: ${trimmedEmail}`)

    return NextResponse.json({
      message: 'Telefone confirmado com sucesso'
    })

  } catch (error) {
    console.error('Erro na verificação de telefone:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
