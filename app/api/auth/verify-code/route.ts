import { NextRequest, NextResponse } from 'next/server'
import { readDataFile } from '@/lib/database'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Ler códigos de verificação
    const codesPath = path.join(process.cwd(), 'data', 'verification-codes.json')
    const codes = readDataFile(codesPath, [])
    
    // Encontrar o código para este email
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

    console.log(`✅ Código verificado com sucesso para: ${email}`)

    return NextResponse.json({
      message: 'Código verificado com sucesso',
      email: email
    })

  } catch (error) {
    console.error('Erro na verificação do código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 