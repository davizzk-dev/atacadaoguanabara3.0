import { NextRequest, NextResponse } from 'next/server'

import fs from 'fs'
import path from 'path'

function ensureDataFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

export async function GET(request: NextRequest) {
  try {
  const dataPath = path.join(process.cwd(), 'data')
  const ordersPath = path.join(dataPath, 'orders.json')
  const feedbacksPath = path.join(dataPath, 'feedback.json')
  const cameraRequestsPath = path.join(dataPath, 'camera-requests.json')
  const returnRequestsPath = path.join(dataPath, 'return-requests.json')

  // Garantir que todos os arquivos existem
  ensureDataFile(ordersPath)
  ensureDataFile(feedbacksPath)
  ensureDataFile(cameraRequestsPath)
  ensureDataFile(returnRequestsPath)

  // Carregar dados dos arquivos JSON
  const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'))
  const feedbacksData = JSON.parse(fs.readFileSync(feedbacksPath, 'utf8'))
  const cameraRequestsData = JSON.parse(fs.readFileSync(cameraRequestsPath, 'utf8'))
  const returnRequestsData = JSON.parse(fs.readFileSync(returnRequestsPath, 'utf8'))
    
    // Analytics de status de pedidos
    const orderStatusAnalytics = {
      pending: ordersData.filter((order: any) => order.status === 'pending').length,
      confirmed: ordersData.filter((order: any) => order.status === 'confirmed').length,
      preparing: ordersData.filter((order: any) => order.status === 'preparing').length,
      delivering: ordersData.filter((order: any) => order.status === 'delivering').length,
      delivered: ordersData.filter((order: any) => order.status === 'delivered').length,
      cancelled: ordersData.filter((order: any) => order.status === 'cancelled').length
    }
    
    // Analytics de pedidos por dia (últimos 30 dias)
    const dailyOrders = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      
      const dayOrders = ordersData.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= dayStart && orderDate < dayEnd
      })
      
      dailyOrders.push({
        date: date.toISOString().split('T')[0],
        count: dayOrders.length,
        revenue: dayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      })
    }
    
    // Analytics de feedback por status
    const feedbackStatusAnalytics = {
      pending: feedbacksData.filter((feedback: any) => feedback.status === 'pending').length,
      reviewed: feedbacksData.filter((feedback: any) => feedback.status === 'reviewed').length,
      resolved: feedbacksData.filter((feedback: any) => feedback.status === 'resolved').length
    }
    
    // Analytics de solicitações de câmera por status
    const cameraStatusAnalytics = {
      pending: cameraRequestsData.filter((request: any) => request.status === 'pending').length,
      processing: cameraRequestsData.filter((request: any) => request.status === 'processing').length,
      completed: cameraRequestsData.filter((request: any) => request.status === 'completed').length
    }
    
    // Analytics de trocas/devoluções por status
    const returnStatusAnalytics = {
      pending: returnRequestsData.filter((request: any) => request.status === 'pending').length,
      approved: returnRequestsData.filter((request: any) => request.status === 'approved').length,
      rejected: returnRequestsData.filter((request: any) => request.status === 'rejected').length,
      completed: returnRequestsData.filter((request: any) => request.status === 'completed').length
    }
    
    return NextResponse.json({
      success: true,
      data: {
        orderStatus: orderStatusAnalytics,
        dailyOrders,
        feedbackStatus: feedbackStatusAnalytics,
        cameraStatus: cameraStatusAnalytics,
        returnStatus: returnStatusAnalytics,
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        totalFeedbacks: feedbacksData.length,
        totalCameraRequests: cameraRequestsData.length,
        totalReturnRequests: returnRequestsData.length
      }
    })
  } catch (error) {
    console.error('Erro ao carregar analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados de analytics'
    }, { status: 500 })
  }
} 