import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🖥️ API System Status: Iniciando requisição...')
  
  try {
    console.log('🖥️ API System Status: Tentando conectar com backend Java...')
    
    const response = await fetch('http://localhost:8080/api/admin/system-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('🖥️ API System Status: Status da resposta:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('🖥️ API System Status: Dados recebidos do backend Java')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API System Status: Erro ao verificar status do sistema Java:', error)
    
    // Dados mockados em caso de erro
    const mockData = {
      status: 'OFFLINE',
      error: 'Sistema Java não está rodando',
      uptime: 0,
      memory: { used: 0, total: 0, percentage: 0 },
      system: { cpu: 0, load: 0 },
      database: { status: 'OFFLINE' },
      timestamp: new Date().toISOString()
    }
    
    console.log('🖥️ API System Status: Retornando dados mockados')
    return NextResponse.json(mockData)
  }
} 