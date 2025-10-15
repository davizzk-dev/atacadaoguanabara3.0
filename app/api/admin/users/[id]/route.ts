import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { withAPIProtection } from '@/lib/auth-middleware'

const dataDir = join(process.cwd(), 'data')
const dataPath = join(dataDir, 'users.json')

// DELETE - Deletar usuário
async function handleDELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API/admin/users/[id]][DELETE] chamada recebida para ID:', params.id)
    
    if (!existsSync(dataPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Arquivo de usuários não encontrado' 
      }, { status: 404 })
    }
    
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    // Encontrar índice do usuário
    const userIndex = users.findIndex((user: any) => user.id === params.id)
    
    if (userIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }
    
    const userToDelete = users[userIndex]
    
    // Verificar se não é o último admin
    const adminUsers = users.filter((user: any) => user.role === 'admin')
    if (userToDelete.role === 'admin' && adminUsers.length <= 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não é possível deletar o último administrador do sistema' 
      }, { status: 400 })
    }
    
    // Criar backup antes de deletar
    const backupPath = dataPath.replace('.json', `_backup_delete_${Date.now()}.json`)
    writeFileSync(backupPath, data)
    console.log(`📋 Backup criado antes da exclusão: ${backupPath}`)
    
    // Remover usuário do array
    users.splice(userIndex, 1)
    
    // Salvar dados atualizados
    writeFileSync(dataPath, JSON.stringify(users, null, 2))
    
    console.log(`✅ Usuário ${userToDelete.name} (${userToDelete.email}) deletado com sucesso`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Usuário deletado com sucesso',
      deletedUser: {
        id: userToDelete.id,
        name: userToDelete.name,
        email: userToDelete.email
      }
    })
  } catch (error: any) {
    console.error('[API/admin/users/[id]][DELETE] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}

// PUT - Atualizar usuário
async function handlePUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API/admin/users/[id]][PUT] chamada recebida para ID:', params.id)
    
    if (!existsSync(dataPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Arquivo de usuários não encontrado' 
      }, { status: 404 })
    }
    
    const body = await request.json()
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    // Encontrar usuário
    const userIndex = users.findIndex((user: any) => user.id === params.id)
    
    if (userIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }
    
    // Verificar se email já existe em outro usuário
    if (body.email) {
      const existingUser = users.find((user: any) => user.email === body.email && user.id !== params.id)
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Email já está sendo usado por outro usuário' 
        }, { status: 409 })
      }
    }
    
    // Atualizar usuário mantendo a estrutura correta
    const updatedUser = {
      ...users[userIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    users[userIndex] = updatedUser
    
    // Salvar dados atualizados
    writeFileSync(dataPath, JSON.stringify(users, null, 2))
    
    console.log(`✅ Usuário ${updatedUser.name} atualizado com sucesso`)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedUser 
    })
  } catch (error: any) {
    console.error('[API/admin/users/[id]][PUT] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}

// GET - Buscar usuário específico
async function handleGET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API/admin/users/[id]][GET] chamada recebida para ID:', params.id)
    
    if (!existsSync(dataPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Arquivo de usuários não encontrado' 
      }, { status: 404 })
    }
    
    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)
    
    const user = users.find((u: any) => u.id === params.id)
    
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
    console.error('[API/admin/users/[id]][GET] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}

export const GET = withAPIProtection(handleGET)
export const PUT = withAPIProtection(handlePUT)
export const DELETE = withAPIProtection(handleDELETE)