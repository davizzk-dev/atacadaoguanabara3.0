import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const sort = searchParams.get('sort') || ''
    const start = parseInt(searchParams.get('start') || '0')
    const count = parseInt(searchParams.get('count') || '100')

    // Headers de autenticação para API externa
    const headers = {
      'Authorization': `Bearer ${process.env.VAREJO_FACIL_TOKEN}`,
      'Content-Type': 'application/json',
    }

    // Construir URL da API externa
    const params = new URLSearchParams()
    if (q) params.append('q', q)
    if (sort) params.append('sort', sort)
    params.append('start', start.toString())
    params.append('count', count.toString())

    const response = await fetch(
      `${process.env.VAREJO_FACIL_BASE_URL}/v1/produto/precos?${params.toString()}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error('Erro na API de preços:', response.status, response.statusText)
      return NextResponse.json(
        { 
          error: 'Erro ao buscar preços',
          details: `Status: ${response.status}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data,
      total: data.total || 0,
      start,
      count
    })

  } catch (error) {
    console.error('Erro ao buscar preços:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do preço é obrigatório' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const headers = {
      'Authorization': `Bearer ${process.env.VAREJO_FACIL_TOKEN}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(
      `${process.env.VAREJO_FACIL_BASE_URL}/v1/produto/precos/${id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error('Erro ao atualizar preço:', response.status, response.statusText)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar preço',
          details: `Status: ${response.status}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Erro ao atualizar preço:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
