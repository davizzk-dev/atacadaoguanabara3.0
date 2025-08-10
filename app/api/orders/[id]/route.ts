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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)
    
    const order = orders.find((order: any) => order.id === id)
    
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    
    console.log(`📋 Pedido ${id} encontrado`)
    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Clone request para evitar "Response body disturbed"
    let updateData
    try {
      const text = await request.text()
      updateData = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Erro ao fazer parse do body:', e)
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos no body da requisição'
      }, { status: 400 })
    }
    
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)
    
    const orderIndex = orders.findIndex((order: any) => order.id === id)
    
    if (orderIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Pedido não encontrado'
      }, { status: 404 })
    }
    
    // Atualizar pedido
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updateData,
      id: orders[orderIndex].id, // Manter ID original
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2))
    
    console.log(`✅ Pedido ${id} atualizado com sucesso`)
    
    const response = NextResponse.json({
      success: true,
      order: orders[orderIndex]
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar pedido:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
} 