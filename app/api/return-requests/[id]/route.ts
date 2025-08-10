import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const returnRequestsPath = path.join(process.cwd(), 'data', 'return-requests.json')

async function ensureDataFile() {
  const dir = path.dirname(returnRequestsPath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    // Diretório já existe
  }
  
  try {
    await fs.access(returnRequestsPath)
  } catch {
    await fs.writeFile(returnRequestsPath, JSON.stringify([], null, 2))
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Clone request para evitar "Response body disturbed"
    let updateData
    try {
      const text = await request.text()
      updateData = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Erro ao fazer parse do body:', e)
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos no body da requisição'
      }, { status: 400 })
    }
    
    await ensureDataFile()
    const data = await fs.readFile(returnRequestsPath, 'utf-8')
    const requests = JSON.parse(data)
    
    const requestIndex = requests.findIndex((req: any) => req.id === id)
    
    if (requestIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Solicitação de devolução não encontrada'
      }, { status: 404 })
    }
    
    // Atualizar solicitação
    requests[requestIndex] = {
      ...requests[requestIndex],
      ...updateData,
      id: requests[requestIndex].id, // Manter ID original
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(returnRequestsPath, JSON.stringify(requests, null, 2))
    
    console.log(`✅ Solicitação de devolução ${id} atualizada`)
    
    const response = NextResponse.json({
      success: true,
      request: requests[requestIndex]
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar solicitação de devolução:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}