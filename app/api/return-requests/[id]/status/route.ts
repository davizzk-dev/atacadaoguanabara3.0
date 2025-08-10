import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// PATCH - Atualizar status de uma solicitação de troca/devolução
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body
    
    if (!status || !['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status inválido. Deve ser: pending, approved, rejected ou completed'
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
    
    // Atualizar status
    returnRequestsData[requestIndex].status = status
    returnRequestsData[requestIndex].updatedAt = new Date().toISOString()
    
    // Salvar no arquivo
    fs.writeFileSync(path.join(dataPath, 'return-requests.json'), JSON.stringify(returnRequestsData, null, 2))
    
    return NextResponse.json({
      success: true,
      data: {
        request: returnRequestsData[requestIndex]
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

