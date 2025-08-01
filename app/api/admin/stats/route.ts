import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Ler dados dos arquivos JSON
    const dataDir = path.join(process.cwd(), 'data')
    
    const usersData = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf-8'))
    const productsData = JSON.parse(await fs.readFile(path.join(dataDir, 'products.json'), 'utf-8'))
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    const cameraRequestsData = JSON.parse(await fs.readFile(path.join(dataDir, 'camera-requests.json'), 'utf-8'))
    const feedbackData = JSON.parse(await fs.readFile(path.join(dataDir, 'feedback.json'), 'utf-8'))
    const productPromotionsData = JSON.parse(await fs.readFile(path.join(dataDir, 'product-promotions.json'), 'utf-8'))
    
    // Calcular estatísticas baseadas nos dados reais
    const totalUsers = usersData.length
    const totalProducts = productsData.length
    const totalOrders = ordersData.length
    const pendingCameraRequests = cameraRequestsData.filter((req: any) => req.status === 'pending').length
    const pendingFeedback = feedbackData.filter((fb: any) => fb.status === 'pending').length
    const activePromotions = productPromotionsData.filter((promo: any) => promo.isActive).length
    
    // Calcular receita total
    const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + order.total, 0)
    
    // Calcular receita mensal (últimos 6 meses)
    const monthlyRevenue = []
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthOrders = ordersData.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === monthDate.getMonth() && orderDate.getFullYear() === monthDate.getFullYear()
      })
      
      const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + order.total, 0)
      monthlyRevenue.push({
        month: months[monthDate.getMonth()],
        revenue: monthRevenue,
        orders: monthOrders.length
      })
    }
    
    // Calcular categorias de produtos
    const categoryCount: Record<string, number> = {}
    productsData.forEach((product: any) => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
    })
    
    const productCategories = Object.entries(categoryCount).map(([name, value]) => ({ name, value }))
    
    // Calcular status dos pedidos
    const statusCount: Record<string, number> = {}
    ordersData.forEach((order: any) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1
    })
    
    const orderStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value }))
    
    const statsData = {
      totalUsers,
      totalProducts,
      totalOrders,
      pendingCameraRequests,
      pendingFeedback,
      activePromotions,
      totalRevenue,
      monthlyRevenue,
      productCategories,
      orderStatus
    }
    
    return NextResponse.json(statsData)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json({
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      pendingCameraRequests: 0,
      pendingFeedback: 0,
      activePromotions: 0,
      totalRevenue: 0,
      monthlyRevenue: [],
      productCategories: [],
      orderStatus: []
    })
  }
} 