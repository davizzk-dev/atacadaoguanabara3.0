import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataDirectory = path.join(process.cwd(), 'data')
    const productsPath = path.join(dataDirectory, 'products.json')
    
    const productsData = await fs.readFile(productsPath, 'utf8')
    const products = JSON.parse(productsData)
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    return NextResponse.json({ error: 'Erro ao carregar produtos' }, { status: 500 })
  }
} 