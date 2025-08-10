'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import LineChart from './LineChart'
import BarChart from './BarChart'

interface AnalyticsData {
  orderStatus: {
    pending: number
    confirmed: number
    preparing: number
    delivering: number
    delivered: number
    cancelled: number
  }
  dailyOrders: Array<{
    date: string
    count: number
    revenue: number
  }>
  feedbackStatus: {
    pending: number
    reviewed: number
    resolved: number
  }
  cameraStatus: {
    pending: number
    processing: number
    completed: number
  }
  returnStatus: {
    pending: number
    approved: number
    rejected: number
    completed: number
  }
  totalOrders: number
  totalRevenue: number
  totalFeedbacks: number
  totalCameraRequests: number
  totalReturnRequests: number
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analytics/order-status')
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text()
          if (text && text.trim() !== '') {
            const data = JSON.parse(text)
            if (data.success) {
              setAnalyticsData(data.data)
              setLastUpdate(new Date())
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Analytics em Tempo Real</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
            <span className="text-sm text-gray-500">Carregando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Preparar dados para gráficos
  const orderStatusData = [
    { label: 'Pendente', value: analyticsData.orderStatus.pending, color: '#f59e0b' },
    { label: 'Confirmado', value: analyticsData.orderStatus.confirmed, color: '#3b82f6' },
    { label: 'Preparando', value: analyticsData.orderStatus.preparing, color: '#f97316' },
    { label: 'Entregando', value: analyticsData.orderStatus.delivering, color: '#8b5cf6' },
    { label: 'Entregue', value: analyticsData.orderStatus.delivered, color: '#10b981' },
    { label: 'Cancelado', value: analyticsData.orderStatus.cancelled, color: '#ef4444' }
  ]

  const dailyOrdersData = analyticsData.dailyOrders.slice(-7).map(item => ({
    label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: item.count
  }))

  const dailyRevenueData = analyticsData.dailyOrders.slice(-7).map(item => ({
    label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: item.revenue
  }))

  const feedbackStatusData = [
    { label: 'Pendente', value: analyticsData.feedbackStatus.pending, color: '#f59e0b' },
    { label: 'Revisado', value: analyticsData.feedbackStatus.reviewed, color: '#3b82f6' },
    { label: 'Resolvido', value: analyticsData.feedbackStatus.resolved, color: '#10b981' }
  ]

  const cameraStatusData = [
    { label: 'Pendente', value: analyticsData.cameraStatus.pending, color: '#f59e0b' },
    { label: 'Processando', value: analyticsData.cameraStatus.processing, color: '#3b82f6' },
    { label: 'Concluído', value: analyticsData.cameraStatus.completed, color: '#10b981' }
  ]

  const returnStatusData = [
    { label: 'Pendente', value: analyticsData.returnStatus.pending, color: '#f59e0b' },
    { label: 'Aprovado', value: analyticsData.returnStatus.approved, color: '#10b981' },
    { label: 'Rejeitado', value: analyticsData.returnStatus.rejected, color: '#ef4444' },
    { label: 'Concluído', value: analyticsData.returnStatus.completed, color: '#3b82f6' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics em Tempo Real</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <span className="text-xs text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {analyticsData.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Feedbacks</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalFeedbacks}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solicitações</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.totalCameraRequests + analyticsData.totalReturnRequests}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pedidos por status */}
        <BarChart
          data={orderStatusData}
          title="Pedidos por Status"
          height={300}
        />

        {/* Gráfico de pedidos diários */}
        <LineChart
          data={dailyOrdersData}
          title="Pedidos dos Últimos 7 Dias"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de receita diária */}
        <LineChart
          data={dailyRevenueData}
          title="Receita dos Últimos 7 Dias"
          height={300}
        />

        {/* Gráfico de status de feedback */}
        <BarChart
          data={feedbackStatusData}
          title="Status dos Feedbacks"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de solicitações de câmera */}
        <BarChart
          data={cameraStatusData}
          title="Status das Solicitações de Câmera"
          height={300}
        />

        {/* Gráfico de trocas/devoluções */}
        <BarChart
          data={returnStatusData}
          title="Status das Trocas/Devoluções"
          height={300}
        />
      </div>
    </div>
  )
}

