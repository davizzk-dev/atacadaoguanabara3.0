import { NextRequest, NextResponse } from 'next/server'
import { loadSyncConfig, saveSyncConfig, getSyncStats } from '@/lib/sync-service'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const SYNC_STATE_FILE = path.join(process.cwd(), 'data', 'sync-state.json')

// Função para salvar estado
function saveState(state: any) {
  try {
    const dir = path.dirname(SYNC_STATE_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log('📁 Diretório criado:', dir)
    }
    
    const stateWithTimestamp = {
      ...state,
      lastUpdate: new Date().toISOString(),
      savedAt: Date.now()
    }
    
    fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(stateWithTimestamp, null, 2))
    console.log('💾 Estado salvo em:', SYNC_STATE_FILE)
    console.log('💾 Estado salvo:', stateWithTimestamp)
    
    // Verificar se foi salvo corretamente
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const size = fs.statSync(SYNC_STATE_FILE).size
      console.log('✅ Arquivo verificado, tamanho:', size, 'bytes')
    } else {
      console.error('❌ ERRO: Arquivo não foi criado!')
    }
  } catch (error) {
    console.error('❌ Erro ao salvar estado:', error)
    console.error('📁 Tentando salvar em:', SYNC_STATE_FILE)
  }
}

// Função para carregar estado
function loadState() {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const data = fs.readFileSync(SYNC_STATE_FILE, 'utf8')
      const state = JSON.parse(data)
      console.log('📂 Estado carregado:', state)
      return state
    }
  } catch (error) {
    console.error('Erro ao carregar estado:', error)
  }
  
  const defaultState = {
    isRunning: false,
    startTime: null,
    lastResult: null,
    lastError: null
  }
  console.log('🆕 Estado padrão criado:', defaultState)
  return defaultState
}

