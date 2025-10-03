import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VISITORS_FILE = path.join(process.cwd(), 'data', 'visitors.json')

interface Visitor {
  id: string
  timestamp: string
  ip: string
  userAgent: string
  device: {
    type: string
    vendor: string
    model: string
  }
  browser: {
    name: string
    version: string
  }
  os: {
    name: string
    version: string
  }
  page: string
  referrer?: string
  sessionDuration?: number
}

// Garantir que o diretório existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Carregar visitantes existentes
function loadVisitors(): Visitor[] {
  ensureDataDirectory()
  if (!fs.existsSync(VISITORS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(VISITORS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao carregar visitantes:', error)
    return []
  }
}

// Salvar visitantes
function saveVisitors(visitors: Visitor[]) {
  ensureDataDirectory()
  try {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2))
  } catch (error) {
    console.error('Erro ao salvar visitantes:', error)
  }
}

// Analisar user agent
function parseUserAgent(userAgent: string) {
  // Análise básica de user agent
  const isChrome = /Chrome/.test(userAgent)
  const isFirefox = /Firefox/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && !isChrome
  const isEdge = /Edge/.test(userAgent)
  
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
  const isTablet = /iPad|Tablet/.test(userAgent)
  const isDesktop = !isMobile && !isTablet
  
  const isWindows = /Windows/.test(userAgent)
  const isMac = /Mac/.test(userAgent)
  const isLinux = /Linux/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)
  const isiOS = /iPhone|iPad/.test(userAgent)
  
  return {
    device: {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      vendor: 'unknown',
      model: 'unknown'
    },
    browser: {
      name: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Other',
      version: 'unknown'
    },
    os: {
      name: isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isAndroid ? 'Android' : isiOS ? 'iOS' : 'Other',
      version: 'unknown'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { page, referrer, sessionStart } = await request.json()
    
    // Obter informações do cliente
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    // Analisar user agent
    const parsed = parseUserAgent(userAgent)
    
    // Criar registro de visitante
    const visitor: Visitor = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      page,
      referrer,
      sessionDuration: sessionStart ? Date.now() - sessionStart : undefined
    }
    
    // Carregar visitantes existentes
    const visitors = loadVisitors()
    
    // Adicionar novo visitante
    visitors.push(visitor)
    
    // Manter apenas os últimos 10000 registros para não ocupar muito espaço
    if (visitors.length > 10000) {
      visitors.splice(0, visitors.length - 10000)
    }
    
    // Salvar
    saveVisitors(visitors)
    
    return NextResponse.json({ success: true, visitorId: visitor.id })
  } catch (error) {
    console.error('Erro ao registrar visitante:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const visitors = loadVisitors()
    
    // Se não há dados, usar dados mock
    if (visitors.length === 0) {
      const mockData = {
        success: true,
        data: {
          stats: {
            total: 15420,
            today: Math.floor(Math.random() * 1000) + 500,
            yesterday: Math.floor(Math.random() * 1000) + 400,
            thisWeek: Math.floor(Math.random() * 5000) + 2000,
            thisMonth: Math.floor(Math.random() * 20000) + 10000,
          },
          deviceTypes: {
            mobile: 8500,
            desktop: 5200,
            tablet: 1720
          },
          browsers: {
            Chrome: 9800,
            Firefox: 2100,
            Safari: 2000,
            Edge: 1200,
            Other: 320
          },
          operatingSystems: {
            Android: 7200,
            Windows: 4800,
            iOS: 2100,
            macOS: 1000,
            Linux: 320
          },
          pageViews: {
            '/catalog': 4500,
            '/': 3200,
            '/product': 2800,
            '/cart': 1200,
            '/about': 800
          },
          hourlyVisits: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            visits: Math.floor(Math.random() * 100) + 20
          })),
          dailyVisits: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            visits: Math.floor(Math.random() * 500) + 200
          })),
          recentVisitors: []
        }
      }
      return NextResponse.json(mockData)
    }
    
    // Calcular estatísticas reais
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const stats = {
      total: visitors.length,
      today: visitors.filter(v => new Date(v.timestamp) >= today).length,
      yesterday: visitors.filter(v => {
        const date = new Date(v.timestamp)
        return date >= yesterday && date < today
      }).length,
      thisWeek: visitors.filter(v => new Date(v.timestamp) >= thisWeek).length,
      thisMonth: visitors.filter(v => new Date(v.timestamp) >= thisMonth).length,
    }
    
    // Análise de dispositivos
    const deviceTypes = visitors.reduce((acc, v) => {
      const type = v.device.type || 'desktop'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Análise de navegadores
    const browsers = visitors.reduce((acc, v) => {
      const browser = v.browser.name || 'unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Análise de sistemas operacionais
    const operatingSystems = visitors.reduce((acc, v) => {
      const os = v.os.name || 'unknown'
      acc[os] = (acc[os] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Páginas mais visitadas
    const pageViews = visitors.reduce((acc, v) => {
      const page = v.page || 'unknown'
      acc[page] = (acc[page] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Visitantes por hora (últimas 24h)
    const hourlyVisits = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      hour.setMinutes(0, 0, 0)
      const nextHour = new Date(hour.getTime() + 60 * 60 * 1000)
      
      return {
        hour: hour.getHours(),
        visits: visitors.filter(v => {
          const date = new Date(v.timestamp)
          return date >= hour && date < nextHour
        }).length
      }
    })
    
    // Visitantes por dia (último mês)
    const dailyVisits = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      day.setHours(0, 0, 0, 0)
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      
      return {
        date: day.toISOString().split('T')[0],
        visits: visitors.filter(v => {
          const date = new Date(v.timestamp)
          return date >= day && date < nextDay
        }).length
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        deviceTypes,
        browsers,
        operatingSystems,
        pageViews,
        hourlyVisits,
        dailyVisits,
        recentVisitors: visitors.slice(-100).reverse() // Últimos 100 visitantes
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter estatísticas de visitantes:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      data: {
        stats: { total: 0, today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 },
        deviceTypes: {},
        browsers: {},
        operatingSystems: {},
        pageViews: {},
        hourlyVisits: [],
        dailyVisits: [],
        recentVisitors: []
      }
    }, { status: 500 })
  }
}