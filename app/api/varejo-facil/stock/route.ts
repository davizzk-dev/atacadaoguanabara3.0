import { NextRequest, NextResponse } from 'next/server'

const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

// Função para fazer requisições para a API do Varejo Fácil
async function makeVarejoFacilRequest(endpoint: string, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  try {
    console.log(`🔍 Stock API: Fazendo requisição para: ${url}`)
    const response = await fetch(url, config)
    
    console.log(`📊 Stock API: Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Stock API: Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json()
      console.log('✅ Stock API: Resposta JSON válida!')
      return json
    } else {
      const text = await response.text()
      console.log(`📋 Stock API: Resposta (primeiros 500 chars): ${text.substring(0, 500)}`)
      return text
    }
  } catch (error) {
    console.error(`❌ Stock API: Erro na requisição para ${endpoint}:`, error.message)
    throw error
  }
}

// GET - Buscar saldos de estoque
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sort = searchParams.get('sort')
    const start = searchParams.get('start') || '0'
    const count = searchParams.get('count') || '100'

    const params = new URLSearchParams()
    if (q) params.append('q', q)
    if (sort) params.append('sort', sort)
    params.append('start', start)
    params.append('count', count)

    console.log('🔍 Buscando saldos de estoque do Varejo Fácil com params:', Object.fromEntries(params))
    
    const response = await makeVarejoFacilRequest(`/api/v1/estoque/saldos?${params}`)
    
    console.log('✅ Saldos de estoque encontrados:', response.items?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar saldos de estoque do Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Criar lote para geração do saldo de estoque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔍 Criando lote para geração do saldo de estoque:', body)
    
    const response = await makeVarejoFacilRequest('/api/v1/estoque/saldos/lote', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    
    console.log('✅ Lote criado com sucesso')
    
    return NextResponse.json({
      success: true,
      data: response
    }, { status: 202 })
  } catch (error: any) {
    console.error('❌ Erro ao criar lote de estoque do Varejo Fácil:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
