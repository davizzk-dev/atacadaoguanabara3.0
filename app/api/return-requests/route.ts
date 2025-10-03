
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withAPIProtection } from '@/lib/auth-middleware'

const dataDir = path.join(process.cwd(), 'data')
const returnRequestsFile = path.join(dataDir, 'return-requests.json')

function safeReadReturnRequests() {
  try {
    if (!fs.existsSync(returnRequestsFile)) {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
      fs.writeFileSync(returnRequestsFile, JSON.stringify([]))
    }
    const data = fs.readFileSync(returnRequestsFile, 'utf-8')
    const arr = JSON.parse(data)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    console.error('Erro ao ler arquivo de devoluções:', e)
    return []
  }
}

// GET - Buscar todas as solicitações de devolução
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

async function handleGET(request: NextRequest) {
  try {
    console.log('[API/return-requests][GET] chamada recebida')
    const returnRequests = safeReadReturnRequests()

    // Identificar usuário/admin
    let userEmail = null
    let userId = null
    let isAdmin = false

    // Tenta NextAuth primeiro
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.email) {
        userEmail = session.user.email
        userId = session.user.id || null
        if (userEmail === 'davikalebe20020602@gmail.com') isAdmin = true
      }
    } catch (e) {
      // ignora
    }

    // Permitir bypass para admin via header (suporte ao admin do painel sem NextAuth)
    const adminHeader = request.headers.get('x-admin')
    if (adminHeader && adminHeader.toLowerCase() === 'true') {
      isAdmin = true
    }

    // Se não for admin, tenta pegar do header (fallback para usuário comum)
    if (!isAdmin && !userEmail) {
      userEmail = request.headers.get('x-user-email')
      userId = request.headers.get('x-user-id')
    }

    let filtered = returnRequests
    if (!isAdmin && userEmail) {
      filtered = returnRequests.filter((r:any) =>
        r.userEmail === userEmail || r.userId === userId || r.contactEmail === userEmail || r.userName === request.headers.get('x-user-name')
      )
    }
    if (!isAdmin && !userEmail) {
      // Não autenticado: não retorna nada
      filtered = []
    }

    return NextResponse.json({
      success: true,
      data: filtered
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch (error: any) {
    console.error('[API/return-requests][GET] Erro:', error, error?.stack)
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Erro interno do servidor',
      details: error?.message,
      stack: error?.stack,
      errorString: String(error),
      errorType: error?.constructor?.name
    }, { status: 500 })
  }
}

// POST - Criar nova solicitação de devolução
export async function POST(request: NextRequest) {
  try {
    console.log('[API/return-requests][POST] chamada recebida')
    
    let body: any
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      console.log('[API/return-requests][POST] Processando FormData')
      
      try {
        const formData = await request.formData()
        body = {}
        
        // Converter FormData para objeto
        for (const [key, value] of formData.entries()) {
          if (key === 'photos') {
            if (!body.photos) body.photos = []
            body.photos.push(value)
          } else {
            body[key] = value.toString()
          }
        }
        console.log('[API/return-requests][POST] FormData convertido:', body)
      } catch (formError) {
        console.error('[API/return-requests][POST] Erro ao processar FormData:', formError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar FormData',
          details: (formError as Error)?.message
        }, { status: 400 })
      }
    } else {
      console.log('[API/return-requests][POST] Processando JSON')
      
      try {
        const textBody = await request.text()
        console.log('[API/return-requests][POST] body recebido:', textBody)
        body = JSON.parse(textBody)
      } catch (parseError) {
        console.error('[API/return-requests][POST] Erro ao fazer parse do JSON:', parseError)
        return NextResponse.json({
          success: false,
          error: 'JSON inválido',
          details: (parseError as Error)?.message
        }, { status: 400 })
      }
    }

    // Validação básica dos campos obrigatórios
    console.log('[API/return-requests][POST] Validando campos obrigatórios...')
    
    if (!body.orderId) {
      console.error('[API/return-requests][POST] Campo orderId é obrigatório')
      return NextResponse.json({
        success: false,
        error: 'Campo orderId é obrigatório'
      }, { status: 400 })
    }

    if (!body.userName) {
      console.error('[API/return-requests][POST] Campo userName é obrigatório')
      return NextResponse.json({
        success: false,
        error: 'Campo userName é obrigatório'
      }, { status: 400 })
    }

    if (!body.reason) {
      console.error('[API/return-requests][POST] Campo reason é obrigatório')
      return NextResponse.json({
        success: false,
        error: 'Campo reason é obrigatório'
      }, { status: 400 })
    }

    console.log('[API/return-requests][POST] Validação passou, criando solicitação...')
    
    // Identidade do usuário: prioriza sessão NextAuth, depois headers, depois body
    let sessionEmail: string | null = null
    let sessionUserId: string | null = null
    try {
      const session = await getServerSession(authOptions) as any
      if (session?.user) {
        sessionUserId = session.user.id || null
        sessionEmail = session.user.email || null
        console.log('[API/return-requests][POST] Sessão encontrada para:', sessionEmail)
      } else {
        console.log('[API/return-requests][POST] Nenhuma sessão encontrada')
      }
    } catch (sessionError) {
      console.log('[API/return-requests][POST] Erro ao obter sessão:', sessionError)
    }

    const headerEmail = request.headers.get('x-user-email')
    const headerUserId = request.headers.get('x-user-id')

    const effectiveUserEmail = sessionEmail || headerEmail || body.userEmail || body.email || null
    const effectiveUserId = sessionUserId || headerUserId || body.userId || null

    const returnRequests = safeReadReturnRequests()
    const newReturnRequest = {
      id: Date.now().toString(),
      orderId: body.orderId,
      userName: body.userName,
      reason: body.reason,
      description: body.description || '',
      requestType: body.requestType || '',
      productName: body.productName || '',
      quantity: body.quantity || 1,
      // Associar à conta autenticada quando disponível
      userId: effectiveUserId,
      userEmail: effectiveUserEmail,
      // Guardar também os contatos informados no formulário (se diferirem)
      contactEmail: body.userEmail || body.email || null,
      contactPhone: body.userPhone || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      messages: []
    }
    
    returnRequests.push(newReturnRequest)
    
    try {
      fs.writeFileSync(returnRequestsFile, JSON.stringify(returnRequests, null, 2))
    } catch (e) {
      console.error('[API/return-requests][POST] Erro ao salvar:', e)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar solicitação',
        details: (e as Error)?.message
      }, { status: 500 })
    }
    
    console.log('[API/return-requests][POST] solicitação criada com sucesso:', newReturnRequest.id)
    return NextResponse.json({
      success: true,
      data: newReturnRequest
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API/return-requests][POST] Erro:', error, error?.stack)
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

export const GET = withAPIProtection(handleGET) 