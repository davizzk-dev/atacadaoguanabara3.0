import { NextRequest, NextResponse } from 'next/server'
import { products } from '@/lib/data'

// Função para ler dados
function readData() {
  return products
}

// GET - Listar produtos
export async function GET() {
  try {
    const products = readData()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 