import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
const dataPath = join(dataDir, 'feedback.json')

function ensureDataFile() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  if (!existsSync(dataPath)) {
    writeFileSync(dataPath, JSON.stringify([], null, 2))
  }
}

// POST - Criar feedback
export async function POST(request: Request) {
  try {
    console.log('[API/feedback][POST] chamada recebida')
    ensureDataFile()
    
    // Ler o body apenas uma vez
    let body: any
    try {
      const bodyText = await request.text()
      if (!bodyText || bodyText.trim() === '') {
        console.log('[API/feedback][POST] Body vazio')
        return NextResponse.json({ 
          success: false, 
          error: 'Body da requisição está vazio' 
        }, { status: 400 })
      }
      body = JSON.parse(bodyText)
    } catch (err) {
      console.error('[API/feedback][POST] Erro ao parsear body:', err)
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
    
    const { name, email, phone, type, rating, message, userId } = body
    if (!name || !email || !type || !rating || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      }, { status: 400 })
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email inválido' 
      }, { status: 400 })
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'Avaliação deve ser entre 1 e 5' 
      }, { status: 400 })
    }
    const data = readFileSync(dataPath, 'utf-8')
    const feedback = JSON.parse(data)
    const newFeedback = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone || '',
      type,
      rating,
      message,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    feedback.push(newFeedback)
    writeFileSync(dataPath, JSON.stringify(feedback, null, 2))
    return NextResponse.json({ success: true, data: newFeedback }, { status: 201 })
  } catch (error: any) {
    console.error('[API/feedback][POST] Erro:', error, error?.stack)
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

// GET - Listar feedback
export async function GET() {
  try {
    console.log('[API/feedback][GET] chamada recebida')
    ensureDataFile()
    const data = readFileSync(dataPath, 'utf-8')
    const feedback = JSON.parse(data)
    return NextResponse.json({ success: true, data: feedback })
  } catch (error: any) {
    console.error('[API/feedback][GET] Erro:', error, error?.stack)
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