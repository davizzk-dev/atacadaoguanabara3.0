import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/product-promotions', {
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
    console.error('Erro ao buscar promoções:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: '1',
        productId: '1',
        productName: 'Arroz Integral',
        originalPrice: 8.50,
        newPrice: 6.80,
        discount: 20.0,
        image: '/images/arroz-promo.jpg',
        isActive: true,
        createdAt: '2024-06-15T10:00:00Z',
        validUntil: '2024-06-30T23:59:59Z'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Azeite de Oliva',
        originalPrice: 25.90,
        newPrice: 19.90,
        discount: 23.2,
        image: '/images/azeite-promo.jpg',
        isActive: true,
        createdAt: '2024-06-14T14:30:00Z',
        validUntil: '2024-06-25T23:59:59Z'
      }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Dados recebidos do frontend:', body)
    
    // Preparar dados para o backend Java
    const promotionData = {
      product: {
        id: parseInt(body.productId)
      },
      originalPrice: parseFloat(body.originalPrice),
      newPrice: parseFloat(body.newPrice),
      image: body.image || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      validUntil: body.validUntil ? new Date(body.validUntil).toISOString() : null
    }
    
    console.log('Dados enviados para o backend:', promotionData)
    
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/admin/product-promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promotionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro da API Java:', errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Resposta do backend:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao criar promoção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/product-promotions/${id}`, {
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
    console.error('Erro ao atualizar promoção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da promoção é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/product-promotions/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Promoção deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar promoção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 