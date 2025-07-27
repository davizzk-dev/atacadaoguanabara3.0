import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/feedback', {
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
    console.error('Erro ao buscar feedbacks:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: '1',
        name: 'Ana Silva',
        email: 'ana@email.com',
        message: 'Excelente atendimento! Produtos de qualidade.',
        rating: 5,
        createdAt: '2024-06-15T16:30:00Z',
        status: 'pending',
        isAnonymous: false,
        type: 'satisfaction'
      },
      {
        id: '2',
        name: 'Carlos Santos',
        email: 'carlos@email.com',
        message: 'Preços muito altos, precisam melhorar.',
        rating: 2,
        createdAt: '2024-06-14T12:20:00Z',
        status: 'reviewed',
        isAnonymous: false,
        type: 'complaint'
      }
    ])
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/feedback/${id}/status`, {
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
    console.error('Erro ao atualizar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do feedback é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/feedback/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Feedback deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 