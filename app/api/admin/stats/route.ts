import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json({
      totalUsers: 1250,
      totalProducts: 450,
      totalOrders: 890,
      pendingCameraRequests: 12,
      pendingFeedback: 8,
      activePromotions: 15,
      totalRevenue: 15000.0,
      monthlyRevenue: [
        { month: 'Jan', revenue: 12000.0, orders: 45 },
        { month: 'Fev', revenue: 13500.0, orders: 52 },
        { month: 'Mar', revenue: 14200.0, orders: 58 },
        { month: 'Abr', revenue: 13800.0, orders: 55 },
        { month: 'Mai', revenue: 15600.0, orders: 62 },
        { month: 'Jun', revenue: 16200.0, orders: 68 }
      ],
      productCategories: [
        { name: 'Grãos', value: 25 },
        { name: 'Óleos', value: 15 },
        { name: 'Massas', value: 20 },
        { name: 'Laticínios', value: 18 },
        { name: 'Frutas', value: 22 }
      ],
      orderStatus: [
        { name: 'Pendente', value: 12 },
        { name: 'Processando', value: 8 },
        { name: 'Entregue', value: 45 },
        { name: 'Cancelado', value: 3 }
      ]
    })
  }
} 