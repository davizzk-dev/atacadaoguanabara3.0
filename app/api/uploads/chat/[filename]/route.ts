import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'chat', filename)
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath)
    } catch {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }
    
    // Ler o arquivo
    const fileBuffer = await fs.readFile(filePath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.wav':
        contentType = 'audio/wav'
        break
      case '.mp3':
        contentType = 'audio/mpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
    }
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}
