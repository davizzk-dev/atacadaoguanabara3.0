import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'users.json')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Ler dados do arquivo users.json
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    // Buscar usuário por email
    const user = users.find((u: any) => u.email === email)
    
    if (user) {
      // Remover senha da resposta por segurança
      const { password, ...userWithoutPassword } = user
      return NextResponse.json(userWithoutPassword)
    }
    
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}