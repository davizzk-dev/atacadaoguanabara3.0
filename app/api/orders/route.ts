import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ordersPath = join(process.cwd(), 'data', 'orders.json')

// Garantir que o arquivo existe
function ensureDataFile() {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, JSON.stringify([], null, 2))
  }
}

// Função para ler dados
function readData() {
  try {
    ensureDataFile()
    const data = readFileSync(ordersPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler pedidos:', error)
    return []
  }
}

// POST - Criar pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const orders = readData()
    
    const newOrder = {
      ...body,
      id: body.id || Date.now().toString(),
      createdAt: body.createdAt || new Date().toISOString(),
      status: body.status || 'pending'
    }
    
    orders.push(newOrder)
    writeFileSync(ordersPath, JSON.stringify(orders, null, 2))
    
    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar pedidos
export async function GET() {
  try {
    const orders = readData()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 