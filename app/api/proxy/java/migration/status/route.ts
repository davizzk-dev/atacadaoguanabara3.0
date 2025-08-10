import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔄 API Migration Status: Iniciando requisição...')
  
  try {
    console.log('🔄 API Migration Status: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/migration/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('🔄 API Migration Status: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('🔄 API Migration Status: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Migration Status: Erro ao verificar status da migração:', error)
    
    // Dados mockados em caso de erro
    const mockData = {
      status: 'ERROR',
      error: 'Não foi possível verificar o status da migração',
      timestamp: new Date().toISOString()
    }
    
    console.log('🔄 API Migration Status: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 