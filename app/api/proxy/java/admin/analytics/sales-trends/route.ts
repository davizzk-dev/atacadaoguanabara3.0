import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('📈 API Sales Trends: Iniciando requisição...')
  
  try {
    console.log('📈 API Sales Trends: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/analytics/sales-trends', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📈 API Sales Trends: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('📈 API Sales Trends: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Sales Trends: Erro ao buscar tendências de vendas:', error)
    
    // Dados mockados em caso de erro
    const mockData = [
      { month: 'Jan', sales: 12000.0, orders: 45 },
      { month: 'Fev', sales: 13500.0, orders: 52 },
      { month: 'Mar', sales: 14200.0, orders: 58 },
      { month: 'Abr', sales: 13800.0, orders: 55 },
      { month: 'Mai', sales: 15600.0, orders: 62 },
      { month: 'Jun', sales: 16200.0, orders: 68 }
    ]
    
    console.log('📈 API Sales Trends: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 