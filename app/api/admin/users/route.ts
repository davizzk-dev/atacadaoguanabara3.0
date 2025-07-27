import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const usersPath = join(process.cwd(), 'data', 'users.json')
const ordersPath = join(process.cwd(), 'data', 'orders.json')

// Garantir que o arquivo existe
function ensureDataFile() {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, JSON.stringify([], null, 2))
  }
  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, JSON.stringify([], null, 2))
  }
}

// Função para ler pedidos
function readOrders() {
  try {
    const fs = require('fs')
    if (!fs.existsSync(ordersPath)) {
      return []
    }
    const data = readFileSync(ordersPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler pedidos:', error)
    return []
  }
}

// Função para ler usuários
function readUsers() {
  try {
    ensureDataFile()
    const data = readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler usuários:', error)
    return []
  }
}

// GET - Listar usuários com informações de pedidos
export async function GET() {
  try {
    const users = readUsers()
    const orders = readOrders()

    // Contar pedidos por usuário
    const usersWithOrders = users.map((user: any) => {
      const userOrders = orders.filter((order: any) => order.userId === user.id)
      return {
        ...user,
        orders: userOrders.length,
        totalSpent: userOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        lastOrder: userOrders.length > 0 ? userOrders[0].createdAt : null,
        isClient: userOrders.length >= 2 // Cliente após 2 pedidos
      }
    })

    return NextResponse.json(usersWithOrders)
  } catch (error) {
    console.error('Erro ao ler usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    const users = readUsers()
    
    const userIndex = users.findIndex((u: any) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    writeFileSync(usersPath, JSON.stringify(users, null, 2))
    
    return NextResponse.json(users[userIndex])
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }
    
    const users = readUsers()
    
    const userIndex = users.findIndex((u: any) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    users.splice(userIndex, 1)
    writeFileSync(usersPath, JSON.stringify(users, null, 2))
    
    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 