'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  Users, Package, ShoppingCart, DollarSign, Settings, 
  Bell, LogOut, Search, Plus, Edit, Trash, Eye,
  BarChart3, TrendingUp, Activity, Globe, Store,
  MessageCircle, Camera, RefreshCw, RotateCcw,
  CheckCircle, AlertCircle, Clock, Zap, Star, Tag,
  PieChart, BarChart, ImageIcon, Upload
} from 'lucide-react'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import ChatInterface from '@/components/admin/ChatInterface'
import { varejoFacilClient } from '@/lib/varejo-facil-client'
import {
  generateSalesReportPDF,
  generateProductsPDF,
  generatePromotionsPDF,
  generateOrdersPDF,
  generateCustomersPDF,
  generateUsersPDF,
  generateFeedbackPDF,
  generateCameraRequestsPDF,
  generateReturnsPDF
} from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

// Interfaces
interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingCameraRequests: number
  pendingFeedback: number
  pendingReturns: number
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

interface Order {
  id: string
  userId: string
  userName: string
  customerInfo?: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
}

interface Feedback {
  id: string
  name: string
  email: string
  message: string
  rating: number
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved'
}

interface CameraRequest {
  id: string
  name: string
  phone: string
  cause: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed'
  messages: ChatMessage[]
}

interface ReturnRequest {
  id: string
  orderId: string
  userName: string
  reason: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  messages: ChatMessage[]
}

interface ChatMessage {
  id: string
  sender: 'user' | 'admin'
  message: string
  timestamp: string
}

interface SyncProgress {
  status: 'idle' | 'running' | 'completed' | 'error'
  current: number
  total: number
  message: string
  error?: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const router = useRouter()
  const storeUser = useAuthStore((s) => s.user)

