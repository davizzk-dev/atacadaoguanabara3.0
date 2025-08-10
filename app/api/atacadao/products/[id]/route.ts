import { NextRequest, NextResponse } from 'next/server'
import { atacadaoApi } from '@/lib/api-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const response = await atacadaoApi.getProduto(id)
    
    if (response.success) {
      return NextResponse.json(response.data)
    } else {
      return NextResponse.json(
        { error: response.error || 'Produto não encontrado' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const response = await atacadaoApi.updateProduto(id, body)
    
    if (response.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: response.error || 'Erro ao atualizar produto' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const response = await atacadaoApi.deleteProduto(id)
    
    if (response.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: response.error || 'Erro ao deletar produto' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 