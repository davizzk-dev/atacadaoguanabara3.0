import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    
    const statusCount: Record<string, number> = {}
    const statusRevenue: Record<string, number> = {}
    
    ordersData.forEach((order: any) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1
      statusRevenue[order.status] = (statusRevenue[order.status] || 0) + order.total
    })
    
    const orderStatus = Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      revenue: statusRevenue[name] || 0
    }))
    
    // Se não há dados, usar dados de exemplo
    if (orderStatus.length === 0) {
      console.log('📊 Usando dados de exemplo para status de pedidos')
      return NextResponse.json([
        { name: 'Pending', value: 15, revenue: 1250.50 },
        { name: 'Confirmed', value: 25, revenue: 2100.75 },
        { name: 'Preparing', value: 18, revenue: 1550.25 },
        { name: 'Delivering', value: 12, revenue: 980.00 },
        { name: 'Delivered', value: 35, revenue: 2950.50 },
        { name: 'Cancelled', value: 5, revenue: 420.00 }
      ])
    }
    
    return NextResponse.json(orderStatus)
  } catch (error) {
    console.error('Erro ao buscar status dos pedidos:', error)
    return NextResponse.json([])
  }
} 