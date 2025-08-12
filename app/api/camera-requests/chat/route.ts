import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CAMERA_REQUESTS_FILE = path.join(process.cwd(), 'data', 'camera-requests.json')

async function ensureDirectoryExists() {
  const dir = path.dirname(CAMERA_REQUESTS_FILE)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function readCameraRequests() {
  try {
    await ensureDirectoryExists()
    const data = await fs.readFile(CAMERA_REQUESTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function saveCameraRequests(requests: any[]) {
  await ensureDirectoryExists()
  await fs.writeFile(CAMERA_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8')
}

// POST - Adicionar mensagem (texto/imagem/áudio) ao chat de câmera
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('multipart/form-data')) {
      // Upload de arquivo (imagem/áudio)
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

      // Salvar arquivo localmente para servir em /api/uploads/chat/[filename]
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
      await fs.mkdir(uploadsDir, { recursive: true })

      const timestamp = Date.now()
      const originalExt = file.name.split('.').pop() || (type === 'audio' ? 'wav' : 'png')
      const fileName = `${requestId}_${timestamp}.${originalExt}`
      const filePath = path.join(uploadsDir, fileName)
      const publicUrl = `/api/uploads/chat/${fileName}`

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filePath, buffer)

      const requests = await readCameraRequests()
      const idx = requests.findIndex((r: any) => r.id === requestId)
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'Solicitação não encontrada' }, { status: 404 })
      }

      const newMessage = {
        id: timestamp.toString(),
        sender,
        message: type === 'image' ? 'Imagem enviada' : 'Áudio enviado',
        timestamp: new Date().toISOString(),
        type,
        mediaUrl: publicUrl,
        mediaName: file.name
      }

      if (!requests[idx].messages) requests[idx].messages = []
      requests[idx].messages.push(newMessage)
      requests[idx].updatedAt = new Date().toISOString()

      await saveCameraRequests(requests)

      return NextResponse.json({ success: true, data: newMessage })
    } else {
      // Mensagem de texto
      const body = await request.json()
      const { requestId, message, sender, type = 'text' } = body || {}

      if (!requestId || !message || !sender) {
        return NextResponse.json({ success: false, error: 'requestId, message e sender são obrigatórios' }, { status: 400 })
      }

      const requests = await readCameraRequests()
      const idx = requests.findIndex((r: any) => r.id === requestId)
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'Solicitação não encontrada' }, { status: 404 })
      }

      const newMessage = {
        id: Date.now().toString(),
        sender,
        message,
        timestamp: new Date().toISOString(),
        type
      }

      if (!requests[idx].messages) requests[idx].messages = []
      requests[idx].messages.push(newMessage)
      requests[idx].updatedAt = new Date().toISOString()

      await saveCameraRequests(requests)

      return NextResponse.json({ success: true, data: newMessage })
    }
  } catch (error: any) {
    console.error('[API/camera-requests/chat][POST] Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
