import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Redirecionando para sincronização completa do Varejo Fácil...')
    
    // Chamar o endpoint de sincronização do Varejo Fácil
    const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync-varejo-facil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!syncResponse.ok) {
      throw new Error(`Erro na sincronização: ${syncResponse.status}`)
    }

    const syncData = await syncResponse.json()

    return NextResponse.json({
      success: true,
      ...syncData
    })

  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
