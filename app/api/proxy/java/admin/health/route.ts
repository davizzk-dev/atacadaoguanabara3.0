import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('💚 API Health: Iniciando requisição...')
  
  try {
    console.log('💚 API Health: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('💚 API Health: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('💚 API Health: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Health: Erro ao verificar saúde do sistema Java:', error)
    
    // Dados mockados em caso de erro
    const mockData = {
      status: 'UNHEALTHY',
      error: 'Não foi possível conectar com o sistema Java',
      timestamp: new Date().toISOString()
    }
    
    console.log('💚 API Health: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 