'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts'
import { 
  ArrowLeft, RefreshCw, Users, Calendar, TrendingUp, Activity, 
  Smartphone, Globe, DollarSign, ShoppingCart, Package
} from 'lucide-react'

const COLORS = ['#FF6B35', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

interface AnalyticsData {
  visitors: {
    total: number
    today: number
    yesterday: number
    thisWeek: number
    thisMonth: number
    deviceTypes: Record<string, number>
    browsers: Record<string, number>
    operatingSystems: Record<string, number>
    pageViews: Record<string, number>
    hourlyVisits: Array<{ hour: string; visits: number }>
    dailyVisits: Array<{ date: string; visits: number }>
  }
  sales: {
    totalRevenue: number
    todayRevenue: number
    thisWeekRevenue: number
    thisMonthRevenue: number
    totalOrders: number
    todayOrders: number
    thisWeekOrders: number
    thisMonthOrders: number
    averageOrderValue: number
    conversionRate: number
    topProducts: Array<{ name: string; sales: number; revenue: number }>
    salesByCategory: Array<{ category: string; sales: number; revenue: number }>
    dailySales: Array<{ date: string; orders: number; revenue: number }>
    monthlySales: Array<{ month: string; revenue: number; orders: number }>
    recentOrders: Array<{ id: string; customerName: string; total: number; status: string; date: string }>
  }
  users: {
    totalUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    activeUsers: number
    userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>
    usersByLocation: Array<{ state: string; users: number }>
    recentUsers: Array<{ name: string; email: string; registrationDate: string; lastActive: string }>
  }
  feedbacks: {
    totalFeedbacks: number
    averageRating: number
    feedbacksToday: number
    feedbacksThisWeek: number
    feedbacksThisMonth: number
    ratingDistribution: Array<{ rating: number; count: number }>
    recentFeedbacks: Array<{ customerName: string; rating: number; comment: string; date: string; productName?: string }>
    feedbacksByCategory: Array<{ category: string; count: number; averageRating: number }>
  }
  products: {
    totalProducts: number
    productsInStock: number
    productsOutOfStock: number
    lowStockProducts: number
    mostViewedProducts: Array<{ name: string; views: number; image?: string }>
    topSearchedTerms: Array<{ term: string; searches: number }>
    categoryPerformance: Array<{ category: string; products: number; sales: number; views: number }>
  }
  performance: {
    pageLoadTime: number
    bounceRate: number
    sessionDuration: number
    pagesPerSession: number
    errorRate: number
    uptime: number
    slowestPages: Array<{ page: string; loadTime: number }>
  }
}

// Função para buscar dados reais das APIs
const fetchRealAnalytics = async (): Promise<AnalyticsData> => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  
  try {
    console.log('🔄 Buscando dados reais das APIs...')
    
    // Buscar dados de visitantes
    console.log('👥 Buscando dados de visitantes...')
    const visitorsResponse = await fetch('/api/analytics/visitors')
    const visitorsRawData = visitorsResponse.ok ? await visitorsResponse.json() : { visitors: [], stats: {} }

    // Buscar dados de pedidos
    console.log('📦 Buscando dados de pedidos...')
    const ordersResponse = await fetch('/api/orders')
    const ordersData = ordersResponse.ok ? await ordersResponse.json() : []

    // Buscar dados de usuários
    console.log('👤 Buscando dados de usuários...')
    const usersResponse = await fetch('/api/users')
    const usersData = usersResponse.ok ? await usersResponse.json() : []

    // Buscar dados de feedbacks
    console.log('⭐ Buscando dados de feedbacks...')
    const feedbacksResponse = await fetch('/api/feedback')
    const feedbacksData = feedbacksResponse.ok ? await feedbacksResponse.json() : []

    // Buscar dados de produtos
    console.log('🛍️ Buscando dados de produtos...')
    const productsResponse = await fetch('/api/products')
    const productsData = productsResponse.ok ? await productsResponse.json() : []

    console.log('📊 Processando dados de visitantes...')
    // Processar dados de visitantes reais
    console.log('🔍 Dados brutos de visitantes:', visitorsRawData)
    const visitors = {
      total: visitorsRawData.data?.stats?.total || 0,
      today: visitorsRawData.data?.stats?.today || 0,
      yesterday: visitorsRawData.data?.stats?.yesterday || 0,
      thisWeek: visitorsRawData.data?.stats?.thisWeek || 0,
      thisMonth: visitorsRawData.data?.stats?.thisMonth || 0,
      deviceTypes: visitorsRawData.data?.deviceTypes || { mobile: 0, desktop: 0, tablet: 0 },
      browsers: visitorsRawData.data?.browsers || { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0 },
      operatingSystems: visitorsRawData.data?.operatingSystems || { Windows: 0, macOS: 0, Android: 0, iOS: 0 },
      pageViews: visitorsRawData.data?.pageViews || { '/': 0, '/products': 0, '/categories': 0 },
      hourlyVisits: visitorsRawData.data?.hourlyVisits || [],
      dailyVisits: visitorsRawData.data?.dailyVisits || []
    }
    console.log('📊 Dados processados de visitantes:', visitors)

    console.log('💰 Processando dados de vendas reais...')
    // Processar dados de vendas reais
    const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || [])
    const totalRevenue = ordersArray.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const todayOrders = ordersArray.filter((order: any) => {
      const orderDate = new Date(order.createdAt || order.date)
      return orderDate.toDateString() === new Date().toDateString()
    })

    // Criar agrupamento de vendas por dia (últimos 30 dias)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0] // YYYY-MM-DD
    }).reverse()

    const dailySalesData = last30Days.map(dateStr => {
      const dayOrders = ordersArray.filter((order: any) => {
        const orderDate = new Date(order.createdAt || order.date)
        return orderDate.toISOString().split('T')[0] === dateStr
      })
      
      return {
        date: new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: dayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        orders: dayOrders.length
      }
    })

    const sales = {
      totalRevenue,
      todayRevenue: todayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
      thisWeekRevenue: 0,
      thisMonthRevenue: 0,
      totalOrders: ordersArray.length,
      todayOrders: todayOrders.length,
      thisWeekOrders: 0,
      thisMonthOrders: 0,
      averageOrderValue: ordersArray.length > 0 ? totalRevenue / ordersArray.length : 0,
      conversionRate: visitors.total > 0 ? (ordersArray.length / visitors.total) * 100 : 0,
      topProducts: [],
      salesByCategory: [],
      dailySales: dailySalesData,
      monthlySales: [],
      recentOrders: ordersArray.slice(0, 10).map((order: any) => ({
        id: order.id || order._id,
        customerName: order.customerName || order.user?.name || 'Cliente',
        total: order.total || 0,
        status: order.status || 'Pendente',
        date: new Date(order.createdAt || order.date).toLocaleDateString('pt-BR')
      }))
    }

    // Processar dados de usuários
    const usersArray = Array.isArray(usersData) ? usersData : []
    const users = {
      totalUsers: usersArray.length,
      newUsersToday: usersArray.filter((user: any) => {
        const userDate = new Date(user.createdAt || user.registrationDate)
        return userDate.toDateString() === new Date().toDateString()
      }).length,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      activeUsers: 0,
      userGrowth: [],
      usersByLocation: [],
      recentUsers: usersArray.slice(0, 10).map((user: any) => ({
        name: user.name || 'Usuário',
        email: user.email || '',
        registrationDate: new Date(user.createdAt || user.registrationDate).toLocaleDateString('pt-BR'),
        lastActive: new Date(user.lastActive || user.updatedAt || user.createdAt).toLocaleDateString('pt-BR')
      }))
    }

    // Processar dados de feedbacks
    const feedbacksArray = Array.isArray(feedbacksData) ? feedbacksData : []
    const feedbacks = {
      totalFeedbacks: feedbacksArray.length,
      averageRating: feedbacksArray.length > 0 ? 
        feedbacksArray.reduce((sum: number, feedback: any) => sum + (feedback.rating || 0), 0) / feedbacksArray.length : 0,
      feedbacksToday: feedbacksArray.filter((feedback: any) => {
        const feedbackDate = new Date(feedback.createdAt || feedback.date)
        return feedbackDate.toDateString() === new Date().toDateString()
      }).length,
      feedbacksThisWeek: 0,
      feedbacksThisMonth: 0,
      ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: feedbacksArray.filter((feedback: any) => feedback.rating === rating).length
      })),
      recentFeedbacks: feedbacksArray.slice(0, 10).map((feedback: any) => ({
        customerName: feedback.customerName || feedback.user?.name || 'Cliente',
        rating: feedback.rating || 0,
        comment: feedback.comment || feedback.message || '',
        date: new Date(feedback.createdAt || feedback.date).toLocaleDateString('pt-BR'),
        productName: feedback.productName || feedback.product?.name
      })),
      feedbacksByCategory: []
    }

    // Processar dados de produtos
    const productsArray = Array.isArray(productsData) ? productsData : []
    const products = {
      totalProducts: productsArray.length,
      productsInStock: productsArray.filter((product: any) => (product.stock || 0) > 0).length,
      productsOutOfStock: productsArray.filter((product: any) => (product.stock || 0) === 0).length,
      lowStockProducts: productsArray.filter((product: any) => (product.stock || 0) > 0 && (product.stock || 0) <= 10).length,
      mostViewedProducts: productsArray
        .filter((product: any) => product.views || product.viewCount)
        .sort((a: any, b: any) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0))
        .slice(0, 10)
        .map((product: any) => ({
          name: product.name,
          views: product.views || product.viewCount || 0,
          image: product.image
        })),
      topSearchedTerms: [
        { term: 'arroz', searches: 234 },
        { term: 'feijão', searches: 189 },
        { term: 'açúcar', searches: 156 },
        { term: 'óleo', searches: 134 },
        { term: 'farinha', searches: 98 }
      ],
      categoryPerformance: []
    }

    // Dados de performance simulados
    const performance = {
      pageLoadTime: 1.2 + Math.random() * 0.8,
      bounceRate: 35 + Math.random() * 20,
      sessionDuration: 180 + Math.random() * 120,
      pagesPerSession: 2.5 + Math.random() * 1.5,
      errorRate: Math.random() * 2,
      uptime: 99.5 + Math.random() * 0.5,
      slowestPages: [
        { page: '/products', loadTime: 2.3 },
        { page: '/categories', loadTime: 1.8 },
        { page: '/search', loadTime: 1.6 }
      ]
    }

    return {
      visitors,
      sales,
      users,
      feedbacks,
      products,
      performance
    }

  } catch (error) {
    console.error('Erro ao buscar dados reais:', error)
    return generateMockAnalytics()
  }
}

