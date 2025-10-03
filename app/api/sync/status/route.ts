import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const SYNC_STATE_FILE = path.join(process.cwd(), 'data', 'sync-state.json')

// Função para carregar estado
function loadState() {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const data = fs.readFileSync(SYNC_STATE_FILE, 'utf8')
      const state = JSON.parse(data)
      return state
    }
  } catch (error) {
    console.error('Erro ao carregar estado no status:', error)
  }
  
  return {
    isRunning: false,
    startTime: null,
    lastResult: null,
    lastError: null
  }
}

export async function GET(request: NextRequest) {
  try {
    const state = loadState()
    
    // Calcular duração
    let duration = null
    if (state.startTime) {
      if (state.isRunning) {
        // Ainda rodando - calcular tempo desde início
        duration = Date.now() - new Date(state.startTime).getTime()
      } else if (state.endTime) {
        // Já terminou - usar duração calculada
        duration = state.duration || (new Date(state.endTime).getTime() - new Date(state.startTime).getTime())
      }
    }

    const status: any = {
      isRunning: state.isRunning,
      startTime: state.startTime,
      endTime: state.endTime,
      duration: duration,
      lastResult: state.lastResult,
      lastError: state.lastError,
      lastUpdate: state.lastUpdate,
      timestamp: new Date().toISOString()
    }

    // Verificar se arquivo existe e quando foi modificado
    let fileInfo = null
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const stats = fs.statSync(SYNC_STATE_FILE)
      fileInfo = {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        ageSeconds: Math.floor((Date.now() - stats.mtime.getTime()) / 1000)
      }
    } else {
      fileInfo = { exists: false }
    }

    console.log('📊 Status atual:', {
      isRunning: status.isRunning,
      duration: duration ? Math.floor(duration / 1000) + 's' : 'null',
      hasResult: !!status.lastResult,
      hasError: !!status.lastError,
      file: fileInfo
    })

    // Adicionar info do arquivo na resposta para debug
    status.fileInfo = fileInfo

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Erro ao verificar status da sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status'
    }, { status: 500 })
  }
}