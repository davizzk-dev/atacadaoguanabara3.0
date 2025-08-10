import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// PATCH - Atualizar status de uma solicitação
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body
    
    if (!status || !['pending', 'processing', 'completed'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status inválido. Deve ser: pending, processing ou completed'
      }, { status: 400 })
    }
    
    const dataPath = path.join(process.cwd(), 'data')
    const cameraRequestsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'camera-requests.json'), 'utf8'))
    
    const requestIndex = cameraRequestsData.findIndex((req: any) => req.id === params.id)
    
    if (requestIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Solicitação não encontrada'
      }, { status: 404 })
    }
    
    // Atualizar status
    cameraRequestsData[requestIndex].status = status
    cameraRequestsData[requestIndex].updatedAt = new Date().toISOString()
    
    // Salvar no arquivo
    fs.writeFileSync(path.join(dataPath, 'camera-requests.json'), JSON.stringify(cameraRequestsData, null, 2))
    
    return NextResponse.json({
      success: true,
      data: {
        request: cameraRequestsData[requestIndex]
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar status'
    }, { status: 500 })
  }
}

