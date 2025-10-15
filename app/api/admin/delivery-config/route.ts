import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DELIVERY_CONFIG_FILE = path.join(process.cwd(), 'delivery-config.json')

// Configurações padrão
const DEFAULT_CONFIG = {
  deliveryEnabled: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin'
}

async function ensureConfigFile() {
  try {
    await fs.access(DELIVERY_CONFIG_FILE)
  } catch {
    await fs.writeFile(DELIVERY_CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2))
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 GET delivery-config called')
  try {
    await ensureConfigFile()
    const data = await fs.readFile(DELIVERY_CONFIG_FILE, 'utf8')
    const config = JSON.parse(data)
    
    console.log('✅ GET delivery-config success:', config)
    return NextResponse.json({ 
      success: true, 
      data: config 
    })
  } catch (error) {
    console.error('❌ Erro ao ler configurações de entrega:', error)
    return NextResponse.json({ 
      success: false, 
      data: DEFAULT_CONFIG 
    })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 POST delivery-config called')
  try {
    await ensureConfigFile()
    const body = await request.json()
    console.log('📝 POST body received:', body)
    
    const { deliveryEnabled, updatedBy } = body
    
    if (typeof deliveryEnabled !== 'boolean') {
      console.log('❌ deliveryEnabled não é boolean:', typeof deliveryEnabled)
      return NextResponse.json({ 
        success: false, 
        error: 'deliveryEnabled deve ser boolean' 
      }, { status: 400 })
    }
    
    const config = {
      deliveryEnabled,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy || 'admin'
    }
    
    await fs.writeFile(DELIVERY_CONFIG_FILE, JSON.stringify(config, null, 2))
    
    console.log(`✅ Configuração de entrega ${deliveryEnabled ? 'ATIVADA' : 'DESATIVADA'} por ${updatedBy}`)
    
    return NextResponse.json({ 
      success: true, 
      data: config 
    })
  } catch (error) {
    console.error('❌ Erro ao salvar configurações de entrega:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}