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
    const body = await request.json()
    const { email, password } = body

    // Validações
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const users = readUsers()

    // Buscar usuário
    const user = users.find((u: any) => u.email === email && u.password === password)
    
    if (!user) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
    }

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 