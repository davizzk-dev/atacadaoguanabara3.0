import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Ler dados do arquivo JSON
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsData = JSON.parse(await fs.readFile(path.join(dataDir, 'product-promotions.json'), 'utf-8'))
    
    return NextResponse.json(promotionsData)
  } catch (error) {
    console.error('Erro ao buscar promoções:', error)
    
    // Dados mockados em caso de erro
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🚀 API: Dados recebidos do frontend:', body)
    console.log('🆔 ProductId recebido:', body.productId)
    console.log('📝 ProductName recebido:', body.productName)
    
    // Ler promoções existentes
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      console.log('Arquivo de promoções não existe, criando novo...')
    }
    
    // Criar nova promoção
    const newPromotion = {
      id: Date.now().toString(),
      productId: body.productId,
      productName: body.productName,
      originalPrice: parseFloat(body.originalPrice),
      newPrice: parseFloat(body.newPrice),
      discount: Math.round(((parseFloat(body.originalPrice) - parseFloat(body.newPrice)) / parseFloat(body.originalPrice)) * 100),
      image: body.image || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      validUntil: body.validUntil ? new Date(body.validUntil).toISOString() : null
    }
    
    console.log('✅ Nova promoção criada:', newPromotion)
    console.log('🆔 ProductId final:', newPromotion.productId)
    console.log('📝 ProductName final:', newPromotion.productName)
    
    // Adicionar à lista
    promotions.push(newPromotion)
    
    // Salvar no arquivo JSON
    await fs.writeFile(promotionsPath, JSON.stringify(promotions, null, 2))
    
    console.log('Promoção salva com sucesso:', newPromotion)
    return NextResponse.json(newPromotion)
  } catch (error) {
    console.error('Erro ao criar promoção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Ler promoções existentes
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      return NextResponse.json({ error: 'Arquivo de promoções não encontrado' }, { status: 404 })
    }
    
    // Encontrar e atualizar a promoção
    const promotionIndex = promotions.findIndex((promotion: any) => promotion.id === id)
    
    if (promotionIndex === -1) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    // Atualizar promoção
    promotions[promotionIndex] = {
      ...promotions[promotionIndex],
      ...updateData,
      discount: updateData.originalPrice && updateData.newPrice 
        ? Math.round(((updateData.originalPrice - updateData.newPrice) / updateData.originalPrice) * 100)
        : promotions[promotionIndex].discount
    }
    
    // Salvar lista atualizada
    await fs.writeFile(promotionsPath, JSON.stringify(promotions, null, 2))
    
    return NextResponse.json(promotions[promotionIndex])
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
    
    // Ler promoções existentes
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      return NextResponse.json({ error: 'Arquivo de promoções não encontrado' }, { status: 404 })
    }
    
    // Filtrar a promoção a ser deletada
    const filteredPromotions = promotions.filter((promotion: any) => promotion.id !== id)
    
    if (filteredPromotions.length === promotions.length) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    // Salvar lista atualizada
    await fs.writeFile(promotionsPath, JSON.stringify(filteredPromotions, null, 2))
    
    return NextResponse.json({ message: 'Promoção deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar promoção:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 