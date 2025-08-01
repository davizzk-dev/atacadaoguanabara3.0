import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const cameraRequestsPath = path.join(process.cwd(), 'data', 'camera-requests.json')

async function ensureDataFile() {
  const dir = path.dirname(cameraRequestsPath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error('Erro ao criar diretório:', error)
  }
  
  try {
    await fs.access(cameraRequestsPath)
  } catch {
    await fs.writeFile(cameraRequestsPath, JSON.stringify([], null, 2))
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body
    
    await ensureDataFile()
    const data = await fs.readFile(cameraRequestsPath, 'utf-8')
    const requests = JSON.parse(data)
    
    const requestIndex = requests.findIndex((req: any) => req.id === id)
    if (requestIndex === -1) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }
    
    requests[requestIndex].status = status
    requests[requestIndex].updatedAt = new Date().toISOString()
    
    await fs.writeFile(cameraRequestsPath, JSON.stringify(requests, null, 2))
    
    console.log(`✅ Solicitação de câmera ${id} atualizada para status: ${status}`)
    return NextResponse.json({ success: true, request: requests[requestIndex] })
  } catch (error) {
    console.error('Erro ao atualizar status da solicitação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 