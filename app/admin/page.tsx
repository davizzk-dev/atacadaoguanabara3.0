'use client'

import { useState, useEffect, ReactNode } from 'react'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  LogOut, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  MessageSquare, 
  Camera, 
  Star, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  MoreHorizontal, 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Activity, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Database, 
  Cpu, 
  Target, 
  CheckSquare, 
  Settings, 
  Palette, 
  History, 
  Zap, 
  Lock,
  Bell,
  Tag,
  Loader2,
  Upload,
  Link,
  Copy,
  RotateCcw,
  Save
} from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { generateSalesReportPDF, generateProductsPDF, generatePromotionsPDF, generateOrdersPDF, generateCustomersPDF } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingCameraRequests: number
  pendingFeedback: number
  productsByCategory: Record<string, number>
  ordersByStatus: Record<string, number>
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  productCategories: Array<{ name: string; value: number }>
  orderStatus: Array<{ name: string; value: number }>
}

interface CameraRequest {
  id: string
  name: string
  phone: string
  cause: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed'
  period?: string
  moment?: string
  rg?: string
  additionalInfo?: string
}

interface Feedback {
  id: string
  name: string
  email: string
  message: string
  rating: number
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved'
  isAnonymous: boolean
  type?: string
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  description: string
  inStock: boolean
  image?: string
  brand?: string
  unit?: string
  stock?: number
  tags?: string[]
  rating?: number
  reviews?: number
}

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
  orders: number
  totalSpent: number
  lastOrder: string | null
  isClient: boolean
}

interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  createdAt: string
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string | {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipCode?: string
      reference?: string
    }
  }
}

