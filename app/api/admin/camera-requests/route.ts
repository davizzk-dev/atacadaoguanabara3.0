import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/camera-requests', {
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
    console.error('Erro ao buscar solicitações de câmera:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: '1',
        name: 'João Silva',
        phone: '(11) 99999-9999',
        cause: 'Perda de documentos',
        createdAt: '2024-06-15T10:30:00Z',
        status: 'pending',
        period: 'Manhã',
        moment: 'Entrada',
        rg: '12.345.678-9',
        additionalInfo: 'Documentos perdidos na entrada do estabelecimento'
      },
      {
        id: '2',
        name: 'Maria Santos',
        phone: '(11) 88888-8888',
        cause: 'Furto de bolsa',
        createdAt: '2024-06-14T14:20:00Z',
        status: 'processing',
        period: 'Tarde',
        moment: 'Saída',
        rg: '98.765.432-1',
        additionalInfo: 'Bolsa foi furtada próximo ao caixa'
      }
    ])
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/camera-requests/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da solicitação é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/camera-requests/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Solicitação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar solicitação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 