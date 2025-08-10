import { NextRequest, NextResponse } from 'next/server'
import { varejoFacilClient } from '@/lib/varejo-facil-client'

// GET - Buscar gêneros do Varejo Fácil
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = searchParams.get('count') || '20'
    const q = searchParams.get('q') || ''
    const sort = searchParams.get('sort') || ''
    const start = searchParams.get('start') || '0'

    console.log('📚 Buscando gêneros do Varejo Fácil...')
    console.log(`   - Count: ${count}`)
    console.log(`   - Query: ${q}`)
    console.log(`   - Sort: ${sort}`)
    console.log(`   - Start: ${start}`)

    const genresData = await varejoFacilClient.getGenres({
      count: parseInt(count),
      q: q || undefined,
      sort: sort || undefined,
      start: parseInt(start)
    })

    console.log(`✅ ${genresData.items?.length || 0} gêneros encontrados`)

    return NextResponse.json({
      success: true,
      data: genresData,
      message: 'Gêneros carregados com sucesso'
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar gêneros:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      data: {
        start: 0,
        count: 0,
        total: 0,
        items: []
      }
    }, { status: 500 })
  }
} 