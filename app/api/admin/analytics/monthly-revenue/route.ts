import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(fs.readFileSync(path.join(dataPath, 'orders.json'), 'utf8'))
    
    // Analytics de receita mensal (últimos 12 meses)
    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      
      const monthOrders = ordersData.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= monthStart && orderDate < monthEnd
      })
      
      const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const monthOrdersCount = monthOrders.length
      
      monthlyRevenue.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrdersCount,
        averageOrder: monthOrdersCount > 0 ? monthRevenue / monthOrdersCount : 0
      })
    }
    
    // Analytics de receita semanal (últimas 8 semanas)
    const weeklyRevenue = []
    for (let i = 7; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - (i * 7))
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      
      const weekOrders = ordersData.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= weekStart && orderDate < weekEnd
      })
      
      const weekRevenue = weekOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      
      weeklyRevenue.push({
        week: `Semana ${8-i}`,
        revenue: weekRevenue,
        orders: weekOrders.length,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: new Date(weekEnd.getTime() - 1).toISOString().split('T')[0]
      })
    }
    
    // Analytics de receita diária (últimos 30 dias)
    const dailyRevenue = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      
      const dayOrders = ordersData.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= dayStart && orderDate < dayEnd
      })
      
      const dayRevenue = dayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length,
        dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'short' })
      })
    }
    
    // Estatísticas gerais
    const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const totalOrders = ordersData.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Receita do mês atual
    const currentMonth = new Date()
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    
    const currentMonthOrders = ordersData.filter((order: any) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= currentMonthStart && orderDate < currentMonthEnd
    })
    
    const currentMonthRevenue = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    
    return NextResponse.json({
      success: true,
      data: {
        monthlyRevenue,
        weeklyRevenue,
        dailyRevenue,
        statistics: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          currentMonthRevenue,
          currentMonthOrders: currentMonthOrders.length
        }
      }
    })
  } catch (error) {
    console.error('Erro ao carregar analytics de receita:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados de receita'
    }, { status: 500 })
  }
} 