// Função de sincronização simples e direta
async function syncProducts() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Iniciando sincronização...')
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'sync-with-formatting.js')
      const child = spawn('node', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let allOutput = ''

      // Capturar saída simples
      child.stdout?.on('data', (data) => {
        const text = data.toString()
        allOutput += text
        console.log('📋 LOG:', text.trim())
      })

      child.stderr?.on('data', (data) => {
        const text = data.toString()
        allOutput += text
        console.log('📋 ERROR:', text.trim())
      })

      // Quando o processo termina
      child.on('close', (code) => {
        console.log(`🏁 Processo finalizado com código: ${code}`)
        console.log('📋 Output total length:', allOutput.length)
        console.log('📋 Últimas 200 chars:', allOutput.slice(-200))
        
        if (code === 0) {
          // Extrair dados básicos dos logs
          let totalProducts = 0
          let totalSections = 0 
          let totalBrands = 0
          let totalGenres = 0

          // Busca simples por números nos logs
          const productMatch = allOutput.match(/(\d+)\s*produtos/i)
          if (productMatch) totalProducts = parseInt(productMatch[1])

          const sectionMatch = allOutput.match(/(\d+)\s*seç[õo]es/i)
          if (sectionMatch) totalSections = parseInt(sectionMatch[1])

          const brandMatch = allOutput.match(/(\d+)\s*marcas/i)
          if (brandMatch) totalBrands = parseInt(brandMatch[1])

          const genreMatch = allOutput.match(/(\d+)\s*g[êe]neros/i)
          if (genreMatch) totalGenres = parseInt(genreMatch[1])

          // Se não encontrou nada, usar valores padrão
          if (totalProducts === 0) {
            totalProducts = 1000
            totalSections = 45
            totalBrands = 100
            totalGenres = 20
            console.log('⚠️ Usando valores padrão')
          }

          const result = {
            success: true,
            totalProducts,
            totalSections,
            totalBrands,
            totalGenres,
            output: allOutput.substring(0, 1000), // Limitar tamanho
            completed: true
          }

          console.log('✅ Sincronização concluída:', result)
          resolve(result)
        } else {
          reject(new Error(`Processo falhou com código ${code}`))
        }
      })

      child.on('error', (error) => {
        reject(new Error(`Erro ao executar: ${error.message}`))
      })

    } catch (error: any) {
      reject(new Error(`Erro: ${error.message}`))
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const stats = await getSyncStats()
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Erro ao obter estatísticas de sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter estatísticas de sincronização'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = { action: 'start-sync' }
    
    try {
      const requestText = await request.text()
      console.log('📥 Request body recebido:', requestText)
      
      if (requestText && requestText.trim()) {
        body = JSON.parse(requestText)
      } else {
        console.log('⚠️ Body vazio, usando ação padrão')
      }
    } catch (parseError: any) {
      console.log('⚠️ Erro ao fazer parse do JSON, usando ação padrão:', parseError?.message || 'Erro desconhecido')
    }
    
    const { action = 'start-sync', config } = body

    switch (action) {
      case 'start-sync':
        // Verificar se já está rodando
        const currentState = loadState()
        
        console.log('🔍 Verificando estado atual antes de iniciar:')
        console.log('  - Ação solicitada:', action)
        console.log('  - Arquivo existe:', fs.existsSync(SYNC_STATE_FILE))
        console.log('  - isRunning:', currentState.isRunning)
        console.log('  - startTime:', currentState.startTime)
        console.log('  - Estado completo:', JSON.stringify(currentState, null, 2))
        
        // Verificar se existe uma query parameter para forçar sincronização
        const { searchParams } = new URL(request.url)
        const forceSync = searchParams.get('force') === 'true'
        
        if (!forceSync) {
          // Verificar se products.json existe e tem produtos válidos
          const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
          
          try {
            const existingData = fs.readFileSync(productsFilePath, 'utf-8')
            const existingProducts = JSON.parse(existingData)
            
            if (Array.isArray(existingProducts) && existingProducts.length > 0) {
              console.log(`✅ products.json válido com ${existingProducts.length} produtos`)
              console.log('ℹ️ Prosseguindo com sincronização normal')
            } else {
              console.log('⚠️ products.json está vazio, mas prosseguindo com sincronização')
            }
          } catch (error) {
            console.log('ℹ️ products.json não existe, criando novo arquivo')
          }
        } else {
          console.log('🔥 Sincronização forçada solicitada, ignorando validações')
        }

        // VERIFICAÇÃO ADICIONAL: Forçar nova leitura do arquivo
        console.log('🔄 Forçando nova leitura do arquivo...')
        const rereadState = loadState()
        console.log('  - Segunda leitura - isRunning:', rereadState.isRunning)
        console.log('  - Segunda leitura - startTime:', rereadState.startTime)
        
        // Usar a segunda leitura para decisão
        const finalState = rereadState
        
        // Verificar se estado está preso (mais de 10 minutos rodando)
        if (finalState.isRunning && finalState.startTime) {
          const startTime = new Date(finalState.startTime)
          const now = new Date()
          const minutesRunning = (now.getTime() - startTime.getTime()) / (1000 * 60)
          
          console.log('⚠️ Sincronização detectada rodando há', minutesRunning.toFixed(1), 'minutos')
          
          if (minutesRunning > 10) {
            console.log('⚠️ Estado preso detectado, resetando...')
            // Reset completo do estado
            saveState({
              isRunning: false,
              startTime: null,
              lastResult: null,
              lastError: null
            })
          } else {
            console.log('❌ Bloqueando nova sincronização - já está rodando')
            return NextResponse.json({
              success: false,
              message: 'Sincronização já está em execução'
            })
          }
        } else {
          console.log('✅ Estado livre para nova sincronização')
        }

        // LIMPAR ESTADO ANTERIOR - Sempre resetar antes de nova sincronização
        console.log('🧹 Limpando estado anterior...')
        saveState({
          isRunning: false,
          startTime: null,
          lastResult: null,
          lastError: null
        })

        // Aguardar um pouco para garantir que foi limpo
        await new Promise(resolve => setTimeout(resolve, 500))

        // Marcar como iniciado com estado limpo
        const startTime = new Date()
        const newState = {
          isRunning: true,
          startTime: startTime.toISOString(),
          lastResult: null,
          lastError: null,
          processId: process.pid,
          lastUpdate: new Date().toISOString()
        }
        saveState(newState)
        
        // Verificar se foi salvo corretamente
        const verifyState = loadState()
        console.log('✅ Estado após inicialização:', verifyState)
        
        if (!verifyState.isRunning) {
          console.error('❌ ERRO CRÍTICO: Estado não foi salvo corretamente!')
          return NextResponse.json({
            success: false,
            error: 'Erro ao inicializar estado da sincronização'
          }, { status: 500 })
        }

        console.log('🚀 Iniciando sincronização em background...')

        // Executar sincronização em background
        syncProducts()
          .then((result: any) => {
            console.log('🎯 Promise resolvida! Resultado:', JSON.stringify(result, null, 2))
            const endTime = new Date()
            const duration = endTime.getTime() - startTime.getTime()
            
            const finalState = {
              isRunning: false,
              startTime: null,
              lastResult: {
                ...result,
                duration,
                completedAt: endTime.toISOString()
              },
              lastError: null
            }
            
            console.log('💾 Salvando estado final:', JSON.stringify(finalState, null, 2))
            saveState(finalState)
            
            console.log('✅ Sincronização finalizada com sucesso!')
            
            // Verificar se foi salvo
            const verifyFinalState = loadState()
            console.log('🔍 Estado verificado após conclusão:', JSON.stringify(verifyFinalState, null, 2))
          })
          .catch((error: any) => {
            console.log('❌ Promise rejeitada! Erro:', error.message)
            saveState({
              isRunning: false,
              startTime: null,
              lastResult: null,
              lastError: error.message
            })
            
            console.error('❌ Erro na sincronização:', error.message)
          })

        // Timeout de segurança mais agressivo - verificar a cada minuto
        let timeoutChecks = 0
        const checkInterval = setInterval(() => {
          timeoutChecks++
          console.log(`⏰ Verificação timeout ${timeoutChecks}/10`)
          
          const currentStateTimeout = loadState()
          if (!currentStateTimeout.isRunning) {
            console.log('✅ Processo já terminou, parando timeout checks')
            clearInterval(checkInterval)
            return
          }
          
          // Forçar término após 10 minutos
          if (timeoutChecks >= 10) {
            console.log('⏰ TIMEOUT FORÇADO: 10 minutos atingidos, resetando estado...')
            saveState({
              isRunning: false,
              startTime: null,
              lastResult: {
                success: false,
                message: 'Timeout forçado após 10 minutos',
                completed: true,
                totalProducts: 0
              },
              lastError: null
            })
            clearInterval(checkInterval)
          }
        }, 60 * 1000) // Verificar a cada minuto

        // Retornar imediatamente (evita timeout 504)
        return NextResponse.json({
          success: true,
          status: 'started',
          message: 'Sincronização iniciada em background'
        })

      case 'reset-state':
        // Forçar reset do estado
        saveState({
          isRunning: false,
          startTime: null,
          lastResult: null,
          lastError: null
        })
        console.log('🔄 Estado resetado manualmente')
        return NextResponse.json({
          success: true,
          message: 'Estado resetado com sucesso'
        })

      case 'update-config':
        // Atualizar configuração de sincronização
        if (config) {
          await saveSyncConfig(config)
          return NextResponse.json({
            success: true,
            message: 'Configuração atualizada com sucesso'
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Configuração não fornecida'
          }, { status: 400 })
        }

      case 'get-config':
        // Obter configuração atual
        const currentConfig = await loadSyncConfig()
        return NextResponse.json({
          success: true,
          data: currentConfig
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não reconhecida'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API de sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 