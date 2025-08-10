import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
const dataPath = join(dataDir, 'users.json')

function ensureDataFile() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  if (!existsSync(dataPath)) {
    // Criar arquivo com usuários mock
    const mockUsers = [
      {
        id: '1',
        name: 'Admin',
        email: 'admin@atacadao.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active'
      },
      {
        id: '2',
        name: 'Usuario Teste',
        email: 'teste@teste.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    ]
    writeFileSync(dataPath, JSON.stringify(mockUsers, null, 2))
  }
}

// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    console.log('[API/users][GET] chamada recebida')
    ensureDataFile()
    
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit')
    
    const data = readFileSync(dataPath, 'utf-8')
    let users = JSON.parse(data)
    
    // Aplicar limite se especificado
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum)) {
        users = users.slice(0, limitNum)
      }
    }
    
    return NextResponse.json(users)
  } catch (error: any) {
    console.error('[API/users][GET] Erro:', error, error?.stack)
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

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    console.log('[API/users][POST] chamada recebida')
    ensureDataFile()
    
    let body: any = null
    try {
      const text = await request.text()
      if (text && text.trim() !== '') {
        body = JSON.parse(text)
      }
    } catch (err) {
      return NextResponse.json({ 
        success: false, 
        error: 'Body inválido ou ausente' 
      }, { status: 400 })
    }
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Body inválido ou ausente' 
      }, { status: 400 })
    }
    
    const { name, email, role = 'user' } = body
    
    if (!name || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome e email são obrigatórios' 
      }, { status: 400 })
    }
    
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      status: 'active'
    }
    
    users.push(newUser)
    writeFileSync(dataPath, JSON.stringify(users, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      data: newUser 
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API/users][POST] Erro:', error, error?.stack)
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
