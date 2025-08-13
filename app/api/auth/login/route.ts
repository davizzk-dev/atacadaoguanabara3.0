import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'users.json')

// Função para ler dados de usuários
function readUsers() {
  try {
    const fs = require('fs')
    if (!fs.existsSync(dataPath)) {
      return []
    }
    const data = readFileSync(dataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler usuários:', error)
    return []
  }
}

// POST - Login de usuário
export async function POST(request: NextRequest) {
  try {
    console.log('[API/auth/login][POST] chamada recebida')
    
    // Usar request.text() e parsing manual para evitar erro do Express middleware
    const textBody = await request.text()
    console.log('[API/auth/login][POST] body recebido:', textBody)
    
    let body: any
    try {
      body = JSON.parse(textBody)
    } catch (parseError) {
      console.error('[API/auth/login][POST] Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON inválido',
        details: (parseError as Error)?.message
      }, { status: 400 })
    }
    
    const { email, password } = body

    // Validações
    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 })
    }

    const users = readUsers()

    // Buscar usuário
    const user = users.find((u: any) => u.email === email && u.password === password)
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Email ou senha incorretos' 
      }, { status: 401 })
    }

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user
    console.log('[API/auth/login][POST] login realizado com sucesso para:', email)
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    })
  } catch (error: any) {
    console.error('[API/auth/login][POST] Erro:', error, error?.stack)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message,
      stack: error?.stack,
      errorString: String(error),
      errorType: error?.constructor?.name
    }, { status: 500 })
  }
} 