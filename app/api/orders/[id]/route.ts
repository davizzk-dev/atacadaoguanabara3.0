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