import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

// Usar caminho correto para o arquivo
const ordersPath = path.join(process.cwd(), 'data', 'orders.json')

async function ensureDataFile() {
  const dir = path.dirname(ordersPath)
  console.log('📁 Diretório data:', dir)
  console.log('📄 Caminho do arquivo orders.json:', ordersPath)
  console.log('🔍 process.cwd():', process.cwd())
  
  try {
    await fs.mkdir(dir, { recursive: true })
    console.log('✅ Diretório criado/verificado')
  } catch (error) {
    console.error('❌ Erro ao criar diretório:', error)
  }
  
  try {
    await fs.access(ordersPath)
    console.log('✅ Arquivo orders.json existe')
  } catch {
    console.log('📝 Criando arquivo orders.json...')
    await fs.writeFile(ordersPath, JSON.stringify([], null, 2))
    console.log('✅ Arquivo orders.json criado')
  }
}

// POST - Criar pedido
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando criação de pedido...')
    await ensureDataFile()
    
    const body = await request.json()
    console.log('📦 Dados recebidos:', JSON.stringify(body, null, 2))
    
    if (!body.items || !body.customerInfo) {
      console.log('❌ Dados obrigatórios faltando')
      return NextResponse.json({ error: 'Dados obrigatórios faltando: items e customerInfo', success: false }, { status: 400 })
    }
    
    console.log('📖 Lendo arquivo orders.json...')
    const data = await fs.readFile(ordersPath, 'utf-8')
    console.log('📄 Conteúdo atual:', data)
    
    const orders = JSON.parse(data)
    console.log('📋 Pedidos existentes:', orders.length)
    
    const newOrder = {
      ...body,
      id: body.id || Date.now().toString(),
      createdAt: body.createdAt || new Date().toISOString(),
      status: body.status || 'pending'
    }
    console.log('🆕 Novo pedido:', JSON.stringify(newOrder, null, 2))
    
    orders.push(newOrder)
    console.log('💾 Salvando pedidos...')
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2))
    console.log('✅ Pedido salvo com sucesso')
    
    return NextResponse.json({ success: true, order: newOrder, message: 'Pedido criado com sucesso' }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error)
    console.error('❌ Stack trace:', error?.stack)
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno do servidor', details: error?.stack || 'Sem detalhes disponíveis' }, { status: 500 })
  }
}

// GET - Listar pedidos do usuário logado
export async function GET(request: NextRequest) {
  try {
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)

    // Obter sessão do usuário logado
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autenticado', orders: [] }, { status: 401 })
    }

    // Filtrar pedidos pelo e-mail do usuário logado
    const userOrders = orders.filter((order: any) => order.customerInfo?.email === session.user.email)
    return NextResponse.json(userOrders)
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', orders: [] }, { status: 500 })
  }
} 