import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do preço é obrigatório' },
        { status: 400 }
      )
    }

    const headers = {
      'Authorization': `Bearer ${process.env.VAREJO_FACIL_TOKEN}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(
      `${process.env.VAREJO_FACIL_BASE_URL}/v1/produto/precos/${id}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error('Erro ao buscar preço específico:', response.status, response.statusText)
      return NextResponse.json(
        { 
          error: 'Erro ao buscar preço',
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
    console.error('Erro ao buscar preço específico:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
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
      const errorText = await response.text()
      console.error('Erro ao atualizar preço:', response.status, errorText)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar preço',
          details: `Status: ${response.status}`,
          responseText: errorText
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do preço é obrigatório' },
        { status: 400 }
      )
    }

    const headers = {
      'Authorization': `Bearer ${process.env.VAREJO_FACIL_TOKEN}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(
      `${process.env.VAREJO_FACIL_BASE_URL}/v1/produto/precos/${id}`,
      {
        method: 'DELETE',
        headers,
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error('Erro ao remover preço:', response.status, response.statusText)
      return NextResponse.json(
        { 
          error: 'Erro ao remover preço',
          details: `Status: ${response.status}` 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preço removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover preço:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
