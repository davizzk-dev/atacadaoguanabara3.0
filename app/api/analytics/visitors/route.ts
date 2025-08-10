import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json')

async function ensureAnalyticsFile() {
  const dir = path.dirname(analyticsPath)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error('Erro ao criar diretório:', error)
  }

  try {
    await fs.access(analyticsPath)
  } catch {
    await fs.writeFile(analyticsPath, JSON.stringify({
      visitors: [],
      dailyStats: {},
      monthlyStats: {},
      yearlyStats: {}
    }, null, 2))
  }
}

// POST - Registrar nova visita
export async function POST(request: NextRequest) {
  try {
    await ensureAnalyticsFile()
    const body = await request.json()
    const { userAgent, ip, referrer, page } = body

    const data = await fs.readFile(analyticsPath, 'utf-8')
    const analytics = JSON.parse(data)

    const visit = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      ip: ip || 'Unknown',
      referrer: referrer || 'Direct',
      page: page || '/',
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent)
    }

    analytics.visitors.push(visit)

    // Atualizar estatísticas diárias
    const today = new Date().toISOString().split('T')[0]
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = {
        total: 0,
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        browsers: {},
        pages: {}
      }
    }
    analytics.dailyStats[today].total++
    analytics.dailyStats[today].devices[visit.device]++
    analytics.dailyStats[today].browsers[visit.browser] = (analytics.dailyStats[today].browsers[visit.browser] || 0) + 1
    analytics.dailyStats[today].pages[visit.page] = (analytics.dailyStats[today].pages[visit.page] || 0) + 1

    // Atualizar estatísticas mensais
    const month = new Date().toISOString().slice(0, 7)
    if (!analytics.monthlyStats[month]) {
      analytics.monthlyStats[month] = {
        total: 0,
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        browsers: {},
        pages: {}
      }
    }
    analytics.monthlyStats[month].total++
    analytics.monthlyStats[month].devices[visit.device]++
    analytics.monthlyStats[month].browsers[visit.browser] = (analytics.monthlyStats[month].browsers[visit.browser] || 0) + 1
    analytics.monthlyStats[month].pages[visit.page] = (analytics.monthlyStats[month].pages[visit.page] || 0) + 1

    // Atualizar estatísticas anuais
    const year = new Date().getFullYear().toString()
    if (!analytics.yearlyStats[year]) {
      analytics.yearlyStats[year] = {
        total: 0,
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        browsers: {},
        pages: {}
      }
    }
    analytics.yearlyStats[year].total++
    analytics.yearlyStats[year].devices[visit.device]++
    analytics.yearlyStats[year].browsers[visit.browser] = (analytics.yearlyStats[year].browsers[visit.browser] || 0) + 1
    analytics.yearlyStats[year].pages[visit.page] = (analytics.yearlyStats[year].pages[visit.page] || 0) + 1

    await fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2))

    return NextResponse.json({ success: true, visit })
  } catch (error) {
    console.error('Erro ao registrar visita:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Obter estatísticas de visitantes
export async function GET(request: NextRequest) {
  try {
    await ensureAnalyticsFile()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // all, daily, monthly, yearly

    const data = await fs.readFile(analyticsPath, 'utf-8')
    const analytics = JSON.parse(data)

    let stats
    switch (period) {
      case 'daily':
        stats = analytics.dailyStats
        break
      case 'monthly':
        stats = analytics.monthlyStats
        break
      case 'yearly':
        stats = analytics.yearlyStats
        break
      default:
        stats = {
          total: analytics.visitors.length,
          devices: getDeviceStats(analytics.visitors),
          browsers: getBrowserStats(analytics.visitors),
          pages: getPageStats(analytics.visitors),
          recent: analytics.visitors.slice(-10)
        }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function detectDevice(userAgent: string): string {
  if (!userAgent) return 'desktop'
  
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const tablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)
  
  if (tablet) return 'tablet'
  if (mobile) return 'mobile'
  return 'desktop'
}

function detectBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  
  return 'Other'
}

function getDeviceStats(visitors: any[]) {
  const stats = { desktop: 0, mobile: 0, tablet: 0 }
  visitors.forEach(visit => {
    stats[visit.device as keyof typeof stats]++
  })
  return stats
}

function getBrowserStats(visitors: any[]) {
  const stats: Record<string, number> = {}
  visitors.forEach(visit => {
    stats[visit.browser] = (stats[visit.browser] || 0) + 1
  })
  return stats
}

function getPageStats(visitors: any[]) {
  const stats: Record<string, number> = {}
  visitors.forEach(visit => {
    stats[visit.page] = (stats[visit.page] || 0) + 1
  })
  return stats
} 