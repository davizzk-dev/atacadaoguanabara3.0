import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(fs.readFileSync(path.join(dataPath, 'orders.json'), 'utf8'))
    
    // Analytics de pedidos mensais (últimos 12 meses)
    const monthlyOrders = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      
      const monthOrders = ordersData.filter((order: any) => {
      const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate < monthEnd
      })
      
      // Agrupar por status
      const statusCount = {
        pending: monthOrders.filter((order: any) => order.status === 'pending').length,
        confirmed: monthOrders.filter((order: any) => order.status === 'confirmed').length,
        preparing: monthOrders.filter((order: any) => order.status === 'preparing').length,
        delivering: monthOrders.filter((order: any) => order.status === 'delivering').length,
        delivered: monthOrders.filter((order: any) => order.status === 'delivered').length,
        cancelled: monthOrders.filter((order: any) => order.status === 'cancelled').length
      }
      
      const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      
      monthlyOrders.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        total: monthOrders.length,
        revenue: monthRevenue,
        averageOrder: monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0,
        statusBreakdown: statusCount
      })
    }
    
    // Analytics de pedidos por dia da semana
    const dayOfWeekOrders = {
      domingo: 0,
      segunda: 0,
      terca: 0,
      quarta: 0,
      quinta: 0,
      sexta: 0,
      sabado: 0
    }
    
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
    
    ordersData.forEach((order: any) => {
      const orderDate = new Date(order.createdAt)
      const dayName = dayNames[orderDate.getDay()]
      dayOfWeekOrders[dayName as keyof typeof dayOfWeekOrders]++
    })
    
    // Analytics de pedidos por hora do dia
    const hourlyOrders = Array(24).fill(0)
    
    ordersData.forEach((order: any) => {
      const orderDate = new Date(order.createdAt)
      const hour = orderDate.getHours()
      hourlyOrders[hour]++
    })
    
    // Analytics de crescimento de pedidos (comparação com mês anterior)
    const currentMonth = new Date()
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1)
    const previousMonthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1)
    
    const currentMonthCount = ordersData.filter((order: any) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= currentMonthStart && orderDate < currentMonthEnd
    }).length
    
    const previousMonthCount = ordersData.filter((order: any) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= previousMonthStart && orderDate < previousMonthEnd
    }).length
    
    const growthRate = previousMonthCount > 0 
      ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100 
      : 0
    
    return NextResponse.json({
      success: true,
      data: {
        monthlyOrders,
        dayOfWeekOrders,
        hourlyOrders,
        growth: {
          currentMonth: currentMonthCount,
          previousMonth: previousMonthCount,
          growthRate: Math.round(growthRate * 100) / 100
        },
        totalOrders: ordersData.length
      }
    })
  } catch (error) {
    console.error('Erro ao carregar analytics de pedidos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados de pedidos'
    }, { status: 500 })
  }
} 