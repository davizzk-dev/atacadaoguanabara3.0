import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
const dataPath = join(dataDir, 'users.json')

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!existsSync(dataPath)) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de usuários não encontrado'
      }, { status: 404 })
    }
    
    const body = await request.json()
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    const userIndex = users.findIndex((user: any) => user.id === id)
    
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }
    
    // Atualizar usuário
    users[userIndex] = {
      ...users[userIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    writeFileSync(dataPath, JSON.stringify(users, null, 2))
    
    return NextResponse.json({
      success: true,
      data: users[userIndex]
    })
  } catch (error: any) {
    console.error('[API/users/[id]][PUT] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!existsSync(dataPath)) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de usuários não encontrado'
      }, { status: 404 })
    }
    
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    const user = users.find((user: any) => user.id === id)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('[API/users/[id]][GET] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}
