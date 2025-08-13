import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const dataPath = join(process.cwd(), 'data', 'camera-requests.json')

// Garantir que o arquivo existe
function ensureDataFile() {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([], null, 2))
  }
}

// POST - Criar solicitação de câmera
export async function POST(request: NextRequest) {
  try {
    console.log('[API/camera-requests][POST] chamada recebida')
    ensureDataFile()
    
    // Ler o body apenas uma vez
    let body: any
    try {
      const bodyText = await request.text()
      if (!bodyText || bodyText.trim() === '') {
        console.log('[API/camera-requests][POST] Body vazio')
        return NextResponse.json({ 
          success: false, 
          error: 'Body da requisição está vazio' 
        }, { status: 400 })
      }
      body = JSON.parse(bodyText)
    } catch (err) {
      console.error('[API/camera-requests][POST] Erro ao parsear body:', err)
      return NextResponse.json({ 
        success: false, 
        error: 'Body inválido ou ausente' 
      }, { status: 400 })
    }
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Body inválido ou ausente' 
      }, { status: 400 })
    }
    
    const { name, phone, rg, cause, moment, period, additionalInfo, userId, userEmail } = body

    // Validações
    if (!name || !phone || !rg || !cause || !moment || !period) {
      return NextResponse.json({ 
        success: false, 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      }, { status: 400 })
    }

    // Validar RG (apenas números, máximo 9 dígitos)
    const rgNumbers = rg.replace(/\D/g, '')
    if (rgNumbers.length < 7 || rgNumbers.length > 9) {
      return NextResponse.json({ 
        success: false, 
        error: 'RG inválido' 
      }, { status: 400 })
    }

    // Validar telefone (apenas números, 10-11 dígitos)
    const phoneNumbers = phone.replace(/\D/g, '')
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json({ 
        success: false, 
        error: 'Telefone inválido' 
      }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const requests = JSON.parse(data)

    // Criar nova solicitação
    const newRequest = {
      id: Date.now().toString(),
      name,
      phone: phone.replace(/\D/g, ''),
      rg: rg.replace(/\D/g, ''),
      cause,
      moment,
      period,
      additionalInfo: additionalInfo || '',
      userId: userId || null,
      userEmail: userEmail || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      reviewed: false
    }

    requests.push(newRequest)
    writeFileSync(dataPath, JSON.stringify(requests, null, 2))

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 })
  } catch (error: any) {
    console.error('[API/camera-requests][POST] Erro:', error, error?.stack)
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

// GET - Listar solicitações de câmera
export async function GET(request: NextRequest) {
  try {
    console.log('[API/camera-requests][GET] chamada recebida')
    ensureDataFile()
    const data = readFileSync(dataPath, 'utf-8')
    const requests = JSON.parse(data)

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

    let filtered = requests
    if (!isAdmin && userEmail) {
      filtered = requests.filter((r:any) => r.userEmail === userEmail || r.userId === userId)
    }
    if (!isAdmin && !userEmail) {
      // Não autenticado: não retorna nada
      filtered = []
    }

    return NextResponse.json({ success: true, data: filtered })
  } catch (error: any) {
    console.error('[API/camera-requests][GET] Erro:', error, error?.stack)
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