import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dados simulados de feedback
    const feedbacks = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        message: 'Excelente atendimento! Produtos de qualidade.',
        rating: 5,
        createdAt: '2024-01-15T10:30:00Z',
        status: 'pending',
        isAnonymous: false,
        type: 'satisfaction'
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@email.com',
        message: 'Preços muito bons, mas poderia ter mais variedade.',
        rating: 4,
        createdAt: '2024-01-14T14:20:00Z',
        status: 'reviewed',
        isAnonymous: false,
        type: 'suggestion'
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        message: 'Entrega rápida e produtos frescos.',
        rating: 5,
        createdAt: '2024-01-13T09:15:00Z',
        status: 'resolved',
        isAnonymous: false,
        type: 'praise'
      }
    ]

    return NextResponse.json(feedbacks)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar feedbacks' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json()
    
    // Simular atualização de status
    return NextResponse.json({ 
      success: true, 
      message: `Status do feedback ${id} atualizado para ${status}` 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar feedback' },
      { status: 500 }
    )
  }
} 