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
  Copy
} from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { ChartContainer } from '@/components/ui/chart'
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
  monthlyRevenue: Array<{ month: string; revenue: number }>
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
  category: string
  description: string
  inStock: boolean
  image?: string
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
    address: string
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cameraRequests, setCameraRequests] = useState<CameraRequest[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [productPromotions, setProductPromotions] = useState<ProductPromotion[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [cameraDetail, setCameraDetail] = useState<CameraRequest | null>(null)
  const [feedbackDetail, setFeedbackDetail] = useState<any | null>(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<ProductPromotion | null>(null)
  
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
      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
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
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      }

      // Carregar usuários
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Carregar pedidos
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
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

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== id))
        loadData()
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
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

  const savePromotion = async (promotionData: any) => {
    setIsUpdating(true)
    try {
      console.log('Salvando promoção:', promotionData)
      
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
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [salesTrendsRes, topProductsRes, performanceRes] = await Promise.all([
        fetch('/api/proxy/java/admin/analytics/sales-trends'),
        fetch('/api/proxy/java/admin/analytics/top-products'),
        fetch('/api/proxy/java/admin/analytics/performance')
      ])

      if (salesTrendsRes.ok && topProductsRes.ok && performanceRes.ok) {
        const [salesTrends, topProducts, performance] = await Promise.all([
          salesTrendsRes.json(),
          topProductsRes.json(),
          performanceRes.json()
        ])

        setAnalyticsData({
          salesTrends,
          topProducts,
          performance
        })
        addNotification('success', 'Dados de analytics carregados com sucesso!')
      } else {
        addNotification('error', 'Erro ao carregar dados de analytics')
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
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

  // Carregar analytics quando o componente montar
  useEffect(() => {
    fetchAnalytics();
  }, []);

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
  const [formData, setFormData] = useState({
    productId: promotion?.productId || '',
    productName: promotion?.productName || '',
    originalPrice: promotion?.originalPrice?.toString() || '',
    newPrice: promotion?.newPrice?.toString() || '',
    image: promotion?.image || '',
    validUntil: promotion?.validUntil ? new Date(promotion.validUntil).toISOString().split('T')[0] : '',
    isActive: promotion?.isActive ?? true
  })

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleProductChange = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setFormData((prev: any) => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        originalPrice: product.price.toString(),
        image: product.image || ''
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
              {product.name}
            </option>
          ))}
        </select>
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
                        alert('Arquivo muito grande. Use uma imagem menor que 5MB.')
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
                      alert('Nenhuma imagem encontrada na área de transferência')
                    } catch (error) {
                      console.error('Erro ao colar imagem:', error)
                      alert('Erro ao colar imagem. Verifique se há uma imagem na área de transferência.')
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
          {formData.image && (
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
                    e.currentTarget.style.display = 'none'
                    alert('Erro ao carregar imagem. Verifique se o link está correto.')
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
                      <p className="text-2xl font-bold text-purple-900">R$ {stats.totalRevenue.toFixed(2)}</p>
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
                    const res = await fetch('/api/proxy/java/admin/report/monthly');
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `relatorio-mensal.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } else {
                      alert('Erro ao gerar PDF.');
                    }
                  }}
                >
                  <Eye className="w-5 h-5" /> PDF Mensal
                </button>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                  onClick={() => {
                    const doc = generateSalesReportPDF({
                      totalOrders: stats.totalOrders,
                      totalRevenue: stats.totalRevenue,
                      totalUsers: stats.totalUsers,
                      totalProducts: stats.totalProducts,
                      promotions: productPromotions.filter(p => p.isActive)
                    });
                    doc.save('relatorio-vendas.pdf');
                  }}
                >
                  <FileText className="w-5 h-5" /> Relatório de Vendas
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

              {/* Gráfico de Faturamento Mensal */}
              {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" /> Faturamento Mensal
                  </h3>
                  <ChartContainer
                    config={{
                      faturamento: { label: 'Faturamento', color: '#3b82f6' },
                    }}
                  >
                    {({ ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid }: any) => (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
                </div>
              )}

              {/* Gráfico de Pedidos Mensais */}
              {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" /> Evolução de Pedidos Mensais
                  </h3>
                  <ChartContainer
                    config={{
                      pedidos: { label: 'Pedidos', color: '#f59e42' },
                    }}
                  >
                    {({ ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend }: any) => (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [value, 'Pedidos']} />
                          <Legend />
                          <Bar dataKey="orders" fill="#f59e42" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
                </div>
              )}

              {/* Gráfico de Status dos Pedidos */}
              {stats?.orderStatus && stats.orderStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" /> Status dos Pedidos
                  </h3>
                  <ChartContainer
                    config={{
                      status: { label: 'Status', color: '#6366f1' },
                    }}
                  >
                    {({ ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend }: any) => (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.orderStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.orderStatus.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#f59e42', '#ef4444', '#6366f1'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, 'Pedidos']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
                </div>
              )}

              {/* Gráfico de Categorias de Produtos */}
              {stats?.productCategories && stats.productCategories.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" /> Distribuição por Categoria
                  </h3>
                  <ChartContainer
                    config={{
                      categorias: { label: 'Categorias', color: '#10b981' },
                    }}
                  >
                    {({ ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend }: any) => (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.productCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.productCategories.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e42', '#ef4444', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [value, 'Produtos']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
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
                  <DialogContent className="max-w-lg p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
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
                    onClick={() => {
                      const doc = generatePromotionsPDF(productPromotions);
                      doc.save('relatorio-promocoes.pdf');
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
                    onClick={() => exportToCSV(filteredProducts, 'produtos')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => {
                      const doc = generateProductsPDF(filteredProducts);
                      doc.save('catalogo-produtos.pdf');
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
                              <button className="text-blue-600 hover:text-blue-900">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
            <div>
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
                    onClick={() => {
                      const doc = generateOrdersPDF(filteredOrders);
                      doc.save('relatorio-pedidos.pdf');
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
                              <div className="text-sm font-medium text-gray-900">{order.userName || '-'}</div>
                              <div className="text-sm text-gray-500">{order.userPhone || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {order.total.toFixed(2) || '0.00'}
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
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              Ver Detalhes
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              Atualizar Status
                            </button>
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
                    onClick={() => {
                      const doc = generateCustomersPDF(filteredUsers);
                      doc.save('relatorio-clientes.pdf');
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
                          <span>{(javaSystemStatus.memory.usedHeap / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Heap Máximo:</span>
                          <span>{(javaSystemStatus.memory.maxHeap / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${javaSystemStatus.memory.heapUsagePercent}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {javaSystemStatus.memory.heapUsagePercent.toFixed(1)}% usado
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
                    onClick={fetchAnalytics} 
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
                              R$ {performanceMetrics.currentMonthRevenue?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-sm text-blue-600">Receita do Mês</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${performanceMetrics.revenueGrowth >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                              {performanceMetrics.revenueGrowth >= 0 ? '+' : ''}{performanceMetrics.revenueGrowth?.toFixed(1) || '0'}%
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
                              R$ {performanceMetrics.averageOrderValue?.toFixed(2) || '0.00'}
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
                      <p className="text-2xl font-bold">99.9%</p>
                    </div>
                    <Clock className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Memória</p>
                      <p className="text-2xl font-bold">45%</p>
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
                    <div className="text-xs text-green-600 mt-1">+12% este mês</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats?.totalOrders || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pedidos Hoje</div>
                    <div className="text-xs text-green-600 mt-1">+8% vs ontem</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">Receita Hoje</div>
                    <div className="text-xs text-green-600 mt-1">+15% vs ontem</div>
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
                        <span className="font-medium text-green-600">99.9%</span>
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

      {/* (1) Modal de detalhes do feedback */}
      {feedbackDetail && (
        <Dialog open={!!feedbackDetail} onOpenChange={open => !open && setFeedbackDetail(null)}>
          <DialogContent className="max-w-lg p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
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
          <DialogContent className="max-w-lg p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100">
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

      {/* Seção de Exportação PDF Completa */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Exportação de Relatórios PDF
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.open('/api/proxy/java/admin/report/complete', '_blank')}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FileText className="h-8 w-8 mb-2" />
            <span className="font-semibold">Relatório Completo</span>
            <span className="text-xs opacity-90">Todos os dados</span>
          </button>
          
          <button
            onClick={() => window.open('/api/proxy/java/admin/report/products', '_blank')}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Package className="h-8 w-8 mb-2" />
            <span className="font-semibold">Relatório Produtos</span>
            <span className="text-xs opacity-90">Estoque e preços</span>
          </button>
          
          <button
            onClick={() => window.open('/api/proxy/java/admin/report/orders', '_blank')}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <ShoppingCart className="h-8 w-8 mb-2" />
            <span className="font-semibold">Relatório Pedidos</span>
            <span className="text-xs opacity-90">Vendas e status</span>
          </button>
          
          <button
            onClick={() => window.open('/api/proxy/java/admin/report/analytics', '_blank')}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <BarChart3 className="h-8 w-8 mb-2" />
            <span className="font-semibold">Relatório Analytics</span>
            <span className="text-xs opacity-90">Métricas e tendências</span>
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
            <div className="text-3xl font-bold text-blue-800 mb-2">R$ 2.450,00</div>
            <div className="flex items-center text-sm text-blue-600">
              <ArrowUp className="w-4 h-4 mr-1" />
              +12% vs ontem
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-green-900">Novos Clientes</h4>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-800 mb-2">8</div>
            <div className="flex items-center text-sm text-green-600">
              <ArrowUp className="w-4 h-4 mr-1" />
              +3 esta semana
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-purple-900">Taxa de Conversão</h4>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-800 mb-2">3.2%</div>
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
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Estoque Baixo</p>
              <p className="text-sm text-red-700">5 produtos com estoque abaixo do mínimo</p>
            </div>
            <button className="text-red-600 hover:text-red-800">
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">Promoções Expirando</p>
              <p className="text-sm text-yellow-700">3 promoções expiram nas próximas 24h</p>
            </div>
            <button className="text-yellow-600 hover:text-yellow-800">
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Novos Feedbacks</p>
              <p className="text-sm text-blue-700">2 novos feedbacks aguardando revisão</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Avançadas */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
          Métricas Avançadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">98.5%</div>
            <div className="text-sm text-gray-600">Satisfação do Cliente</div>
            <div className="text-xs text-green-600 mt-1">+2.1% vs mês passado</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">15min</div>
            <div className="text-sm text-gray-600">Tempo Médio de Entrega</div>
            <div className="text-xs text-green-600 mt-1">-3min vs mês passado</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">2.3x</div>
            <div className="text-sm text-gray-600">Taxa de Retorno</div>
            <div className="text-xs text-green-600 mt-1">+0.2x vs mês passado</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">85%</div>
            <div className="text-sm text-gray-600">Taxa de Conversão Mobile</div>
            <div className="text-xs text-green-600 mt-1">+5% vs mês passado</div>
          </div>
        </div>
      </div>

      {/* Sistema de Tarefas Rápidas */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
          Tarefas Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Revisar Feedbacks</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                2 novos
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">2 feedbacks aguardando revisão</p>
            <button className="text-sm text-green-600 hover:text-green-800 font-medium">
              Ver detalhes →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Atualizar Estoque</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                5 baixo
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">5 produtos com estoque baixo</p>
            <button className="text-sm text-green-600 hover:text-green-800 font-medium">
              Gerenciar estoque →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Criar Promoção</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                3 expiram
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">3 promoções expiram em 24h</p>
            <button className="text-sm text-green-600 hover:text-green-800 font-medium">
              Criar promoção →
            </button>
          </div>
        </div>
      </div>

      {/* Configurações Rápidas */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          Configurações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Notificações</p>
              <p className="text-sm text-gray-600">Configurar alertas</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-3">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Segurança</p>
              <p className="text-sm text-gray-600">Configurar acesso</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Aparência</p>
              <p className="text-sm text-gray-600">Personalizar tema</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mr-3">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Backup</p>
              <p className="text-sm text-gray-600">Exportar dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Atividades */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <History className="w-5 h-5 mr-2 text-indigo-600" />
          Histórico de Atividades
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Nova promoção criada</p>
              <p className="text-xs text-gray-600">Promoção "Desconto 20%" foi criada</p>
              <p className="text-xs text-gray-400 mt-1">há 5 minutos</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Estoque atualizado</p>
              <p className="text-xs text-gray-600">Produto "Arroz Integral" teve estoque atualizado</p>
              <p className="text-xs text-gray-400 mt-1">há 15 minutos</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Relatório gerado</p>
              <p className="text-xs text-gray-600">Relatório mensal foi exportado em PDF</p>
              <p className="text-xs text-gray-400 mt-1">há 1 hora</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Feedback respondido</p>
              <p className="text-xs text-gray-600">Feedback do cliente João Silva foi respondido</p>
              <p className="text-xs text-gray-400 mt-1">há 2 horas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionalidades de Produtividade */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          Funcionalidades de Produtividade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
            <Calendar className="w-6 h-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Agendar Tarefas</p>
              <p className="text-xs opacity-90">Programar atividades</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200">
            <Users className="w-6 h-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Gerenciar Equipe</p>
              <p className="text-xs opacity-90">Permissões e acesso</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
            <BarChart3 className="w-6 h-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Relatórios Avançados</p>
              <p className="text-xs opacity-90">Análises detalhadas</p>
            </div>
          </button>
        </div>
      </div>


    </div>
  )
}
