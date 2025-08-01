import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Ler dados do arquivo JSON
    const dataDir = path.join(process.cwd(), 'data')
    const usersData = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf-8'))
    const ordersData = JSON.parse(await fs.readFile(path.join(dataDir, 'orders.json'), 'utf-8'))
    
    // Calcular estatísticas para cada usuário
    const usersWithStats = usersData.map((user: any) => {
      const userOrders = ordersData.filter((order: any) => order.userId === user.id)
      const totalSpent = userOrders.reduce((sum: number, order: any) => sum + order.total, 0)
      const lastOrder = userOrders.length > 0 ? 
        userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : 
        null
      
      return {
        ...user,
        orders: userOrders.length,
        totalSpent,
        lastOrder,
        isClient: user.role === 'client'
      }
    })
    
    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([])
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