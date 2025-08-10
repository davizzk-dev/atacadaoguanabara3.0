import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/test-write iniciado')
  
  try {
    const body = await request.json()
    console.log('✅ Body recebido:', body)
    
    // Tentar escrever no arquivo
    const dataDir = path.join(process.cwd(), 'data')
    const testPath = path.join(dataDir, 'test-write.json')
    
    console.log('📁 Diretório:', dataDir)
    console.log('📄 Arquivo:', testPath)
    
    // Garantir que o diretório existe
    await fs.mkdir(dataDir, { recursive: true })
    console.log('✅ Diretório criado/verificado')
    
    // Escrever dados de teste
    const testData = {
      timestamp: new Date().toISOString(),
      data: body,
      success: true
    }
    
    await fs.writeFile(testPath, JSON.stringify(testData, null, 2))
    console.log('✅ Arquivo escrito com sucesso')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste de escrita funcionou!',
      data: testData
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de escrita:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

