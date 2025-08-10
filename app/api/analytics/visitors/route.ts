import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[API/analytics/visitors][GET] chamada recebida')
    const mockData = {
      success: true,
      data: {
        visitors: {
          today: Math.floor(Math.random() * 1000) + 500,
          yesterday: Math.floor(Math.random() * 1000) + 400,
          thisWeek: Math.floor(Math.random() * 5000) + 2000,
          lastWeek: Math.floor(Math.random() * 5000) + 1800,
          thisMonth: Math.floor(Math.random() * 20000) + 10000,
          lastMonth: Math.floor(Math.random() * 20000) + 9000
        },
        pageViews: {
          today: Math.floor(Math.random() * 2000) + 1000,
          yesterday: Math.floor(Math.random() * 2000) + 900,
          thisWeek: Math.floor(Math.random() * 10000) + 4000,
          lastWeek: Math.floor(Math.random() * 10000) + 3600,
          thisMonth: Math.floor(Math.random() * 40000) + 20000,
          lastMonth: Math.floor(Math.random() * 40000) + 18000
        },
        topPages: [
          { path: '/catalog', views: Math.floor(Math.random() * 500) + 200 },
          { path: '/product/1234', views: Math.floor(Math.random() * 300) + 150 },
          { path: '/', views: Math.floor(Math.random() * 400) + 180 },
          { path: '/cart', views: Math.floor(Math.random() * 200) + 100 },
          { path: '/about', views: Math.floor(Math.random() * 150) + 80 }
        ]
      }
    }
    return NextResponse.json(mockData)
  } catch (error: any) {
    console.error('[API/analytics/visitors][GET] Erro:', error, error?.stack)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error?.message,
      stack: error?.stack,
      errorString: String(error),
      errorType: error?.constructor?.name,
      data: {
        visitors: { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 },
        pageViews: { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 },
        topPages: []
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Simular processamento bem-sucedido sem tentar ler o body
  return NextResponse.json({
    success: true,
    message: 'Dados de visitor processados',
    data: { received: true }
  })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Dados de visitor atualizados',
    data: { updated: true }
  })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Dados de visitor removidos',
    data: { deleted: true }
  })
} 