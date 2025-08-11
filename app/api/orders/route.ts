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
    console.log('[API/orders][POST] Iniciando criação de pedido...')
    await ensureDataFile()
    
    // Usar request.text() e parsing manual para evitar erro do Express middleware
    const textBody = await request.text()
    console.log('[API/orders][POST] body recebido:', textBody)
    
    let body: any
    try {
      body = JSON.parse(textBody)
    } catch (parseError) {
      console.error('[API/orders][POST] Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON inválido',
        details: (parseError as Error)?.message
      }, { status: 400 })
    }
    
    console.log('[API/orders][POST] Dados recebidos:', JSON.stringify(body, null, 2))
    
    // Validação mais flexível - apenas items é obrigatório
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      console.log('[API/orders][POST] Items obrigatórios faltando ou inválidos')
      return NextResponse.json({ 
        error: 'Items obrigatórios faltando ou inválidos', 
        success: false 
      }, { status: 400 })
    }
    
    // Validar customerInfo básico
    if (!body.customerInfo || !body.customerInfo.name || !body.customerInfo.phone) {
      console.log('[API/orders][POST] Informações básicas do cliente faltando (nome e telefone)')
      return NextResponse.json({ 
        error: 'Informações básicas do cliente são obrigatórias: nome e telefone', 
        success: false 
      }, { status: 400 })
    }
    
    console.log('[API/orders][POST] Lendo arquivo orders.json...')
    const data = await fs.readFile(ordersPath, 'utf-8')
    console.log('[API/orders][POST] Conteúdo atual:', data)
    
    const orders = JSON.parse(data)
    console.log('[API/orders][POST] Pedidos existentes:', orders.length)
    
    const newOrder = {
      ...body,
      id: body.id || Date.now().toString(),
      createdAt: body.createdAt || new Date().toISOString(),
      status: body.status || 'pending',
      // Garantir que customerInfo tenha email mesmo que vazio
      customerInfo: {
        ...body.customerInfo,
        email: body.customerInfo.email || ''
      }
    }
    console.log('[API/orders][POST] Novo pedido:', JSON.stringify(newOrder, null, 2))
    
    orders.push(newOrder)
    console.log('[API/orders][POST] Salvando pedidos...')
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2))
    console.log('[API/orders][POST] Pedido salvo com sucesso')
    
    return NextResponse.json({ 
      success: true, 
      order: newOrder, 
      message: 'Pedido criado com sucesso' 
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API/orders][POST] Erro:', error, error?.stack)
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

// GET - Listar pedidos do usuário logado
export async function GET(request: NextRequest) {
  try {
    console.log('[API/orders][GET] chamada recebida')
    await ensureDataFile()
    const data = await fs.readFile(ordersPath, 'utf-8')
    const orders = JSON.parse(data)

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userEmail = searchParams.get('userEmail')
    
    console.log('[API/orders][GET] Parâmetros:', { userId, userEmail })

    // Para o admin ou se não há filtros, retornar todos os pedidos
    if (!userId && !userEmail) {
      console.log('[API/orders][GET] retornando todos os pedidos:', orders.length)
      return NextResponse.json(orders)
    }

    // Filtrar pedidos por userId ou userEmail
    let filteredOrders = orders

    if (userEmail) {
      filteredOrders = orders.filter((order: any) => 
        order.customerInfo?.email === userEmail
      )
      console.log('[API/orders][GET] pedidos filtrados por email:', filteredOrders.length)
    } else if (userId && userId !== 'guest') {
      // Para usuários específicos (não guest)
      filteredOrders = orders.filter((order: any) => 
        order.userId === userId
      )
      console.log('[API/orders][GET] pedidos filtrados por userId:', filteredOrders.length)
    }

    // Tentar também autenticação por session como fallback
    try {
      const session = await getServerSession(authOptions)
      
      if (session?.user?.email && !userEmail) {
        // Usuário autenticado - filtrar pedidos
        filteredOrders = orders.filter((order: any) => 
          order.customerInfo?.email === session.user.email
        )
        
        console.log('[API/orders][GET] pedidos filtrados por session:', filteredOrders.length)
      }
    } catch (authError) {
      console.log('[API/orders][GET] Erro na autenticação, usando filtros da URL')
    }

    return NextResponse.json(filteredOrders)
  } catch (error: any) {
    console.error('[API/orders][GET] Erro:', error, error?.stack)
    return NextResponse.json([], { status: 500 })
  }
} 