import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'delivery-settings.json')

// Configurações padrão
const DEFAULT_SETTINGS = {
  deliveryEnabled: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin'
}

async function ensureSettingsFile() {
  try {
    await fs.access(SETTINGS_FILE)
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2))
  }
}

export async function GET() {
  try {
    await ensureSettingsFile()
    const data = await fs.readFile(SETTINGS_FILE, 'utf8')
    const settings = JSON.parse(data)
    
    return NextResponse.json({ 
      success: true, 
      data: settings 
    })
  } catch (error) {
    console.error('Erro ao ler configurações de entrega:', error)
    return NextResponse.json({ 
      success: false, 
      data: DEFAULT_SETTINGS 
    })
  }
}

export async function PUT(request: Request) {
  try {
    await ensureSettingsFile()
    const { deliveryEnabled, updatedBy } = await request.json()
    
    if (typeof deliveryEnabled !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'deliveryEnabled deve ser boolean' 
      }, { status: 400 })
    }
    
    const settings = {
      deliveryEnabled,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy || 'admin'
    }
    
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    
    console.log(`✅ Configuração de entrega ${deliveryEnabled ? 'ATIVADA' : 'DESATIVADA'} por ${updatedBy}`)
    
    return NextResponse.json({ 
      success: true, 
      data: settings 
    })
  } catch (error) {
    console.error('Erro ao salvar configurações de entrega:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}