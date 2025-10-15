import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const STOCK_CONFIG_FILE = path.join(process.cwd(), 'stock-config.json')

// Configurações padrão
const DEFAULT_CONFIG = {
  syncWithVarejoFacil: true, // Por padrão sincronizado
  lastUpdated: new Date().toISOString(),
  updatedBy: null
}

// Garantir que o arquivo de configuração existe
const ensureConfigFile = async () => {
  try {
    await fs.access(STOCK_CONFIG_FILE)
  } catch {
    await fs.writeFile(STOCK_CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2))
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 GET stock-config called')
  try {
    await ensureConfigFile()
    const data = await fs.readFile(STOCK_CONFIG_FILE, 'utf8')
    const config = JSON.parse(data)
    
    console.log('✅ GET stock-config success:', config)
    return NextResponse.json({ 
      success: true, 
      data: config 
    })
  } catch (error) {
    console.error('❌ Erro ao ler configurações de estoque:', error)
    return NextResponse.json({ 
      success: false, 
      data: DEFAULT_CONFIG 
    })
  }
}

export async function POST(request: NextRequest) {
  console.log('📝 POST stock-config called')
  try {
    await ensureConfigFile()
    
    const body = await request.json()
    console.log('📦 Dados recebidos:', body)
    
    const { syncWithVarejoFacil, updatedBy } = body

    if (typeof syncWithVarejoFacil !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetro syncWithVarejoFacil deve ser boolean' 
      }, { status: 400 })
    }

    const newConfig = {
      syncWithVarejoFacil,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy || 'Sistema'
    }

    await fs.writeFile(STOCK_CONFIG_FILE, JSON.stringify(newConfig, null, 2))
    
    console.log('✅ POST stock-config success:', newConfig)
    return NextResponse.json({ 
      success: true, 
      data: newConfig,
      message: `Estoque ${syncWithVarejoFacil ? 'sincronizado com Varejo Fácil' : 'configurado como infinito'}`
    })
    
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de estoque:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}