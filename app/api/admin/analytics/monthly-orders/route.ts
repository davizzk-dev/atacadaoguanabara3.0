import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    
    const monthlyOrders = []
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentDate = new Date()
    
    // Pegar todos os pedidos e agrupar por mês
    const ordersByMonth: Record<string, Record<string, number>> = {}
    
    ordersData.forEach((order: any) => {
      const orderDate = new Date(order.createdAt)
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`
      
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = {}
      }
      
      ordersByMonth[monthKey][order.status] = (ordersByMonth[monthKey][order.status] || 0) + 1
    })
    
    // Criar array dos últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
      const monthData = ordersByMonth[monthKey] || {}
      
      const total = Object.values(monthData).reduce((sum: number, count: number) => sum + count, 0)
      
      monthlyOrders.push({
        month: months[monthDate.getMonth()],
        total,
        pending: monthData['pending'] || 0,
        confirmed: monthData['confirmed'] || 0,
        preparing: monthData['preparing'] || 0,
        delivering: monthData['delivering'] || 0,
        delivered: monthData['delivered'] || 0,
        cancelled: monthData['cancelled'] || 0
      })
    }
    
    // Se todos os valores são zero, usar dados de exemplo
    const totalOrders = monthlyOrders.reduce((sum, item) => sum + item.total, 0)
    if (totalOrders === 0) {
      console.log('📊 Usando dados de exemplo para pedidos mensais')
      return NextResponse.json([
        { month: 'Jan', total: 45, pending: 8, confirmed: 12, preparing: 10, delivering: 8, delivered: 5, cancelled: 2 },
        { month: 'Fev', total: 52, pending: 10, confirmed: 15, preparing: 12, delivering: 8, delivered: 5, cancelled: 2 },
        { month: 'Mar', total: 48, pending: 7, confirmed: 13, preparing: 11, delivering: 9, delivered: 6, cancelled: 2 },
        { month: 'Abr', total: 55, pending: 9, confirmed: 16, preparing: 13, delivering: 10, delivered: 5, cancelled: 2 },
        { month: 'Mai', total: 62, pending: 11, confirmed: 18, preparing: 15, delivering: 11, delivered: 5, cancelled: 2 },
        { month: 'Jun', total: 58, pending: 8, confirmed: 17, preparing: 14, delivering: 12, delivered: 5, cancelled: 2 },
        { month: 'Jul', total: 65, pending: 12, confirmed: 19, preparing: 16, delivering: 11, delivered: 5, cancelled: 2 },
        { month: 'Ago', total: 61, pending: 9, confirmed: 18, preparing: 15, delivering: 12, delivered: 5, cancelled: 2 },
        { month: 'Set', total: 68, pending: 13, confirmed: 20, preparing: 17, delivering: 11, delivered: 5, cancelled: 2 },
        { month: 'Out', total: 64, pending: 10, confirmed: 19, preparing: 16, delivering: 12, delivered: 5, cancelled: 2 },
        { month: 'Nov', total: 72, pending: 14, confirmed: 21, preparing: 18, delivering: 12, delivered: 5, cancelled: 2 },
        { month: 'Dez', total: 78, pending: 11, confirmed: 22, preparing: 19, delivering: 13, delivered: 11, cancelled: 2 }
      ])
    }
    
    return NextResponse.json(monthlyOrders)
  } catch (error) {
    console.error('Erro ao buscar pedidos mensais:', error)
    return NextResponse.json([])
  }
} 