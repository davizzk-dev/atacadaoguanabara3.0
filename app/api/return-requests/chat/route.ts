import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const RETURN_REQUESTS_FILE = path.join(process.cwd(), 'data', 'return-requests.json')

// Função para garantir que o diretório existe
async function ensureDirectoryExists() {
  const dir = path.dirname(RETURN_REQUESTS_FILE)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// Função para ler solicitações
async function readReturnRequests() {
  try {
    await ensureDirectoryExists()
    const data = await fs.readFile(RETURN_REQUESTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Função para salvar solicitações
async function saveReturnRequests(requests: any[]) {
  await ensureDirectoryExists()
  await fs.writeFile(RETURN_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8')
}

// POST - Adicionar mensagem ao chat
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Processar arquivo (imagem ou áudio)
      const formData = await request.formData()
      const file = formData.get('file') as File
      const requestId = formData.get('requestId') as string
      const sender = formData.get('sender') as string
      const type = formData.get('type') as string

      if (!file || !requestId || !sender || !type) {
        return NextResponse.json({
          success: false,
          error: 'Arquivo, requestId, sender e type são obrigatórios'
        }, { status: 400 })
      }

      // Criar diretório para arquivos
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
      await fs.mkdir(uploadsDir, { recursive: true })

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || (type === 'audio' ? 'wav' : 'png')
      const fileName = `${requestId}_${timestamp}.${extension}`
      const filePath = path.join(uploadsDir, fileName)
      const publicUrl = `/api/uploads/chat/${fileName}`

      // Salvar arquivo
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filePath, buffer)

      const requests = await readReturnRequests()
      const requestIndex = requests.findIndex((req: any) => req.id === requestId)

      if (requestIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Solicitação não encontrada'
        }, { status: 404 })
      }

      // Criar nova mensagem com arquivo
      const newMessage = {
        id: timestamp.toString(),
        sender,
        message: type === 'image' ? 'Imagem enviada' : 'Áudio enviado',
        timestamp: new Date().toISOString(),
        type,
        mediaUrl: publicUrl,
        mediaName: file.name
      }

      // Adicionar mensagem ao chat
      if (!requests[requestIndex].messages) {
        requests[requestIndex].messages = []
      }
      requests[requestIndex].messages.push(newMessage)
      requests[requestIndex].updatedAt = new Date().toISOString()

      await saveReturnRequests(requests)

      return NextResponse.json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        data: newMessage
      })
    } else {
      // Processar mensagem de texto
      const body = await request.json()
      const { requestId, message, sender, type = 'text' } = body

      if (!requestId || !message || !sender) {
        return NextResponse.json({
          success: false,
          error: 'requestId, message e sender são obrigatórios'
        }, { status: 400 })
      }

      const requests = await readReturnRequests()
      const requestIndex = requests.findIndex((req: any) => req.id === requestId)

      if (requestIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Solicitação não encontrada'
        }, { status: 404 })
      }

      // Criar nova mensagem
      const newMessage = {
        id: Date.now().toString(),
        sender,
        message,
        timestamp: new Date().toISOString(),
        type
      }

      // Adicionar mensagem ao chat
      if (!requests[requestIndex].messages) {
        requests[requestIndex].messages = []
      }
      requests[requestIndex].messages.push(newMessage)
      requests[requestIndex].updatedAt = new Date().toISOString()

      await saveReturnRequests(requests)

      return NextResponse.json({
        success: true,
        message: 'Mensagem adicionada com sucesso',
        data: newMessage
      })
    }
  } catch (error: any) {
    console.error('[API/return-requests/chat][POST] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
