import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BANNERS_FILE = path.join(process.cwd(), 'data', 'banners.json')

// Garantir que o diretório existe
const ensureDataDir = () => {
  const dataDir = path.dirname(BANNERS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Carregar banners
const loadBanners = () => {
  try {
    ensureDataDir()
    if (fs.existsSync(BANNERS_FILE)) {
      const data = fs.readFileSync(BANNERS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Erro ao carregar banners:', error)
  }
  
  // Retornar banners padrão se não existir o arquivo
  return {
    hero: {
      title: "Atacadão Guanabara",
      subtitle: "Os melhores produtos com preços que cabem no seu bolso",
      image: "/images/hero-banner.jpg",
      isActive: true
    },
    promotional: [
      {
        id: 1,
        title: "Super Ofertas da Semana!",
        subtitle: "Até 40% OFF em produtos selecionados",
        image: "/images/promotional-banner.jpg",
        link: "/catalog",
        isActive: true
      }
    ]
  }
}

// Salvar banners
const saveBanners = (banners: any) => {
  try {
    ensureDataDir()
    fs.writeFileSync(BANNERS_FILE, JSON.stringify(banners, null, 2))
    return true
  } catch (error) {
    console.error('Erro ao salvar banners:', error)
    return false
  }
}

export async function GET() {
  try {
    const banners = loadBanners()
    return NextResponse.json({ success: true, banners })
  } catch (error) {
    console.error('Erro na API de banners:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { banners } = body

    if (!banners || typeof banners !== 'object') {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }

    const success = saveBanners(banners)
    if (success) {
      return NextResponse.json({ success: true, message: 'Banners atualizados com sucesso' })
    } else {
      return NextResponse.json({ success: false, error: 'Erro ao salvar banners' }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na API de banners:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
