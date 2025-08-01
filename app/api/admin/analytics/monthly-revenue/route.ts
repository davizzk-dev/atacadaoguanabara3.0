import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    
    const monthlyRevenue = []
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentDate = new Date()
    
    // Pegar todos os pedidos e agrupar por mês
    const ordersByMonth: Record<string, { revenue: number; orders: number }> = {}
    
    ordersData.forEach((order: any) => {
      const orderDate = new Date(order.createdAt)
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`
      
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = { revenue: 0, orders: 0 }
      }
      
      ordersByMonth[monthKey].revenue += order.total
      ordersByMonth[monthKey].orders += 1
    })
    
    // Criar array dos últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
      const monthData = ordersByMonth[monthKey] || { revenue: 0, orders: 0 }
      
      monthlyRevenue.push({
        month: months[monthDate.getMonth()],
        revenue: monthData.revenue,
        orders: monthData.orders
      })
    }
    
    // Se todos os valores são zero, usar dados de exemplo
    const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0)
    if (totalRevenue === 0) {
      console.log('📊 Usando dados de exemplo para faturamento mensal')
      return NextResponse.json([
        { month: 'Jan', revenue: 12500, orders: 45 },
        { month: 'Fev', revenue: 15800, orders: 52 },
        { month: 'Mar', revenue: 14200, orders: 48 },
        { month: 'Abr', revenue: 16800, orders: 55 },
        { month: 'Mai', revenue: 19200, orders: 62 },
        { month: 'Jun', revenue: 17500, orders: 58 },
        { month: 'Jul', revenue: 20300, orders: 65 },
        { month: 'Ago', revenue: 18900, orders: 61 },
        { month: 'Set', revenue: 21500, orders: 68 },
        { month: 'Out', revenue: 19800, orders: 64 },
        { month: 'Nov', revenue: 23200, orders: 72 },
        { month: 'Dez', revenue: 24500, orders: 78 }
      ])
    }
    
    return NextResponse.json(monthlyRevenue)
  } catch (error) {
    console.error('Erro ao buscar faturamento mensal:', error)
    return NextResponse.json([])
  }
} 