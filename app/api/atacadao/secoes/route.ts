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

    const response = await atacadaoApi.getSecoes(params)
    
    if (response.success) {
      return NextResponse.json(response.data)
    } else {
      return NextResponse.json(
        { error: response.error || 'Erro ao buscar seções' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro na API de seções:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 