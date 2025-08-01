import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('💰 API Quotation: Iniciando requisição...')
  
  try {
    console.log('💰 API Quotation: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/analytics/quotation', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('💰 API Quotation: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('💰 API Quotation: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Quotation: Erro ao buscar dados de cotação:', error)
    
    // Dados mockados em caso de erro
    const mockData = {
      currentQuotation: 5.25,
      previousQuotation: 5.10,
      change: 0.15,
      changePercentage: 2.94,
      trend: 'up',
      lastUpdate: new Date().toISOString(),
      currency: 'BRL'
    }
    
    console.log('💰 API Quotation: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 