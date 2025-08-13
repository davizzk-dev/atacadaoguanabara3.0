import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filename = params.filename.join('/')
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    
    console.log(`📁 Tentando servir arquivo: ${filePath}`)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Determinar o tipo de conteúdo baseado na extensão
      const ext = path.extname(filename).toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
        case '.svg':
          contentType = 'image/svg+xml'
          break
      }
      
      console.log(`✅ Arquivo encontrado: ${filename} (${fileBuffer.length} bytes)`)
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
      
    } catch (fileError) {
      console.error(`❌ Arquivo não encontrado: ${filename}`, fileError)
      return NextResponse.json({
        error: 'Arquivo não encontrado',
        filename: filename
      }, { status: 404 })
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao servir arquivo:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 })
  }
}
