import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const HISTORY_FILE = path.join(process.cwd(), 'data', 'sync-history.json')

// Garantir que o diretório existe
const dataDir = path.dirname(HISTORY_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Garantir que o arquivo existe
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]))
}

export async function GET() {
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8')
    const history = JSON.parse(data)
    
    // Ordenar por data decrescente (mais recente primeiro)
    history.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    
    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return NextResponse.json({ success: false, error: 'Erro ao carregar histórico' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newEntry = await request.json()
    
    const data = fs.readFileSync(HISTORY_FILE, 'utf8')
    const history = JSON.parse(data)
    
    // Adicionar nova entrada
    history.push({
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      ...newEntry
    })
    
    // Manter apenas os últimos 50 registros
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar histórico:', error)
    return NextResponse.json({ success: false, error: 'Erro ao salvar histórico' }, { status: 500 })
  }
}
