
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(__dirname, '../../../data')
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
export async function GET() {
  try {
    console.log('[API/return-requests][GET] chamada recebida')
    const returnRequests = safeReadReturnRequests()
    
    return NextResponse.json({
      success: true,
      data: returnRequests
    })
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
    
    // Usar request.text() e parsing manual para evitar erro do Express middleware
    const textBody = await request.text()
    console.log('[API/return-requests][POST] body recebido:', textBody)
    
    let body: any
    try {
      body = JSON.parse(textBody)
    } catch (parseError) {
      console.error('[API/return-requests][POST] Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON inválido',
        details: (parseError as Error)?.message
      }, { status: 400 })
    }
    
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