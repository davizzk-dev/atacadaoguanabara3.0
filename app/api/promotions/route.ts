import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
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
    
    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      data: promotionsData
    })
  } catch (error) {
    console.error('Erro ao buscar promoções:', error)
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Erro ao buscar promoções'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API/promotions][POST] chamada recebida')
    
    // Usar request.text() e parsing manual para evitar erro do Express middleware
    const textBody = await request.text()
    console.log('[API/promotions][POST] body recebido:', textBody)
    
    let body: any
    try {
      body = JSON.parse(textBody)
    } catch (parseError) {
      console.error('[API/promotions][POST] Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON inválido',
        details: (parseError as Error)?.message
      }, { status: 400 })
    }
    
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
    
    console.log('[API/promotions][POST] promoção criada com sucesso:', newPromotion.id)
    return NextResponse.json({ 
      success: true, 
      data: newPromotion 
    })
    
  } catch (error: any) {
    console.error('[API/promotions][POST] Erro:', error, error?.stack)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message,
      stack: error?.stack,
      errorString: String(error),
      errorType: error?.constructor?.name
    }, { status: 500 })
  }
}
