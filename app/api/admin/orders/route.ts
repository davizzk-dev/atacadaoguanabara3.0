import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ordersPath = path.join(process.cwd(), 'data', 'orders.json')

async function ensureDataFile() {
  const dir = path.dirname(ordersPath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error('Erro ao criar diretório:', error)
  }
  
  try {
    await fs.access(ordersPath)
  } catch {
    await fs.writeFile(ordersPath, JSON.stringify([], null, 2))
  }
}

// GET - Listar todos os pedidos (para admin)
export async function GET(request: NextRequest) {
  try {
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)
    
    console.log(`📋 Admin: Retornando ${orders.length} pedidos`)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao listar pedidos para admin:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', orders: [] }, { status: 500 })
  }
}

// PUT - Atualizar status do pedido
export async function PUT(request: NextRequest) {
  try {
    await ensureDataFile()
    const body = await request.json()
    const { orderId, status } = body
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId e status são obrigatórios' }, { status: 400 })
    }
    
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)
    
    const orderIndex = orders.findIndex((order: any) => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    
    orders[orderIndex].status = status
    orders[orderIndex].updatedAt = new Date().toISOString()
    
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2))
    
    console.log(`✅ Pedido ${orderId} atualizado para status: ${status}`)
    return NextResponse.json({ success: true, order: orders[orderIndex] })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar pedido
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    
    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 })
    }
    
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)
    
    const orderIndex = orders.findIndex((order: any) => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    
    orders.splice(orderIndex, 1)
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2))
    
    console.log(`🗑️ Pedido ${orderId} deletado`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar pedido:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
} 