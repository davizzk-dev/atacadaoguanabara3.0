import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'feedback.json')

// Garantir que o arquivo existe
function ensureDataFile() {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([], null, 2))
  }
}

// POST - Criar feedback
export async function POST(request: NextRequest) {
  try {
    ensureDataFile()
    const body = await request.json()
    const { name, email, phone, type, rating, message, userId } = body

    // Validações
    if (!name || !email || !type || !rating || !message) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Validar rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Avaliação deve ser entre 1 e 5' }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const feedback = JSON.parse(data)

    // Criar novo feedback
    const newFeedback = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone || '',
      type,
      rating,
      message,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    feedback.push(newFeedback)
    writeFileSync(dataPath, JSON.stringify(feedback, null, 2))

    return NextResponse.json(newFeedback, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar feedback
export async function GET() {
  try {
    ensureDataFile()
    const data = readFileSync(dataPath, 'utf-8')
    const feedback = JSON.parse(data)
    
    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Erro ao ler feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 