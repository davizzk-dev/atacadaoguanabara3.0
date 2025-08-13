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

// GET - Buscar todas as promoções
export async function GET() {
  try {
    await ensurePromotionsFileExists()
    
    const promotionsData = await fs.readFile(promotionsFilePath, 'utf8')
    const promotions = JSON.parse(promotionsData) || []

    console.log('🎁 Promotions-test: Buscando promoções:', promotions.length)

    return NextResponse.json({
      success: true,
      data: promotions
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar promoções:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      data: []
    }, { status: 500 })
  }
}

// POST - Criar nova promoção
export async function POST() {
  console.log('🚀 POST /api/promotions-test iniciado')
  
  try {
    // Criar promoção básica
    const newPromotion = {
      id: `promo_${Date.now()}`,
      title: 'Promoção Teste',
      description: 'Descrição da promoção',
      type: 'promotion',
      products: [],
      discount: 10,
      discountType: 'percentage',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('✅ Promoção criada:', newPromotion.id)
    
    // Salvar no arquivo
    try {
      await ensurePromotionsFileExists()
      
      const promotionsData = await fs.readFile(promotionsFilePath, 'utf8')
      const promotions = JSON.parse(promotionsData) || []
      
      promotions.push(newPromotion)
      
      await fs.writeFile(promotionsFilePath, JSON.stringify(promotions, null, 2))
      console.log('✅ Arquivo salvo com sucesso')
    } catch (fileError) {
      console.error('❌ Erro ao salvar arquivo:', fileError)
    }
    
    // Retornar resposta
    console.log('🚀 Retornando resposta...')
    return NextResponse.json({
      success: true,
      data: newPromotion,
      message: 'Promoção criada com sucesso'
    })

  } catch (error: any) {
    console.error('❌ Erro no POST:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