interface ProductPromotion {
  id: string
  productId: string
  productName: string
  originalPrice: number
  newPrice: number
  discount: number
  image: string
  isActive: boolean
  createdAt: Date
  validUntil?: Date
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingCameraRequests: 0,
    pendingFeedback: 0,
    productsByCategory: {},
    ordersByStatus: {},
    monthlyRevenue: [],
    productCategories: [],
    orderStatus: []
  })
  const [cameraRequests, setCameraRequests] = useState<CameraRequest[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [productPromotions, setProductPromotions] = useState<ProductPromotion[]>([])
  const [returnRequests, setReturnRequests] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [cameraDetail, setCameraDetail] = useState<CameraRequest | null>(null)
  const [returnDetail, setReturnDetail] = useState<any>(null)
  const [feedbackDetail, setFeedbackDetail] = useState<any | null>(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<ProductPromotion | null>(null)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [visitorStats, setVisitorStats] = useState<any>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all')
  const [reportPeriod, setReportPeriod] = useState('all')
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year'>('month')
  
  // Estados para o sistema Java
  const [javaSystemStatus, setJavaSystemStatus] = useState<any>(null)
  const [javaHealth, setJavaHealth] = useState<any>(null)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [isCheckingJava, setIsCheckingJava] = useState(false)
  
  // Estados para pesquisa e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Adicionar estado para notificações
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  // Adicionar estados para analytics
  const [salesTrends, setSalesTrends] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [quotationData, setQuotationData] = useState<any>(null)
  const [quotationLoading, setQuotationLoading] = useState(false)

  // Adicionar estados para dados dinâmicos do dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState({
    revenueGrowth: 0,
    userGrowth: 0,
    conversionRate: 0,
    systemUptime: 0,
    memoryUsage: 0,
    cpuUsage: 0
  })

  // Adicionar estado para logs de atividade
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    action: string;
    description: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
  }>>([]);

  // Adicionar estados para filtros e pesquisa
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Adicionar estado para mostrar/ocultar notificações
  const [showNotifications, setShowNotifications] = useState(false);

  // Função para alternar visibilidade das notificações
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Carregar dados
  useEffect(() => {
    loadData()
    checkJavaSystem()
    fetchAnalytics()
    fetchQuotationData()
    checkSystemAlerts()
    
    // Configurar intervalos para atualizações automáticas
    const interval = setInterval(() => {
      checkJavaSystem()
      checkSystemAlerts()
    }, 30000) // Verificar a cada 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  // Verificar sistema Java quando a aba sistema for selecionada
  useEffect(() => {
    if (activeTab === 'system') {
      checkJavaSystem();
    }
  }, [activeTab]);

  // Adicionar notificações automáticas baseadas nos dados
  useEffect(() => {
    if (stats) {
      if (stats.pendingCameraRequests > 0) {
        addNotification('warning', `${stats.pendingCameraRequests} solicitações de câmera pendentes`);
      }
      if (stats.pendingFeedback > 0) {
        addNotification('info', `${stats.pendingFeedback} feedbacks aguardando revisão`);
      }
    }
  }, [stats]);

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Iniciando carregamento de dados...')
      
      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/stats')
      console.log('📊 Resposta da API stats:', statsResponse.status)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('📊 Dados de stats recebidos:', statsData)
        setStats(statsData)
        
        // Calcular métricas dinâmicas
        const metrics = {
          revenueGrowth: statsData.totalRevenue > 0 ? Math.round((statsData.totalRevenue / 15000 - 1) * 100) : 0,
          userGrowth: statsData.totalUsers > 0 ? Math.round((statsData.totalUsers / 1000 - 1) * 100) : 0,
          conversionRate: statsData.totalOrders > 0 && statsData.totalUsers > 0 ? 
            Math.round((statsData.totalOrders / statsData.totalUsers) * 100 * 10) / 10 : 0,
          systemUptime: 99.9,
          memoryUsage: 45,
          cpuUsage: 25
        }
        console.log('📈 Métricas calculadas:', metrics)
        setDashboardMetrics(metrics)
      } else {
        console.error('❌ Erro ao carregar stats:', statsResponse.status)
      }

      // Carregar solicitações de câmera
      const cameraResponse = await fetch('/api/admin/camera-requests')
      if (cameraResponse.ok) {
        const cameraData = await cameraResponse.json()
        setCameraRequests(cameraData)
      }

      // Carregar feedback
      const feedbackResponse = await fetch('/api/admin/feedback')
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json()
        setFeedback(feedbackData)
      }

      // Carregar produtos
      const productsResponse = await fetch('/api/admin/products')
      console.log('📦 Resposta da API produtos:', productsResponse.status)
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        console.log('📦 Produtos carregados:', productsData.length)
        console.log('📦 Primeiros produtos:', productsData.slice(0, 3))
        setProducts(productsData)
      } else {
        console.error('❌ Erro ao carregar produtos:', productsResponse.status)
      }

      // Carregar usuários
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Carregar pedidos (API específica para admin)
      try {
        const ordersResponse = await fetch('/api/admin/orders')
        console.log('📋 Resposta da API admin/orders:', ordersResponse.status)
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          console.log('📋 Pedidos carregados:', ordersData.length)
          setOrders(ordersData)
        } else {
          console.error('❌ Erro ao carregar pedidos:', ordersResponse.status)
          setOrders([])
        }
      } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error)
        setOrders([])
      }

      // Carregar promoções de produtos
      const promotionsResponse = await fetch('/api/admin/product-promotions')
      console.log('Status da resposta de promoções:', promotionsResponse.status)
      if (promotionsResponse.ok) {
        const promotionsData = await promotionsResponse.json()
        console.log('Promoções carregadas:', promotionsData)
        setProductPromotions(promotionsData)
      } else {
        console.error('Erro ao carregar promoções:', promotionsResponse.status)
      }

      // Carregar solicitações de trocas e devoluções
      try {
        const returnsResponse = await fetch('http://localhost:8080/api/returns')
        console.log('Status da resposta de trocas/devoluções:', returnsResponse.status)
        if (returnsResponse.ok) {
          const returnsData = await returnsResponse.json()
          console.log('Solicitações de trocas/devoluções carregadas:', returnsData.length)
          setReturnRequests(returnsData)
        } else {
          console.error('Erro ao carregar solicitações de trocas/devoluções:', returnsResponse.status)
          setReturnRequests([])
        }
      } catch (error) {
        console.error('Erro ao carregar solicitações de trocas/devoluções:', error)
        setReturnRequests([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar status do sistema Java
  const checkJavaSystem = async () => {
    setIsCheckingJava(true)
    try {
      // Verificar status do sistema
      const systemResponse = await fetch('/api/proxy/java/admin/system-status')
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setJavaSystemStatus(systemData)
      }

      // Verificar saúde do sistema
      const healthResponse = await fetch('/api/proxy/java/admin/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setJavaHealth(healthData)
      }

      // Verificar status da migração
      const migrationResponse = await fetch('/api/proxy/java/migration/status')
      if (migrationResponse.ok) {
        const migrationData = await migrationResponse.json()
        setMigrationStatus(migrationData)
      }
    } catch (error) {
      console.error('Erro ao verificar sistema Java:', error)
      setJavaSystemStatus({ status: 'OFFLINE', error: 'Sistema Java não está rodando' })
      setJavaHealth({ status: 'UNHEALTHY', error: 'Não foi possível conectar' })
    } finally {
      setIsCheckingJava(false)
    }
  }

  const updateCameraRequestStatus = async (id: string, status: CameraRequest['status']) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/camera-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        addNotification('success', `Status da solicitação atualizado para ${status}`)
        loadData()
      } else {
        addNotification('error', 'Erro ao atualizar status da solicitação')
      }
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error)
      addNotification('error', 'Erro ao atualizar status da solicitação')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateFeedbackStatus = async (id: string, status: Feedback['status']) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        addNotification('success', `Status do feedback atualizado para ${status}`)
        loadData()
      } else {
        addNotification('error', 'Erro ao atualizar status do feedback')
      }
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error)
      addNotification('error', 'Erro ao atualizar status do feedback')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      
      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        ))
        addNotification('success', `Status do pedido atualizado para ${status}`)
        loadData()
        
        // Scroll para a seção de pedidos após atualização
        setTimeout(() => {
          const ordersSection = document.getElementById('orders-section')
          if (ordersSection) {
            ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        addNotification('error', 'Erro ao atualizar status do pedido')
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error)
      addNotification('error', 'Erro ao atualizar status do pedido')
    } finally {
      setIsUpdating(false)
    }
  }



  const deletePromotion = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta promoção?')) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/product-promotions?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProductPromotions(prev => prev.filter(promotion => promotion.id !== id))
        loadData()
      }
    } catch (error) {
      console.error('Erro ao deletar promoção:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const saveProduct = async (productData: any) => {
    try {
      setIsUpdating(true)
      addNotification('info', editingProduct ? 'Atualizando produto...' : 'Criando produto...')
      
      console.log('💾 Salvando produto:', productData)
      
      if (editingProduct) {
        // Atualizar produto existente - preservar o ID original
        const updatedProduct = {
          ...productData,
          id: editingProduct.id // Garantir que o ID original seja preservado
        }
        
        console.log('🔄 Atualizando produto:', updatedProduct)
        
        const response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        })
        
        console.log('📊 Resposta da API (PUT):', response.status, response.statusText)
        
        if (response.ok) {
          let result
          try {
            result = await response.json()
            console.log('✅ Produto atualizado:', result)
          } catch (parseError) {
            console.warn('⚠️ Resposta não é JSON válido, mas operação foi bem-sucedida')
            result = { success: true }
          }
          
          setProducts(prev => prev.map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...productData, id: editingProduct.id }
              : p
          ))
          addNotification('success', 'Produto atualizado com sucesso!')
          addActivityLog('update', `Produto ${editingProduct.id} atualizado`, 'success')
        } else {
          let errorMessage = 'Erro ao atualizar produto'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse da resposta de erro:', parseError)
            errorMessage = `Erro ${response.status}: ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
      } else {
        // Criar novo produto - usar o ID fornecido pelo usuário
        const newProduct = {
          ...productData,
          rating: 0,
          reviews: 0,
          inStock: productData.inStock ?? true,
          stock: productData.stock || 0
        }
        
        console.log('📝 Criando novo produto:', newProduct)
        
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        })
        
        console.log('📊 Resposta da API (POST):', response.status, response.statusText)
        
        if (response.ok) {
          let result
          try {
            result = await response.json()
            console.log('✅ Produto criado:', result)
          } catch (parseError) {
            console.warn('⚠️ Resposta não é JSON válido, mas operação foi bem-sucedida')
            result = { success: true }
          }
          
          setProducts(prev => [...prev, newProduct])
          addNotification('success', `Produto criado com sucesso! ID: ${productData.id}`)
          addActivityLog('create', `Produto ${productData.id} criado`, 'success')
        } else {
          let errorMessage = 'Erro ao criar produto'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse da resposta de erro:', parseError)
            errorMessage = `Erro ${response.status}: ${response.statusText}`
          }
          throw new Error(errorMessage)
        }
      }
      
      setShowProductModal(false)
      setEditingProduct(null)
      // Recarregar dados para garantir sincronização
      loadData()
    } catch (error: any) {
      console.error('❌ Erro ao salvar produto:', error)
      addNotification('error', `Erro ao salvar produto: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return
    
    try {
      setIsUpdating(true)
      addNotification('info', 'Deletando produto...')
      
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        addNotification('success', 'Produto deletado com sucesso!')
        addActivityLog('delete', `Produto ${id} deletado`, 'success')
      } else {
        throw new Error('Erro ao deletar produto')
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      addNotification('error', 'Erro ao deletar produto')
    } finally {
      setIsUpdating(false)
    }
  }

  const syncProducts = async (direction: 'to-json' | 'to-data' | 'both') => {
    try {
      setIsUpdating(true)
      addNotification('info', 'Sincronizando produtos...')
      
      const response = await fetch('/api/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addNotification('success', `Produtos sincronizados com sucesso! ${result.count || ''} produtos processados.`)
          addActivityLog('sync', `Sincronização ${direction} realizada`, 'success')
          loadData() // Recarregar dados
        } else {
          addNotification('error', result.error || 'Erro na sincronização')
        }
      } else {
        let errorMessage = 'Erro na sincronização'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        addNotification('error', errorMessage)
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      addNotification('error', 'Erro na sincronização de produtos')
    } finally {
      setIsUpdating(false)
    }
  }

  const savePromotion = async (promotionData: any) => {
    setIsUpdating(true)
    try {
      console.log('Salvando promoção:', promotionData)
          console.log('💾 Salvando promoção...')
    console.log('🆔 Produto ID sendo salvo:', promotionData.productId)
    console.log('📝 Nome do produto sendo salvo:', promotionData.productName)
    console.log('💰 Preço original:', promotionData.originalPrice)
    console.log('🎯 Novo preço:', promotionData.newPrice)
    console.log('📊 Desconto:', promotionData.discount)
    console.log('🖼️ Imagem:', promotionData.image)
      
      const method = editingPromotion ? 'PUT' : 'POST'
      const url = '/api/admin/product-promotions'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })

      console.log('Resposta da API:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Promoção salva com sucesso:', result)
        
        alert(editingPromotion ? 'Promoção atualizada com sucesso!' : 'Promoção criada com sucesso!')
        setShowPromotionModal(false)
        setEditingPromotion(null)
        loadData()
      } else {
        const errorData = await response.json()
        console.error('Erro da API:', errorData)
        alert(`Erro ao salvar promoção: ${errorData.error || 'Tente novamente.'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar promoção:', error)
      alert('Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    // Simular logout
    window.location.href = '/'
  }

  // Funções para gerenciar solicitações de trocas e devoluções
  const updateReturnRequestStatus = async (id: number, status: string, adminNotes?: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          adminNotes: adminNotes || ''
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Atualizar a lista local
          setReturnRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: status, adminNotes: adminNotes } : req
          ))
          addNotification('success', 'Status atualizado com sucesso!')
        } else {
          addNotification('error', result.message || 'Erro ao atualizar status')
        }
      } else {
        addNotification('error', 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      addNotification('error', 'Erro ao atualizar status')
    }
  }

  const deleteReturnRequest = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta solicitação?')) return

    try {
      const response = await fetch(`http://localhost:8080/api/returns/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReturnRequests(prev => prev.filter(req => req.id !== id))
          addNotification('success', 'Solicitação deletada com sucesso!')
        } else {
          addNotification('error', result.message || 'Erro ao deletar solicitação')
        }
      } else {
        addNotification('error', 'Erro ao deletar solicitação')
      }
    } catch (error) {
      console.error('Erro ao deletar solicitação:', error)
      addNotification('error', 'Erro ao deletar solicitação')
    }
  }

  // Funções de filtro
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const filteredOrders = orders.filter(order => {
    return searchTerm === '' || 
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const filteredUsers = users.filter(user => {
    return searchTerm === '' || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredCameraRequests = cameraRequests.filter(request => {
    return searchTerm === '' || 
      request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.cause?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredFeedback = feedback.filter(item => {
    return searchTerm === '' || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Adicionar função de exportação CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para adicionar notificação
  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Manter apenas as 5 últimas
  };

  // Função para remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Função para buscar dados de analytics
  const fetchAnalytics = async (period: 'day' | 'month' | 'year' = chartPeriod) => {
    setAnalyticsLoading(true)
    try {
      console.log('🔍 Iniciando busca de dados de analytics...', { period })
      
      // Buscar dados reais dos pedidos
      const ordersResponse = await fetch('/api/admin/orders')
      let allOrders: any[] = []
      
      if (ordersResponse.ok) {
        allOrders = await ordersResponse.json()
        console.log('📦 Pedidos carregados:', allOrders.length)
      } else {
        console.log('⚠️ Erro ao carregar pedidos, usando dados do estado local')
        allOrders = orders // Usar dados do estado local se disponível
      }
      
      // Filtrar apenas pedidos entregues ou confirmados para faturamento
      const validOrders = allOrders.filter(order => 
        order.status === 'delivered' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivering'
      )
      
      const currentDate = new Date()
      const revenueData = []
      const ordersData = []
      
      let dataPoints = 0
      let dateKey = ''
      
      switch (period) {
        case 'day':
          dataPoints = 30 // Últimos 30 dias
          dateKey = 'day'
          break
        case 'month':
          dataPoints = 12 // Últimos 12 meses
          dateKey = 'month'
          break
        case 'year':
          dataPoints = 5 // Últimos 5 anos
          dateKey = 'year'
          break
      }
      
      for (let i = dataPoints - 1; i >= 0; i--) {
        let date: Date
        let startDate: Date
        let endDate: Date
        
        switch (period) {
          case 'day':
            date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i)
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
            endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
            break
          case 'month':
            date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
            startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
            break
          case 'year':
            date = new Date(currentDate.getFullYear() - i, 0, 1)
            startDate = new Date(date.getFullYear(), 0, 1, 0, 0, 0)
            endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59)
            break
        }
        
        let label = ''
        switch (period) {
          case 'day':
            label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            break
          case 'month':
            label = date.toLocaleDateString('pt-BR', { month: 'short' })
            break
          case 'year':
            label = date.getFullYear().toString()
            break
        }
        
        // Filtrar pedidos do período
        const periodOrders = validOrders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= startDate && orderDate <= endDate
        })
        
        // Calcular faturamento e número de pedidos do período
        const revenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        const ordersCount = periodOrders.length
        
        console.log(`📊 Período ${label}: ${ordersCount} pedidos, R$ ${revenue.toFixed(2)}`)
        
        revenueData.push({
          [dateKey]: label,
          revenue: revenue
        })
        
        ordersData.push({
          [dateKey]: label,
          total: ordersCount
        })
      }
      
      // Dados de categorias baseados nos produtos
      const categoryDistribution = Object.entries(stats?.productsByCategory || {}).map(([name, value]) => ({
        name,
        value: value as number
      }))
      
      // Dados de status baseados nos pedidos
      const orderStatus = Object.entries(stats?.ordersByStatus || {}).map(([name, value]) => ({
        name: name === 'pending' ? 'Pendente' : 
              name === 'confirmed' ? 'Confirmado' : 
              name === 'preparing' ? 'Preparando' : 
              name === 'delivering' ? 'Em Rota' : 
              name === 'delivered' ? 'Entregue' : 
              name === 'cancelled' ? 'Cancelado' : name,
        value: value as number
      }))
      
      const analyticsData = {
        monthlyRevenue: revenueData,
        monthlyOrders: ordersData,
        categoryDistribution,
        orderStatus,
        currentPeriod: period
      }
      
      console.log('📊 Dados de analytics gerados:', analyticsData)
      console.log('📈 Dados do gráfico:', analyticsData.monthlyRevenue)
      setAnalyticsData(analyticsData)
      addNotification('success', `Dados de analytics carregados com sucesso! (${validOrders.length} pedidos válidos)`)
      
    } catch (error) {
      console.error('❌ Erro ao buscar analytics:', error)
      addNotification('error', 'Erro ao carregar dados de analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }



  const fetchQuotationData = async () => {
    setQuotationLoading(true)
    try {
      const response = await fetch('/api/proxy/java/admin/analytics/quotation')
      
      if (response.ok) {
        const data = await response.json()
        setQuotationData(data)
        addNotification('success', 'Dados de cotação carregados com sucesso!')
      } else {
        addNotification('error', 'Erro ao carregar dados de cotação')
      }
    } catch (error) {
      console.error('Erro ao buscar cotação:', error)
      addNotification('error', 'Erro ao carregar dados de cotação')
    } finally {
      setQuotationLoading(false)
    }
  }

  const fetchVisitorStats = async (period: string = 'all') => {
    try {
      const response = await fetch(`/api/analytics/visitors?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setVisitorStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de visitantes:', error)
    }
  }

  // Carregar analytics quando o componente montar
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Carregar estatísticas de visitantes quando a aba analytics for selecionada
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchVisitorStats(analyticsPeriod);
    }
  }, [activeTab, analyticsPeriod]);

  // Função para adicionar log de atividade
  const addActivityLog = (action: string, description: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const log = {
      id: Date.now().toString(),
      action,
      description,
      timestamp: new Date(),
      type
    };
    setActivityLogs(prev => [log, ...prev.slice(0, 19)]); // Manter apenas os 20 últimos
  };

  // Função para simular alertas do sistema
  const checkSystemAlerts = () => {
    const alerts = [];
    
    if (stats && stats.totalOrders > 0 && stats.totalOrders < 10) {
      alerts.push('Baixo volume de pedidos detectado');
    }
    
    if (productPromotions.filter(p => p.isActive).length === 0) {
      alerts.push('Nenhuma promoção ativa no momento');
    }
    
    if (cameraRequests.filter(r => r.status === 'pending').length > 5) {
      alerts.push('Muitas solicitações de câmera pendentes');
    }
    
    return alerts;
  };

  // Função para filtrar e ordenar dados
  const filterAndSortData = (data: any[], type: 'products' | 'orders' | 'users') => {
    let filtered = data;

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (type === 'products') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (type === 'orders') {
          return item.id?.toString().includes(searchTerm) ||
                 item.status?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (type === 'users') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.email?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    // Aplicar filtros específicos
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'all' && type === 'products') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt || item.date);
        return itemDate >= filterDate;
      });
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
          </div>
        </main>
        <Footer />
          </div>
  )
}

// Componente do formulário de promoção
function PromotionForm({ 
  promotion, 
  products, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  promotion: ProductPromotion | null
  products: Product[]
  onSave: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  // Função para mostrar notificações bonitas
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    // Criar elemento de notificação
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="font-medium">${message}</span>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `
    document.body.appendChild(notification)
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, 5000)
  }
  const [formData, setFormData] = useState({
    productId: promotion?.productId || '',
    productName: promotion?.productName || '',
    originalPrice: promotion?.originalPrice?.toString() || '',
    newPrice: promotion?.newPrice?.toString() || '',
    image: promotion?.image || '',
    validUntil: promotion?.validUntil ? new Date(promotion.validUntil).toISOString().split('T')[0] : '',
    isActive: promotion?.isActive ?? true
  })

  console.log('🎯 Promoção recebida:', promotion)
  console.log('🖼️ Imagem inicial:', promotion?.image)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // useEffect para garantir que a imagem seja carregada quando uma promoção existente é editada
  useEffect(() => {
    if (promotion && promotion.image) {
      console.log('🖼️ Carregando imagem da promoção existente:', promotion.image)
      setFormData(prev => ({
        ...prev,
        image: promotion.image
      }))
    }
  }, [promotion])

  // Debug para verificar o estado do formData
  useEffect(() => {
    console.log('📋 Estado atual do formData:', formData)
  }, [formData])

  const handleProductChange = (productId: string) => {
    console.log('🔍 Produto selecionado - ID:', productId)
    console.log('📦 Total de produtos disponíveis:', products.length)
    
    if (!productId) {
      setSelectedProduct(null)
      setFormData((prev: any) => ({
        ...prev,
        productId: '',
        productName: '',
        originalPrice: '',
        image: ''
      }))
      return
    }
    
    const product = products.find((p: Product) => p.id === productId)
    if (product) {
      console.log('✅ Produto encontrado:', product.name, 'ID:', product.id)
      setSelectedProduct(product)
      
      // Atualizar formData diretamente para evitar problemas de timing
      setFormData((prev: any) => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        originalPrice: product.price.toString(),
        image: product.image || '/placeholder.svg' // Usar placeholder se não houver imagem
      }))
    } else {
      console.log('❌ Produto não encontrado para ID:', productId)
      setSelectedProduct(null)
      setFormData((prev: any) => ({
        ...prev,
        productId: '',
        productName: '',
        originalPrice: '',
        image: ''
      }))
    }
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData((prev: any) => ({
      ...prev,
      image: imageUrl
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação dos dados
    if (!formData.productId) {
      alert('Por favor, selecione um produto.')
      return
    }
    
    if (!formData.productName) {
      alert('Por favor, preencha o nome do produto.')
      return
    }
    
    if (!formData.originalPrice || !formData.newPrice) {
      alert('Por favor, preencha os preços.')
      return
    }
    
    const originalPrice = parseFloat(formData.originalPrice)
    const newPrice = parseFloat(formData.newPrice)
    
    if (originalPrice <= 0 || newPrice <= 0) {
      alert('Os preços devem ser maiores que zero.')
      return
    }
    
    if (newPrice >= originalPrice) {
      alert('O novo preço deve ser menor que o preço original.')
      return
    }
    
    const promotionData = {
      ...(promotion && { id: promotion.id }),
      productId: formData.productId,
      productName: formData.productName,
      originalPrice: originalPrice,
      newPrice: newPrice,
      image: formData.image || '',
      isActive: formData.isActive,
      validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined
    }
    
    console.log('Dados do formulário para envio:', promotionData)
    onSave(promotionData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4">
      {/* Cabeçalho visual do modal */}
      <div className="flex items-center gap-3 mb-2">
        <Tag className="w-7 h-7 text-orange-500" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{promotion ? 'Editar Promoção' : 'Nova Promoção'}</h2>
          <p className="text-gray-600 text-sm">Preencha os campos obrigatórios <span className="text-orange-500">*</span> para criar ou editar uma promoção de produto.</p>
        </div>
      </div>
      {/* Feedback visual de erro/sucesso */}
      {/* (Exemplo: pode ser controlado por estado externo) */}
      {/* <div className="bg-green-100 text-green-800 rounded px-3 py-2 text-sm">Promoção salva com sucesso!</div> */}
      {/* Seleção do Produto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          Produto <span className="text-orange-500" title="Campo obrigatório">*</span>
        </label>
        <select
          value={formData.productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          required
        >
          <option value="">Selecione um produto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (ID: {product.id})
            </option>
          ))}
        </select>
        {formData.productId && (
          <p className="text-sm text-gray-600 mt-1">
            Produto selecionado: <strong>{formData.productName}</strong> (ID: {formData.productId})
          </p>
        )}
      </div>
      {/* Campo Nome do Produto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          Nome do Produto <span className="text-orange-500" title="Campo obrigatório">*</span>
        </label>
        <input
          type="text"
          value={formData.productName}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          required
        />
      </div>
      {/* Campo Preço Original */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Preço Original <span className="text-orange-500" title="Campo obrigatório">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.originalPrice}
            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            required
          />
        </div>
        {/* Campo Novo Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Novo Preço <span className="text-orange-500" title="Campo obrigatório">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.newPrice}
            onChange={(e) => setFormData({ ...formData, newPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            required
          />
        </div>
      </div>
      {/* Campo Imagem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          Imagem da Promoção <span className="text-gray-500 text-xs">(opcional)</span>
        </label>
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'url' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="h-4 w-4 inline mr-2" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'file' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Arquivo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'paste' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Copy className="h-4 w-4 inline mr-2" />
              Colar
            </button>
          </div>

          {activeTab === 'url' && (
            <div className="space-y-2">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
              <p className="text-xs text-gray-500">Cole aqui o link direto da imagem</p>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Arraste uma imagem aqui ou clique para selecionar
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) { // 5MB
                        showNotification('error', 'Arquivo muito grande. Use uma imagem menor que 5MB.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const result = e.target?.result as string
                        setFormData({ ...formData, image: result })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="bg-orange-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-600 transition-colors">
                  Selecionar Arquivo
                </label>
                <p className="text-xs text-gray-500 mt-2">Máximo 5MB</p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                <Copy className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Cole uma imagem da área de transferência
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clipboardItems = await navigator.clipboard.read()
                      for (const clipboardItem of clipboardItems) {
                        for (const type of clipboardItem.types) {
                          if (type.startsWith('image/')) {
                            const blob = await clipboardItem.getType(type)
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const result = e.target?.result as string
                              setFormData({ ...formData, image: result })
                            }
                            reader.readAsDataURL(blob)
                            return
                          }
                        }
                      }
                      showNotification('warning', 'Nenhuma imagem encontrada na área de transferência')
                    } catch (error) {
                      console.error('Erro ao colar imagem:', error)
                      showNotification('error', 'Erro ao colar imagem. Verifique se há uma imagem na área de transferência.')
                    }
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Colar Imagem
                </button>
                <p className="text-xs text-gray-500 mt-2">Ctrl+V para colar</p>
              </div>
            </div>
          )}

          {/* Preview da imagem */}
          {(formData.image && formData.image.trim() !== '') && (
            <div className="relative bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Preview da Imagem</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-full h-40 object-contain rounded-lg border bg-white"
                  onError={(e) => {
                    console.log('❌ Erro ao carregar imagem:', formData.image)
                    e.currentTarget.style.display = 'none'
                    // Mostrar placeholder quando a imagem falha
                    const placeholder = document.createElement('div')
                    placeholder.className = 'w-full h-40 bg-gray-200 rounded-lg border flex items-center justify-center text-gray-500'
                    placeholder.innerHTML = '<span>Imagem não encontrada</span>'
                    e.currentTarget.parentElement?.appendChild(placeholder)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campo Data de Validade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Válido até</label>
        <input
          type="date"
          value={formData.validUntil}
          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
        />
      </div>
      {/* Campo Ativo */}
      <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          id="isActive"
          className="accent-orange-500"
          />
        <label htmlFor="isActive" className="text-sm text-gray-700">Promoção ativa</label>
      </div>
      {/* Botões de ação */}
      <div className="flex flex-col md:flex-row gap-3 justify-end mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" /> {promotion ? 'Salvar Alterações' : 'Criar Promoção'}
        </button>
      </div>
    </form>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header com Notificações */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
                <span className="text-sm text-gray-500">• Sistema Ativo</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {/* Dropdown de Notificações */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botão de Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Sistema de Pesquisa e Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Barra de Pesquisa */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar produtos, pedidos, usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="PENDING">Pendente</option>
                <option value="PROCESSING">Processando</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Grãos">Grãos</option>
                <option value="Óleos">Óleos</option>
                <option value="Massas">Massas</option>
                <option value="Laticínios">Laticínios</option>
                <option value="Pães">Pães</option>
                <option value="Frutas">Frutas</option>
                <option value="Verduras">Verduras</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápidos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => window.open('/api/proxy/java/admin/report/monthly', '_blank')}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FileText className="h-6 w-6 mr-2" />
              <div className="text-left">
                <p className="font-semibold">Gerar PDF</p>
                <p className="text-xs opacity-90">Relatório Mensal</p>
              </div>
            </button>
            
            <button
              onClick={() => addNotification('info', 'Exportando dados...')}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-6 w-6 mr-2" />
              <div className="text-left">
                <p className="font-semibold">Exportar</p>
                <p className="text-xs opacity-90">Dados do Sistema</p>
              </div>
            </button>
            
            <button
              onClick={() => fetchAnalytics()}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="h-6 w-6 mr-2" />
              <div className="text-left">
                <p className="font-semibold">Analytics</p>
                <p className="text-xs opacity-90">Atualizar Dados</p>
              </div>
            </button>
            
            <button
              onClick={() => addNotification('success', 'Backup iniciado...')}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Database className="h-6 w-6 mr-2" />
              <div className="text-left">
                <p className="font-semibold">Backup</p>
                <p className="text-xs opacity-90">Banco de Dados</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
                { id: 'products', name: 'Produtos', icon: Package },
                { id: 'promotions', name: 'Promoções', icon: Tag },
                { id: 'orders', name: 'Pedidos', icon: ShoppingCart },
                { id: 'returns', name: 'Trocas e Devoluções', icon: RotateCcw },
                { id: 'reports', name: 'Relatórios', icon: FileText },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 },
                { id: 'camera-requests', name: 'Solicitações Câmera', icon: Camera },
                { id: 'feedback', name: 'Feedback', icon: MessageSquare },
                { id: 'users', name: 'Usuários', icon: Users },
                { id: 'system', name: 'Sistema', icon: Eye },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'dashboard' && stats && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total de Usuários</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Produtos</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalProducts}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ShoppingCart className="w-8 h-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">Pedidos</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.totalOrders}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Receita Total</p>
                      <p className="text-2xl font-bold text-purple-900">R$ {(stats.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Camera className="w-6 h-6 text-yellow-600" />
                    <h3 className="ml-2 font-medium text-yellow-800">Solicitações de Câmera Pendentes</h3>
                  </div>
                  <p className="text-yellow-700 mb-4">{stats.pendingCameraRequests} solicitações aguardando atendimento</p>
                  <button
                    onClick={() => setActiveTab('camera-requests')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Ver Solicitações
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    <h3 className="ml-2 font-medium text-blue-800">Feedback Pendente</h3>
                  </div>
                  <p className="text-blue-700 mb-4">{stats.pendingFeedback} feedbacks aguardando revisão</p>
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Ver Feedback
                  </button>
                </div>
              </div>

              {/* Botões de geração de PDF */}
              <div className="flex justify-end mb-4 gap-2">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                  onClick={async () => {
                    try {
                      addNotification('info', 'Gerando PDF mensal...');
                    const res = await fetch('/api/proxy/java/admin/report/monthly');
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `relatorio-mensal.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                        addNotification('success', 'PDF mensal gerado com sucesso!');
                    } else {
                        addNotification('error', 'Erro ao gerar PDF mensal');
                      }
                    } catch (error) {
                      console.error('Erro ao gerar PDF mensal:', error);
                      addNotification('error', 'Erro ao gerar PDF mensal');
                    }
                  }}
                >
                  <Eye className="w-5 h-5" /> PDF Mensal
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                  onClick={async () => {
                    try {
                      addNotification('info', 'Gerando relatório de vendas...');
                      const doc = await generateSalesReportPDF({
                        totalOrders: stats.totalOrders,
                        totalRevenue: stats.totalRevenue,
                        totalUsers: stats.totalUsers,
                        totalProducts: stats.totalProducts,
                        promotions: productPromotions.filter(p => p.isActive),
                        orders: filteredOrders // Adicionando dados dos pedidos
                      });
                      doc.save('relatorio-vendas.pdf');
                      addNotification('success', 'Relatório de vendas gerado com sucesso!');
                    } catch (error) {
                      console.error('Erro ao gerar PDF:', error);
                      addNotification('error', 'Erro ao gerar relatório de vendas');
                    }
                  }}
                >
                  <FileText className="w-5 h-5" /> Relatório de Vendas
                </button>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                  onClick={async () => {
                    try {
                      addNotification('info', 'Gerando relatório completo do sistema...');
                      // Gerar múltiplos PDFs
                      const salesDoc = await generateSalesReportPDF({
                        totalOrders: stats.totalOrders,
                        totalRevenue: stats.totalRevenue,
                        totalUsers: stats.totalUsers,
                        totalProducts: stats.totalProducts,
                        promotions: productPromotions.filter(p => p.isActive),
                        orders: filteredOrders // Adicionando dados dos pedidos
                      });
                      salesDoc.save('relatorio-completo-vendas.pdf');
                      
                      const productsDoc = await generateProductsPDF(filteredProducts);
                      productsDoc.save('relatorio-completo-produtos.pdf');
                      
                      const ordersDoc = await generateOrdersPDF(filteredOrders);
                      ordersDoc.save('relatorio-completo-pedidos.pdf');
                      
                      const customersDoc = await generateCustomersPDF(filteredUsers);
                      customersDoc.save('relatorio-completo-clientes.pdf');
                      
                      addNotification('success', 'Relatórios completos gerados com sucesso!');
                    } catch (error) {
                      console.error('Erro ao gerar PDFs:', error);
                      addNotification('error', 'Erro ao gerar relatórios completos');
                    }
                  }}
                >
                  <BarChart3 className="w-5 h-5" /> Relatório Completo
                </button>
              </div>

              {/* Card de análise estatística visual */}
              <div className={`bg-gradient-to-r ${stats.totalOrders > 0 ? 'from-green-100 to-green-50' : 'from-red-100 to-red-50'} p-6 rounded-lg mb-8 flex items-center justify-between`}>
                <div>
                  <p className={`text-lg font-semibold ${stats.totalOrders > 0 ? 'text-green-800' : 'text-red-800'}`}>Tendência de Pedidos</p>
                  <p className={`text-3xl font-bold flex items-center gap-2 ${stats.totalOrders > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {stats.totalOrders}
                    <span className={`inline-block ${stats.totalOrders > 0 ? 'text-green-600 animate-bounce' : 'text-red-600 animate-pulse'} transform ${stats.totalOrders > 0 ? 'rotate-45' : '-rotate-45'}`}>
                      {stats.totalOrders > 0 ? '↑' : '↓'}
                    </span>
                  </p>
                  <p className={`text-sm ${stats.totalOrders > 0 ? 'text-green-700' : 'text-red-700'}`}>{stats.totalOrders > 0 ? 'Pedidos subindo este mês!' : 'Pedidos caindo este mês!'}</p>
                </div>
                <TrendingUp className={`w-12 h-12 ${stats.totalOrders > 0 ? 'text-green-400 animate-bounce' : 'text-red-400 animate-pulse'}`} />
              </div>

              {/* Gráfico de Faturamento */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" /> 
                    Faturamento {chartPeriod === 'day' ? 'Diário' : chartPeriod === 'month' ? 'Mensal' : 'Anual'}
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Filtro de Período */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Período:</label>
                      <select
                        value={chartPeriod}
                        onChange={(e) => {
                          const period = e.target.value as 'day' | 'month' | 'year'
                          setChartPeriod(period)
                          fetchAnalytics(period)
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="day">Dia</option>
                        <option value="month">Mês</option>
                        <option value="year">Ano</option>
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {(stats.totalRevenue || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Total Geral</p>
                    </div>
                  </div>
                </div>
                
                {(() => {
                  console.log('🎯 Renderizando gráfico - analyticsData:', analyticsData)
                  console.log('🎯 monthlyRevenue:', analyticsData?.monthlyRevenue)
                  return analyticsData?.monthlyRevenue && analyticsData.monthlyRevenue.length > 0
                })() ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey={chartPeriod === 'day' ? 'day' : chartPeriod === 'month' ? 'month' : 'year'} 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`R$ ${(value || 0).toFixed(2)}`, 'Faturamento']}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Nenhum dado de faturamento disponível</p>
                      <p className="text-xs text-gray-400 mt-2">Analytics: {JSON.stringify(analyticsData)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Gráfico de Pedidos Mensais */}
              {analyticsData?.monthlyOrders && analyticsData.monthlyOrders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" /> Evolução de Pedidos Mensais
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.monthlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [value, 'Pedidos']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#f59e42" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de Status dos Pedidos */}
              {analyticsData?.orderStatus && analyticsData.orderStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" /> Status dos Pedidos
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.orderStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.orderStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#f59e42', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Pedidos']}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de Categorias de Produtos */}
              {analyticsData?.categoryDistribution && analyticsData.categoryDistribution.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" /> Distribuição por Categoria
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.categoryDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e42', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Produtos']}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analytics de Visitantes</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={analyticsPeriod}
                    onChange={(e) => {
                      setAnalyticsPeriod(e.target.value)
                      fetchVisitorStats(e.target.value)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Todos os Períodos</option>
                    <option value="daily">Diário</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                  <button
                    onClick={() => fetchVisitorStats(analyticsPeriod)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Atualizar
                  </button>
                </div>
              </div>

              {!visitorStats ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando Analytics</h3>
                  <p className="text-gray-600">Aguarde enquanto carregamos os dados...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Estatísticas Gerais */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitas Totais</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analyticsPeriod === 'all' ? visitorStats.total : Object.values(visitorStats).reduce((sum: any, stat: any) => sum + (stat.total || 0), 0)}
                    </div>
                    <p className="text-sm text-gray-600">Total de visitas registradas</p>
                  </div>

                  {/* Dispositivos */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispositivos</h3>
                    {analyticsPeriod === 'all' && visitorStats.devices ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Desktop</span>
                          <span className="font-semibold text-blue-600">{visitorStats.devices.desktop || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Mobile</span>
                          <span className="font-semibold text-green-600">{visitorStats.devices.mobile || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tablet</span>
                          <span className="font-semibold text-purple-600">{visitorStats.devices.tablet || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Selecione "Todos os Períodos" para ver detalhes</p>
                    )}
                  </div>

                  {/* Navegadores */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegadores</h3>
                    {analyticsPeriod === 'all' && visitorStats.browsers ? (
                      <div className="space-y-2">
                        {Object.entries(visitorStats.browsers).map(([browser, count]) => (
                          <div key={browser} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{browser}</span>
                            <span className="font-semibold text-orange-600">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Selecione "Todos os Períodos" para ver detalhes</p>
                    )}
                  </div>

                  {/* Páginas Mais Visitadas */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Páginas Mais Visitadas</h3>
                    {analyticsPeriod === 'all' && visitorStats.pages ? (
                      <div className="space-y-2">
                        {Object.entries(visitorStats.pages)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 5)
                          .map(([page, count]) => (
                            <div key={page} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 truncate">{page}</span>
                              <span className="font-semibold text-indigo-600">{count as number}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Selecione "Todos os Períodos" para ver detalhes</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera-requests' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Solicitações de Câmera</h2>
                {(searchTerm || selectedCategory !== 'all') && (
                  <span className="text-sm text-gray-600">
                    {filteredCameraRequests.length} de {cameraRequests.length} resultados
                  </span>
                )}
              </div>
              
              {filteredCameraRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação</h3>
                  <p className="text-gray-600">Não há solicitações de câmera no momento</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Perdido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCameraRequests.map((request, idx) => (
                        <tr key={request.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.cause || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.createdAt ? new Date(request.createdAt).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.status === 'pending' ? 'Pendente' :
                               request.status === 'processing' ? 'Processando' : 'Concluído'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateCameraRequestStatus(request.id, 'completed')}
                                disabled={isUpdating || request.status === 'completed'}
                                className={`text-green-600 hover:text-green-900 disabled:opacity-50 border border-green-200 rounded px-2 py-1 ${request.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {request.status === 'completed' ? 'Concluído' : 'Concluir'}
                              </button>
                              <button
                                onClick={() => setCameraDetail(request)}
                                className="text-orange-600 hover:text-orange-900 text-sm"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Feedback dos Clientes</h2>
                {(searchTerm || selectedCategory !== 'all') && (
                  <span className="text-sm text-gray-600">
                    {filteredFeedback.length} de {feedback.length} resultados
                  </span>
                )}
              </div>
              
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum feedback</h3>
                  <p className="text-gray-600">Não há feedback de clientes no momento</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedback.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.isAnonymous ? 'Anônimo' : item.name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.isAnonymous ? 'anonimo@feedback.com' : item.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.type || 'Não informado'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status === 'pending' ? 'Pendente' :
                           item.status === 'reviewed' ? 'Revisado' : 'Resolvido'}
                        </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2 items-end">
                              <button
                                onClick={() => setFeedbackDetail(item)}
                                className="text-orange-600 hover:text-orange-900 text-sm border border-orange-200 rounded px-2 py-1 mb-2"
                              >
                                Visualizar
                              </button>
                              <button
                                onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                                disabled={isUpdating || item.status === 'resolved'}
                                className={`text-green-600 hover:text-green-900 text-sm border border-green-200 rounded px-2 py-1 ${item.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {item.status === 'resolved' ? 'Resolvido' : 'Resolver'}
                              </button>
                      </div>
                          </td>
                        </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Modal de detalhes do feedback */}
              {feedbackDetail && (
                <Dialog open={!!feedbackDetail} onOpenChange={open => !open && setFeedbackDetail(null)}>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-800">
                        <MessageSquare className="w-6 h-6 text-blue-500" /> Detalhes do Feedback
                      </DialogTitle>
                      <DialogDescription className="text-gray-500">Veja as informações completas do feedback do cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                          {feedbackDetail.isAnonymous ? 'A' : (feedbackDetail.name?.[0] || '?')}
                        </div>
                        <div>
                          <div className="font-semibold text-blue-900">{feedbackDetail.isAnonymous ? 'Anônimo' : feedbackDetail.name || '-'}</div>
                          <div className="text-xs text-gray-500">{feedbackDetail.isAnonymous ? 'anonimo@feedback.com' : feedbackDetail.email || '-'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Avaliação:</span>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={star <= (feedbackDetail.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-gray-700">Motivo:</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{feedbackDetail.type || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Mensagem:</span>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-800 whitespace-pre-line">{feedbackDetail.message || '-'}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${feedbackDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : feedbackDetail.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{feedbackDetail.status === 'pending' ? 'Pendente' : feedbackDetail.status === 'reviewed' ? 'Revisado' : 'Resolvido'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-gray-700">Data:</span>
                        <span className="text-gray-600">{feedbackDetail.createdAt ? new Date(feedbackDetail.createdAt).toLocaleString('pt-BR') : '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => updateFeedbackStatus(feedbackDetail.id, 'resolved')}
                        disabled={isUpdating || feedbackDetail.status === 'resolved'}
                        className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors ${feedbackDetail.status === 'resolved' ? 'bg-green-200 text-green-700 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      >
                        {feedbackDetail.status === 'resolved' ? 'Resolvido' : 'Marcar como Resolvido'}
                      </button>
                      <DialogClose asChild>
                        <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700">Fechar</button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {activeTab === 'promotions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Promoções de Produtos</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando PDF de promoções...');
                        const doc = await generatePromotionsPDF(productPromotions);
                        doc.save('relatorio-promocoes.pdf');
                        addNotification('success', 'PDF de promoções gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar PDF de promoções');
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar PDF
                  </button>
                <button
                  onClick={() => {
                    setEditingPromotion(null)
                    setShowPromotionModal(true)
                  }}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Promoção</span>
                </button>
                </div>
              </div>
              
              {productPromotions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção cadastrada</h3>
                  <p className="text-gray-600">Crie promoções para aumentar as vendas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productPromotions.map((promotion) => (
                    <div key={promotion.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {promotion.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                          {promotion.validUntil && new Date(promotion.validUntil) > new Date() && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {Math.ceil((new Date(promotion.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                            </span>
                          )}
                          {promotion.validUntil && new Date(promotion.validUntil) <= new Date() && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Expirada
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Toggle promoção ativa/inativa
                              const updatedPromotion = { ...promotion, isActive: !promotion.isActive };
                              savePromotion(updatedPromotion);
                            }}
                            className={`text-sm px-2 py-1 rounded border transition-colors ${
                              promotion.isActive 
                                ? 'text-red-600 border-red-200 hover:bg-red-50' 
                                : 'text-green-600 border-green-200 hover:bg-green-50'
                            }`}
                          >
                            {promotion.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingPromotion(promotion)
                              setShowPromotionModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePromotion(promotion.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        {promotion.image && (
                          <img
                            src={promotion.image}
                            alt={promotion.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">{promotion.productName}</h3>
                          <p className="text-xs text-gray-500">ID: {promotion.productId}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Preço Original:</span>
                          <span className="line-through text-gray-400">R$ {promotion.originalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Novo Preço:</span>
                          <span className="font-bold text-green-600">R$ {promotion.newPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Desconto:</span>
                          <span className="font-bold text-red-600">{promotion.discount}% OFF</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Criada em: {new Date(promotion.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        {promotion.validUntil && (
                          <p className="text-xs text-gray-500">
                            Válida até: {new Date(promotion.validUntil).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
                <div className="flex items-center gap-2">
                  {(searchTerm || selectedCategory !== 'all') && (
                    <span className="text-sm text-gray-600">
                      {filteredProducts.length} de {products.length} resultados
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingProduct(null)
                      setShowProductModal(true)
                    }}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => syncProducts('to-json')}
                      disabled={isUpdating}
                      className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm disabled:opacity-50"
                      title="Sincronizar data.ts -> products.json"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Sync → JSON
                    </button>
                    <button
                      onClick={() => syncProducts('to-data')}
                      disabled={isUpdating}
                      className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm disabled:opacity-50"
                      title="Sincronizar products.json -> data.ts"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Sync → Data
                    </button>
                  </div>
                  <button
                    onClick={() => exportToCSV(filteredProducts, 'produtos')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando PDF de produtos...');
                        const doc = await generateProductsPDF(filteredProducts);
                        doc.save('catalogo-produtos.pdf');
                        addNotification('success', 'PDF de produtos gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar PDF de produtos');
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar PDF
                  </button>
                </div>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
                  <p className="text-gray-600">Adicione produtos para começar a vender</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product, idx) => (
                        <tr key={product.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name || '-'}</div>
                              <div className="text-sm text-gray-500">{product.description || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {product.price.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.inStock ? 'Em estoque' : 'Sem estoque'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingProduct(product)
                                  setShowProductModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar produto"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                title="Deletar produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div id="orders-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
                <div className="flex items-center gap-2">
                  {(searchTerm || selectedCategory !== 'all') && (
                    <span className="text-sm text-gray-600">
                      {filteredOrders.length} de {orders.length} resultados
                    </span>
                  )}
                  <button
                    onClick={() => exportToCSV(filteredOrders, 'pedidos')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando PDF de pedidos...');
                        const doc = await generateOrdersPDF(filteredOrders);
                        doc.save('relatorio-pedidos.pdf');
                        addNotification('success', 'PDF de pedidos gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar PDF de pedidos');
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar PDF
                  </button>
                </div>
              </div>
              
              {filteredOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600">Os pedidos aparecerão aqui quando forem realizados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Itens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.customerInfo?.name || order.userName || 'Cliente não informado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                📧 {order.customerInfo?.email || order.userEmail || 'Email não informado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                📞 {order.customerInfo?.phone || order.userPhone || 'Telefone não informado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                📍 {order.customerInfo?.address ? (typeof order.customerInfo.address === 'string' ? order.customerInfo.address : formatAddress(order.customerInfo.address)) : 'Endereço não informado'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {(order.total || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'delivering' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'pending' ? 'Pendente' :
                               order.status === 'confirmed' ? 'Confirmado' :
                               order.status === 'preparing' ? 'Preparando' :
                               order.status === 'delivering' ? 'Entregando' :
                               order.status === 'delivered' ? 'Entregue' :
                               'Cancelado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2">
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderDetailsModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Ver Detalhes
                              </button>
                              <div className="flex space-x-1">
                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                  <>
                                    <button 
                                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                      disabled={isUpdating || order.status === 'confirmed'}
                                      className={`text-xs px-2 py-1 rounded ${
                                        order.status === 'confirmed' 
                                          ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                                          : 'bg-green-500 text-white hover:bg-green-600'
                                      }`}
                                    >
                                      Confirmar
                                    </button>
                                    <button 
                                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                                      disabled={isUpdating || order.status === 'preparing'}
                                      className={`text-xs px-2 py-1 rounded ${
                                        order.status === 'preparing' 
                                          ? 'bg-orange-100 text-orange-800 cursor-not-allowed' 
                                          : 'bg-orange-500 text-white hover:bg-orange-600'
                                      }`}
                                    >
                                      Preparar
                                    </button>
                                  </>
                                )}
                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                                    disabled={isUpdating || order.status === 'delivering'}
                                    className={`text-xs px-2 py-1 rounded ${
                                      order.status === 'delivering'
                                        ? 'bg-blue-100 text-blue-800 cursor-not-allowed' 
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                  >
                                    Entregar
                                  </button>
                                )}
                                {order.status === 'delivering' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                                    disabled={isUpdating}
                                    className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                                  >
                                    ✅ Entrega Concluída
                                  </button>
                                )}
                                {order.status === 'delivered' && (
                                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                    ✅ Entregue
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
                <div className="flex items-center gap-2">
                  {(searchTerm || selectedCategory !== 'all') && (
                    <span className="text-sm text-gray-600">
                      {filteredUsers.length} de {users.length} resultados
                    </span>
                  )}
                  <button
                    onClick={() => exportToCSV(filteredUsers, 'usuarios')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando PDF de clientes...');
                        const doc = await generateCustomersPDF(filteredUsers);
                        doc.save('relatorio-clientes.pdf');
                        addNotification('success', 'PDF de clientes gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar PDF de clientes');
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar PDF
                  </button>
                </div>
              </div>
              
              {filteredUsers.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário cadastrado</h3>
                  <p className="text-gray-600">Os usuários aparecerão aqui quando se registrarem</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pedidos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Gasto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Pedido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user, idx) => (
                        <tr key={user.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || '-'}</div>
                              <div className="text-sm text-gray-500">{user.email || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.orders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {user.totalSpent.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isClient ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.isClient ? 'Cliente' : 'Usuário'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastOrder ? new Date(user.lastOrder).toLocaleDateString('pt-BR') : 'Nunca'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'returns' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trocas e Devoluções</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToCSV(returnRequests, 'trocas-devolucoes')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>
              
              {returnRequests.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação de troca/devolução</h3>
                  <p className="text-gray-600">As solicitações aparecerão aqui quando forem enviadas pelos clientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnRequests.map((request, idx) => (
                        <tr key={request.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.userName || '-'}</div>
                              <div className="text-sm text-gray-500">{request.userEmail || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.productName || '-'}</div>
                              <div className="text-sm text-gray-500">Qtd: {request.quantity || 1}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.requestType === 'exchange' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {request.requestType === 'exchange' ? 'Troca' : 'Devolução'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status === 'pending' ? 'Pendente' :
                               request.status === 'approved' ? 'Aprovado' :
                               request.status === 'rejected' ? 'Rejeitado' :
                               request.status || 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setReturnDetail(request)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver Detalhes
                              </button>
                              {request.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => updateReturnRequestStatus(request.id, 'APPROVED')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => updateReturnRequestStatus(request.id, 'REJECTED')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Rejeitar
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => deleteReturnRequest(request.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Deletar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Relatórios e Exportações</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Todos os Períodos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                    <option value="year">Último Ano</option>
                  </select>
                </div>
              </div>
              
              {/* Relatórios PDF */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Relatórios PDF
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando relatório de vendas...');
                        const doc = await generateSalesReportPDF({
                          totalOrders: stats?.totalOrders || 0,
                          totalRevenue: stats?.totalRevenue || 0,
                          totalUsers: stats?.totalUsers || 0,
                          totalProducts: stats?.totalProducts || 0,
                          promotions: productPromotions.filter(p => p.isActive),
                          orders: filteredOrders // Adicionando dados dos pedidos
                        });
                        doc.save('relatorio-vendas.pdf');
                        addNotification('success', 'Relatório de vendas gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar relatório de vendas');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FileText className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Relatório de Vendas</span>
                    <span className="text-xs opacity-90">Estatísticas gerais</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando catálogo de produtos...');
                        const doc = await generateProductsPDF(filteredProducts);
                        doc.save('catalogo-produtos.pdf');
                        addNotification('success', 'Catálogo de produtos gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar catálogo de produtos');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Package className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Catálogo de Produtos</span>
                    <span className="text-xs opacity-90">Estoque e preços</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando relatório de promoções...');
                        const doc = await generatePromotionsPDF(productPromotions);
                        doc.save('relatorio-promocoes.pdf');
                        addNotification('success', 'Relatório de promoções gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar relatório de promoções');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Tag className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Relatório de Promoções</span>
                    <span className="text-xs opacity-90">Ofertas ativas</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        const periodText = reportPeriod === 'all' ? 'Todos os Períodos' : 
                                         reportPeriod === 'today' ? 'Hoje' :
                                         reportPeriod === 'week' ? 'Última Semana' :
                                         reportPeriod === 'month' ? 'Último Mês' : 'Último Ano';
                        
                        addNotification('info', `Gerando relatório de pedidos (${periodText})...`);
                        const doc = await generateOrdersPDF(filteredOrders, periodText);
                        doc.save(`relatorio-pedidos-${reportPeriod}.pdf`);
                        addNotification('success', 'Relatório de pedidos gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar relatório de pedidos');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Relatório de Pedidos</span>
                    <span className="text-xs opacity-90">Vendas e status por período</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando relatório de clientes...');
                        const doc = await generateCustomersPDF(filteredUsers);
                        doc.save('relatorio-clientes.pdf');
                        addNotification('success', 'Relatório de clientes gerado com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        addNotification('error', 'Erro ao gerar relatório de clientes');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Users className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Relatório de Clientes</span>
                    <span className="text-xs opacity-90">Base de dados</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        addNotification('info', 'Gerando relatórios completos...');
                        // Gerar múltiplos PDFs
                        const salesDoc = await generateSalesReportPDF({
                          totalOrders: stats?.totalOrders || 0,
                          totalRevenue: stats?.totalRevenue || 0,
                          totalUsers: stats?.totalUsers || 0,
                          totalProducts: stats?.totalProducts || 0,
                          promotions: productPromotions.filter(p => p.isActive),
                          orders: filteredOrders // Adicionando dados dos pedidos
                        });
                        salesDoc.save('relatorio-completo-vendas.pdf');
                        
                        const productsDoc = await generateProductsPDF(filteredProducts);
                        productsDoc.save('relatorio-completo-produtos.pdf');
                        
                        const ordersDoc = await generateOrdersPDF(filteredOrders);
                        ordersDoc.save('relatorio-completo-pedidos.pdf');
                        
                        const customersDoc = await generateCustomersPDF(filteredUsers);
                        customersDoc.save('relatorio-completo-clientes.pdf');
                        
                        addNotification('success', 'Relatórios completos gerados com sucesso!');
                      } catch (error) {
                        console.error('Erro ao gerar PDFs:', error);
                        addNotification('error', 'Erro ao gerar relatórios completos');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Relatório Completo</span>
                    <span className="text-xs opacity-90">Todos os dados</span>
                  </button>
                </div>
              </div>

              {/* Dashboard em Tempo Real */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Dashboard em Tempo Real
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">Vendas Hoje</h4>
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-800 mb-2">R$ {stats?.totalRevenue?.toFixed(2) || '0,00'}</div>
                    <div className="flex items-center text-sm text-blue-600">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      +{dashboardMetrics.revenueGrowth}% vs ontem
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-green-900">Novos Clientes</h4>
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-800 mb-2">{stats?.totalUsers || 0}</div>
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      +{dashboardMetrics.userGrowth}% este mês
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-purple-900">Taxa de Conversão</h4>
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-800 mb-2">{dashboardMetrics.conversionRate}%</div>
                    <div className="flex items-center text-sm text-purple-600">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      +0.5% vs mês passado
                    </div>
                  </div>
                </div>
              </div>

              {/* Sistema de Alertas Inteligente */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-orange-600" />
                  Alertas Inteligentes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <h4 className="font-medium text-yellow-800">Estoque Baixo</h4>
                    </div>
                    <p className="text-yellow-700 text-sm">5 produtos com estoque abaixo do mínimo</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-800">Sistema Online</h4>
                    </div>
                    <p className="text-green-700 text-sm">Todos os serviços funcionando normalmente</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Status do Sistema</h2>
                <button
                  onClick={checkJavaSystem}
                  disabled={isCheckingJava}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingJava ? 'animate-spin' : ''}`} />
                  <span>{isCheckingJava ? 'Verificando...' : 'Verificar Sistema'}</span>
                </button>
              </div>

              {/* Status do Backend Java */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Status Geral */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Status do Backend Java
                  </h3>
                  
                  {javaSystemStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          javaSystemStatus.status === 'ONLINE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {javaSystemStatus.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Uptime:</span>
                        <span className="text-sm font-medium">
                          {javaSystemStatus.uptime?.formatted || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Última verificação:</span>
                        <span className="text-sm font-medium">
                          {javaSystemStatus.timestamp ? new Date(javaSystemStatus.timestamp).toLocaleString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Verificando status...</p>
                    </div>
                  )}
                </div>

                {/* Saúde do Sistema */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Saúde do Sistema
                  </h3>
                  
                  {javaHealth ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          javaHealth.status === 'HEALTHY' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {javaHealth.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Banco de Dados:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          javaHealth.database === 'CONNECTED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {javaHealth.database || 'N/A'}
                        </span>
                      </div>
                      
                      {javaHealth.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">{javaHealth.error}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Verificando saúde...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Sistema */}
              {javaSystemStatus && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Memória */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Uso de Memória</h4>
                    {javaSystemStatus.memory && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Heap Usado:</span>
                          <span>{((javaSystemStatus.memory?.usedHeap || 0) / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Heap Máximo:</span>
                          <span>{((javaSystemStatus.memory?.maxHeap || 0) / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${javaSystemStatus.memory?.heapUsagePercent || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {(javaSystemStatus.memory?.heapUsagePercent || 0).toFixed(1)}% usado
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sistema Operacional */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Sistema Operacional</h4>
                    {javaSystemStatus.system && (
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">OS:</span> {javaSystemStatus.system.os}</div>
                        <div><span className="text-gray-600">Versão:</span> {javaSystemStatus.system.version}</div>
                        <div><span className="text-gray-600">Arquitetura:</span> {javaSystemStatus.system.arch}</div>
                        <div><span className="text-gray-600">Processadores:</span> {javaSystemStatus.system.processors}</div>
                      </div>
                    )}
                  </div>

                  {/* Banco de Dados */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Banco de Dados</h4>
                    {javaSystemStatus.database && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            javaSystemStatus.database.status === 'CONNECTED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {javaSystemStatus.database.status}
                          </span>
                        </div>
                        <div><span className="text-gray-600">Tipo:</span> H2 Database</div>
                        <div><span className="text-gray-600">Console:</span> 
                          <a href="http://localhost:8080/h2-console" target="_blank" className="text-blue-600 hover:underline ml-1">
                            Acessar
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Migração de Dados */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Migração de Dados (JSON → Java)
                </h3>
                
                {migrationStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        migrationStatus.status === 'READY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {migrationStatus.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Origem (JSON)</h4>
                        <p className="text-sm text-blue-700">Dados atuais do sistema Node.js</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Destino (Java)</h4>
                        <p className="text-sm text-green-700">Novo sistema Java Spring Boot</p>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2">Tempo Estimado</h4>
                        <p className="text-sm text-orange-700">{migrationStatus.estimatedTime || '2-3 minutos'}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('http://localhost:8080/api/migration/preview')
                            if (response.ok) {
                              const data = await response.json()
                              alert(`Preview da migração:\n- Usuários JSON: ${data.jsonUsers}\n- Produtos JSON: ${data.jsonProducts}\n- Pedidos JSON: ${data.jsonOrders}\n- Usuários DB: ${data.dbUsers}\n- Produtos DB: ${data.dbProducts}\n- Pedidos DB: ${data.dbOrders}`)
                            }
                          } catch (error) {
                            alert('Erro ao verificar preview da migração')
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Ver Preview
                      </button>
                      
                      <button
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja iniciar a migração? Isso irá copiar todos os dados do JSON para o banco Java.')) {
                            try {
                              const response = await fetch('http://localhost:8080/api/migration/start', { method: 'POST' })
                              if (response.ok) {
                                const data = await response.json()
                                alert(`Migração concluída!\n- Usuários migrados: ${data.migratedUsers}\n- Produtos migrados: ${data.migratedProducts}\n- Pedidos migrados: ${data.migratedOrders}`)
                                checkJavaSystem()
                              }
                            } catch (error) {
                              alert('Erro ao iniciar migração')
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Iniciar Migração
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Verificando status da migração...</p>
                  </div>
                )}
              </div>

              {/* Seção de Analytics Avançada */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                    Análise Avançada
                  </h2>
                  <Button 
                    onClick={() => fetchAnalytics()} 
                    disabled={analyticsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {analyticsLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Atualizar
                  </Button>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Carregando análises...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Métricas de Performance */}
                    {performanceMetrics && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Métricas de Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-800">
                              R$ {(performanceMetrics.currentMonthRevenue || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-blue-600">Receita do Mês</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${(performanceMetrics.revenueGrowth || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                              {(performanceMetrics.revenueGrowth || 0) >= 0 ? '+' : ''}{(performanceMetrics.revenueGrowth || 0).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">Crescimento</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-800">
                              {performanceMetrics.currentMonthOrders || 0}
                            </p>
                            <p className="text-sm text-indigo-600">Pedidos do Mês</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-800">
                              R$ {(performanceMetrics.averageOrderValue || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-purple-600">Ticket Médio</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Produtos Mais Vendidos */}
                    {topProducts.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
                        <h3 className="text-lg font-semibold text-green-900 mb-4">Produtos Mais Vendidos</h3>
                        <div className="space-y-3">
                          {topProducts.slice(0, 5).map((product, index) => (
                            <div key={product.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="ml-3 text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-green-700">
                                {product.quantity} un
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seção de Logs de Atividade e Alertas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Logs de Atividade */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Logs de Atividade
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {activityLogs.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhuma atividade registrada</p>
                    ) : (
                      activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            log.type === 'success' ? 'bg-green-500' :
                            log.type === 'warning' ? 'bg-yellow-500' :
                            log.type === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{log.action}</p>
                            <p className="text-xs text-gray-600">{log.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {log.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Alertas do Sistema */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Alertas do Sistema
                  </h3>
                  <div className="space-y-3">
                    {checkSystemAlerts().length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">Sistema funcionando normalmente</span>
                      </div>
                    ) : (
                      checkSystemAlerts().map((alert, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-orange-800">{alert}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Cards de Status do Sistema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Sistema</p>
                      <p className="text-2xl font-bold">Online</p>
                    </div>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Uptime</p>
                      <p className="text-2xl font-bold">{dashboardMetrics.systemUptime}%</p>
                    </div>
                    <Clock className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Memória</p>
                      <p className="text-2xl font-bold">{dashboardMetrics.memoryUsage}%</p>
                    </div>
                    <Activity className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">CPU</p>
                      <p className="text-2xl font-bold">32%</p>
                    </div>
                    <Cpu className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              </div>

              {/* Métricas em Tempo Real */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Métricas em Tempo Real
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats?.totalUsers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Usuários Ativos</div>
                    <div className="text-xs text-green-600 mt-1">+{dashboardMetrics.userGrowth}% este mês</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats?.totalOrders || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pedidos Hoje</div>
                    <div className="text-xs text-green-600 mt-1">+{dashboardMetrics.revenueGrowth}% vs ontem</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">Receita Hoje</div>
                    <div className="text-xs text-green-600 mt-1">+{dashboardMetrics.revenueGrowth}% vs ontem</div>
                  </div>
                </div>
              </div>

              {/* Funcionalidades Avançadas */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <Zap className="w-5 h-5 mr-2" /> Funcionalidades Avançadas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Gestão de Estoque */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <Package className="w-6 h-6 text-blue-600 mr-2" />
                      <h4 className="font-medium text-blue-900">Gestão de Estoque</h4>
                    </div>
                    <p className="text-blue-700 text-sm mb-3">Controle automático de estoque baixo e alertas</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Produtos com estoque baixo:</span>
                        <span className="font-medium text-red-600">5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Produtos em promoção:</span>
                        <span className="font-medium text-green-600">3</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700">
                      Gerenciar Estoque
                    </button>
                  </div>

                  {/* Relatórios Avançados */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center mb-3">
                      <FileText className="w-6 h-6 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-900">Relatórios Avançados</h4>
                    </div>
                    <p className="text-green-700 text-sm mb-3">Relatórios detalhados e análises preditivas</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Relatórios gerados:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Última análise:</span>
                        <span className="font-medium">Hoje</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700">
                      Gerar Relatório
                    </button>
                  </div>

                  {/* Monitoramento de Performance */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center mb-3">
                      <Activity className="w-6 h-6 text-purple-600 mr-2" />
                      <h4 className="font-medium text-purple-900">Performance</h4>
                    </div>
                    <p className="text-purple-700 text-sm mb-3">Monitoramento em tempo real do sistema</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime:</span>
                        <span className="font-medium text-green-600">{dashboardMetrics.systemUptime}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Latência:</span>
                        <span className="font-medium">45ms</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-purple-700">
                      Ver Detalhes
                    </button>
                  </div>

                  {/* Gestão de Usuários */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center mb-3">
                      <Users className="w-6 h-6 text-orange-600 mr-2" />
                      <h4 className="font-medium text-orange-900">Gestão de Usuários</h4>
                    </div>
                    <p className="text-orange-700 text-sm mb-3">Controle de permissões e acesso</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usuários ativos:</span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Novos hoje:</span>
                        <span className="font-medium text-green-600">8</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-orange-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-orange-700">
                      Gerenciar Usuários
                    </button>
                  </div>

                  {/* Backup e Segurança */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center mb-3">
                      <Lock className="w-6 h-6 text-red-600 mr-2" />
                      <h4 className="font-medium text-red-900">Backup & Segurança</h4>
                    </div>
                    <p className="text-red-700 text-sm mb-3">Backup automático e monitoramento de segurança</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Último backup:</span>
                        <span className="font-medium">2h atrás</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">Seguro</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700">
                      Configurar Backup
                    </button>
                  </div>

                  {/* Integrações */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center mb-3">
                      <Settings className="w-6 h-6 text-indigo-600 mr-2" />
                      <h4 className="font-medium text-indigo-900">Integrações</h4>
                    </div>
                    <p className="text-indigo-700 text-sm mb-3">Conecte com outros sistemas</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Integrações ativas:</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">Online</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-indigo-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-indigo-700">
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal de Promoção */}
      {showPromotionModal && (
        <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col bg-white rounded-xl shadow-2xl">
            <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-t-xl border-b">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Tag className="w-6 h-6 text-orange-500" />
                {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Configure os detalhes da promoção do produto. Preencha os campos obrigatórios marcados com <span className="text-orange-500">*</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 modal-scroll relative scroll-smooth bg-gray-50">
              <div className="bg-white rounded-lg p-6 shadow-sm">
              <PromotionForm
                promotion={editingPromotion}
                products={products}
                onSave={savePromotion}
                onCancel={() => {
                  setShowPromotionModal(false)
                  setEditingPromotion(null)
                }}
                isLoading={isUpdating}
              />
              </div>
              
              {/* Indicador de scroll */}
              <div className="absolute bottom-4 right-4 bg-orange-100 text-orange-600 text-xs px-3 py-2 rounded-full opacity-90 pointer-events-none shadow-sm">
                ↕️ Scroll para ver mais campos
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Produto */}
      {showProductModal && (
        <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-orange-800">
                <Package className="w-6 h-6 text-orange-500" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {editingProduct ? 'Edite as informações do produto' : 'Adicione um novo produto ao catálogo. Escolha um ID único para o produto.'}
              </DialogDescription>
            </DialogHeader>
            
            <ProductForm
              product={editingProduct}
              onSave={saveProduct}
              onCancel={() => {
                setShowProductModal(false)
                setEditingProduct(null)
              }}
              isLoading={isUpdating}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* (1) Modal de detalhes do feedback */}
      {feedbackDetail && (
        <Dialog open={!!feedbackDetail} onOpenChange={open => !open && setFeedbackDetail(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-800">
                <MessageSquare className="w-6 h-6 text-blue-500" /> Detalhes do Feedback
              </DialogTitle>
              <DialogDescription className="text-gray-500">Veja as informações completas do feedback do cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {feedbackDetail.isAnonymous ? 'A' : (feedbackDetail.name?.[0] || '?')}
                </div>
                <div>
                  <div className="font-semibold text-blue-900">{feedbackDetail.isAnonymous ? 'Anônimo' : feedbackDetail.name || '-'}</div>
                  <div className="text-xs text-gray-500">{feedbackDetail.isAnonymous ? 'anonimo@feedback.com' : feedbackDetail.email || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Avaliação:</span>
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={star <= (feedbackDetail.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Motivo:</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{feedbackDetail.type || 'Não informado'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Mensagem:</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-800 whitespace-pre-line">{feedbackDetail.message || '-'}</div>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${feedbackDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : feedbackDetail.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{feedbackDetail.status === 'pending' ? 'Pendente' : feedbackDetail.status === 'reviewed' ? 'Revisado' : 'Resolvido'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Data:</span>
                <span className="text-gray-600">{feedbackDetail.createdAt ? new Date(feedbackDetail.createdAt).toLocaleString('pt-BR') : '-'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => updateFeedbackStatus(feedbackDetail.id, 'resolved')}
                disabled={isUpdating || feedbackDetail.status === 'resolved'}
                className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors ${feedbackDetail.status === 'resolved' ? 'bg-green-200 text-green-700 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {feedbackDetail.status === 'resolved' ? 'Resolvido' : 'Marcar como Resolvido'}
              </button>
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700">Fechar</button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* (2) Modal de detalhes da solicitação de câmera */}
      {cameraDetail && (
        <Dialog open={!!cameraDetail} onOpenChange={open => !open && setCameraDetail(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-orange-800">
                <Camera className="w-6 h-6 text-orange-500" /> Detalhes da Solicitação de Câmera
              </DialogTitle>
              <DialogDescription className="text-gray-500">Veja as informações completas da solicitação</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-700">
                  {cameraDetail.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-semibold text-orange-900">{cameraDetail.name || '-'}</div>
                  <div className="text-xs text-gray-500">{cameraDetail.phone || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Item Perdido:</span>
                  <div className="text-gray-800">{cameraDetail.cause || '-'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Período:</span>
                  <div className="text-gray-800">{cameraDetail.period || '-'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Momento:</span>
                  <div className="text-gray-800">{cameraDetail.moment || '-'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">RG:</span>
                  <div className="text-gray-800">{cameraDetail.rg || '-'}</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Informações Adicionais:</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-800 whitespace-pre-line">{cameraDetail.additionalInfo || '-'}</div>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cameraDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : cameraDetail.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{cameraDetail.status === 'pending' ? 'Pendente' : cameraDetail.status === 'processing' ? 'Processando' : 'Concluído'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Data:</span>
                <span className="text-gray-600">{cameraDetail.createdAt ? new Date(cameraDetail.createdAt).toLocaleString('pt-BR') : '-'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => updateCameraRequestStatus(cameraDetail.id, 'completed')}
                disabled={isUpdating || cameraDetail.status === 'completed'}
                className={`px-4 py-2 rounded-lg font-semibold shadow transition-colors ${cameraDetail.status === 'completed' ? 'bg-green-200 text-green-700 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {cameraDetail.status === 'completed' ? 'Concluído' : 'Marcar como Concluído'}
              </button>
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700">Fechar</button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Detalhes da Solicitação de Troca/Devolução */}
      {returnDetail && (
        <Dialog open={!!returnDetail} onOpenChange={open => !open && setReturnDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-green-50 border-2 border-green-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-green-800">
                <RotateCcw className="w-6 h-6 text-green-500" /> Detalhes da Solicitação #{returnDetail.id}
              </DialogTitle>
              <DialogDescription className="text-gray-500">Informações completas da solicitação de troca/devolução</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Informações do Cliente */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <div className="font-medium text-gray-900">{returnDetail.userName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <div className="font-medium text-gray-900">{returnDetail.userEmail || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Telefone:</span>
                    <div className="font-medium text-gray-900">{returnDetail.userPhone || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Pedido:</span>
                    <div className="font-medium text-gray-900">{returnDetail.orderId || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Informações do Produto */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-500" />
                  Informações do Produto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Produto:</span>
                    <div className="font-medium text-gray-900">{returnDetail.productName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantidade:</span>
                    <div className="font-medium text-gray-900">{returnDetail.quantity || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <div className="font-medium text-gray-900">
                      {returnDetail.requestType === 'EXCHANGE' ? 'Troca' : 'Devolução'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      returnDetail.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      returnDetail.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      returnDetail.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {returnDetail.status === 'PENDING' ? 'Pendente' :
                       returnDetail.status === 'APPROVED' ? 'Aprovado' :
                       returnDetail.status === 'REJECTED' ? 'Rejeitado' :
                       returnDetail.status || 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo e Descrição */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  Detalhes da Solicitação
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Motivo:</span>
                    <div className="font-medium text-gray-900">{returnDetail.reason || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Descrição:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-800 whitespace-pre-line">
                      {returnDetail.description || 'Não informado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fotos */}
              {returnDetail.photoUrls && returnDetail.photoUrls.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-500" />
                    Fotos do Produto
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {returnDetail.photoUrls.map((photo: string, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={`http://localhost:8080${photo}`}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/150x100?text=Erro+na+imagem'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas do Admin */}
              {returnDetail.adminNotes && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    Notas do Administrador
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-line">
                    {returnDetail.adminNotes}
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Informações de Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Criado em:</span>
                    <div className="font-medium text-gray-900">
                      {returnDetail.createdAt ? new Date(returnDetail.createdAt).toLocaleString('pt-BR') : '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Atualizado em:</span>
                    <div className="font-medium text-gray-900">
                      {returnDetail.updatedAt ? new Date(returnDetail.updatedAt).toLocaleString('pt-BR') : '-'}
                    </div>
                  </div>
                  {returnDetail.resolvedAt && (
                    <div>
                      <span className="text-gray-500">Resolvido em:</span>
                      <div className="font-medium text-gray-900">
                        {new Date(returnDetail.resolvedAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700">Fechar</button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Detalhes do Pedido */}
      {showOrderDetailsModal && selectedOrder && (
        <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-blue-800">
                <ShoppingCart className="w-6 h-6 text-blue-500" /> Detalhes do Pedido #{selectedOrder.id}
              </DialogTitle>
              <DialogDescription className="text-gray-500">Informações completas do pedido</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Informações do Cliente */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Informações do Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📝 Nome:</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.customerInfo?.name || selectedOrder.userName || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📧 Email:</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.customerInfo?.email || selectedOrder.userEmail || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📞 Telefone:</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.customerInfo?.phone || selectedOrder.userPhone || 'Não informado'}
                    </span>
                  </div>
                                     <div className="flex items-start gap-2">
                     <span className="text-gray-500 mt-1">📍 Endereço:</span>
                     <span className="font-medium text-gray-900">
                       {selectedOrder.customerInfo?.address ? (typeof selectedOrder.customerInfo.address === 'string' ? selectedOrder.customerInfo.address : formatAddress(selectedOrder.customerInfo.address)) : 'Não informado'}
                     </span>
                   </div>
                </div>
              </div>

              {/* Detalhes do Pedido */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Detalhes do Pedido
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📅 Data:</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('pt-BR') : 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📊 Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                      selectedOrder.status === 'delivering' ? 'bg-purple-100 text-purple-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.status === 'pending' ? 'Pendente' :
                       selectedOrder.status === 'confirmed' ? 'Confirmado' :
                       selectedOrder.status === 'preparing' ? 'Preparando' :
                       selectedOrder.status === 'delivering' ? 'Entregando' :
                       selectedOrder.status === 'delivered' ? 'Entregue' :
                       'Cancelado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📦 Itens:</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.items?.length || 0} produto(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">💰 Total:</span>
                    <span className="font-bold text-lg text-green-600">
                      R$ {(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-500" />
                Itens do Pedido
              </h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name || 'Produto não informado'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>📊 Qtd: {item.quantity || 0}</span>
                        <span>💰 Preço: R$ {(item.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">Nenhum item encontrado</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700">
                  Fechar
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Seção de Exportação PDF Completa */}



    </div>
  )
}

// Função para formatar endereço
function formatAddress(address: any): string {
  if (typeof address === 'string') {
    return address
  }
  
  if (typeof address === 'object' && address !== null) {
    const parts = []
    
    if (address.street) parts.push(address.street)
    if (address.number) parts.push(address.number)
    if (address.complement) parts.push(address.complement)
    if (address.neighborhood) parts.push(address.neighborhood)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    
    return parts.join(', ')
  }
  
  return 'Endereço não informado'
}

function ProductForm({ 
  product, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  product: Product | null
  onSave: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<{
    id: string
    name: string
    price: number
    originalPrice: number
    category: string
    description: string
    image: string
    brand: string
    unit: string
    stock: number
    inStock: boolean
    tags: string[]
  }>({
    id: '',
    name: '',
    price: 0,
    originalPrice: 0,
    category: '',
    description: '',
    image: '',
    brand: '',
    unit: '',
    stock: 0,
    inStock: true,
    tags: []
  })

  // Atualizar formData quando product mudar
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id || '',
        name: product.name || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || 0,
        category: product.category || '',
        description: product.description || '',
        image: product.image || '',
        brand: product.brand || '',
        unit: product.unit || '',
        stock: product.stock || 0,
        inStock: product.inStock ?? true,
        tags: product.tags || []
      })
    } else {
      setFormData({
        id: '',
        name: '',
        price: 0,
        originalPrice: 0,
        category: '',
        description: '',
        image: '',
        brand: '',
        unit: '',
        stock: 0,
        inStock: true,
        tags: []
      })
    }
  }, [product])

  const [newTag, setNewTag] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const categories = [
    "REFRIGERANTES E OUTROS LIQUIDOS",
    "MERCEARIA",
    "MOLHOS",
    "RESFRIADOS",
    "BISCOITOS",
    "FRIOS Á GRANEL E PACOTES",
    "CONFEITARIA E OUTROS",
    "PANIFICAÇÃO",
    "DESCARTÁVEIS",
    "PRODUTOS DE LIMPEZA",
    "TEMPEROS",
    "ENLATADOS E EM CONSERVA",
    "CONGELADOS",
    "SUSHITERIA"
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
        setFormData(prev => ({ ...prev, image: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📋 Validando formulário:', formData)
    
    // Validação mais detalhada
    const errors = []
    
    if (!formData.id || formData.id.trim() === '') {
      errors.push('ID do produto é obrigatório')
    }
    
    if (!formData.name || formData.name.trim() === '') {
      errors.push('Nome do produto é obrigatório')
    }
    
    if (!formData.price || formData.price <= 0) {
      errors.push('Preço deve ser maior que zero')
    }
    
    if (!formData.category || formData.category.trim() === '') {
      errors.push('Categoria é obrigatória')
    }
    
    if (errors.length > 0) {
      const errorMessage = 'Por favor, corrija os seguintes erros:\n' + errors.join('\n')
      alert(errorMessage)
      return
    }
    
    // Preparar dados para envio
    const productToSave = {
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim(),
      category: formData.category.trim(),
      description: formData.description?.trim() || '',
      brand: formData.brand?.trim() || '',
      unit: formData.unit?.trim() || '',
      price: parseFloat(formData.price.toString()),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice.toString()) : 0,
      stock: parseInt(formData.stock.toString()) || 0,
      inStock: formData.inStock,
      tags: formData.tags || []
    }
    
    console.log('✅ Dados validados, enviando:', productToSave)
    onSave(productToSave)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.id || ''}
              onChange={(e) => handleInputChange('id', e.target.value)}
              disabled={!!product} // Desabilitar durante edição
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                product ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Ex: 110, 111, 112..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {product ? 'ID não pode ser alterado durante a edição' : 'Escolha um ID único para o produto'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nome do produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Descrição detalhada do produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Marca do produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidade
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: kg, L, un, g"
            />
          </div>
        </div>

        {/* Preços e Estoque */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Atual <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.price?.toString() || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Original
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.originalPrice?.toString() || ''}
              onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estoque
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock?.toString() || ''}
              onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="inStock"
              checked={formData.inStock}
              onChange={(e) => handleInputChange('inStock', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
              Em estoque
            </label>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Descrição detalhada do produto..."
        />
      </div>

      {/* Upload de Imagem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagem do Produto
        </label>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {(imagePreview || formData.image) && (
            <div className="mt-2">
              <img
                src={imagePreview || formData.image}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Adicionar tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Adicionar
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2 inline" />
              {product ? 'Atualizar' : 'Criar'} Produto
            </>
          )}
        </button>
      </div>
    </form>
  )
}
