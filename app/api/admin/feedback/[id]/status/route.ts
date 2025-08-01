import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const feedbackPath = path.join(process.cwd(), 'data', 'feedback.json')

async function ensureDataFile() {
  const dir = path.dirname(feedbackPath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error('Erro ao criar diretório:', error)
  }
  
  try {
    await fs.access(feedbackPath)
  } catch {
    await fs.writeFile(feedbackPath, JSON.stringify([], null, 2))
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
    const data = await fs.readFile(feedbackPath, 'utf-8')
    const feedbacks = JSON.parse(data)
    
    const feedbackIndex = feedbacks.findIndex((feedback: any) => feedback.id === id)
    if (feedbackIndex === -1) {
      return NextResponse.json({ error: 'Feedback não encontrado' }, { status: 404 })
    }
    
    feedbacks[feedbackIndex].status = status
    feedbacks[feedbackIndex].updatedAt = new Date().toISOString()
    
    await fs.writeFile(feedbackPath, JSON.stringify(feedbacks, null, 2))
    
    console.log(`✅ Feedback ${id} atualizado para status: ${status}`)
    return NextResponse.json({ success: true, feedback: feedbacks[feedbackIndex] })
  } catch (error) {
    console.error('Erro ao atualizar status do feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 