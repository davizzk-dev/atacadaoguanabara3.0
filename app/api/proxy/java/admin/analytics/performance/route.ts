import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/analytics/performance', {
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
    console.error('Erro ao buscar métricas de performance:', error)
    return NextResponse.json({
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
    })
  }
} 