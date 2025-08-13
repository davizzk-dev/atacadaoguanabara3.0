import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// POST - Upload de imagem para promoção
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageData, fileName, imageUrl } = body

    // Se foi fornecida uma URL, apenas validar e retornar
    if (imageUrl) {
      try {
        new URL(imageUrl) // Validar se é uma URL válida
        console.log('✅ URL de imagem validada:', imageUrl)
        return NextResponse.json({
          success: true,
          data: {
            url: imageUrl,
            type: 'url'
          }
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'URL de imagem inválida'
        }, { status: 400 })
      }
    }

    // Se foi fornecido base64, processar upload
    if (imageData) {
      // Validar formato base64
      if (!imageData.startsWith('data:image/')) {
        return NextResponse.json({
          success: false,
          error: 'Formato de imagem inválido. Use base64 válido.'
        }, { status: 400 })
      }

      // Extrair tipo de imagem e dados
      const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({
          success: false,
          error: 'Formato base64 inválido'
        }, { status: 400 })
      }

      const imageType = matches[1]
      const base64Data = matches[2]

      // Validar tipos de imagem permitidos
      const allowedTypes = ['jpeg', 'jpg', 'png', 'webp']
      if (!allowedTypes.includes(imageType.toLowerCase())) {
        return NextResponse.json({
          success: false,
          error: 'Tipo de imagem não permitido. Use: JPEG, PNG ou WebP'
        }, { status: 400 })
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 15)
      const fileExtension = imageType === 'jpeg' ? 'jpg' : imageType
      const uniqueFileName = fileName 
        ? `${fileName.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExtension}`
        : `promotion_${timestamp}_${randomStr}.${fileExtension}`

      // Diretório para salvar imagens
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'promotions')
      
      // Criar diretório se não existir
      try {
        await fs.access(uploadsDir)
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true })
      }

      // Caminho completo do arquivo
      const filePath = path.join(uploadsDir, uniqueFileName)

      // Converter base64 para buffer e salvar
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Verificar tamanho do arquivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (buffer.length > maxSize) {
        return NextResponse.json({
          success: false,
          error: 'Imagem muito grande. Máximo permitido: 5MB'
        }, { status: 400 })
      }

      await fs.writeFile(filePath, buffer)

      // URL para acessar a imagem
      const imageUrl = `/uploads/promotions/${uniqueFileName}`

      console.log('✅ Imagem de promoção salva:', {
        fileName: uniqueFileName,
        size: `${(buffer.length / 1024).toFixed(2)}KB`,
        type: imageType
      })

      return NextResponse.json({
        success: true,
        data: {
          url: imageUrl,
          fileName: uniqueFileName,
          size: buffer.length,
          type: 'upload'
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Forneça imageData (base64) ou imageUrl'
    }, { status: 400 })

  } catch (error: any) {
    console.error('❌ Erro no upload de imagem:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// DELETE - Remover imagem de promoção
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: 'Nome do arquivo é obrigatório'
      }, { status: 400 })
    }

    // Validar se o arquivo está no diretório correto
    if (!fileName.includes('promotion_') && !fileName.includes('_promotion')) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não é uma imagem de promoção válida'
      }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'promotions', fileName)

    try {
      await fs.access(filePath)
      await fs.unlink(filePath)
      
      console.log('✅ Imagem de promoção removida:', fileName)
      
      return NextResponse.json({
        success: true,
        message: 'Imagem removida com sucesso'
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não encontrado'
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('❌ Erro ao remover imagem:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
