import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/analytics/quotation', {
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
    console.error('Erro ao buscar dados de cotação:', error)
    return NextResponse.json({
      lastUpdate: new Date().toISOString(),
      products: [
        {
          product: 'Arroz Integral',
          supplier: 'Fornecedor A',
          currentPrice: 8.50,
          previousPrice: 8.20,
          change: 3.66,
          trend: 'up'
        },
        {
          product: 'Azeite de Oliva',
          supplier: 'Fornecedor B',
          currentPrice: 25.90,
          previousPrice: 26.50,
          change: -2.26,
          trend: 'down'
        },
        {
          product: 'Macarrão Espaguete',
          supplier: 'Fornecedor C',
          currentPrice: 4.20,
          previousPrice: 4.00,
          change: 5.00,
          trend: 'up'
        },
        {
          product: 'Feijão Preto',
          supplier: 'Fornecedor D',
          currentPrice: 6.80,
          previousPrice: 7.20,
          change: -5.56,
          trend: 'down'
        },
        {
          product: 'Óleo de Soja',
          supplier: 'Fornecedor E',
          currentPrice: 12.50,
          previousPrice: 12.30,
          change: 1.63,
          trend: 'up'
        }
      ]
    })
  }
} 