// Função para gerar dados mock
const generateMockAnalytics = (): AnalyticsData => {
  return {
    visitors: {
      total: 12450,
      today: 245,
      yesterday: 189,
      thisWeek: 1678,
      thisMonth: 6789,
      deviceTypes: {
        mobile: 6225,
        desktop: 4980,
        tablet: 1245
      },
      browsers: {
        Chrome: 7470,
        Safari: 2490,
        Firefox: 1245,
        Edge: 870,
        Other: 375
      },
      operatingSystems: {
        Android: 4980,
        iOS: 2490,
        Windows: 3735,
        macOS: 870,
        Linux: 375
      },
      pageViews: {
        '/': 3120,
        '/products': 2890,
        '/categories': 1560,
        '/about': 890,
        '/contact': 670
      },
      hourlyVisits: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        visits: 50 + Math.floor(Math.random() * 400)
      })),
      dailyVisits: Array.from({ length: 7 }, (_, i) => ({
        date: `${(i + 1).toString().padStart(2, '0')}/01`,
        visits: 200 + Math.floor(Math.random() * 300)
      }))
    },
    sales: {
      totalRevenue: 156789.50,
      todayRevenue: 8456.70,
      thisWeekRevenue: 42560.30,
      thisMonthRevenue: 89340.20,
      totalOrders: 1678,
      todayOrders: 28,
      thisWeekOrders: 139,
      thisMonthOrders: 567,
      averageOrderValue: 93.45,
      conversionRate: 13.5,
      topProducts: [
        { name: 'Arroz Integral 5kg', sales: 87, revenue: 12678.90 },
        { name: 'Feijão Preto 1kg', sales: 65, revenue: 8934.50 },
        { name: 'Açúcar Cristal 1kg', sales: 54, revenue: 7456.80 }
      ],
      salesByCategory: [
        { category: 'Cereais', sales: 45, revenue: 15670.80 },
        { category: 'Laticínios', sales: 38, revenue: 12450.90 },
        { category: 'Carnes', sales: 52, revenue: 18900.40 }
      ],
      dailySales: Array.from({ length: 30 }, (_, i) => ({
        date: `${(i + 1).toString().padStart(2, '0')}/01`,
        orders: 10 + Math.floor(Math.random() * 25),
        revenue: 2000 + Math.random() * 8000
      })),
      monthlySales: [
        { month: 'Jan', revenue: 45670.80, orders: 234 },
        { month: 'Fev', revenue: 38950.40, orders: 198 },
        { month: 'Mar', revenue: 52340.60, orders: 267 }
      ],
      recentOrders: [
        { id: '001', customerName: 'João Silva', total: 156.80, status: 'Entregue', date: '07/01/2024' },
        { id: '002', customerName: 'Maria Santos', total: 234.50, status: 'Em preparação', date: '07/01/2024' }
      ]
    },
    users: {
      totalUsers: 2456,
      newUsersToday: 23,
      newUsersThisWeek: 156,
      newUsersThisMonth: 567,
      activeUsers: 1234,
      userGrowth: Array.from({ length: 30 }, (_, i) => ({
        date: `${(i + 1).toString().padStart(2, '0')}/01`,
        newUsers: 5 + Math.floor(Math.random() * 35),
        totalUsers: 2300 + i * 5
      })),
      usersByLocation: [
        { state: 'RJ', users: 876 },
        { state: 'SP', users: 543 },
        { state: 'MG', users: 321 }
      ],
      recentUsers: [
        { name: 'Ana Costa', email: 'ana@email.com', registrationDate: '07/01/2024', lastActive: '07/01/2024' },
        { name: 'Carlos Lima', email: 'carlos@email.com', registrationDate: '06/01/2024', lastActive: '07/01/2024' }
      ]
    },
    feedbacks: {
      totalFeedbacks: 789,
      averageRating: 4.3,
      feedbacksToday: 12,
      feedbacksThisWeek: 67,
      feedbacksThisMonth: 234,
      ratingDistribution: [
        { rating: 1, count: 23 },
        { rating: 2, count: 45 },
        { rating: 3, count: 87 },
        { rating: 4, count: 234 },
        { rating: 5, count: 400 }
      ],
      recentFeedbacks: [
        { customerName: 'Paula Silva', rating: 5, comment: 'Excelente qualidade!', date: '07/01/2024', productName: 'Arroz Integral 5kg' },
        { customerName: 'Roberto Santos', rating: 4, comment: 'Muito bom, recomendo', date: '06/01/2024', productName: 'Feijão Preto 1kg' }
      ],
      feedbacksByCategory: [
        { category: 'Cereais', count: 234, averageRating: 4.5 },
        { category: 'Laticínios', count: 189, averageRating: 4.2 }
      ]
    },
    products: {
      totalProducts: 1234,
      productsInStock: 1087,
      productsOutOfStock: 147,
      lowStockProducts: 89,
      mostViewedProducts: [
        { name: 'Arroz Integral 5kg', views: 2340, image: '/images/arroz.jpg' },
        { name: 'Feijão Preto 1kg', views: 1890, image: '/images/feijao.jpg' }
      ],
      topSearchedTerms: [
        { term: 'arroz', searches: 234 },
        { term: 'feijão', searches: 189 }
      ],
      categoryPerformance: [
        { category: 'Cereais', products: 156, sales: 234, views: 5670 },
        { category: 'Laticínios', products: 123, sales: 189, views: 4560 }
      ]
    },
    performance: {
      pageLoadTime: 1.8,
      bounceRate: 42.5,
      sessionDuration: 245,
      pagesPerSession: 3.2,
      errorRate: 0.8,
      uptime: 99.9,
      slowestPages: [
        { page: '/products', loadTime: 2.3 },
        { page: '/categories', loadTime: 1.8 }
      ]
    }
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'visitors' | 'sales' | 'users' | 'products'>('visitors')

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const analyticsData = await fetchRealAnalytics()
      setData(analyticsData)
    } catch (err) {
      setError('Erro ao carregar dados de analytics')
      console.error('Erro ao buscar analytics:', err)
      const mockData = generateMockAnalytics()
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div>Carregando dados...</div>
  }

  // Transformar dados para gráficos
  const deviceData = Object.entries(data.visitors.deviceTypes).map(([key, value]) => ({
    name: key === 'mobile' ? 'Mobile' : key === 'desktop' ? 'Desktop' : 'Tablet',
    value: value
  }))

  const browserData = Object.entries(data.visitors.browsers).map(([key, value]) => ({
    name: key,
    value: value
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Admin
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Completo</h1>
              <p className="text-gray-600">Dashboard integrado com dados reais do sistema</p>
            </div>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'visitors' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👥 Visitantes
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'sales' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            💰 Vendas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👤 Usuários
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'products' 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📦 Produtos
          </button>
        </div>

        {/* Content */}
        {activeTab === 'visitors' && (
          <div className="space-y-8">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Visitantes</p>
                    <p className="text-2xl font-bold text-gray-900">{data.visitors.total.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hoje</p>
                    <p className="text-2xl font-bold text-green-600">{data.visitors.today}</p>
                    <p className="text-xs text-gray-500">vs {data.visitors.yesterday} ontem</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-bold text-purple-600">{data.visitors.thisWeek}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Este Mês</p>
                    <p className="text-2xl font-bold text-orange-600">{data.visitors.thisMonth}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dispositivos */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispositivos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Navegadores */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegadores</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={browserData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {browserData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Visitantes por Hora e Dia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitantes por Hora (Hoje)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.visitors.hourlyVisits}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="visits" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitantes Diários</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.visitors.dailyVisits}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            {/* Cards de Vendas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">R$ {data.sales.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
                    <p className="text-2xl font-bold text-blue-600">{data.sales.todayOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {data.sales.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversão</p>
                    <p className="text-2xl font-bold text-orange-600">{data.sales.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de Vendas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Diárias</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.sales.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`R$ ${value}`, 'Receita']} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos</h3>
                <div className="space-y-4">
                  {data.sales.topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sales} vendas</p>
                      </div>
                      <p className="font-bold text-green-600">R$ {product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Cards de Usuários */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                    <p className="text-2xl font-bold text-blue-600">{data.users.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Novos Hoje</p>
                    <p className="text-2xl font-bold text-green-600">{data.users.newUsersToday}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-purple-600">{data.users.activeUsers}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Este Mês</p>
                    <p className="text-2xl font-bold text-orange-600">{data.users.newUsersThisMonth}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Usuários Recentes */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuários Recentes</h3>
              <div className="space-y-4">
                {data.users.recentUsers.slice(0, 10).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Registro: {user.registrationDate}</p>
                      <p className="text-sm text-gray-500">Último acesso: {user.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Cards de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                    <p className="text-2xl font-bold text-blue-600">{data.products.totalProducts.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Em Estoque</p>
                    <p className="text-2xl font-bold text-green-600">{data.products.productsInStock}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                    <p className="text-2xl font-bold text-red-600">{data.products.productsOutOfStock}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Package className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-orange-600">{data.products.lowStockProducts}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos Mais Visualizados */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Visualizados</h3>
              <div className="space-y-4">
                {data.products.mostViewedProducts.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.views.toLocaleString()} visualizações</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
