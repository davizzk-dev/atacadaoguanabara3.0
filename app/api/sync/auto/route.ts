import { NextRequest, NextResponse } from 'next/server'
import { runAutoSync, checkAutoSync } from '@/lib/sync-service'

export async function GET(request: NextRequest) {
  try {
    const needsSync = await checkAutoSync()
    
    if (!needsSync) {
      return NextResponse.json({
        success: true,
        message: 'Sincronização automática não necessária neste momento',
        needsSync: false
      })
    }

    // Executar sincronização automática
    await runAutoSync()
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização automática executada com sucesso',
      needsSync: true
    })
  } catch (error) {
    console.error('Erro na sincronização automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na sincronização automática'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { force } = body

    if (force) {
      // Forçar sincronização mesmo se não for necessária
      await runAutoSync()
      return NextResponse.json({
        success: true,
        message: 'Sincronização forçada executada com sucesso'
      })
    } else {
      // Verificar se é necessária antes de executar
      return GET(request)
    }
  } catch (error) {
    console.error('Erro na sincronização automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na sincronização automática'
    }, { status: 500 })
  }
} 