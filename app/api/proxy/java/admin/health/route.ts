import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/health', {
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
    console.error('Erro ao verificar saúde do sistema Java:', error)
    return NextResponse.json({
      status: 'UNHEALTHY',
      error: 'Não foi possível conectar com o sistema Java',
      timestamp: new Date()
    })
  }
} 