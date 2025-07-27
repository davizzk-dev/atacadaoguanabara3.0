import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { ProductPromotion } from '@/lib/types'

const dataFilePath = path.join(process.cwd(), 'data', 'product-promotions.json')

// Função para ler dados
function readData(): ProductPromotion[] {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return []
    }
    const data = fs.readFileSync(dataFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler dados:', error)
    return []
  }
}

// Função para escrever dados
function writeData(data: ProductPromotion[]) {
  try {
    console.log('Tentando escrever dados em:', dataFilePath)
    
    const dir = path.dirname(dataFilePath)
    if (!fs.existsSync(dir)) {
      console.log('Criando diretório:', dir)
      fs.mkdirSync(dir, { recursive: true })
    }
    
    const jsonData = JSON.stringify(data, null, 2)
    console.log('Dados JSON para escrever:', jsonData)
    
    fs.writeFileSync(dataFilePath, jsonData)
    console.log('Dados escritos com sucesso em:', dataFilePath)
  } catch (error) {
    console.error('Erro detalhado ao escrever dados:', error)
    throw error // Re-throw para que o erro seja capturado
  }
}

// GET - Listar todas as promoções
export async function GET() {
  try {
    console.log('GET /api/admin/product-promotions - Iniciando...')
    const promotions = readData()
    console.log('Promoções encontradas:', promotions.length)
    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Erro ao buscar promoções:', error)
    return NextResponse.json({ error: 'Erro ao buscar promoções' }, { status: 500 })
  }
}

// POST - Criar nova promoção
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/product-promotions - Iniciando...')
    
    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const promotions = readData()
    console.log('Promoções existentes:', promotions.length)
    
    const newPromotion: ProductPromotion = {
      id: Date.now().toString(),
      productId: body.productId,
      productName: body.productName,
      originalPrice: parseFloat(body.originalPrice),
      newPrice: parseFloat(body.newPrice),
      discount: Math.round(((parseFloat(body.originalPrice) - parseFloat(body.newPrice)) / parseFloat(body.originalPrice)) * 100),
      image: body.image,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    }
    
    console.log('Nova promoção criada:', newPromotion)
    
    promotions.push(newPromotion)
    writeData(promotions)
    
    console.log('Promoção salva com sucesso')
    return NextResponse.json(newPromotion)
  } catch (error) {
    console.error('Erro detalhado ao criar promoção:', error)
    return NextResponse.json({ 
      error: 'Erro ao criar promoção', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// PUT - Atualizar promoção
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const promotions = readData()
    
    const index = promotions.findIndex(p => p.id === body.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    promotions[index] = {
      ...promotions[index],
      ...body,
      discount: body.originalPrice && body.newPrice 
        ? Math.round(((body.originalPrice - body.newPrice) / body.originalPrice) * 100)
        : promotions[index].discount,
    }
    
    writeData(promotions)
    return NextResponse.json(promotions[index])
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar promoção' }, { status: 500 })
  }
}

// DELETE - Remover promoção
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da promoção é obrigatório' }, { status: 400 })
    }
    
    const promotions = readData()
    const filteredPromotions = promotions.filter(p => p.id !== id)
    
    if (filteredPromotions.length === promotions.length) {
      return NextResponse.json({ error: 'Promoção não encontrada' }, { status: 404 })
    }
    
    writeData(filteredPromotions)
    return NextResponse.json({ message: 'Promoção removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover promoção' }, { status: 500 })
  }
} 