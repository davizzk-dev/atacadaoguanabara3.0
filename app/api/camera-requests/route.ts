import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'camera-requests.json')

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

// POST - Criar solicitação de câmera
export async function POST(request: NextRequest) {
  try {
    ensureDataFile()
    const body = await request.json()
    const { name, phone, rg, cause, moment, period, additionalInfo, userId, userEmail } = body

    // Validações
    if (!name || !phone || !rg || !cause || !moment || !period) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }

    // Validar RG (apenas números, máximo 9 dígitos)
    const rgNumbers = rg.replace(/\D/g, '')
    if (rgNumbers.length < 7 || rgNumbers.length > 9) {
      return NextResponse.json({ error: 'RG inválido' }, { status: 400 })
    }

    // Validar telefone (apenas números, 10-11 dígitos)
    const phoneNumbers = phone.replace(/\D/g, '')
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const requests = JSON.parse(data)

    // Criar nova solicitação
    const newRequest = {
      id: Date.now().toString(),
      name,
      phone: phone.replace(/\D/g, ''),
      rg: rg.replace(/\D/g, ''),
      cause,
      moment,
      period,
      additionalInfo: additionalInfo || '',
      userId: userId || null,
      userEmail: userEmail || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      reviewed: false
    }

    requests.push(newRequest)
    writeFileSync(dataPath, JSON.stringify(requests, null, 2))

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar solicitação de câmera:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar solicitações de câmera
export async function GET() {
  try {
    ensureDataFile()
    const data = readFileSync(dataPath, 'utf-8')
    const requests = JSON.parse(data)
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Erro ao ler solicitações de câmera:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 