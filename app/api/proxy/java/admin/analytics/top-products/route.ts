import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🏆 API Top Products: Iniciando requisição...')
  
  try {
    console.log('🏆 API Top Products: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/analytics/top-products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('🏆 API Top Products: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('🏆 API Top Products: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Top Products: Erro ao buscar produtos mais vendidos:', error)
    
    // Dados mockados em caso de erro
    const mockData = [
      { name: 'Arroz Integral', sales: 1250, revenue: 10625.00 },
      { name: 'Azeite de Oliva', sales: 890, revenue: 23051.00 },
      { name: 'Macarrão Espaguete', sales: 1560, revenue: 6552.00 },
      { name: 'Feijão Preto', sales: 980, revenue: 3920.00 },
      { name: 'Óleo de Soja', sales: 720, revenue: 4320.00 }
    ]
    
    console.log('🏆 API Top Products: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 