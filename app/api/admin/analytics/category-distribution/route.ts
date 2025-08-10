import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const productsData = JSON.parse(await fs.readFile(path.join(dataDir, 'products.json'), 'utf-8'))
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    
    const categoryStats: Record<string, { count: number; revenue: number; orders: number }> = {}
    
    productsData.forEach((product: any) => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = { count: 0, revenue: 0, orders: 0 }
      }
      categoryStats[product.category].count++
    })
    
    ordersData.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const product = productsData.find((p: any) => p.id === item.productId)
        if (product && categoryStats[product.category]) {
          categoryStats[product.category].revenue += item.price * item.quantity
          categoryStats[product.category].orders++
        }
      })
    })
    
    const categoryDistribution = Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue,
      orders: stats.orders
    }))
    
    // Se não há dados, usar dados de exemplo
    if (categoryDistribution.length === 0) {
      console.log('📊 Usando dados de exemplo para distribuição por categoria')
      return NextResponse.json([
        { name: 'Bebidas', value: 25, revenue: 1850.75, orders: 45 },
        { name: 'Grãos', value: 18, revenue: 1250.50, orders: 32 },
        { name: 'Snacks', value: 15, revenue: 980.25, orders: 28 },
        { name: 'Higiene', value: 12, revenue: 750.00, orders: 22 },
        { name: 'Limpeza', value: 10, revenue: 620.50, orders: 18 },
        { name: 'Outros', value: 8, revenue: 450.25, orders: 12 }
      ])
    }
    
    return NextResponse.json(categoryDistribution)
  } catch (error) {
    console.error('Erro ao buscar distribuição por categoria:', error)
    return NextResponse.json([])
  }
} 