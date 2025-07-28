import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/analytics/top-products', {
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
    console.error('Erro ao buscar produtos mais vendidos:', error)
    return NextResponse.json([
      {
        id: '1',
        name: 'Arroz Integral',
        sales: 150,
        revenue: 1275.00,
        category: 'Grãos'
      },
      {
        id: '2',
        name: 'Azeite de Oliva',
        sales: 89,
        revenue: 2305.10,
        category: 'Óleos'
      },
      {
        id: '3',
        name: 'Macarrão Espaguete',
        sales: 234,
        revenue: 982.80,
        category: 'Massas'
      }
    ])
  }
} 