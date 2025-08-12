import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// GET - Retorna histórico de sincronizações do Varejo Fácil
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const historyPath = path.join(dataDir, 'varejo-sync-history.json')

    try {
      await fs.access(historyPath)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
      await fs.writeFile(historyPath, JSON.stringify([], null, 2))
    }

    const content = await fs.readFile(historyPath, 'utf-8')
    const history = JSON.parse(content || '[]')
    return NextResponse.json({ success: true, data: history })
  } catch (error: any) {
    console.error('Erro ao ler histórico de sync:', error)
    return NextResponse.json({ success: false, data: [], error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
