import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// GET - Obter estatísticas completas do admin
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    
    // Função para ler arquivo JSON com fallback
    const readJsonFile = async (filename: string) => {
      try {
        const filePath = path.join(dataDir, filename)
        const data = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(data)
      } catch (error) {
        console.log(`Arquivo ${filename} não encontrado, usando array vazio`)
        return []
      }
    }

    // Carregar todos os dados
    const [
      products,
      orders,
      users,
      feedbacks,
      cameraRequests,
      returnRequests,
      varejoFacilData
    ] = await Promise.all([
      readJsonFile('products.json'),
      readJsonFile('orders.json'),
      readJsonFile('users.json'),
      readJsonFile('feedback.json'),
      readJsonFile('camera-requests.json'),
      readJsonFile('return-requests.json'),
      readJsonFile('varejo-facil-sync.json')
    ])

    // Calcular estatísticas
    const stats = {
      // Produtos
      totalProducts: Array.isArray(products) ? products.length : 0,
      productsWithImages: Array.isArray(products) ? products.filter((p: any) => p.image).length : 0,
      productsWithoutImages: Array.isArray(products) ? products.filter((p: any) => !p.image).length : 0,
      
      // Pedidos
      totalOrders: Array.isArray(orders) ? orders.length : 0,
      totalRevenue: Array.isArray(orders) ? orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) : 0,
      ordersByStatus: Array.isArray(orders) ? {
        pending: orders.filter((o: any) => o.status === 'pending').length,
        confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
        preparing: orders.filter((o: any) => o.status === 'preparing').length,
        delivering: orders.filter((o: any) => o.status === 'delivering').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length
      } : { pending: 0, confirmed: 0, preparing: 0, delivering: 0, delivered: 0, cancelled: 0 },
      
      // Usuários
      totalUsers: Array.isArray(users) ? users.length : 0,
      usersByRole: Array.isArray(users) ? {
        admin: users.filter((u: any) => u.role === 'admin').length,
        manager: users.filter((u: any) => u.role === 'manager').length,
        customer: users.filter((u: any) => u.role === 'customer' || !u.role).length
      } : { admin: 0, manager: 0, customer: 0 },
      
      // Feedbacks
      totalFeedbacks: Array.isArray(feedbacks) ? feedbacks.length : 0,
      feedbacksByStatus: Array.isArray(feedbacks) ? {
        pending: feedbacks.filter((f: any) => f.status === 'pending').length,
        reviewed: feedbacks.filter((f: any) => f.status === 'reviewed').length,
        resolved: feedbacks.filter((f: any) => f.status === 'resolved').length
      } : { pending: 0, reviewed: 0, resolved: 0 },
      averageRating: Array.isArray(feedbacks) && feedbacks.length > 0 
        ? (feedbacks.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
        : 0,
      
      // Solicitações de Câmera
      totalCameraRequests: Array.isArray(cameraRequests) ? cameraRequests.length : 0,
      cameraRequestsByStatus: Array.isArray(cameraRequests) ? {
        pending: cameraRequests.filter((c: any) => c.status === 'pending').length,
        processing: cameraRequests.filter((c: any) => c.status === 'processing').length,
        completed: cameraRequests.filter((c: any) => c.status === 'completed').length
      } : { pending: 0, processing: 0, completed: 0 },
      
      // Solicitações de Retorno
      totalReturnRequests: Array.isArray(returnRequests) ? returnRequests.length : 0,
      returnRequestsByStatus: Array.isArray(returnRequests) ? {
        pending: returnRequests.filter((r: any) => r.status === 'pending').length,
        approved: returnRequests.filter((r: any) => r.status === 'approved').length,
        rejected: returnRequests.filter((r: any) => r.status === 'rejected').length,
        completed: returnRequests.filter((r: any) => r.status === 'completed').length
      } : { pending: 0, approved: 0, rejected: 0, completed: 0 },
      
      // Varejo Fácil
      varejoFacil: {
        lastSync: varejoFacilData?.lastSync || null,
        totalProducts: varejoFacilData?.totalProducts || 0,
        totalSections: varejoFacilData?.totalSections || 0,
        totalBrands: varejoFacilData?.totalBrands || 0,
        totalGenres: varejoFacilData?.totalGenres || 0,
        totalPrices: varejoFacilData?.totalPrices || 0,
        isSynced: !!varejoFacilData?.lastSync
      },
      
      // Resumo geral
      summary: {
        totalItems: (Array.isArray(products) ? products.length : 0) +
                   (Array.isArray(orders) ? orders.length : 0) +
                   (Array.isArray(users) ? users.length : 0) +
                   (Array.isArray(feedbacks) ? feedbacks.length : 0) +
                   (Array.isArray(cameraRequests) ? cameraRequests.length : 0) +
                   (Array.isArray(returnRequests) ? returnRequests.length : 0),
        pendingItems: (Array.isArray(orders) ? orders.filter((o: any) => o.status === 'pending').length : 0) +
                     (Array.isArray(feedbacks) ? feedbacks.filter((f: any) => f.status === 'pending').length : 0) +
                     (Array.isArray(cameraRequests) ? cameraRequests.filter((c: any) => c.status === 'pending').length : 0) +
                     (Array.isArray(returnRequests) ? returnRequests.filter((r: any) => r.status === 'pending').length : 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Estatísticas carregadas com sucesso'
    })

  } catch (error: any) {
    console.error('❌ Erro ao carregar estatísticas:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
} 