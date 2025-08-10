import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// PATCH - Atualizar status de um feedback
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body
    
    if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status inválido. Deve ser: pending, reviewed ou resolved'
      }, { status: 400 })
    }
    
    const dataPath = path.join(process.cwd(), 'data')
    const feedbacksData = JSON.parse(fs.readFileSync(path.join(dataPath, 'feedback.json'), 'utf8'))
    
    const feedbackIndex = feedbacksData.findIndex((feedback: any) => feedback.id === params.id)
    
    if (feedbackIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Feedback não encontrado'
      }, { status: 404 })
    }
    
    // Atualizar status
    feedbacksData[feedbackIndex].status = status
    feedbacksData[feedbackIndex].updatedAt = new Date().toISOString()
    
    // Salvar no arquivo
    fs.writeFileSync(path.join(dataPath, 'feedback.json'), JSON.stringify(feedbacksData, null, 2))
    
    return NextResponse.json({
      success: true,
      data: {
        feedback: feedbacksData[feedbackIndex]
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar status do feedback:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar status'
    }, { status: 500 })
  }
}

