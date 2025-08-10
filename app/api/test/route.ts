import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando conexão com backend Java...')
    
    // Testar conexão com backend Java
    const response = await fetch('http://localhost:8080/api/admin/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Conexão com backend Java OK')
      return NextResponse.json({
        status: 'success',
        message: 'Conexão com backend Java funcionando',
        data: data
      })
    } else {
      console.log('❌ Backend Java retornou erro:', response.status)
      return NextResponse.json({
        status: 'error',
        message: `Backend Java retornou status ${response.status}`,
        error: response.statusText
      })
    }
      } catch (error: any) {
      console.error('❌ Erro ao conectar com backend Java:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao conectar com backend Java',
        error: error.message
      })
    }
} 