import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Caminho absoluto para garantir gravação correta
const ABSOLUTE_DATA_PATH = path.resolve(process.cwd(), 'data', 'test-api.json')

function ensureTestFile() {
  const dir = path.dirname(ABSOLUTE_DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(ABSOLUTE_DATA_PATH)) fs.writeFileSync(ABSOLUTE_DATA_PATH, JSON.stringify([]))
}

export async function GET() {
  try {
    ensureTestFile()
    const data = fs.readFileSync(ABSOLUTE_DATA_PATH, 'utf-8')
    const arr = JSON.parse(data)
    return NextResponse.json({ success: true, data: arr })
  } catch (e) {
  const msg = (e instanceof Error) ? e.message : String(e)
  return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureTestFile()
    const body = await request.json()
    const data = fs.readFileSync(ABSOLUTE_DATA_PATH, 'utf-8')
    const arr = JSON.parse(data)
    const newItem = { id: Date.now().toString(), ...body, createdAt: new Date().toISOString() }
    arr.push(newItem)
    fs.writeFileSync(ABSOLUTE_DATA_PATH, JSON.stringify(arr, null, 2))
    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (e) {
  const msg = (e instanceof Error) ? e.message : String(e)
  return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
