import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/admin/system-status', {
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
    console.error('Erro ao verificar status do sistema Java:', error)
    return NextResponse.json({
      status: 'OFFLINE',
      error: 'Sistema Java não está rodando',
      uptime: 0,
      memory: { used: 0, total: 0, percentage: 0 },
      system: { cpu: 0, load: 0 },
      database: { status: 'OFFLINE' },
      timestamp: new Date()
    })
  }
} 