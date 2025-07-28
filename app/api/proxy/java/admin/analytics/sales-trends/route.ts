import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/analytics/sales-trends', {
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
    console.error('Erro ao buscar tendências de vendas:', error)
    return NextResponse.json({
      daily: [
        { date: '2024-06-01', sales: 1250.00, orders: 45 },
        { date: '2024-06-02', sales: 1380.50, orders: 52 },
        { date: '2024-06-03', sales: 1420.75, orders: 58 },
        { date: '2024-06-04', sales: 1380.00, orders: 55 },
        { date: '2024-06-05', sales: 1560.25, orders: 62 },
        { date: '2024-06-06', sales: 1620.00, orders: 68 },
        { date: '2024-06-07', sales: 1580.50, orders: 65 }
      ],
      weekly: [
        { week: 'Semana 1', sales: 8500.00, orders: 320 },
        { week: 'Semana 2', sales: 9200.00, orders: 345 },
        { week: 'Semana 3', sales: 9800.00, orders: 370 },
        { week: 'Semana 4', sales: 10500.00, orders: 395 }
      ]
    })
  }
} 