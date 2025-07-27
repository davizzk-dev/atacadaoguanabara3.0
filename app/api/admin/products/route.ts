import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/products', {
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
    console.error('Erro ao buscar produtos:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: '1',
        name: 'Arroz Integral',
        price: 8.50,
        category: 'Grãos',
        description: 'Arroz integral de alta qualidade',
        inStock: true,
        image: '/images/arroz-integral.jpg'
      },
      {
        id: '2',
        name: 'Azeite de Oliva',
        price: 25.90,
        category: 'Óleos',
        description: 'Azeite extra virgem',
        inStock: true,
        image: '/images/azeite.jpg'
      },
      {
        id: '3',
        name: 'Macarrão Espaguete',
        price: 4.20,
        category: 'Massas',
        description: 'Macarrão espaguete tradicional',
        inStock: true,
        image: '/images/macarrao.jpg'
      }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/products/${id}`, {
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
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/products/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Produto deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 