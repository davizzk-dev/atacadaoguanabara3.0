import { NextRequest, NextResponse } from 'next/server'
import { loadSyncConfig, saveSyncConfig, getSyncStats } from '@/lib/sync-service'
import { syncProducts } from '@/scripts/sync-products'

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
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'start-sync':
        // Iniciar sincronização manual
        const syncResult = await syncProducts()

        return NextResponse.json({
          success: syncResult.success,
          message: syncResult.message,
          totalProcessed: syncResult.totalProcessed
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