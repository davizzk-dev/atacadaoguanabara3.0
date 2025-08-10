import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    try {
      await fs.access(promotionsPath)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
      await fs.writeFile(promotionsPath, JSON.stringify([], null, 2))
    }
    
    const promotionsData = JSON.parse(await fs.readFile(promotionsPath, 'utf-8'))
    return NextResponse.json(promotionsData)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.productId || !body.productName || !body.originalPrice || !body.newPrice) {
      return NextResponse.json({ 
        success: false,
        error: 'Dados obrigatórios faltando' 
      }, { status: 400 })
    }
    
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true })
    }
    
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
    
    promotions.push(newPromotion)
    await fs.writeFile(promotionsPath, JSON.stringify(promotions, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      data: newPromotion 
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      return NextResponse.json({ error: 'Arquivo de promoções não encontrado' }, { status: 404 })
    }
    
    const promotionIndex = promotions.findIndex((promotion: any) => promotion.id === id)
    
    if (promotionIndex === -1) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    promotions[promotionIndex] = {
      ...promotions[promotionIndex],
      ...updateData,
      discount: updateData.originalPrice && updateData.newPrice 
        ? Math.round(((updateData.originalPrice - updateData.newPrice) / updateData.originalPrice) * 100)
        : promotions[promotionIndex].discount
    }
    
    await fs.writeFile(promotionsPath, JSON.stringify(promotions, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      data: promotions[promotionIndex] 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da promoção é obrigatório' }, { status: 400 })
    }
    
    const dataDir = path.join(process.cwd(), 'data')
    const promotionsPath = path.join(dataDir, 'product-promotions.json')
    
    let promotions = []
    try {
      const existingData = await fs.readFile(promotionsPath, 'utf-8')
      promotions = JSON.parse(existingData)
    } catch (error) {
      return NextResponse.json({ error: 'Arquivo de promoções não encontrado' }, { status: 404 })
    }
    
    const filteredPromotions = promotions.filter((promotion: any) => promotion.id !== id)
    
    if (filteredPromotions.length === promotions.length) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    await fs.writeFile(promotionsPath, JSON.stringify(filteredPromotions, null, 2))
    
    return NextResponse.json({ 
      success: true,
      message: 'Promoção deletada com sucesso' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 