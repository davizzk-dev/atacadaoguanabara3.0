import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('📊 API Performance: Iniciando requisição...')
  
  try {
    console.log('📊 API Performance: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/analytics/performance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📊 API Performance: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('📊 API Performance: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Performance: Erro ao buscar métricas de performance:', error)
    
    // Dados mockados em caso de erro
    const mockData = {
      conversionRate: 68.5,
      averageOrderValue: 125.80,
      customerRetention: 85.2,
      topCategories: [
        { name: 'Grãos', sales: 25000.00, percentage: 35 },
        { name: 'Óleos', sales: 18000.00, percentage: 25 },
        { name: 'Massas', sales: 15000.00, percentage: 20 },
        { name: 'Laticínios', sales: 12000.00, percentage: 15 },
        { name: 'Frutas', sales: 5000.00, percentage: 5 }
      ],
      monthlyGrowth: 12.5,
      customerSatisfaction: 4.6
    }
    
    console.log('📊 API Performance: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 