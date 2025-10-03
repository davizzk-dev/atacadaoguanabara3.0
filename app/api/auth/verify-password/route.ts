import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { handlePasswordLogin } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Ler arquivo de usuários
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = await fs.readFile(usersFilePath, 'utf8')
    const users = JSON.parse(usersData)

    // Buscar usuário no arquivo JSON
    const user = users.find((u: any) => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar senha usando o sistema de hash consistente
    const isValidPassword = handlePasswordLogin(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Senha incorreta' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro na verificação de senha:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
