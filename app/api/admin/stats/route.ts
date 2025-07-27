import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const productsPath = join(process.cwd(), 'data', 'products.json')
const ordersPath = join(process.cwd(), 'data', 'orders.json')
const usersPath = join(process.cwd(), 'data', 'users.json')
const cameraRequestsPath = join(process.cwd(), 'data', 'camera-requests.json')
const feedbackPath = join(process.cwd(), 'data', 'feedback.json')

// Função para garantir que o arquivo existe
function ensureDataFile(filePath: string, defaultData: any[] = []) {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2))
  }
}

// Função para ler dados de um arquivo
function readDataFile(filePath: string, defaultData: any[] = []) {
  try {
    ensureDataFile(filePath, defaultData)
    const data = readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error)
    return defaultData
  }
}

// GET - Obter estatísticas do dashboard
export async function GET() {
  try {
    // Garantir que todos os arquivos existem
    ensureDataFile(productsPath, [])
    ensureDataFile(ordersPath, [])
    ensureDataFile(usersPath, [])
    ensureDataFile(cameraRequestsPath, [])
    ensureDataFile(feedbackPath, [])

    const products = readDataFile(productsPath)
    const orders = readDataFile(ordersPath)
    const users = readDataFile(usersPath)
    const cameraRequests = readDataFile(cameraRequestsPath)
    const feedback = readDataFile(feedbackPath)

    // Calcular estatísticas
    const totalProducts = products.length
    const totalOrders = orders.length
    const totalUsers = users.length
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const pendingCameraRequests = cameraRequests.filter((req: any) => req.status === 'pending').length
    const pendingFeedback = feedback.filter((f: any) => f.status === 'pending').length

    // Estatísticas por categoria
    const productsByCategory = products.reduce((acc: any, product: any) => {
      const category = product.category || 'Sem categoria'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Pedidos por status
    const ordersByStatus = orders.reduce((acc: any, order: any) => {
      const status = order.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Receita por mês (últimos 6 meses)
    const monthlyRevenue = []
    const currentDate = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
      })
      const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      monthlyRevenue.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: monthRevenue
      })
    }

    const stats = {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingCameraRequests,
      pendingFeedback,
      productsByCategory,
      ordersByStatus,
      monthlyRevenue
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 