import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { withAPIProtection } from '@/lib/auth-middleware'

const dataDir = join(process.cwd(), 'data')
const feedbackPath = join(dataDir, 'feedback.json')
const usersPath = join(dataDir, 'users.json')
const ordersPath = join(dataDir, 'orders.json')

async function handleGET(request: NextRequest) {
  try {
    console.log('[API/admin/feedback][GET] chamada recebida')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // pending, reviewed, resolved
    const rating = searchParams.get('rating') // 1-5
    const type = searchParams.get('type') // sugestao, reclamacao, elogio, etc
    const limit = searchParams.get('limit')
    const userId = searchParams.get('userId')
    
    // Verificar se arquivos existem
    if (!existsSync(feedbackPath)) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        stats: {
          total: 0,
          pending: 0,
          reviewed: 0,
          resolved: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          typeDistribution: {}
        }
      })
    }
    
    // Ler dados
    const feedbackData = JSON.parse(readFileSync(feedbackPath, 'utf-8'))
    let usersData = []
    let ordersData = []
    
    try {
      if (existsSync(usersPath)) {
        usersData = JSON.parse(readFileSync(usersPath, 'utf-8'))
      }
      if (existsSync(ordersPath)) {
        ordersData = JSON.parse(readFileSync(ordersPath, 'utf-8'))
      }
    } catch (error) {
      console.warn('Erro ao ler dados auxiliares:', error)
    }
    
    // Processar feedbacks com informações dos usuários
    let processedFeedbacks = feedbackData.map((feedback: any) => {
      const user = feedback.userId ? usersData.find((u: any) => u.id === feedback.userId) : null
      const userOrders = feedback.userId ? ordersData.filter((o: any) => o.userId === feedback.userId) : []
      
      return {
        ...feedback,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          totalOrders: userOrders.length,
          totalSpent: userOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        } : null,
        isRegisteredUser: !!user,
        orderHistory: userOrders.length
      }
    })
    
    // Aplicar filtros
    if (status) {
      processedFeedbacks = processedFeedbacks.filter((f: any) => f.status === status)
    }
    
    if (rating) {
      const ratingNum = parseInt(rating)
      processedFeedbacks = processedFeedbacks.filter((f: any) => f.rating === ratingNum)
    }
    
    if (type) {
      processedFeedbacks = processedFeedbacks.filter((f: any) => f.type === type)
    }
    
    if (userId) {
      processedFeedbacks = processedFeedbacks.filter((f: any) => f.userId === userId)
    }
    
    // Ordenar por data (mais recentes primeiro)
    processedFeedbacks.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    // Aplicar limite
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum) && limitNum > 0) {
        processedFeedbacks = processedFeedbacks.slice(0, limitNum)
      }
    }
    
    // Calcular estatísticas
    const allFeedbacks = feedbackData
    const stats = {
      total: allFeedbacks.length,
      pending: allFeedbacks.filter((f: any) => f.status === 'pending').length,
      reviewed: allFeedbacks.filter((f: any) => f.status === 'reviewed').length,
      resolved: allFeedbacks.filter((f: any) => f.status === 'resolved').length,
      averageRating: allFeedbacks.length > 0 
        ? (allFeedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1)
        : 0,
      ratingDistribution: {
        1: allFeedbacks.filter((f: any) => f.rating === 1).length,
        2: allFeedbacks.filter((f: any) => f.rating === 2).length,
        3: allFeedbacks.filter((f: any) => f.rating === 3).length,
        4: allFeedbacks.filter((f: any) => f.rating === 4).length,
        5: allFeedbacks.filter((f: any) => f.rating === 5).length,
      },
      typeDistribution: allFeedbacks.reduce((acc: any, f: any) => {
        acc[f.type] = (acc[f.type] || 0) + 1
        return acc
      }, {}),
      registeredUsers: allFeedbacks.filter((f: any) => f.userId).length,
      anonymousUsers: allFeedbacks.filter((f: any) => f.isAnonymous || !f.userId).length,
      recentFeedbacks: allFeedbacks.filter((f: any) => {
        const feedbackDate = new Date(f.createdAt)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return feedbackDate >= sevenDaysAgo
      }).length
    }
    
    console.log(`[API/admin/feedback][GET] Retornando ${processedFeedbacks.length} feedbacks de ${allFeedbacks.length} total`)
    
    return NextResponse.json({ 
      success: true, 
      data: processedFeedbacks,
      stats: stats,
      filters: {
        status: status || 'all',
        rating: rating || 'all',
        type: type || 'all',
        limit: limit || 'none'
      }
    })
  } catch (error: any) {
    console.error('[API/admin/feedback][GET] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/feedback/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID do feedback é obrigatório' }, { status: 400 })
    }
    
    // Conectar com o backend Java
    const response = await fetch(`http://localhost:8080/api/admin/feedback/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return NextResponse.json({ message: 'Feedback deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const GET = withAPIProtection(handleGET) 