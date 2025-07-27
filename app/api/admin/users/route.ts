import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/users', {
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
    console.error('Erro ao buscar usuários:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        role: 'client',
        createdAt: '2024-01-15T10:30:00Z',
        orders: 5,
        totalSpent: 1250.00,
        lastOrder: '2024-06-15T14:20:00Z',
        isClient: true
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(11) 88888-8888',
        role: 'client',
        createdAt: '2024-02-20T09:15:00Z',
        orders: 3,
        totalSpent: 890.50,
        lastOrder: '2024-06-10T16:45:00Z',
        isClient: true
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        phone: '(11) 77777-7777',
        role: 'admin',
        createdAt: '2024-01-10T08:00:00Z',
        orders: 0,
        totalSpent: 0,
        lastOrder: null,
        isClient: false
      }
    ])
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Conectar com o backend Java para atualizar
    const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java para deletar
    const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 