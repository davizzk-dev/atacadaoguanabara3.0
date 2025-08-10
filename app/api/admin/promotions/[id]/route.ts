import { NextRequest, NextResponse } from 'next/server'

// DELETE - Excluir promoção específica (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da promoção é obrigatório'
      }, { status: 400 })
    }

    // Redirecionar para a API principal de promoções
    const promotionsResponse = await fetch(`${request.nextUrl.origin}/api/promotions?id=${id}`, {
      method: 'DELETE'
    })

    const result = await promotionsResponse.json()
    
    if (result.success) {
      console.log('✅ Admin: Promoção excluída com sucesso:', id)
    } else {
      console.error('❌ Admin: Erro ao excluir promoção:', result.error)
    }

    return NextResponse.json(result, { 
      status: promotionsResponse.status 
    })

  } catch (error: any) {
    console.error('❌ Erro ao excluir promoção (admin):', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// GET - Buscar promoção específica (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da promoção é obrigatório'
      }, { status: 400 })
    }

    // Buscar todas as promoções e filtrar pela ID
    const promotionsResponse = await fetch(`${request.nextUrl.origin}/api/promotions`)
    const promotionsResult = await promotionsResponse.json()

    if (!promotionsResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar promoções'
      }, { status: 500 })
    }

    const promotion = promotionsResult.data.find((p: any) => p.id === id)

    if (!promotion) {
      return NextResponse.json({
        success: false,
        error: 'Promoção não encontrada'
      }, { status: 404 })
    }

    console.log('✅ Admin: Promoção encontrada:', id)

    return NextResponse.json({
      success: true,
      data: promotion
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar promoção específica (admin):', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
