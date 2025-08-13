import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const promotionsFilePath = path.join(process.cwd(), 'data', 'promotions.json')

// Garantir que o arquivo de promoções existe
const ensurePromotionsFileExists = async () => {
  try {
    await fs.access(promotionsFilePath)
  } catch (error) {
    // Se o arquivo não existe, criar com array vazio
    await fs.writeFile(promotionsFilePath, JSON.stringify([], null, 2))
  }
}

// GET - Buscar todas as promoções para admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, inactive, expired
    const type = searchParams.get('type') // sale, promotion, flyer

    await ensurePromotionsFileExists()
    
    const promotionsData = await fs.readFile(promotionsFilePath, 'utf8')
    let promotions = JSON.parse(promotionsData) || []

    console.log('🎁 Admin: Buscando promoções:', {
      total: promotions.length,
      status,
      type
    })

    // Filtrar por status
    if (status) {
      const now = new Date()
      promotions = promotions.filter((promo: any) => {
        const startDate = new Date(promo.startDate)
        const endDate = new Date(promo.endDate)
        
        switch (status) {
          case 'active':
            return promo.isActive && now >= startDate && now <= endDate
          case 'inactive':
            return !promo.isActive
          case 'expired':
            return now > endDate
          case 'scheduled':
            return promo.isActive && now < startDate
          default:
            return true
        }
      })
    }

    // Filtrar por tipo
    if (type) {
      promotions = promotions.filter((promo: any) => promo.type === type)
    }

    // Calcular estatísticas
    const now = new Date()
    const stats = {
      total: promotions.length,
      active: promotions.filter((p: any) => {
        const start = new Date(p.startDate)
        const end = new Date(p.endDate)
        return p.isActive && now >= start && now <= end
      }).length,
      scheduled: promotions.filter((p: any) => {
        const start = new Date(p.startDate)
        return p.isActive && now < start
      }).length,
      expired: promotions.filter((p: any) => {
        const end = new Date(p.endDate)
        return now > end
      }).length,
      inactive: promotions.filter((p: any) => !p.isActive).length
    }

    // Ordenar por prioridade e data de criação
    promotions.sort((a: any, b: any) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Maior prioridade primeiro
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log(`✅ Admin: Retornando ${promotions.length} promoções`)

    const response = NextResponse.json({
      success: true,
      data: promotions,
      stats
    })
    
    // Evitar cache para prevenir problemas de request body
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro ao buscar promoções (admin):', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      data: [],
      stats: { total: 0, active: 0, scheduled: 0, expired: 0, inactive: 0 }
    }, { status: 500 })
  }
}

// POST - Criar nova promoção (admin)
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/admin/promotions iniciado')
  
  try {
    // Ler o body da requisição
    const body = await request.json()
    console.log('📥 Body recebido:', body)

    // Validações básicas
    if (!body.title?.trim()) {
      console.log('❌ Título obrigatório')
      return NextResponse.json({
        success: false,
        error: 'Título da promoção é obrigatório'
      }, { status: 400 })
    }

    if (!body.description?.trim()) {
      console.log('❌ Descrição obrigatória')
      return NextResponse.json({
        success: false,
        error: 'Descrição da promoção é obrigatória'
      }, { status: 400 })
    }

    // Criar nova promoção
    const newPromotion = {
      id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: body.title.trim(),
      name: body.name || body.title.trim(),
      description: body.description.trim(),
      type: body.type || 'promotion',
      discountType: body.discountType || 'percentage',
      discount: parseFloat(body.discount) || 0,
      discountValue: parseFloat(body.discount) || 0,
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: body.isActive !== false,
      image: body.image || '',
      banner: body.banner || body.image || '',
      products: body.products || [],
      priority: body.priority || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: body.createdBy || 'admin',
      tags: body.tags || [],
      usageCount: 0
    }

    console.log('✅ Promoção criada:', newPromotion.id)
    
    // Retornar resposta imediatamente
    const response = NextResponse.json({
      success: true,
      data: newPromotion,
      message: 'Promoção criada com sucesso'
    })

    console.log('🚀 Retornando resposta...')
    return response

  } catch (error: any) {
    console.error('❌ Erro no POST:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// PUT - Atualizar promoção (admin)
export async function PUT(request: NextRequest) {
  try {
    // Clone request para evitar "Response body disturbed"
    let body
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Erro ao fazer parse do body:', e)
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos no body da requisição'
      }, { status: 400 })
    }
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'ID da promoção é obrigatório'
      }, { status: 400 })
    }
    
    await ensurePromotionsFileExists()
    
    const promotionsData = await fs.readFile(promotionsFilePath, 'utf8')
    let promotions = JSON.parse(promotionsData) || []
    
    const promotionIndex = promotions.findIndex((p: any) => p.id === body.id)
    
    if (promotionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Promoção não encontrada'
      }, { status: 404 })
    }
    
    // Atualizar promoção
    promotions[promotionIndex] = {
      ...promotions[promotionIndex],
      ...body,
      id: promotions[promotionIndex].id, // Manter ID original
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(promotionsFilePath, JSON.stringify(promotions, null, 2))
    
    console.log('✅ Admin: Promoção atualizada com sucesso:', body.id)
    
    const response = NextResponse.json({
      success: true,
      data: promotions[promotionIndex],
      message: 'Promoção atualizada com sucesso'
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response

  } catch (error: any) {
    console.error('❌ Erro ao atualizar promoção (admin):', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