  // Estados principais - DEVEM vir antes de qualquer return
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMainLoading, setIsMainLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingCameraRequests: 0,
    pendingFeedback: 0,
    pendingReturns: 0
  })

  // Estados de dados
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [highlightOrderIds, setHighlightOrderIds] = useState<Set<string>>(new Set())
  const [users, setUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [cameraRequests, setCameraRequests] = useState<CameraRequest[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [productPromotions, setProductPromotions] = useState<any[]>([])

  // Estados de Varejo Fácil
  const [varejoFacilProducts, setVarejoFacilProducts] = useState<any[]>([])
  const [varejoFacilSections, setVarejoFacilSections] = useState<any[]>([])
  const [varejoFacilBrands, setVarejoFacilBrands] = useState<any[]>([])
  const [varejoFacilGenres, setVarejoFacilGenres] = useState<any[]>([])
  const [varejoFacilData, setVarejoFacilData] = useState({
    products: { total: 0, items: [] },
    sections: { total: 0, items: [] },
    brands: { total: 0, items: [] },
    genres: { total: 0, items: [] }
  })
  const [showVarejoFacilModal, setShowVarejoFacilModal] = useState(false)
  const [selectedVarejoFacilData, setSelectedVarejoFacilData] = useState<any[]>([])
  const [selectedVarejoFacilType, setSelectedVarejoFacilType] = useState<string>('')

  // Estados de sincronização
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    message: ''
  })
  const [autoSync, setAutoSync] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  // Estados de imagens do site
  const [categoryImages, setCategoryImages] = useState<{[key: string]: string}>({})
  const [banners, setBanners] = useState({
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
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingCategoryUrl, setEditingCategoryUrl] = useState('')

  // Estados de chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')

  // Estados de promoções
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<any>(null)
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    type: 'promotion', // Apenas promoção
    discountType: 'percentage', // 'percentage' ou 'fixed'
    discount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    image: '',
    products: [] as any[],
    selectedProduct: null as any // Produto selecionado
  })
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Estados de edição de produtos
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    inStock: true
  })

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('7d')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(50)
  const [onlySoldLast2Months, setOnlySoldLast2Months] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [lastLoadTime, setLastLoadTime] = useState(0)
  const [isSubmittingPromotion, setIsSubmittingPromotion] = useState(false)
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)
  // Estados de criação de usuário
  const [showUserModal, setShowUserModal] = useState(false)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'manager' | 'admin',
    phone: ''
  })

  // Verificação de autenticação - APÓS todos os hooks
  useEffect(() => {
    if (status === 'loading') return // Aguardando carregar

    const nextAuthEmail = user?.email || null
    const isNextAuthAdmin = nextAuthEmail === 'davikalebe20020602@gmail.com'
    const isStoreAdmin = !!(storeUser && (storeUser.role === 'admin' || storeUser.email === 'admin' || storeUser.email === 'davikalebe20020602@gmail.com'))
    const isLoggedIn = status === 'authenticated' || !!storeUser

    if (!isLoggedIn) {
      router.push('/login?admin=true&callback=%2Fadmin')
      return
    }

    if (!(isNextAuthAdmin || isStoreAdmin)) {
      router.push('/')
      return
    }
  }, [user, status, storeUser, router])

  // Se não é admin, renderizar tela de acesso negado
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  // Se não atender os critérios de admin (nem sessão NextAuth admin nem store admin), bloqueia
  const nextAuthEmail = user?.email || null
  const isNextAuthAdmin = nextAuthEmail === 'davikalebe20020602@gmail.com'
  const isStoreAdmin = !!(storeUser && (storeUser.role === 'admin' || storeUser.email === 'admin' || storeUser.email === 'davikalebe20020602@gmail.com'))
  if (!(isNextAuthAdmin || isStoreAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa ser um administrador para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Helper function to safely parse JSON responses
  const safeJsonParse = async (response: Response) => {
    try {
      if (!response.ok) {
        console.warn(`Response not ok: ${response.status}`)
        return null
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON')
        return null
      }
      
      const text = await response.text()
      if (!text || text.trim() === '') {
        console.warn('Empty response body')
        return null
      }
      
      return JSON.parse(text)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return null
    }
  }

  // useEffect para carregar dados iniciais
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        await loadData()
        loadSyncHistory() // Carregar histórico de sincronização
      } catch (error) {
        console.error('Erro na inicialização:', error)
      } finally {
        // Garantir que o loading sempre pare
        setIsMainLoading(false)
        setIsDataLoading(false)
      }
    }
    
    initializeAdmin()
    
    // Timeout de segurança para parar loading em 10 segundos
    const safetyTimeout = setTimeout(() => {
      console.log('⏰ Timeout de segurança: parando loading forçadamente')
      setIsMainLoading(false)
      setIsDataLoading(false)
    }, 10000)
    
    return () => clearTimeout(safetyTimeout)
  }, [])

  // useEffect separado para autoSync
  useEffect(() => {
    if (autoSync) {
      // Executar sincronização imediatamente quando ativar
      startVarejoFacilSync()
      
      // Configurar sincronização automática a cada hora
      const interval = setInterval(() => {
        console.log('🔄 Executando sincronização automática...')
        startVarejoFacilSync()
      }, 4 * 60 * 60 * 1000) // 4 horas (reduzir uso de recursos)
      
      return () => clearInterval(interval)
    }
  }, [autoSync])

  // useEffect para carregar imagens salvas
  useEffect(() => {
    loadSiteImages()
  }, [])

  // Função para limpar dados não utilizados e liberar memória
  const cleanupMemory = () => {
    // Limitar arrays grandes para economizar memória
    if (products.length > 200) {
      setProducts(prev => prev.slice(0, 200))
    }
    if (orders.length > 200) {
      setOrders(prev => prev.slice(0, 200))
    }
    if (users.length > 100) {
      setUsers(prev => prev.slice(0, 100))
    }
    
    // Force garbage collection se disponível
    if (window.gc) {
      window.gc()
    }
  }

  // Cleanup de memória a cada 5 minutos
  useEffect(() => {
    const memoryCleanup = setInterval(cleanupMemory, 5 * 60 * 1000)
    return () => clearInterval(memoryCleanup)
  }, [products.length, orders.length, users.length])

  // Polling contínuo para notificações de novas mensagens
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      // Sempre verifica por novas mensagens para mostrar notificações
      loadChatData()
    }, 2000) // A cada 2 segundos verifica novas mensagens

    return () => clearInterval(notificationInterval)
  }, []) // Executa sempre, independente de qualquer estado

  // Polling para atualizar chat em tempo real - mais agressivo
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null

    if (activeTab === 'camera-requests' || activeTab === 'returns') {
      console.log('🔄 [Admin] Iniciando polling do chat - Tab:', activeTab)
      pollingInterval = setInterval(() => {
        console.log('🔄 [Admin] Atualizando dados do chat...')
        // Para chat, carregar apenas dados específicos sem throttle
        loadChatData()
      }, 500) // Atualiza a cada 500ms para ser mais responsivo
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        console.log('🔄 [Admin] Parando polling do chat')
      }
    }
  }, [activeTab]) // Removendo selectedChat da dependência

  // Função específica para carregar dados do chat sem throttle
  const loadChatData = async () => {
    try {
      if (activeTab === 'camera-requests') {
        const cameraRes = await fetch('/api/camera-requests', { headers: { 'x-admin': 'true' } })
        if (cameraRes.ok) {
          const cameraData = await safeJsonParse(cameraRes)
          setCameraRequests(Array.isArray(cameraData?.data) ? cameraData.data : [])
        }
      } else if (activeTab === 'returns') {
        const returnsRes = await fetch('/api/return-requests', { headers: { 'x-admin': 'true' } })
        if (returnsRes.ok) {
          const returnsData = await safeJsonParse(returnsRes)
          setReturnRequests(Array.isArray(returnsData?.data) ? returnsData.data : [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do chat:', error)
    }
  }

  const loadData = async () => {
    // Throttle: não carregar dados se foi carregado há menos de 2 segundos
    const now = Date.now()
    if (isDataLoading || (now - lastLoadTime < 2000)) {
      console.log('🚫 LoadData throttled - muito recente ou já carregando')
      return
    }
    
    try {
      setIsDataLoading(true)
      setLastLoadTime(now)
      
      // Carregar dados básicos com limitação para economizar memória
      const [productsRes, ordersRes, usersRes, feedbacksRes, cameraRes, returnsRes] = await Promise.all([
        fetch('/api/products'), // Carregar TODOS os produtos para pesquisa funcionar
        fetch('/api/orders?limit=100'),   // Limitar pedidos iniciais
        fetch('/api/users?limit=50'),     // Limitar usuários iniciais
        fetch('/api/feedback?limit=50'),  // Limitar feedback inicial
        fetch('/api/admin/camera-requests'),
        fetch('/api/return-requests?limit=50', { headers: { 'x-admin': 'true' } })
      ])

      // Carregar dados do Varejo Fácil apenas se necessário (economizar memória)
      if (activeTab === 'varejoFacil') {
      await loadVarejoFacilData()
      }

      if (productsRes.ok) {
        const data = await safeJsonParse(productsRes)
        setProducts(Array.isArray(data) ? data : [])
      } else {
        setProducts([])
      }

      if (ordersRes.ok) {
        const data = await safeJsonParse(ordersRes)
        // A API retorna {success: true, orders: [...]}
        if (data && data.success && Array.isArray(data.orders)) {
          setOrders(data.orders)
        } else if (Array.isArray(data)) {
          setOrders(data)
        } else {
          setOrders([])
        }
      } else {
        setOrders([])
      }

      if (usersRes.ok) {
        const data = await safeJsonParse(usersRes)
        setUsers(Array.isArray(data) ? data : [])
      } else {
        setUsers([])
      }

      if (feedbacksRes.ok) {
        const data = await safeJsonParse(feedbacksRes)
        const feedbackArray = data?.data || data
        setFeedbacks(Array.isArray(feedbackArray) ? feedbackArray : [])
      } else {
        setFeedbacks([])
      }

      if (cameraRes.ok) {
        const data = await safeJsonParse(cameraRes)
        const cameraArray = data?.data || data
        setCameraRequests(Array.isArray(cameraArray) ? cameraArray : [])
      } else {
        setCameraRequests([])
      }

      if (returnsRes.ok) {
        const data = await safeJsonParse(returnsRes)
        const returnArray = data?.data || data
        setReturnRequests(Array.isArray(returnArray) ? returnArray : [])
      } else {
        setReturnRequests([])
      }

      // Carregar promoções de produtos via API
      try {
        const promotionsResponse = await fetch('/api/admin/product-promotions')
        console.log('Status da resposta de promoções:', promotionsResponse.status)
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json()
          console.log('Promoções carregadas da API:', promotionsData)
          setProductPromotions(promotionsData)
          setPromotions(promotionsData)
        } else {
          console.error('Erro ao carregar promoções via API')
          setProductPromotions([])
          setPromotions([])
        }
      } catch (error) {
        console.error('Erro ao buscar promoções:', error)
        setProductPromotions([])
        setPromotions([])
      }

      // Calcular estatísticas
      await updateStats()

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsDataLoading(false)
      setIsMainLoading(false) // Parar loading principal após primeiro carregamento
    }
  }

  // Atualizar pedidos manualmente com badge de novos
  const refreshOrders = async () => {
    try {
      setIsRefreshingOrders(true)
      const prevIds = new Set((orders || []).map(o => o.id))
      const res = await fetch('/api/orders?limit=100')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await safeJsonParse(res)
      const nextOrders: Order[] = data?.orders || data || []
      setOrders(nextOrders)

      // Detectar novos
      const newOnes = nextOrders.filter(o => !prevIds.has(o.id)).map(o => o.id)
      setNewOrdersCount(newOnes.length)
      if (newOnes.length) {
        const ids = new Set<string>(newOnes)
        setHighlightOrderIds(ids)
        // Remover destaque após 6s
        setTimeout(() => setHighlightOrderIds(new Set()), 6000)
      } else {
        setHighlightOrderIds(new Set())
      }
    } catch (e) {
      console.error('Erro ao atualizar pedidos:', e)
    } finally {
      setIsRefreshingOrders(false)
    }
  }

  const loadVarejoFacilData = async () => {
    try {
      // Carregar apenas dados essenciais para economizar memória
      const [productsRes, sectionsRes, brandsRes, genresRes] = await Promise.all([
        fetch('/api/varejo-facil/products?count=5'),  // Reduzido
        fetch('/api/varejo-facil/sections?count=10'), // Reduzido
        fetch('/api/varejo-facil/brands?count=10'),   // Reduzido
        fetch('/api/varejo-facil/genres?count=10')    // Reduzido
      ])

      if (productsRes.ok) {
        const data = await safeJsonParse(productsRes)
        setVarejoFacilData(prev => ({ ...prev, products: data }))
        setVarejoFacilProducts(data?.items || [])
      }

      if (sectionsRes.ok) {
        const data = await safeJsonParse(sectionsRes)
        setVarejoFacilData(prev => ({ ...prev, sections: data }))
        setVarejoFacilSections(data?.items || [])
      }
      
      if (brandsRes.ok) {
        const data = await safeJsonParse(brandsRes)
        setVarejoFacilData(prev => ({ ...prev, brands: data }))
        setVarejoFacilBrands(data?.items || [])
      }

      if (genresRes.ok) {
        const data = await safeJsonParse(genresRes)
        setVarejoFacilData(prev => ({ ...prev, genres: data }))
        setVarejoFacilGenres(data?.items || [])
      }

      // Carregar histórico de sincronização
      try {
        const histRes = await fetch('/api/varejo-facil/sync-history')
        if (histRes.ok) {
          const histData = await histRes.json()
          setSyncHistory(Array.isArray(histData?.data) ? histData.data : [])
        }
      } catch (e) {
        console.warn('Sem histórico de sincronização ainda')
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Varejo Fácil:', error)
    }
  }

  const updateStats = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await safeJsonParse(statsRes)
        if (statsData?.success) {
          const data = statsData.data
          setStats({
            totalUsers: data.totalUsers || 0,
            totalProducts: data.totalProducts || 0,
            totalOrders: data.totalOrders || 0,
            totalRevenue: data.totalRevenue || 0,
            pendingCameraRequests: data.cameraRequestsByStatus?.pending || 0,
            pendingFeedback: data.feedbacksByStatus?.pending || 0,
            pendingReturns: data.returnRequestsByStatus?.pending || 0
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      // Fallback para cálculo local
      setStats({
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        pendingCameraRequests: cameraRequests.filter(r => r.status === 'pending').length,
        pendingFeedback: feedbacks.filter(f => f.status === 'pending').length,
        pendingReturns: returnRequests.filter(r => r.status === 'pending').length
      })
    }
  }

  const startVarejoFacilSync = async () => {
    const startTime = new Date().toISOString()
    
    try {
      setSyncProgress({
        status: 'running',
        current: 0,
        total: 0,
        message: '🔄 Iniciando sincronização do Varejo Fácil...'
      })

      // Atualizar mensagem de progresso
      setTimeout(() => {
        setSyncProgress(prev => ({
          ...prev,
          message: '📂 Buscando seções, marcas e gêneros...'
        }))
      }, 1000)

      setTimeout(() => {
        setSyncProgress(prev => ({
          ...prev,
          message: '💰 Sincronizando preços escalonados dos produtos...'
        }))
      }, 3000)

      setTimeout(() => {
        setSyncProgress(prev => ({
          ...prev,
          message: '📦 Aplicando preços nas fichas dos produtos...'
        }))
      }, 4500)

      setTimeout(() => {
        setSyncProgress(prev => ({
          ...prev,
          message: '🔄 Finalizando sincronização de produtos em lotes de 300...'
        }))
      }, 6000)


      // Chamar o endpoint correto de sincronização em lote
      const syncRes = await fetch('/api/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!syncRes.ok) {
        throw new Error(`Erro na API: ${syncRes.status}`)
      }

      const syncData = await syncRes.json()

      if (syncData.success) {
        const endTime = new Date().toISOString()
        const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
        
        setSyncProgress({
          status: 'completed',
          current: syncData.totalProducts || 0,
          total: syncData.totalProducts || 0,
          message: `✅ Sincronização concluída! ${syncData.totalProducts || 0} produtos sincronizados e salvos no products.json.`
        })

        // Salvar no histórico
        await saveSyncToHistory({
          startedAt: startTime,
          finishedAt: endTime,
          durationMs: duration,
          status: 'success',
          totals: {
            products: syncData.totalProducts || 0,
            sections: syncData.totalSections || 0,
            brands: syncData.totalBrands || 0,
            genres: syncData.totalGenres || 0
          }
        })

        // Atualizar dados do painel
        setVarejoFacilData(prev => ({
          ...prev,
          products: { total: syncData.totalProducts, items: [] },
          sections: { total: syncData.totalSections, items: [] },
          brands: { total: syncData.totalBrands, items: [] },
          genres: { total: syncData.totalGenres, items: [] }
        }))

        // Recarregar dados da página
        setTimeout(() => {
          loadData()
          window.location.reload()
        }, 2000)
      } else {
        throw new Error(syncData.error || 'Erro na sincronização')
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      
      // Salvar erro no histórico
      await saveSyncToHistory({
        startedAt: startTime,
        finishedAt: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      
      setSyncProgress({
        status: 'error',
        current: 0,
        total: 0,
        message: '❌ Erro na sincronização',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  const sendChatMessage = async (requestId: string, message: string, type: 'camera' | 'return') => {
    try {
      const endpoint = type === 'camera' ? '/api/camera-requests' : '/api/return-requests'
      const response = await fetch(`${endpoint}/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        setChatMessage('')
        loadData() // Recarregar dados para atualizar chat
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string, type: 'camera' | 'return') => {
    try {
      const endpoint = type === 'camera' ? '/api/camera-requests' : '/api/return-requests'
      const response = await fetch(`${endpoint}/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Funções de promoções
  const searchProducts = async (query: string) => {
    try {
      console.log('🔍 Buscando produtos para promoção:', query)
      const response = await fetch(`/api/promotions/products/search?search=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('✅ Produtos encontrados:', result.data.length)
          setSearchResults(result.data || [])
        } else {
          console.error('Erro na busca:', result.error)
          setSearchResults([])
        }
      }
    } catch (error) {
      console.error('❌ Erro na busca de produtos:', error)
      setSearchResults([])
    }
  }

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmittingPromotion) {
      console.log('🚫 Já está enviando promoção, aguarde...')
      return
    }
    
    if (!promotionForm.selectedProduct) {
      alert('Selecione um produto primeiro!')
      return
    }
    
    if (!promotionForm.title?.trim()) {
      alert('Título é obrigatório!')
      return
    }
    
    if (!promotionForm.discount || parseFloat(promotionForm.discount.toString()) <= 0) {
      alert('Desconto deve ser maior que zero!')
      return
    }
    
    if (!promotionForm.endDate) {
      alert('Data de validade é obrigatória!')
      return
    }
    
    setIsSubmittingPromotion(true)
    
    try {
      // Calcular preço com desconto
      const originalPrice = promotionForm.selectedProduct.price
      const discount = parseFloat(promotionForm.discount)
      let newPrice = 0
      
      if (promotionForm.discountType === 'percentage') {
        newPrice = originalPrice * (1 - discount / 100)
      } else {
        newPrice = Math.max(0, originalPrice - discount)
      }
      
      // Criar dados para a API
      const promotionData = {
        id: editingPromotion?.id,
        productId: promotionForm.selectedProduct.id,
        productName: promotionForm.selectedProduct.name,
        originalPrice: originalPrice,
        newPrice: newPrice,
        discount: promotionForm.discountType === 'percentage' 
          ? Math.round(((originalPrice - newPrice) / originalPrice) * 100)
          : Math.round(originalPrice - newPrice),
        image: promotionForm.image || promotionForm.selectedProduct.image || '',
        isActive: promotionForm.isActive !== false,
        validUntil: promotionForm.endDate,
        description: promotionForm.description || ''
      }
  
      console.log('🔍 Dados da promoção:', {
        produto: promotionForm.selectedProduct.name,
        precoOriginal: originalPrice,
        desconto: promotionForm.discount,
        tipoDesconto: promotionForm.discountType,
        precoFinal: newPrice
      })
  
      console.log('🚀 Salvando promoção via API...')
      
      // Salvar via API ao invés de localStorage
      const method = editingPromotion ? 'PUT' : 'POST'
      const url = editingPromotion 
        ? `/api/admin/product-promotions?id=${editingPromotion.id}`
        : '/api/admin/product-promotions'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promotionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar promoção')
      }

      const result = await response.json()
      console.log('✅ Promoção salva com sucesso via API!', result)
      
      setShowPromotionModal(false)
      setEditingPromotion(null)
      setPromotionForm({
        title: '',
        description: '',
        type: 'promotion',
        discountType: 'percentage',
        discount: '',
        startDate: '',
        endDate: '',
        isActive: true,
        image: '',
        products: [],
        selectedProduct: null
      })
      
      // Recarregar dados
      loadData()
      
      alert('Promoção salva com sucesso!')
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar promoção:', error)
      alert(`Erro ao salvar promoção: ${error.message || error}`)
    } finally {
      setIsSubmittingPromotion(false)
    }
  }

  const deletePromotion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return
    
    try {
      const response = await fetch(`/api/admin/product-promotions?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Atualizar localmente ao invés de recarregar tudo
        setPromotions(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Erro ao excluir promoção:', error)
    }
  }

  const editPromotion = (promotion: any) => {
    setEditingPromotion(promotion)
    setPromotionForm({
      title: promotion.title || '',
      description: promotion.description || '',
      type: promotion.type || 'promotion',
      discountType: promotion.discountType || 'percentage',
      discount: promotion.discount?.toString() || '',
      startDate: promotion.startDate?.split('T')[0] || '',
      endDate: promotion.endDate?.split('T')[0] || '',
      isActive: promotion.isActive !== false,
      image: promotion.image || '',
      products: promotion.products || [],
      selectedProduct: promotion.selectedProduct || null
    })
    setShowPromotionModal(true)
  }

  // Funções de produtos
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Evitar múltiplas submissões
    if (isSubmittingProduct) {
      console.log('🚫 Já está enviando produto, aguarde...')
      return
    }
    
    setIsSubmittingProduct(true)
    
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}` 
        : '/api/admin/products'
      
      const productData = {
        ...productForm,
        id: editingProduct?.id,
        price: parseFloat(productForm.price)
      }

      console.log('🚀 Enviando produto:', productData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      console.log('📡 Response status produto:', response.status)
      const result = await response.json()
      console.log('📦 Response data produto:', result)

      if (response.ok && result.success) {
        console.log('✅ Produto salvo com sucesso!', result)
        
        // Fechar modal e limpar form
        setShowProductModal(false)
        setEditingProduct(null)
        setProductForm({
          name: '',
          price: '',
          category: '',
          description: '',
          image: '',
          inStock: true
        })
        
        // Recarregar dados para garantir que a imagem apareça
        await loadData()
        
        console.log('✅ Produto salvo e dados recarregados!')
        alert('Produto salvo com sucesso!')
      } else {
        console.error('❌ Erro na resposta produto:', result)
        alert(`Erro ao salvar produto: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error)
      alert(`Erro de rede produto: ${error}`)
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  const editProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      description: product.description || '',
      image: product.image || '',
      inStock: product.inStock !== false
    })
    setShowProductModal(true)
  }

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
        })

        if (response.ok) {
          loadData()
        }
      } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
    }
  }

  // Funções de upload de imagens
  const loadSiteImages = async () => {
    try {
      // Carregar imagens das categorias
      const categoryResponse = await fetch('/api/category-images')
      if (categoryResponse.ok) {
        const categoryResult = await categoryResponse.json()
        if (categoryResult.success) {
          setCategoryImages(categoryResult.images)
        }
      }

      // Carregar banners
      const bannersResponse = await fetch('/api/banners')
      if (bannersResponse.ok) {
        const bannersResult = await bannersResponse.json()
        if (bannersResult.success) {
          setBanners(bannersResult.banners)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar imagens do site:', error)
    }
  }

  const updateCategoryImage = async (category: string, newImageUrl: string) => {
    try {
      const updatedImages = { ...categoryImages, [category]: newImageUrl }
      
      const response = await fetch('/api/category-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedImages })
      })

      if (response.ok) {
        setCategoryImages(updatedImages)
        setEditingCategory(null)
        alert('Imagem da categoria atualizada com sucesso!')
      } else {
        throw new Error('Erro no servidor')
      }
    } catch (error) {
      console.error('Erro ao atualizar imagem da categoria:', error)
      alert('Erro ao atualizar imagem da categoria')
    }
  }

  const updateBanners = async (newBanners: any) => {
    try {
      const response = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: newBanners })
      })

      if (response.ok) {
        setBanners(newBanners)
        alert('Banners atualizados com sucesso!')
      } else {
        throw new Error('Erro no servidor')
      }
    } catch (error) {
      console.error('Erro ao atualizar banners:', error)
      alert('Erro ao atualizar banners')
    }
  }

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'site-image')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        throw new Error('Erro no upload')
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const addPromotionalBanner = () => {
    const newBanner = {
      id: Date.now(),
      title: "Novo Banner",
      subtitle: "Descrição do banner",
      image: "/images/placeholder.jpg",
      link: "/catalog",
      isActive: true
    }
    
    const newBanners = {
      ...banners,
      promotional: [...banners.promotional, newBanner]
    }
    
    updateBanners(newBanners)
  }

  const removePromotionalBanner = (bannerId: number) => {
    const newBanners = {
      ...banners,
      promotional: banners.promotional.filter(b => b.id !== bannerId)
    }
    
    updateBanners(newBanners)
  }

  // Funções do histórico de sincronização
  const loadSyncHistory = async () => {
    try {
      const response = await fetch('/api/sync-history')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSyncHistory(data.history)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const saveSyncToHistory = async (syncData: any) => {
    try {
      await fetch('/api/sync-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      })
      // Recarregar histórico
      loadSyncHistory()
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
    }
  }



  const deleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          loadData()
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
      }
    }
  }

  const createUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Nome e e-mail são obrigatórios')
      return
    }
    try {
      setIsSubmittingUser(true)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Erro ao criar usuário: ${res.status} ${txt}`)
      }
      setShowUserModal(false)
      setUserForm({ name: '', email: '', role: 'user', phone: '' })
      await loadData()
      setActiveTab('users')
    } catch (e) {
      console.error(e)
      alert('Falha ao criar usuário')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  const exportData = async (
    type: 'products' | 'orders' | 'users' | 'feedback' | 'camera-requests' | 'returns' | 'promotions'
  ) => {
    try {
      // Usar geradores padronizados para manter alinhamento
      if (type === 'products') {
        const selected = onlySoldLast2Months ? getProductsSoldInLast2Months() : products
        const doc = await generateProductsPDF(selected)
        doc.save(`products-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'orders') {
        const doc = await generateOrdersPDF(orders)
        doc.save(`orders-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'users') {
        const doc = await generateUsersPDF(users)
        doc.save(`users-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'feedback') {
        const doc = await generateFeedbackPDF(feedbacks)
        doc.save(`feedback-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'camera-requests') {
        const doc = await generateCameraRequestsPDF(cameraRequests)
        doc.save(`camera-requests-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'returns') {
        const doc = await generateReturnsPDF(returnRequests)
        doc.save(`returns-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }
      if (type === 'promotions') {
        const doc = await generatePromotionsPDF(promotions)
        doc.save(`promotions-${new Date().toISOString().split('T')[0]}.pdf`)
        return
      }

    } catch (error) {
  console.error('Erro ao exportar dados:', error)
      // Fallback para JSON se PDF falhar
      try {
        let fallbackData: any[] = []
        switch (type) {
          case 'products':
            fallbackData = onlySoldLast2Months ? getProductsSoldInLast2Months() : products
            break
          case 'orders':
            fallbackData = orders
            break
          case 'users':
            fallbackData = users
            break
          case 'feedback':
            fallbackData = feedbacks
            break
          case 'camera-requests':
            fallbackData = cameraRequests
            break
          case 'returns':
            fallbackData = returnRequests
            break
          case 'promotions':
            fallbackData = promotions
            break
        }
        
        const blob = new Blob([JSON.stringify(fallbackData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (fallbackError) {
        console.error('Erro no fallback JSON:', fallbackError)
      }
    }
  }

  // Produtos vendidos nos últimos 2 meses
  const getProductsSoldInLast2Months = () => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 2)
    const soldMap = new Map<string, { quantity: number; revenue: number }>()
    orders.forEach((order) => {
      const date = new Date(order.createdAt)
      if (date >= cutoff) {
        order.items?.forEach((it) => {
          const prev = soldMap.get(it.productId) || { quantity: 0, revenue: 0 }
          prev.quantity += it.quantity || 0
          prev.revenue += (it.price || 0) * (it.quantity || 0)
          soldMap.set(it.productId, prev)
        })
      }
    })
    // Enriquecer com dados dos produtos
    const productById = new Map(products.map((p) => [p.id, p]))
    const result = Array.from(soldMap.entries()).map(([productId, stats]) => {
      const p = productById.get(productId) || { id: productId, name: 'Produto', price: 0, category: '-', inStock: true }
      return { ...p, soldQuantity: stats.quantity, soldRevenue: stats.revenue }
    })
    // Ordenar por quantidade vendida desc
    result.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
    return result
  }

  const handleLogout = async () => {
    // Limpar localStorage manualmente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage')
      localStorage.clear()
    }
    
    await signOut({ callbackUrl: '/' })
  }

  // Fallback seguro para stats
  const safeStats = stats || { totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingCameraRequests: 0, pendingFeedback: 0, pendingReturns: 0 }

  if (isMainLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  // Log para debug de stats
  if (!stats) {
    console.warn('stats está indefinido, usando fallback')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar Navigation */}
        <div className="flex gap-6">
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <PieChart className="h-4 w-4 mr-3" />
                Analytics
              </button>
              
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'products' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Package className="h-4 w-4 mr-3" />
                Produtos
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-3" />
                Pedidos
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4 mr-3" />
                Usuários
              </button>
              
              <button
                onClick={() => setActiveTab('feedback')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'feedback' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-3" />
                Feedbacks
              </button>
              
              <button
                onClick={() => setActiveTab('camera-requests')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'camera-requests' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Camera className="h-4 w-4 mr-3" />
                Câmeras
              </button>
              
              <button
                onClick={() => setActiveTab('returns')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'returns' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <RotateCcw className="h-4 w-4 mr-3" />
                Trocas/Devoluções
              </button>
              
              <button
                onClick={() => setActiveTab('varejo-facil')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'varejo-facil' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Globe className="h-4 w-4 mr-3" />
                Varejo Fácil
              </button>
              
              <button
                onClick={() => setActiveTab('promotions')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'promotions' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Tag className="h-4 w-4 mr-3" />
                Promoções
              </button>
              
              <button
                onClick={() => setActiveTab('site-images')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'site-images' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-3" />
                Imagens do Site
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configurações
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalProducts}</p>
                      </div>
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalOrders}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Receita Total</p>
                        <p className="text-2xl font-bold text-gray-900">R$ {safeStats.totalRevenue.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Cards de pendências */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Solicitações de Câmera</p>
                        <p className="text-2xl font-bold text-orange-600">{safeStats.pendingCameraRequests}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                      </div>
                      <Camera className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Feedbacks</p>
                        <p className="text-2xl font-bold text-blue-600">{safeStats.pendingFeedback}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Trocas/Devoluções</p>
                        <p className="text-2xl font-bold text-red-600">{safeStats.pendingReturns}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                      </div>
                      <RotateCcw className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Gráficos e Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Pedidos por Status */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Pedidos por Status</h3>
                    <div className="space-y-3">
                      {['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'].map((status) => {
                        const count = orders.filter(order => order.status === status).length
                        const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                        const color = {
                          pending: 'bg-yellow-500',
                          confirmed: 'bg-blue-500',
                          preparing: 'bg-orange-500',
                          delivering: 'bg-purple-500',
                          delivered: 'bg-green-500',
                          cancelled: 'bg-red-500'
                        }[status]
                        
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {status === 'pending' ? 'Pendente' :
                                 status === 'confirmed' ? 'Confirmado' :
                                 status === 'preparing' ? 'Preparando' :
                                 status === 'delivering' ? 'Entregando' :
                                 status === 'delivered' ? 'Entregue' : 'Cancelado'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{count}</span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${color}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 w-8">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Gráfico de Receita Mensal */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Receita dos Últimos 7 Dias</h3>
                    <div className="space-y-3">
                      {[...Array(7)].map((_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - (6 - i))
                        const dayOrders = orders.filter(order => {
                          const orderDate = new Date(order.createdAt)
                          return orderDate.toDateString() === date.toDateString()
                        })
                        const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0)
                        const maxRevenue = Math.max(...[...Array(7)].map((_, j) => {
                          const checkDate = new Date()
                          checkDate.setDate(checkDate.getDate() - (6 - j))
                          const checkOrders = orders.filter(order => {
                            const orderDate = new Date(order.createdAt)
                            return orderDate.toDateString() === checkDate.toDateString()
                          })
                          return checkOrders.reduce((sum, order) => sum + order.total, 0)
                        }))
                        const height = maxRevenue > 0 ? (dayRevenue / maxRevenue) * 100 : 0
                        
                        return (
                          <div key={i} className="flex items-end space-x-2">
                            <div className="flex-1">
                              <div className="bg-blue-100 rounded-t" style={{ height: `${height}px` }}>
                                <div className="bg-blue-500 h-full rounded-t"></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 w-8 text-center">
                              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-600 w-16 text-right">
                              R$ {dayRevenue.toFixed(2)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Atividades Recentes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Novo pedido de {order.customerInfo?.name || order.userName || 'Cliente'}
                          </p>
                          <p className="text-sm text-gray-500">
                            R$ {order.total.toFixed(2)} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {/* Varejo Fácil */}
            {activeTab === 'varejo-facil' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Varejo Fácil</h2>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setAutoSync(!autoSync)} 
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        autoSync 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Zap className="h-4 w-4 mr-2 inline" />
                      {autoSync ? 'Auto Sync Ativo' : 'Ativar Auto Sync'}
                    </button>
                    <button 
                      onClick={startVarejoFacilSync} 
                      disabled={syncProgress.status === 'running'}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        syncProgress.status === 'running'
                          ? 'bg-blue-500 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                      } disabled:opacity-50`}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 inline ${syncProgress.status === 'running' ? 'animate-spin' : ''}`} />
                      {syncProgress.status === 'running' ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </button>
                  </div>
                </div>
                
                {/* Totais consolidados */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Produtos', value: varejoFacilData.products?.total || varejoFacilProducts.length, icon: Package, color: 'text-blue-600' },
                    { label: 'Seções', value: varejoFacilData.sections?.total || varejoFacilSections.length, icon: Globe, color: 'text-green-600' },
                    { label: 'Marcas', value: varejoFacilData.brands?.total || varejoFacilBrands.length, icon: Store, color: 'text-purple-600' },
                    { label: 'Gêneros', value: varejoFacilData.genres?.total || varejoFacilGenres.length, icon: Tag, color: 'text-yellow-600' },
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{card.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                          <p className="text-sm text-gray-500">Total sincronizado</p>
                        </div>
                        <card.icon className={`h-8 w-8 ${card.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Histórico de sincronização */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Sincronizações</h3>
                  {syncHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum histórico ainda.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quando</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seções</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marcas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gêneros</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {syncHistory.slice(0, 15).map((h) => (
                            <tr key={h.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(h.finishedAt || h.startedAt).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {typeof h.durationMs === 'number' ? `${Math.round(h.durationMs / 1000)}s` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{h.totals?.products ?? '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{h.totals?.sections ?? '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{h.totals?.brands ?? '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{h.totals?.genres ?? '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  h.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {h.status === 'success' ? 'Sucesso' : 'Erro'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Produtos</p>
                        <p className="text-2xl font-bold text-gray-900">{varejoFacilProducts.length}</p>
                        <p className="text-sm text-gray-500">Total sincronizado</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Seções</p>
                        <p className="text-2xl font-bold text-gray-900">{varejoFacilSections.length}</p>
                        <p className="text-sm text-gray-500">Total sincronizado</p>
                      </div>
                      <Globe className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Marcas</p>
                        <p className="text-2xl font-bold text-gray-900">{varejoFacilBrands.length}</p>
                        <p className="text-sm text-gray-500">Total sincronizado</p>
                      </div>
                      <Store className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gêneros</p>
                        <p className="text-2xl font-bold text-gray-900">{varejoFacilGenres.length}</p>
                        <p className="text-sm text-gray-500">Total sincronizado</p>
                      </div>
                      <Tag className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Status da Sincronização</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      {syncProgress.status === 'running' && (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      )}
                      {syncProgress.status === 'completed' && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                      {syncProgress.status === 'error' && (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{syncProgress.message}</p>
                        {syncProgress.status === 'running' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Sincronizando produtos do Varejo Fácil em lotes de 300...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {syncProgress.status === 'running' && (
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: syncProgress.total > 0 
                              ? `${(syncProgress.current / syncProgress.total) * 100}%` 
                              : '20%' 
                          }}
                        />
                      </div>
                    )}
                    
                    {syncProgress.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Teste da API concluído com sucesso!
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {syncProgress.current} produtos disponíveis na API do Varejo Fácil
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {syncProgress.status === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Erro no teste da API
                            </p>
                            {syncProgress.error && (
                              <p className="text-xs text-red-600 mt-1">
                                {syncProgress.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {varejoFacilProducts.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Produtos Recentes</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descrição
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {varejoFacilProducts.slice(0, 10).map((product: any) => (
                              <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.descricao}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.codigoInterno}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.descricaoReduzida || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedbacks */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Feedbacks</h2>
                  <div className="flex space-x-2">
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                      <option value="90d">Últimos 90 dias</option>
                    </select>
                    <button 
                      onClick={() => exportData('feedback')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Exportar PDF
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avaliação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mensagem
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
                          {(feedbacks || []).map((feedback) => (
                            <tr key={feedback.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{feedback.name}</div>
                                  <div className="text-sm text-gray-500">{feedback.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {feedback.message}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {feedback.status === 'pending' ? 'Pendente' :
                                   feedback.status === 'reviewed' ? 'Revisado' : 'Resolvido'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(feedback.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <select 
                                  value={feedback.status}
                                  onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="reviewed">Revisado</option>
                                  <option value="resolved">Resolvido</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Requests */}
            {activeTab === 'camera-requests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Solicitações de Câmera</h2>
                  <button 
                    onClick={() => exportData('camera-requests')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Exportar PDF
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de solicitações */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Solicitações</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {(cameraRequests || []).map((request) => (
                          <div 
                            key={request.id}
                            onClick={() => setSelectedChat(request.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              selectedChat === request.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{request.name}</p>
                                <p className="text-sm text-gray-500">{request.phone}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {request.status === 'pending' ? 'Pendente' :
                                 request.status === 'processing' ? 'Processando' : 'Concluído'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 truncate">{request.cause}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="lg:col-span-2">
                    {selectedChat ? (
                      <ChatInterface
                        requestId={selectedChat}
                        requestType="camera"
                        requestName={cameraRequests.find(r => r.id === selectedChat)?.name || ''}
                        requestStatus={cameraRequests.find(r => r.id === selectedChat)?.status || 'pending'}
                        onStatusChange={(status) => updateRequestStatus(selectedChat, status, 'camera')}
                      />
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
                        <p className="text-gray-500">Selecione uma solicitação para ver o chat</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Returns */}
            {activeTab === 'returns' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Trocas e Devoluções</h2>
                  <button 
                    onClick={() => exportData('returns')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Exportar PDF
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de solicitações */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Solicitações</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {(returnRequests || []).map((request) => (
                          <div 
                            key={request.id}
                            onClick={() => setSelectedChat(request.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              selectedChat === request.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{request.userName}</p>
                                <p className="text-sm text-gray-500">Pedido: {request.orderId}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {request.status === 'pending' ? 'Pendente' :
                                 request.status === 'approved' ? 'Aprovado' :
                                 request.status === 'rejected' ? 'Rejeitado' : 'Concluído'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 truncate">{request.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="lg:col-span-2">
                    {selectedChat ? (
                      <ChatInterface
                        requestId={selectedChat}
                        requestType="return"
                        requestName={returnRequests.find(r => r.id === selectedChat)?.userName || ''}
                        requestStatus={returnRequests.find(r => r.id === selectedChat)?.status || 'pending'}
                        onStatusChange={(status) => updateRequestStatus(selectedChat, status, 'return')}
                      />
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
                        <p className="text-gray-500">Selecione uma solicitação para ver o chat</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Produtos */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar em TODOS os produtos (nome, marca, categoria, descrição)..."
                        value={productSearchTerm}
                        onChange={(e) => {
                          setProductSearchTerm(e.target.value)
                          setCurrentPage(1) // Resetar para primeira página ao buscar
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button 
                      onClick={() => exportData('products')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 inline" />
                      Exportar
                    </button>
                    <button
                      onClick={() => setOnlySoldLast2Months((v) => !v)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${onlySoldLast2Months ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      title="Filtrar produtos vendidos nos últimos 2 meses"
                    >
                      {onlySoldLast2Months ? 'Vendidos 2 meses: ON' : 'Vendidos 2 meses: OFF'}
                    </button>
                    <button
                      onClick={() => {
                        const prev = onlySoldLast2Months
                        if (!prev) setOnlySoldLast2Months(true)
                        exportData('products')
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                    >
                      Exportar (Vendidos 2m)
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(null)
                        setProductForm({
                          name: '',
                          price: '',
                          category: '',
                          description: '',
                          image: '',
                          inStock: true
                        })
                        setShowProductModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Adicionar Produto
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
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
                              Estoque
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(onlySoldLast2Months ? getProductsSoldInLast2Months() : products)
                            .filter(product => {
                              if (!productSearchTerm) return true
                              
                              // Função para normalizar texto (remover acentos)
                              const normalizeText = (text) => {
                                return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
                              }
                              
                              const searchTerm = normalizeText(productSearchTerm)
                              const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1)
                              
                              const name = normalizeText(product.name || '')
                              const category = normalizeText(product.category || '')
                              const description = normalizeText((product as any).description || '')
                              const brand = normalizeText((product as any).brand || '')
                              const tags = normalizeText(((product as any).tags || []).join(' '))
                              
                              // Busca por correspondência exata
                              if (name.includes(searchTerm) || 
                                  category.includes(searchTerm) ||
                                  description.includes(searchTerm) ||
                                  brand.includes(searchTerm) ||
                                  tags.includes(searchTerm)) {
                                return true
                              }
                              
                              // Busca por palavras individuais
                              return searchWords.some(word => 
                                name.includes(word) || 
                                category.includes(word) ||
                                description.includes(word) ||
                                brand.includes(word) ||
                                tags.includes(word)
                              )
                            })
                            .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                            .map((product) => (
                            <tr key={product.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {('image' in product) && (product as any).image && (
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover mr-3" 
                                      src={(product as any).image} 
                                      alt={product.name} 
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    {('description' in product) && (product as any).description && (
                                      <div className="text-sm text-gray-500">{(product as any).description}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                R$ {product.price.toFixed(2)}
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
                                    onClick={() => editProduct(product)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pedidos */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
                  <div className="flex space-x-2">
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                      <option value="90d">Últimos 90 dias</option>
                    </select>
                    <button
                      onClick={refreshOrders}
                      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border ${isRefreshingOrders ? 'bg-gray-100 text-gray-500' : 'bg-white hover:bg-gray-50 text-gray-800'} border-gray-300`}
                      disabled={isRefreshingOrders}
                      title="Atualizar lista de pedidos"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                      Atualizar
                      {newOrdersCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                          Novos {newOrdersCount}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => exportData('orders')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 inline" />
                      Exportar
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
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
                          {(orders || []).map((order) => (
                            <tr key={order.id} className={`${highlightOrderIds.has(order.id) ? 'bg-green-50 animate-pulse' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{order.customerInfo?.name || order.userName || 'Cliente'}</div>
                                <div className="text-sm text-gray-500">
                                  {order.customerInfo?.email && `Email: ${order.customerInfo.email}`}
                                  {order.customerInfo?.phone && ` • Tel: ${order.customerInfo.phone}`}
                                  {!order.customerInfo?.email && !order.customerInfo?.phone && `ID: ${order.userId || order.id}`}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                  {order.items.length > 2 && '...'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                R$ {order.total.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select 
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    order.status === 'preparing' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    order.status === 'delivering' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                    'bg-red-100 text-red-800 border-red-200'
                                  }`}
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="confirmed">Confirmado</option>
                                  <option value="preparing">Preparando</option>
                                  <option value="delivering">Entregando</option>
                                  <option value="delivered">Entregue</option>
                                  <option value="cancelled">Cancelado</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usuários */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button 
                      onClick={() => exportData('users')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 inline" />
                      Exportar
                    </button>
                    <button 
                      onClick={() => setShowUserModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Adicionar Usuário
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
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
                              Função
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data de Cadastro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(users || [])
                            .filter(user => 
                              user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((user) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role === 'admin' ? 'Administrador' :
                                   user.role === 'manager' ? 'Gerente' : 'Cliente'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-indigo-600 hover:text-indigo-900">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Adicionar Usuário */}
            {showUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Novo Usuário</h3>
                    <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowUserModal(false)}>×</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nome</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">E-mail</label>
                      <input 
                        type="email"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Função</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={userForm.role}
                        onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                      >
                        <option value="user">Cliente</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 border-t flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 rounded-md text-sm border border-gray-300"
                      onClick={() => setShowUserModal(false)}
                      disabled={isSubmittingUser}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white disabled:opacity-50"
                      onClick={createUser}
                      disabled={isSubmittingUser}
                    >
                      {isSubmittingUser ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Promoções */}
            {activeTab === 'promotions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Promoções</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => exportData('promotions')}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Exportar PDF
                    </button>
                    <button
                                          onClick={() => {
                        setEditingPromotion(null)
                        setPromotionForm({
                          title: '',
                          description: '',
                          type: 'promotion',
                          discountType: 'percentage',
                          discount: '',
                          startDate: '',
                          endDate: '',
                          isActive: true,
                          image: '',
                          products: [],
                          selectedProduct: null
                        })
                      setShowPromotionModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Promoção
                  </button>
                  </div>
                </div>

                {/* Estatísticas de Promoções */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
                      </div>
                      <Tag className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ativas</p>
                        <p className="text-2xl font-bold text-green-600">
                          {promotions.filter(p => p.isActive && new Date(p.endDate) > new Date()).length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Agendadas</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {promotions.filter(p => p.isActive && new Date(p.startDate) > new Date()).length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Expiradas</p>
                        <p className="text-2xl font-bold text-red-600">
                          {promotions.filter(p => new Date(p.endDate) < new Date()).length}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Tabela de Promoções */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Lista de Promoções</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Produto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Preços
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Validade
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
                          {promotions.map((promotion) => {
                            const now = new Date()
                            const endDate = new Date(promotion.validUntil || promotion.endDate)
                            let status = 'Inativa'
                            let statusColor = 'bg-gray-100 text-gray-800'
                            
                            if (promotion.isActive) {
                              if (now <= endDate) {
                                status = 'Ativa'
                                statusColor = 'bg-green-100 text-green-800'
                              } else {
                                status = 'Expirada'
                                statusColor = 'bg-red-100 text-red-800'
                              }
                            }

                            return (
                              <tr key={promotion.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    {promotion.image && (
                                      <img 
                                        src={promotion.image} 
                                        alt={promotion.productName}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{promotion.productName}</div>
                                      <div className="text-sm text-gray-500">{promotion.description}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm">
                                    <div className="text-gray-500 line-through">R$ {promotion.originalPrice?.toFixed(2)}</div>
                                    <div className="font-bold text-green-600">R$ {promotion.newPrice?.toFixed(2)}</div>
                                    <div className="text-xs text-red-600">-{promotion.discount}%</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div>Válida até: {new Date(promotion.validUntil || promotion.endDate).toLocaleDateString('pt-BR')}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => editPromotion(promotion)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => deletePromotion(promotion.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gerenciamento de Imagens do Site */}
            {activeTab === 'site-images' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Imagens do Site</h2>
                  <div className="text-sm text-gray-500">
                    Gerencie as imagens do carrossel e banners promocionais
                  </div>
                </div>

                {/* Hero Banner */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Banner Principal (Hero)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Imagem Atual
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <img 
                            src={banners.hero.image} 
                            alt="Hero Banner" 
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nova Imagem
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadImage(file, 'hero')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Especificações:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Tamanho recomendado: 1920x800px</li>
                        <li>• Formato: JPG, PNG, WEBP</li>
                        <li>• Tamanho máximo: 5MB</li>
                        <li>• Usado na seção principal da página inicial</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Banner Promocional */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-orange-600" />
                    Banner Promocional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Imagem Atual
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <img 
                            src={banners.promotional[0]?.image || '/images/placeholder.jpg'} 
                            alt="Banner Promocional" 
                            className="w-full h-24 object-cover rounded"
                            onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nova Imagem
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadImage(file, 'banner')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Especificações:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Tamanho recomendado: 1200x300px</li>
                        <li>• Formato: JPG, PNG, WEBP</li>
                        <li>• Tamanho máximo: 3MB</li>
                        <li>• Usado na seção de ofertas da semana</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Carrossel de Imagens */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Package className="h-5 w-5 mr-2 text-green-600" />
                      Imagens das Categorias
                    </h3>
                    <p className="text-sm text-gray-600">
                      Edite as imagens que aparecem no carrossel de categorias
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(categoryImages).map(([category, image]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {category}
                            </label>
                            <img 
                              src={image} 
                              alt={`Categoria ${category}`} 
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingCategory === category ? editingCategoryUrl : image}
                                onChange={(e) => setEditingCategoryUrl(e.target.value)}
                                disabled={editingCategory !== category}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                                placeholder="URL da imagem"
                              />
                              {editingCategory === category ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateCategoryImage(category, editingCategoryUrl)}
                                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCategory(null)
                                      setEditingCategoryUrl('')
                                    }}
                                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCategory(category)
                                    setEditingCategoryUrl(image)
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Especificações do Carrossel:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Tamanho recomendado: 1200x600px</li>
                      <li>• Formato: JPG, PNG, WEBP</li>
                      <li>• Tamanho máximo: 5MB por imagem</li>
                      <li>• Mínimo 1 imagem, máximo 10 imagens</li>
                    </ul>
                  </div>
                </div>

                {uploadingImage && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>Enviando imagem...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Imagens do Site */}
            {activeTab === 'site-images' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Gerenciar Imagens do Site</h2>
                
                {/* Imagens das Categorias */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Imagens das Categorias (Carrossel)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Edite as imagens que aparecem no carrossel de categorias na página inicial
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryImages).map(([category, imageUrl]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <img 
                          src={imageUrl} 
                          alt={category}
                          className="w-full h-32 object-cover rounded-md mb-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                          }}
                        />
                        <h4 className="font-medium text-sm mb-2">{category}</h4>
                        
                        {editingCategory === category ? (
                          <div className="space-y-2">
                            <input
                              type="url"
                              placeholder="URL da nova imagem"
                              className="w-full px-3 py-1 text-sm border rounded"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const url = (e.target as HTMLInputElement).value
                                  if (url) updateCategoryImage(category, url)
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-${category}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    try {
                                      const url = await uploadImage(file)
                                      updateCategoryImage(category, url)
                                    } catch (error) {
                                      alert('Erro ao enviar imagem')
                                    }
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`file-${category}`}
                                className="flex-1 bg-blue-500 text-white text-xs px-2 py-1 rounded cursor-pointer text-center hover:bg-blue-600"
                              >
                                {uploadingImage ? 'Enviando...' : 'Upload'}
                              </label>
                              <button 
                                onClick={() => setEditingCategory(null)}
                                className="flex-1 bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setEditingCategory(category)}
                            className="w-full bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Editar Imagem
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banner Hero */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Banner Principal (Hero)
                  </h3>
                  
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <img 
                        src={banners.hero.image} 
                        alt="Banner Principal"
                        className="w-full h-48 object-cover rounded-md mb-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                        <input
                          type="text"
                          value={banners.hero.title}
                          onChange={(e) => setBanners(prev => ({
                            ...prev,
                            hero: { ...prev.hero, title: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                        <textarea
                          value={banners.hero.subtitle}
                          onChange={(e) => setBanners(prev => ({
                            ...prev,
                            hero: { ...prev.hero, subtitle: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                        <input
                          type="url"
                          value={banners.hero.image}
                          onChange={(e) => setBanners(prev => ({
                            ...prev,
                            hero: { ...prev.hero, image: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="hero-file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const url = await uploadImage(file)
                                setBanners(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, image: url }
                                }))
                              } catch (error) {
                                alert('Erro ao enviar imagem')
                              }
                            }
                          }}
                        />
                        <label 
                          htmlFor="hero-file"
                          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
                        >
                          {uploadingImage ? 'Enviando...' : 'Upload Nova Imagem'}
                        </label>
                        <button 
                          onClick={() => updateBanners(banners)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banners Promocionais */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Tag className="h-5 w-5 mr-2" />
                      Banners Promocionais
                    </h3>
                    <button 
                      onClick={addPromotionalBanner}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Banner
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {banners.promotional.map((banner, index) => (
                      <div key={banner.id} className="border rounded-lg p-4">
                        <div className="flex gap-4">
                          <img 
                            src={banner.image} 
                            alt={banner.title}
                            className="w-32 h-20 object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                            }}
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                              <input
                                type="text"
                                value={banner.title}
                                onChange={(e) => {
                                  const newBanners = { ...banners }
                                  newBanners.promotional[index].title = e.target.value
                                  setBanners(newBanners)
                                }}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                              <input
                                type="text"
                                value={banner.subtitle}
                                onChange={(e) => {
                                  const newBanners = { ...banners }
                                  newBanners.promotional[index].subtitle = e.target.value
                                  setBanners(newBanners)
                                }}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                              <input
                                type="text"
                                value={banner.link}
                                onChange={(e) => {
                                  const newBanners = { ...banners }
                                  newBanners.promotional[index].link = e.target.value
                                  setBanners(newBanners)
                                }}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`promo-file-${banner.id}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  try {
                                    const url = await uploadImage(file)
                                    const newBanners = { ...banners }
                                    newBanners.promotional[index].image = url
                                    setBanners(newBanners)
                                  } catch (error) {
                                    alert('Erro ao enviar imagem')
                                  }
                                }
                              }}
                            />
                            <label 
                              htmlFor={`promo-file-${banner.id}`}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm cursor-pointer hover:bg-blue-600 text-center"
                            >
                              Upload
                            </label>
                            <button 
                              onClick={() => removePromotionalBanner(banner.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={banner.isActive}
                              onChange={(e) => {
                                const newBanners = { ...banners }
                                newBanners.promotional[index].isActive = e.target.checked
                                setBanners(newBanners)
                              }}
                              className="mr-2"
                            />
                            Banner Ativo
                          </label>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                            <input
                              type="url"
                              value={banner.image}
                              onChange={(e) => {
                                const newBanners = { ...banners }
                                newBanners.promotional[index].image = e.target.value
                                setBanners(newBanners)
                              }}
                              className="px-3 py-1 border rounded-md text-sm"
                              placeholder="URL da imagem"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => updateBanners(banners)}
                      className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                      Salvar Todos os Banners
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Empresa
                        </label>
                        <input
                          type="text"
                          defaultValue="Atacadão Guanabara"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email de Contato
                        </label>
                        <input
                          type="email"
                          defaultValue="contato@atacadaoguanabara.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          defaultValue="(11) 99999-9999"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Configurações de Sincronização</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Sincronização Automática</span>
                        <button 
                          onClick={() => setAutoSync(!autoSync)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoSync ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoSync ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Intervalo de Sincronização (horas)
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="1">1 hora</option>
                          <option value="6">6 horas</option>
                          <option value="12">12 horas</option>
                          <option value="24">24 horas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Backup e Manutenção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                      <RefreshCw className="h-4 w-4 mr-2 inline" />
                      Fazer Backup
                    </button>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700">
                      <Activity className="h-4 w-4 mr-2 inline" />
                      Verificar Sistema
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
                      <AlertCircle className="h-4 w-4 mr-2 inline" />
                      Limpar Cache
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Promoções */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                </h3>
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePromotionSubmit} className="space-y-6">
                {/* Passo 1: Seleção do Produto */}
                <div className="border-b pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">1. Escolha o Produto</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar Produto
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite o nome do produto..."
                        value={productSearchQuery}
                        onChange={(e) => {
                          setProductSearchQuery(e.target.value)
                          if (e.target.value.length > 2) {
                            searchProducts(e.target.value)
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => searchProducts(productSearchQuery)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {/* Resultados da busca */}
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {searchResults.map(product => (
                        <div 
                          key={product.id} 
                          className="flex justify-between items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setPromotionForm({
                              ...promotionForm,
                              selectedProduct: product,
                              title: product.name,
                              image: product.image || ''
                            })
                            setSearchResults([])
                            setProductSearchQuery('')
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">R$ {product.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="text-blue-600 text-sm">Selecionar</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Produto selecionado */}
                  {promotionForm.selectedProduct && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="font-medium text-green-800 mb-2">Produto Selecionado:</h5>
                      <div className="flex items-center gap-3">
                        {promotionForm.selectedProduct.image && (
                          <img 
                            src={promotionForm.selectedProduct.image} 
                            alt={promotionForm.selectedProduct.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{promotionForm.selectedProduct.name}</div>
                          <div className="text-sm text-gray-600">ID: {promotionForm.selectedProduct.id}</div>
                          <div className="text-lg font-bold text-green-600">
                            R$ {promotionForm.selectedProduct.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passo 2: Configuração da Promoção */}
                {promotionForm.selectedProduct && (
                  <div className="border-b pb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">2. Configure a Promoção</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título da Promoção
                        </label>
                        <input
                          type="text"
                          value={promotionForm.title}
                          onChange={(e) => setPromotionForm({...promotionForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço Original
                        </label>
                        <input
                          type="number"
                          value={promotionForm.selectedProduct.price}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Promoção
                      </label>
                      <textarea
                        value={promotionForm.description}
                        onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Descreva os detalhes da promoção..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Desconto
                        </label>
                        <select
                          value={promotionForm.discountType}
                          onChange={(e) => setPromotionForm({...promotionForm, discountType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="percentage">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Desconto ({promotionForm.discountType === 'percentage' ? '%' : 'R$'})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={promotionForm.discountType === 'percentage' ? '100' : '999999'}
                          step="0.01"
                          value={promotionForm.discount}
                          onChange={(e) => setPromotionForm({...promotionForm, discount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder={promotionForm.discountType === 'percentage' ? '0-100' : '0.00'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preço com Desconto
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(() => {
                            if (!promotionForm.selectedProduct || !promotionForm.discount) return ''
                            const originalPrice = promotionForm.selectedProduct.price
                            const discount = parseFloat(promotionForm.discount) || 0
                            if (promotionForm.discountType === 'percentage') {
                              return (originalPrice * (1 - discount / 100)).toFixed(2)
                            } else {
                              return Math.max(0, originalPrice - discount).toFixed(2)
                            }
                          })()}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Validade
                        </label>
                        <input
                          type="date"
                          value={promotionForm.endDate}
                          onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload de Imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem da Promoção
                  </label>
                  <div className="space-y-3">
                    {/* Input de URL */}
                    <div>
                      <input
                        type="text"
                        placeholder="Cole uma URL de imagem aqui... (opcional)"
                        value={promotionForm.image || ''}
                        onChange={(e) => setPromotionForm({...promotionForm, image: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {/* Ou divisor */}
                    <div className="flex items-center">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="px-3 text-sm text-gray-500">ou</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    {/* Upload de arquivo */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Preview imediato
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setPromotionForm({...promotionForm, image: e.target?.result as string})
                            }
                            reader.readAsDataURL(file)
                            
                            // Upload para nuvem em background
                            const formData = new FormData()
                            formData.append('file', file)
                            try {
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              const result = await response.json()
                              if (result.success) {
                                setPromotionForm({...promotionForm, image: result.url})
                                console.log(`✅ Upload via ${result.service}`)
                              }
                            } catch (error) {
                              console.log('Upload em background falhou, usando preview local')
                            }
                          }
                        }}
                        className="hidden"
                        id="promotion-image-upload"
                      />
                      <label
                        htmlFor="promotion-image-upload"
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">📱</div>
                          <div className="text-sm font-medium text-gray-700">
                            Escolher foto do seu dispositivo
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Galeria, câmera, computador...
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {promotionForm.image && (
                    <div className="mt-2">
                      <img 
                        src={promotionForm.image} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={promotionForm.isActive}
                    onChange={(e) => setPromotionForm({...promotionForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Ativar promoção
                  </label>
                </div>

                {/* Removido busca duplicada - já existe no topo do modal */}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPromotionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPromotion}
                    className={`px-4 py-2 text-white rounded-md ${
                      isSubmittingPromotion 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmittingPromotion 
                      ? 'Salvando...' 
                      : `${editingPromotion ? 'Atualizar' : 'Criar'} Promoção`
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Produtos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    {editingProduct ? (
                      <input
                        type="text"
                        value={productForm.category}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                        readOnly
                      />
                    ) : (
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="DESCARTÁVEIS">DESCARTÁVEIS</option>
                        <option value="CONFEITARIA E OUTROS">CONFEITARIA E OUTROS</option>
                        <option value="PANIFICAÇÃO">PANIFICAÇÃO</option>
                        <option value="MOLHOS">MOLHOS</option>
                        <option value="SUSHITERIA">SUSHITERIA</option>
                        <option value="PRODUTOS DE LIMPEZA">PRODUTOS DE LIMPEZA</option>
                        <option value="TEMPEROS">TEMPEROS</option>
                        <option value="ENLATADOS E EM CONSERVA">ENLATADOS E EM CONSERVA</option>
                        <option value="BISCOITOS">BISCOITOS</option>
                        <option value="MERCEARIA">MERCEARIA</option>
                        <option value="FRIOS Á GRANEL E PACOTES">FRIOS Á GRANEL E PACOTES</option>
                        <option value="RESFRIADOS">RESFRIADOS</option>
                        <option value="CONGELADOS">CONGELADOS</option>
                        <option value="REFRIGERANTES E OUTROS LIQUIDOS">REFRIGERANTES E OUTROS LIQUIDOS</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagem do Produto
                    </label>
                    <div className="space-y-3">
                      {/* Input de URL */}
                      <div>
                        <input
                          type="text"
                          value={productForm.image || ''}
                          onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Cole uma URL de imagem aqui... (opcional)"
                        />
                      </div>
                      
                      {/* Ou divisor */}
                      <div className="flex items-center">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="px-3 text-sm text-gray-500">ou</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                      
                      {/* Upload de arquivo */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              console.log('📁 Arquivo selecionado:', file.name)
                              
                              // Preview imediato
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const result = e.target?.result as string
                                console.log('🖼️ Preview carregado')
                                setProductForm(prev => ({...prev, image: result}))
                              }
                              reader.readAsDataURL(file)
                              
                              // Upload para nuvem em background
                              const formData = new FormData()
                              formData.append('file', file)
                              try {
                                console.log('☁️ Iniciando upload...')
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                })
                                const result = await response.json()
                                if (result.success) {
                                  console.log(`✅ Upload produto via ${result.service}:`, result.url)
                                  setProductForm(prev => ({...prev, image: result.url}))
                                }
                              } catch (error) {
                                console.log('Upload em background falhou, usando preview local:', error)
                              }
                            }
                          }}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">🖼️</div>
                            <div className="text-sm font-medium text-gray-700">
                              Escolher foto do produto
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Galeria, câmera, computador...
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    {productForm.image && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Prévia da Imagem:</p>
                        <div className="flex justify-center">
                          <img 
                            src={productForm.image} 
                            alt="Preview" 
                            className="h-32 w-32 object-cover rounded-lg border-2 border-blue-200 shadow-md"
                            onError={(e) => {
                              console.log('❌ Erro ao carregar prévia da imagem')
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                            onLoad={() => {
                              console.log('✅ Prévia da imagem carregada com sucesso')
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({...productForm, inStock: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                    Produto em estoque
                  </label>
                </div>

                {productForm.image && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prévia da Imagem
                    </label>
                    <div className="w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                      <img
                        src={productForm.image}
                        alt="Prévia"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className={`px-4 py-2 text-white rounded-md ${
                      isSubmittingProduct 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmittingProduct 
                      ? 'Salvando...' 
                      : `${editingProduct ? 'Atualizar' : 'Criar'} Produto`
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
