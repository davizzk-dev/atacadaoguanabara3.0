import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data')
    const ordersData = JSON.parse(fs.readFileSync(path.join(dataPath, 'orders.json'), 'utf8'))
    const productsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'products.json'), 'utf8'))
    
    // Analytics de distribuição de categorias por vendas
    const categorySales: Record<string, { orders: number; revenue: number; items: number }> = {}
    
    ordersData.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const product = productsData.find((p: any) => p.id === item.productId)
        const category = product?.category || 'Sem categoria'
        
        if (!categorySales[category]) {
          categorySales[category] = { orders: 0, revenue: 0, items: 0 }
        }
        
        categorySales[category].revenue += item.price * item.quantity
        categorySales[category].items += item.quantity
      })
      
      // Contar pedidos únicos por categoria
      const orderCategories = new Set()
      order.items.forEach((item: any) => {
        const product = productsData.find((p: any) => p.id === item.productId)
        const category = product?.category || 'Sem categoria'
        orderCategories.add(category)
      })
      
      orderCategories.forEach((category: any) => {
        const categoryStr = String(category)
        if (!categorySales[categoryStr]) {
          categorySales[categoryStr] = { orders: 0, revenue: 0, items: 0 }
        }
        categorySales[categoryStr].orders++
      })
    })
    
    // Converter para array e ordenar por receita
    const categoryDistribution = Object.entries(categorySales)
      .map(([category, data]) => ({
        category,
        orders: data.orders,
        revenue: data.revenue,
        items: data.items,
        percentage: 0 // Será calculado abaixo
      }))
      .sort((a, b) => b.revenue - a.revenue)
    
    // Calcular porcentagens
    const totalRevenue = categoryDistribution.reduce((sum, cat) => sum + cat.revenue, 0)
    const totalOrders = categoryDistribution.reduce((sum, cat) => sum + cat.orders, 0)
    const totalItems = categoryDistribution.reduce((sum, cat) => sum + cat.items, 0)
    
    categoryDistribution.forEach(cat => {
      cat.percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0
    })
    
    // Analytics de produtos por categoria
    const categoryProducts: Record<string, number> = {}
    productsData.forEach((product: any) => {
      const category = product.category || 'Sem categoria'
      categoryProducts[category] = (categoryProducts[category] || 0) + 1
    })
    
    const productDistribution = Object.entries(categoryProducts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / productsData.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
    
    // Analytics de produtos mais vendidos por categoria
    const topProductsByCategory: Record<string, any[]> = {}
    
    ordersData.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const product = productsData.find((p: any) => p.id === item.productId)
        const category = product?.category || 'Sem categoria'
        
        if (!topProductsByCategory[category]) {
          topProductsByCategory[category] = []
        }
        
        const existingProduct = topProductsByCategory[category].find(p => p.id === item.productId)
        if (existingProduct) {
          existingProduct.quantity += item.quantity
          existingProduct.revenue += item.price * item.quantity
        } else {
          topProductsByCategory[category].push({
            id: item.productId,
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            price: item.price
          })
        }
      })
    })
    
    // Ordenar produtos por quantidade vendida em cada categoria
    Object.keys(topProductsByCategory).forEach(category => {
      topProductsByCategory[category].sort((a, b) => b.quantity - a.quantity)
      topProductsByCategory[category] = topProductsByCategory[category].slice(0, 5) // Top 5
    })
    
    return NextResponse.json({
      success: true,
      data: {
        categoryDistribution,
        productDistribution,
        topProductsByCategory,
        totals: {
          revenue: totalRevenue,
          orders: totalOrders,
          items: totalItems,
          products: productsData.length
        }
      }
    })
  } catch (error) {
    console.error('Erro ao carregar analytics de categorias:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados de categorias'
    }, { status: 500 })
  }
} 