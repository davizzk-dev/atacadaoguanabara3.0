import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET - Buscar mensagens de uma solicitação de troca/devolução
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataPath = path.join(process.cwd(), 'data')
    const returnRequestsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'return-requests.json'), 'utf8'))
    
    const request = returnRequestsData.find((req: any) => req.id === params.id)
    
    if (!request) {
      return NextResponse.json({
        success: false,
        error: 'Solicitação não encontrada'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        messages: request.messages || [],
        request: {
          id: request.id,
          orderId: request.orderId,
          userName: request.userName,
          reason: request.reason,
          status: request.status,
          createdAt: request.createdAt
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar mensagens'
    }, { status: 500 })
  }
}

// POST - Enviar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { message, sender = 'admin' } = body
    
    if (!message || !message.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Mensagem é obrigatória'
      }, { status: 400 })
    }
    
    const dataPath = path.join(process.cwd(), 'data')
    const returnRequestsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'return-requests.json'), 'utf8'))
    
    const requestIndex = returnRequestsData.findIndex((req: any) => req.id === params.id)
    
    if (requestIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Solicitação não encontrada'
      }, { status: 404 })
    }
    
    const newMessage = {
      id: Date.now().toString(),
      sender,
      message: message.trim(),
      timestamp: new Date().toISOString()
    }
    
    // Inicializar array de mensagens se não existir
    if (!returnRequestsData[requestIndex].messages) {
      returnRequestsData[requestIndex].messages = []
    }
    
    // Adicionar nova mensagem
    returnRequestsData[requestIndex].messages.push(newMessage)
    
    // Atualizar timestamp da solicitação
    returnRequestsData[requestIndex].updatedAt = new Date().toISOString()
    
    // Salvar no arquivo
    fs.writeFileSync(path.join(dataPath, 'return-requests.json'), JSON.stringify(returnRequestsData, null, 2))
    
    return NextResponse.json({
      success: true,
      data: {
        message: newMessage,
        request: returnRequestsData[requestIndex]
      }
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao enviar mensagem'
    }, { status: 500 })
  }
}