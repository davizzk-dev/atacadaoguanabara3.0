import { NextRequest, NextResponse } from 'next/server'
import { atacadaoApi } from '@/lib/api-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sort = searchParams.get('sort')
    const start = searchParams.get('start')
    const count = searchParams.get('count')

    const params: any = {}
    if (q) params.q = q
    if (sort) params.sort = sort
    if (start) params.start = parseInt(start)
    if (count) params.count = parseInt(count)

    const response = await atacadaoApi.getProdutos(params)
    
    if (response.success) {
      return NextResponse.json(response.data)
    } else {
      return NextResponse.json(
        { error: response.error || 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro na API de produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await atacadaoApi.createProduto(body)
    
    if (response.success) {
      return NextResponse.json(response.data, { status: 201 })
    } else {
      return NextResponse.json(
        { error: response.error || 'Erro ao criar produto' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 