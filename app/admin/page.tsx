'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import ChatInterface from "../../components/admin/ChatInterface"
import AdminBairrosFrete from "../../components/admin/AdminBairrosFrete"
import { 
  Users, Package, ShoppingCart, DollarSign, Settings, 
  Bell, LogOut, Search, Plus, Edit, Trash, Eye,
  BarChart3, TrendingUp, Activity, Globe, Store,
  MessageCircle, Camera, RefreshCw, RotateCcw,
  CheckCircle, AlertCircle, Clock, Zap, Star, Tag,
  PieChart, BarChart, ImageIcon, Upload, Smartphone
} from 'lucide-react'

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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
  userEmail: string
  customerInfo?: {
    name: string
    email: string
    phone: string
  }
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    image?: string
    category?: string
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  paymentMethod?: string
  observations?: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'user' | 'manager' | 'admin'
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
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
  userId?: string
  category?: string
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
  const user = session?.user || null
  const router = useRouter()
  const storeUser = useAuthStore((s) => s.user)

  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMainLoading, setIsMainLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [lastLoadTime, setLastLoadTime] = useState(0)
  
  // Estados de dados
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingCameraRequests: 0,
    pendingFeedback: 0,
    pendingReturns: 0
  })
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [cameraRequests, setCameraRequests] = useState<CameraRequest[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [productPromotions, setProductPromotions] = useState<any[]>([])

  // Estados de pesquisa e filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermAdmin, setSearchTermAdmin] = useState("")
  const debouncedSearchTermAdmin = useDebounce(searchTermAdmin, 300) // Debounce de 300ms
  const [selectedCategoryAdmin, setSelectedCategoryAdmin] = useState("Todos")
  const [categoriesAdmin, setCategoriesAdmin] = useState<string[]>([])
  const [maisVendidosAdmin, setMaisVendidosAdmin] = useState<{ nome: string, quantidade?: string }[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 300) // Debounce de 300ms
  const [dateRange, setDateRange] = useState('7d')
  const [currentPageAdmin, setCurrentPageAdmin] = useState(1)
  const [productsPerPageAdmin] = useState(100)
  const [onlySoldLast2Months, setOnlySoldLast2Months] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

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

  // Estados de pedidos
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [highlightOrderIds, setHighlightOrderIds] = useState<Set<string>>(new Set())

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
  
  // Estados das abas das seções
  const [cameraSubTab, setCameraSubTab] = useState('list')
  const [returnSubTab, setReturnSubTab] = useState('list')

  // Estados de promoções
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<any>(null)
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    type: 'promotion',
    discountType: 'percentage',
    discount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    image: '',
    products: [] as any[],
    selectedProduct: null as any
  })
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSubmittingPromotion, setIsSubmittingPromotion] = useState(false)

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
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)

  // Estados de criação de usuário
  const [showUserModal, setShowUserModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showFeedbackDetailsModal, setShowFeedbackDetailsModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [viewingUser, setViewingUser] = useState<any>(null)
  const [viewingOrder, setViewingOrder] = useState<any>(null)
  const [viewingFeedback, setViewingFeedback] = useState<any>(null)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'manager' | 'admin',
    phone: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'Fortaleza',
      state: 'Ceará',
      zipCode: ''
    }
  })

  // Lista de bairros de Fortaleza
  const bairrosFortaleza = [
    'Jardim Guanabara', 'Vila Velha', 'Quintino Cunha', 'Olavo Oliveira', 'Jardim Iracema',
    'Padre Andrade', 'Floresta', 'Antonio Bezerra', 'Barra do Ceara', 'Cristo Redentor',
    'Alvaro Wayne', 'Carlito', 'Pirambu', 'Monte Castelo', 'Elery', 'Alagadiço',
    'Parquelandia', 'Parque Araxá', 'Rodolgo Teofilo', 'Amadeu Furtado', 'Bela Vista',
    'Pici', 'Dom Lustosa', 'Autran Nunes', 'Genibau', 'Tabapuá', 'Iparana',
    'Parque Albano', 'Parque Leblon', 'Jacarecanga', 'Centro', 'Moura brasil',
    'Farias Brito', 'Benfica', 'Damas', 'Jardim America', 'Bom Futuro', 'Montese',
    'Pan Americano', 'Couto Fernandes', 'Democrito Rocha', 'Joquei Clube',
    'Henrique Jorge', 'Joao XXIII', 'Conj Ceara', 'Parangaba', 'Itaoca'
  ]

  // Função de normalização para busca
  const normalizeAdmin = useCallback((s: string): string => (s || "")
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim(), [])

  // Verificações de autenticação e permissões
  const nextAuthEmail = user?.email || null
  const isNextAuthAdmin = nextAuthEmail === 'davikalebe20020602@gmail.com'
  const isStoreAdmin = !!(storeUser && (storeUser.role === 'admin' || storeUser.email === 'admin' || storeUser.email === 'davikalebe20020602@gmail.com'))
  const isAdmin = isNextAuthAdmin || isStoreAdmin

  // Carregar categorias
  useEffect(() => {
    const loadCategoriesAdmin = async () => {
      try {
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategoriesAdmin(['Todos', ...categoriesData])
        } else {
          setCategoriesAdmin(['Todos', 'Promoções', 'Mais Vendidos', 'Novidades'])
        }
      } catch (error) {
        setCategoriesAdmin(['Todos', 'Promoções', 'Mais Vendidos', 'Novidades'])
      }
    }
    loadCategoriesAdmin()
  }, [])

  // Carregar mais vendidos
  useEffect(() => {
    const fetchMaisVendidosAdmin = async () => {
      try {
        const res = await fetch('/api/mais-vendidos')
        if (res.ok) {
          const data = await res.json()
          setMaisVendidosAdmin(data.slice().reverse())
        } else {
          setMaisVendidosAdmin([])
        }
      } catch (error) {
        setMaisVendidosAdmin([])
      }
    }
    fetchMaisVendidosAdmin()
  }, [])

  // Reset da paginação quando categoria ou busca mudam
  useEffect(() => {
    setCurrentPageAdmin(1)
  }, [selectedCategoryAdmin, debouncedSearchTermAdmin])

  // Controlar estado de carregamento da busca
  useEffect(() => {
    if (searchTermAdmin !== debouncedSearchTermAdmin) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTermAdmin, debouncedSearchTermAdmin])

  // Função para encontrar produtos do CSV nos produtos disponíveis
  const getProdutosDoCSVAdmin = useMemo(() => {
    return (produtosOriginais: Product[], categoria?: string, maxCount?: number) => {
      if (!produtosOriginais.length) return []
      const produtosMap = new Map<string, Product>()
      produtosOriginais.forEach(prod => {
        if (prod.inStock && (!categoria || prod.category === categoria)) {
          produtosMap.set(normalizeAdmin(prod.name), prod)
        }
      })
      const produtosEncontrados: Product[] = []
      const produtosNaoEncontrados: string[] = []
      const maisVendidosLote = maxCount ? maisVendidosAdmin.slice(0, maxCount) : maisVendidosAdmin
      maisVendidosLote.forEach((itemCSV) => {
        const nomeNormalizadoCSV = normalizeAdmin(itemCSV.nome)
        const produtoEncontrado = produtosMap.get(nomeNormalizadoCSV)
        if (produtoEncontrado) {
          produtosEncontrados.push(produtoEncontrado)
        } else {
          produtosNaoEncontrados.push(itemCSV.nome)
        }
      })
      // Para produtos não encontrados, tenta encontrar correspondências parciais
      produtosNaoEncontrados.forEach((nomeProduto) => {
        const nomeNormalizadoCSV = normalizeAdmin(nomeProduto)
        for (const [nome, prod] of produtosMap.entries()) {
          if ((nome.includes(nomeNormalizadoCSV) || nomeNormalizadoCSV.includes(nome)) && 
              prod.inStock && 
              !produtosEncontrados.some(p => p.id === prod.id)) {
            produtosEncontrados.push(prod)
            break
          }
        }
      })
      // Adiciona os produtos da categoria que não estão no CSV no final
      const idsCSV = produtosEncontrados.map(p => p.id)
      const outros = Array.from(produtosMap.values()).filter(p => !idsCSV.includes(p.id))
      return [...produtosEncontrados, ...outros]
    }
  }, [maisVendidosAdmin, normalizeAdmin])

  // Produtos filtrados por categoria e ordenados por mais vendidos
  const produtosFiltradosAdmin = useMemo(() => {
    if (!products.length) return []
    if (selectedCategoryAdmin === "Todos") {
      return getProdutosDoCSVAdmin(products)
    } else if (selectedCategoryAdmin === "Promoções") {
      const produtosComPromocao = products.filter(p => (p as any).salePrice !== undefined && (p as any).salePrice < p.price)
      return getProdutosDoCSVAdmin(produtosComPromocao)
    } else if (selectedCategoryAdmin === "Novidades") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const produtosNovos = products.filter(p => (p as any).createdAt && new Date((p as any).createdAt) > thirtyDaysAgo)
      return getProdutosDoCSVAdmin(produtosNovos)
    } else if (selectedCategoryAdmin === "Mais Vendidos") {
      return getProdutosDoCSVAdmin(products).filter(p => 
        maisVendidosAdmin.some(item => {
          const nomeProdutoNormalizado = normalizeAdmin(p.name)
          const nomeCSVNormalizado = normalizeAdmin(item.nome)
          return nomeProdutoNormalizado === nomeCSVNormalizado || 
                 nomeProdutoNormalizado.includes(nomeCSVNormalizado) ||
                 nomeCSVNormalizado.includes(nomeProdutoNormalizado)
        })
      )
    } else {
      return getProdutosDoCSVAdmin(products, selectedCategoryAdmin)
    }
  }, [products, maisVendidosAdmin, selectedCategoryAdmin, getProdutosDoCSVAdmin, normalizeAdmin])

  // Busca nos produtos filtrados - otimizada com limite de resultados
  const filteredProductsAdmin = useMemo(() => {
    if (!debouncedSearchTermAdmin) return produtosFiltradosAdmin
    
    // Limitar busca para evitar travamento com muitos produtos
    const maxResults = 500
    let result = [...produtosFiltradosAdmin]
    
    if (debouncedSearchTermAdmin.startsWith('#')) {
      const code = debouncedSearchTermAdmin.replace('#', '').trim()
      result = result.filter((p: Product) => p.id === code)
    } else {
      const q = normalizeAdmin(debouncedSearchTermAdmin.trim())
      
      // Busca mais eficiente
      const produtosDoCSV: Product[] = []
      const outrosProdutos: Product[] = []
      
      // Cache para normalização
      const normalizedNames = new Map<string, string>()
      const getNormalizedName = (name: string) => {
        if (!normalizedNames.has(name)) {
          normalizedNames.set(name, normalizeAdmin(name))
        }
        return normalizedNames.get(name)!
      }
      
      // Busca otimizada com early break
      for (let i = 0; i < result.length && (produtosDoCSV.length + outrosProdutos.length) < maxResults; i++) {
        const prod = result[i]
        const nomeProduto = getNormalizedName(prod.name)
        
        if (nomeProduto.includes(q)) {
          // Verificar se está no CSV (busca mais eficiente)
          const estaNoCSV = maisVendidosAdmin.some(item => {
            const nomeCSV = getNormalizedName(item.nome)
            return nomeCSV === nomeProduto || nomeProduto.includes(nomeCSV)
          })
          
          if (estaNoCSV) {
            produtosDoCSV.push(prod)
          } else {
            outrosProdutos.push(prod)
          }
        }
      }
      
      result = [...produtosDoCSV, ...outrosProdutos]
    }
    
    return result
  }, [produtosFiltradosAdmin, debouncedSearchTermAdmin, maisVendidosAdmin, normalizeAdmin])

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

  // Função para carregar dados iniciais
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

  // Função para atualizar estatísticas
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

  // Função para carregar dados do Varejo Fácil
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

  // Função para iniciar sincronização com Varejo Fácil (Sistema Anti-Timeout 504)
  const startVarejoFacilSync = async () => {
    const startTime = new Date().toISOString()
    let isMonitoring = true // Controlar se deve continuar monitorando
    
    try {
      // LIMPAR ESTADO ANTERIOR NO FRONTEND
      setSyncProgress({
        status: 'running',
        current: 0,
        total: 100,
        message: '🧹 Limpando estado anterior... Preparando nova sincronização...'
      })

      // Reset do estado no backend primeiro
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset-state' })
        })
        console.log('🔄 Estado anterior resetado')
      } catch (e) {
        console.warn('Aviso ao resetar estado:', e)
      }

      // Aguardar um pouco para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSyncProgress({
        status: 'running',
        current: 5,
        total: 100,
        message: '🚀 Iniciando nova sincronização... (aguardando logs)'
      })

      // Iniciar sincronização em background para evitar timeout 504
      const syncRes = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-sync' })
      })

      if (!syncRes.ok) {
        throw new Error(`Erro na API: ${syncRes.status}`)
      }

      const syncData = await syncRes.json()

      if (syncData.success && (syncData.status === 'started' || syncData.message?.includes('background'))) {
        // Sincronização iniciada em background, monitorar progresso real
        setSyncProgress({
          status: 'running',
          current: 0,
          total: 0,
          message: '🚀 Sincronização iniciada... Conectando com servidor...'
        })

        // Contador para evitar loop infinito
        let attemptCount = 0
        let maxAttempts = 300 // 15 minutos (300 * 3 segundos)
        
        // Função simples para monitorar o progresso
        const monitorProgress = async () => {
          if (!isMonitoring) return

          // Verificar timeout
          attemptCount++
          if (attemptCount > maxAttempts) {
            console.log('⏰ Timeout do monitoramento atingido')
            isMonitoring = false
            setSyncProgress({
              status: 'error',
              current: 0,
              total: 100,
              message: '⏰ Timeout: Sincronização demorou mais que o esperado'
            })
            return
          }

          try {
            const statusRes = await fetch('/api/sync/status')
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              const status = statusData.data

              if (status.isRunning) {
                // Ainda rodando - mostrar progresso baseado no tempo
                const duration = status.duration ? Math.floor(status.duration / 1000) : 0
                const minutes = Math.floor(duration / 60)
                const seconds = duration % 60
                const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
                
                setSyncProgress({
                  status: 'running',
                  current: Math.min((duration / 300) * 100, 95), // 5 minutos = 100%
                  total: 100,
                  message: `🔄 Sincronizando... (${timeStr})`
                })
                
                if (isMonitoring) {
                  setTimeout(monitorProgress, 3000)
                }
              } else {
                // Não está rodando - verificar se deveria estar
                const syncStartTime = new Date(startTime).getTime()
                const now = Date.now()
                const timeSinceStart = now - syncStartTime
                
                // Se passou mais de 30 segundos e ainda não iniciou, provavelmente houve erro
                if (timeSinceStart > 30000 && !status.isRunning && attemptCount > 10) {
                  console.log(`⚠️ Sincronização não iniciou após ${Math.floor(timeSinceStart/1000)}s`)
                  console.log(`   - isRunning: ${status.isRunning}`)
                  console.log(`   - startTime backend: ${status.startTime}`)
                  
                  isMonitoring = false
                  setSyncProgress({
                    status: 'error',
                    current: 0,
                    total: 100,
                    message: '⚠️ Sincronização não iniciou. Verifique se o servidor está respondendo corretamente.'
                  })
                  return
                }
                
                // Não está mais rodando - verificar resultado
                if (status.lastResult && status.lastResult.completed) {
                  // Verificar se é resultado da sincronização ATUAL (não de uma anterior)
                  const resultTime = new Date(status.lastResult.completedAt || 0).getTime()
                  const syncStartTime = new Date(startTime).getTime()
                  const now = Date.now()
                  
                  // Resultado deve ser:
                  // 1. POSTERIOR ao início da sincronização
                  // 2. Nos últimos 30 segundos (resultado recente)
                  const isRecentResult = (now - resultTime) < 30000 // 30 segundos
                  const isAfterStart = resultTime > syncStartTime
                  
                  // Verificar se passou muito tempo esperando (mais de 2 minutos)
                  const waitingTooLong = (now - syncStartTime) > 120000 // 2 minutos
                  
                  if (isAfterStart && isRecentResult) {
                    // TERMINOU COM SUCESSO RECENTE!
                    isMonitoring = false
                    const result = status.lastResult
                    const endTime = new Date().toISOString()
                    const durationMs = result.duration || (new Date().getTime() - new Date(startTime).getTime())
                    
                    setSyncProgress({
                      status: 'completed',
                      current: 100,
                      total: 100,
                      message: `✅ Sincronização concluída! ${result.totalProducts || 0} produtos sincronizados.`
                    })
                  } else if (waitingTooLong) {
                    // Esperou muito tempo e não há sincronização rodando
                    // Provavelmente a sincronização não iniciou corretamente
                    console.log(`⚠️ Sincronização não iniciou corretamente. Parando monitoramento.`)
                    console.log(`   - Tempo de espera: ${Math.floor((now - syncStartTime) / 60000)}min`)
                    console.log(`   - isRunning: ${status.isRunning}`)
                    console.log(`   - Último resultado: ${new Date(resultTime).toLocaleTimeString()}`)
                    
                    isMonitoring = false
                    setSyncProgress({
                      status: 'error',
                      current: 0,
                      total: 100,
                      message: '⚠️ Sincronização não iniciou. Tente novamente ou verifique o servidor.'
                    })
                    return
                  } else {
                    // Resultado antigo, continuar aguardando (mas com limite)
                    const ageMinutes = Math.floor((now - resultTime) / 60000)
                    console.log(`📊 Resultado antigo detectado (${ageMinutes}min atrás), aguardando nova sincronização...`)
                    console.log(`   - Resultado em: ${new Date(resultTime).toLocaleTimeString()}`)
                    console.log(`   - Início sync: ${new Date(syncStartTime).toLocaleTimeString()}`)
                    console.log(`   - Agora: ${new Date(now).toLocaleTimeString()}`)
                    
                    setSyncProgress({
                      status: 'running',
                      current: Math.min(10 + (attemptCount * 0.5), 90),
                      total: 100,
                      message: `⏳ Aguardando nova sincronização... (tentativa ${attemptCount}/${maxAttempts})`
                    })
                    
                    if (isMonitoring) {
                      setTimeout(monitorProgress, 3000)
                    }
                    return
                  }

                  // Salvar no histórico
                  try {
                    await saveSyncToHistory({
                      startedAt: startTime,
                      finishedAt: endTime,
                      durationMs: durationMs,
                      status: 'success',
                      totals: {
                        products: result.totalProducts || 0,
                        sections: result.totalSections || 0,
                        brands: result.totalBrands || 0,
                        genres: result.totalGenres || 0
                      },
                      logs: result.output || 'Sincronização concluída'
                    })
                  } catch (e) {
                    console.error('Erro ao salvar histórico:', e)
                  }

                  // Atualizar dados do painel
                  setVarejoFacilData(prev => ({
                    ...prev,
                    products: { total: result.totalProducts || 0, items: [] },
                    sections: { total: result.totalSections || 0, items: [] },
                    brands: { total: result.totalBrands || 0, items: [] },
                    genres: { total: result.totalGenres || 0, items: [] }
                  }))

                  // Recarregar dados
                  setTimeout(() => {
                    loadSyncHistory()
                    loadData()
                  }, 1000)

                } else if (status.lastError) {
                  // TERMINOU COM ERRO
                  isMonitoring = false
                  setSyncProgress({
                    status: 'error',
                    current: 0,
                    total: 100,
                    message: `❌ Erro: ${status.lastError}`
                  })

                  // Salvar erro no histórico  
                  try {
                    await saveSyncToHistory({
                      startedAt: startTime,
                      finishedAt: new Date().toISOString(),
                      status: 'error',
                      error: status.lastError,
                      logs: status.lastError
                    })
                  } catch (e) {
                    console.error('Erro ao salvar histórico de erro:', e)
                  }

                } else {
                  // Não está rodando mas não há resultado recente - processo pode ter terminado sem salvar resultado
                  console.log('⚠️ Processo não está rodando mas sem resultado recente, continuando aguardar...')
                  setSyncProgress({
                    status: 'running',
                    current: 85,
                    total: 100,
                    message: '⏳ Finalizando sincronização... (aguardando resultado)'
                  })
                  
                  if (isMonitoring) {
                    setTimeout(monitorProgress, 2000) // Verificar mais frequente
                  }
                }
              }
            } else {
              // Erro ao acessar status, tentar novamente
              if (isMonitoring) {
                setTimeout(monitorProgress, 5000)
              }
            }
          } catch (error) {
            console.error('Erro no monitoramento:', error)
            if (isMonitoring) {
              setTimeout(monitorProgress, 5000)
            }
          }
        }

        // Timeout de segurança (10 minutos)
        setTimeout(() => {
          if (isMonitoring) {
            isMonitoring = false
            setSyncProgress({
              status: 'completed',
              current: 100,
              total: 100,
              message: '✅ Sincronização finalizada (timeout)'
            })
          }
        }, 10 * 60 * 1000)

        // Começar a monitorar imediatamente
        setTimeout(monitorProgress, 2000)
        return

      } else {
        throw new Error(syncData.message || 'Erro ao iniciar sincronização')
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      isMonitoring = false // Parar monitoramento em caso de erro
      
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

  // Função para salvar histórico de sincronização
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

  // Função para carregar histórico de sincronização
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

  // Função para atualizar pedidos manualmente
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

  // Função para enviar mensagem no chat
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

  // Função para atualizar status de solicitação
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

  // Função para buscar produtos
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

  // Função para enviar formulário de promoção
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

  // Função para deletar promoção
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

  // Função para editar promoção
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

  // Função para enviar formulário de produto
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

  // Função para editar produto
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

  // Função para atualizar status de feedback
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

  // Função para atualizar status de pedido
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

  // Função para carregar imagens do site
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

  // Função para atualizar imagem de categoria
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

  // Função para atualizar banners
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

  // Função para fazer upload de imagem
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

  // Função para adicionar banner promocional
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

  // Função para remover banner promocional
  const removePromotionalBanner = (bannerId: number) => {
    const newBanners = {
      ...banners,
      promotional: banners.promotional.filter(b => b.id !== bannerId)
    }
    
    updateBanners(newBanners)
  }

  // Função para deletar usuário
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

  // Função para criar usuário
  const createUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Nome e e-mail são obrigatórios')
      return
    }

    // Validação de senha
    if (!userForm.password.trim()) {
      alert('Senha é obrigatória')
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (userForm.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
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
          role: userForm.role,
          phone: userForm.phone.trim(),
          password: userForm.password,
          address: userForm.address
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Erro ao criar usuário: ${res.status} ${txt}`)
      }
      setShowUserModal(false)
      setUserForm({ 
        name: '', 
        email: '', 
        role: 'user', 
        phone: '',
        password: '',
        confirmPassword: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: 'Fortaleza',
          state: 'Ceará',
          zipCode: ''
        }
      })
      await loadData()
      setActiveTab('users')
    } catch (e) {
      console.error(e)
      alert('Falha ao criar usuário')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  // Função para atualizar usuário
  const updateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Nome e e-mail são obrigatórios')
      return
    }

    // Validação de senha (apenas se foi informada)
    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (userForm.password && userForm.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setIsSubmittingUser(true)
      const updateData: any = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        phone: userForm.phone.trim(),
        address: userForm.address
      }

      // Apenas incluir senha se foi informada
      if (userForm.password.trim()) {
        updateData.password = userForm.password
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Erro ao atualizar usuário: ${res.status} ${txt}`)
      }
      setShowUserModal(false)
      setEditingUser(null)
      setUserForm({ 
        name: '', 
        email: '', 
        role: 'user', 
        phone: '',
        password: '',
        confirmPassword: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: 'Fortaleza',
          state: 'Ceará',
          zipCode: ''
        }
      })
      await loadData()
      setActiveTab('users')
    } catch (e) {
      console.error(e)
      alert('Falha ao atualizar usuário')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  // Função para exportar dados
  const exportData = async (
    type: 'products' | 'orders' | 'users' | 'feedback' | 'camera-requests' | 'returns' | 'promotions'
  ) => {
    try {
      // Export as JSON for now - PDF functions can be implemented later
      let data: any = []
      let filename = ''
      
      switch (type) {
        case 'products':
          data = onlySoldLast2Months ? getProductsSoldInLast2Months() : products
          filename = `products-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'orders':
          data = orders
          filename = `orders-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'users':
          data = users
          filename = `users-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'feedback':
          data = feedbacks
          filename = `feedback-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'camera-requests':
          data = cameraRequests
          filename = `camera-requests-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'returns':
          data = returnRequests
          filename = `returns-${new Date().toISOString().split('T')[0]}.json`
          break
        case 'promotions':
          data = promotions
          filename = `promotions-${new Date().toISOString().split('T')[0]}.json`
          break
      }
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

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

  // Função para fazer logout
  const handleLogout = async () => {
    // Limpar localStorage manualmente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage')
      localStorage.clear()
    }
    
    await signOut({ callbackUrl: '/' })
  }

  // Carregar dados iniciais
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

  // AutoSync
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

  // Carregar imagens salvas
  useEffect(() => {
    loadSiteImages()
  }, [])

  // Polling contínuo para notificações de novas mensagens
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      // Sempre verifica por novas mensagens para mostrar notificações
      loadChatData()
    }, 2000) // A cada 2 segundos verifica novas mensagens

    return () => clearInterval(notificationInterval)
  }, []) // Executa sempre, independente de qualquer estado

  // Polling para atualizar chat em tempo real
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

  // Renderização condicional para loading
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

  // Verificação de permissões
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa ser um administrador para acessar esta página.</p>
        </div>
      </div>
    )
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

  // Renderização do componente
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno Aprimorado */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-orange-500 shadow-xl relative overflow-hidden">
        {/* Efeito de fundo */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-orange-400"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-6">
              {/* Logo com animação */}
              <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                <img 
                  src="https://i.ibb.co/TBGDxS4M/guanabara-1.png" 
                  alt="Atacadão Guanabara" 
                  className="h-14 w-auto drop-shadow-lg"
                />
              </div>
              
              {/* Título e navegação aprimorados */}
              <div className="flex items-center space-x-8">
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-md">Painel Administrativo</h1>
                  <p className="text-blue-100 text-sm mt-1">Gestão Completa do Sistema</p>
                </div>
                <div className="h-12 w-px bg-white/30"></div>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="group flex items-center gap-3 px-6 py-3 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                >
                  <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium">Voltar ao Catálogo</span>
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Controles do usuário aprimorados */}
            <div className="flex items-center space-x-6">
              {/* User info aprimorado */}
              <div className="flex items-center space-x-4 text-white">
                <div className="text-right">
                  <div className="text-sm font-semibold">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-blue-100 opacity-90">{user?.email}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-white/20 to-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Linha decorativa */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar Navigation */}
        <div className="flex gap-6">
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50'
                }`}
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50'
                }`}
              >
                <PieChart className="h-5 w-5 mr-3" />
                Analytics
              </button>
              
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'products' ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50'
                }`}
              >
                <Package className="h-5 w-5 mr-3" />
                Produtos
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'orders' ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50'
                }`}
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
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
              
             
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalUsers}</p>
                        <p className="text-xs text-blue-600 mt-1">+12% vs mês anterior</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalProducts}</p>
                        <p className="text-xs text-orange-600 mt-1">+8% vs mês anterior</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg">
                        <Package className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{safeStats.totalOrders}</p>
                        <p className="text-xs text-blue-600 mt-1">+15% vs mês anterior</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-orange-100 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Receita Total</p>
                        <p className="text-2xl font-bold text-gray-900">R$ {safeStats.totalRevenue.toFixed(2)}</p>
                        <p className="text-xs text-green-600 mt-1">+22% vs mês anterior</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
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

            {/* Produtos */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Header da seção */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Mais Vendidos</h2>
                      <p className="text-blue-100">Gerencie os produtos mais populares da sua loja</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-white/20 rounded-lg px-3 py-2">
                        <span className="font-medium">{filteredProductsAdmin.length}</span> produtos encontrados
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros e Pesquisa Aprimorados */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Search className="h-5 w-5 text-blue-600" />
                      Pesquisa e Filtros
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Encontre produtos rapidamente usando filtros avançados</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {/* Barra de Pesquisa Aprimorada */}
                      <div className="relative col-span-1 md:col-span-2 xl:col-span-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {isSearching ? (
                              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Search className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <input
                            type="text"
                            value={searchTermAdmin}
                            onChange={e => setSearchTermAdmin(e.target.value)}
                            placeholder="🔍 Pesquisar produto por nome ou #código..."
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 hover:border-blue-300 shadow-sm"
                          />
                          {searchTermAdmin && (
                            <button
                              onClick={() => setSearchTermAdmin('')}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                            >
                              <div className="p-1 rounded-full group-hover:bg-gray-200 transition-colors">
                                <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            </button>
                          )}
                        </div>
                        {isSearching && (
                          <div className="absolute inset-y-0 right-8 flex items-center pr-2">
                            <div className="text-xs text-blue-500 font-medium">Buscando...</div>
                          </div>
                        )}
                      </div>

                      {/* Seletor de Categoria */}
                      <div className="relative">
                        <select
                          value={selectedCategoryAdmin}
                          onChange={e => setSelectedCategoryAdmin(e.target.value)}
                          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        >
                          {categoriesAdmin.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Filtros ativos */}
                    {(searchTermAdmin || selectedCategoryAdmin !== "Todos") && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
                        {searchTermAdmin && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Busca: "{searchTermAdmin}"
                            <button 
                              onClick={() => setSearchTermAdmin('')}
                              className="ml-1 hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        )}
                        {selectedCategoryAdmin !== "Todos" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Categoria: {selectedCategoryAdmin}
                            <button 
                              onClick={() => setSelectedCategoryAdmin("Todos")}
                              className="ml-1 hover:text-green-600"
                            >
                              ×
                            </button>
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSearchTermAdmin('')
                            setSelectedCategoryAdmin("Todos")
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          Limpar todos
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabela de Produtos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Produto
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Categoria
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Preço
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Status
                              </div>
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center justify-center gap-2">
                                <Settings className="h-4 w-4" />
                                Ações
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredProductsAdmin
                            .slice((currentPageAdmin - 1) * productsPerPageAdmin, currentPageAdmin * productsPerPageAdmin)
                            .map((prod, index) => (
                            <tr key={prod.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0">
                                    {prod.image ? (
                                      <img 
                                        src={prod.image} 
                                        alt={prod.name} 
                                        className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200 shadow-sm" 
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{prod.name}</p>
                                    <p className="text-xs text-gray-500">ID: #{prod.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {prod.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-green-700">
                                  R$ {prod.price?.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {prod.inStock ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Em estoque
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Sem estoque
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => editProduct(prod)}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 border border-blue-200"
                                  title="Editar produto"
                                >
                                  <Edit className="h-4 w-4" />
                                  Editar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Estado vazio */}
                      {filteredProductsAdmin.length === 0 && (
                        <div className="text-center py-16">
                          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                          <p className="text-gray-500 mb-6">
                            {searchTermAdmin || selectedCategoryAdmin !== "Todos" 
                              ? "Tente ajustar seus filtros para encontrar produtos." 
                              : "Não há produtos cadastrados ainda."}
                          </p>
                          {(searchTermAdmin || selectedCategoryAdmin !== "Todos") && (
                            <button
                              onClick={() => {
                                setSearchTermAdmin('')
                                setSelectedCategoryAdmin("Todos")
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Limpar filtros
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                      
                  {/* Componente de Paginação Melhorado */}
                  {filteredProductsAdmin.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-medium">
                            Mostrando <span className="text-blue-600">{((currentPageAdmin - 1) * productsPerPageAdmin) + 1}</span> até{' '}
                            <span className="text-blue-600">{Math.min(currentPageAdmin * productsPerPageAdmin, filteredProductsAdmin.length)}</span> de{' '}
                            <span className="text-blue-600">{filteredProductsAdmin.length}</span> produtos
                            </span>
                        </div>
                          
                        <div className="flex items-center justify-center sm:justify-end">
                          <nav className="flex items-center space-x-1" aria-label="Paginação">
                            <button
                              onClick={() => setCurrentPageAdmin(currentPageAdmin - 1)}
                              disabled={currentPageAdmin === 1}
                              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPageAdmin === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm'
                              }`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              <span className="hidden sm:inline">Anterior</span>
                            </button>
                            
                            {/* Números das páginas */}
                            {(() => {
                              const totalPages = Math.ceil(filteredProductsAdmin.length / productsPerPageAdmin);
                              const pages = [];
                              const maxVisiblePages = 5;
                              
                              let startPage = Math.max(1, currentPageAdmin - Math.floor(maxVisiblePages / 2));
                              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                              
                              if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                              }
                              
                              // Primeira página
                              if (startPage > 1) {
                                pages.push(
                                  <button
                                    key={1}
                                    onClick={() => setCurrentPageAdmin(1)}
                                    className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-lg transition-all duration-200 shadow-sm"
                                  >
                                    1
                                  </button>
                                );
                                if (startPage > 2) {
                                  pages.push(
                                    <span key="start-dots" className="flex items-center justify-center w-10 h-10 text-sm text-gray-500">
                                      ⋯
                                    </span>
                                  );
                                }
                              }
                              
                              // Páginas visíveis
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <button
                                    key={i}
                                    onClick={() => setCurrentPageAdmin(i)}
                                    className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${
                                      i === currentPageAdmin
                                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                                    }`}
                                  >
                                    {i}
                                  </button>
                                );
                              }
                              
                              // Última página
                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  pages.push(
                                    <span key="end-dots" className="flex items-center justify-center w-10 h-10 text-sm text-gray-500">
                                      ⋯
                                    </span>
                                  );
                                }
                                pages.push(
                                  <button
                                    key={totalPages}
                                    onClick={() => setCurrentPageAdmin(totalPages)}
                                    className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-lg transition-all duration-200 shadow-sm"
                                  >
                                    {totalPages}
                                  </button>
                                );
                              }
                              
                              return pages;
                            })()}
                            
                            <button
                              onClick={() => setCurrentPageAdmin(currentPageAdmin + 1)}
                              disabled={currentPageAdmin >= Math.ceil(filteredProductsAdmin.length / productsPerPageAdmin)}
                              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPageAdmin >= Math.ceil(filteredProductsAdmin.length / productsPerPageAdmin)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm'
                              }`}
                            >
                              <span className="hidden sm:inline">Próxima</span>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

           

          

            {/* Analytics */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">📊 Analytics do Site</h2>
                  <Link href="/admin/analytics">
                    <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Ver Analytics Completo
                    </button>
                  </Link>
                </div>
                

              </div>
            )}

            {/* Bairros/Frete */}
            {activeTab === 'bairros-frete' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Bairros e Frete</h2>
                <AdminBairrosFrete />
              </div>
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
                    
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'reset-state' })
                          })
                          const data = await response.json()
                          if (data.success) {
                            setSyncProgress({
                              status: 'idle',
                              current: 0,
                              total: 0,
                              message: '🔄 Estado resetado - pode sincronizar novamente'
                            })
                          }
                        } catch (error) {
                          console.error('Erro ao resetar estado:', error)
                        }
                      }}
                      className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-1 inline" />
                      Reset
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
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">
                              Sistema anti-timeout ativo - Sincronização rodando em background
                            </p>
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              ✨ Sem erro 504! O processo continua mesmo se você fechar esta aba
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {syncProgress.status === 'running' && (
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${syncProgress.current || 0}%`
                          }}
                        />
                      </div>
                    )}
                    
                    {syncProgress.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Sincronização concluída com sucesso!
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {syncProgress.message}
                            </p>
                          </div>
                        </div>
                        
                        {/* Logs de output */}
                        {syncProgress.output && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-green-700 mb-2">
                              📋 Ver logs da sincronização
                            </summary>
                            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                              <pre>{syncProgress.output}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                    
                    {syncProgress.status === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Erro na sincronização
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {syncProgress.message}
                            </p>
                          </div>
                        </div>

                        {/* Logs de erro */}
                        {syncProgress.error && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-red-700 mb-2">
                              🔍 Ver detalhes do erro
                            </summary>
                            <div className="bg-gray-900 text-red-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                              <pre>{syncProgress.error}</pre>
                            </div>
                          </details>
                        )}
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
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => {
                                      setViewingFeedback(feedback)
                                      setShowFeedbackDetailsModal(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Ver detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <select 
                                    value={feedback.status}
                                    onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="pending">Pendente</option>
                                    <option value="reviewed">Revisado</option>
                                    <option value="resolved">Resolvido</option>
                                  </select>
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

            {/* Modal: Detalhes do Feedback */}
            {showFeedbackDetailsModal && viewingFeedback && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Detalhes do Feedback</h3>
                    <button 
                      className="text-gray-500 hover:text-gray-700" 
                      onClick={() => {
                        setShowFeedbackDetailsModal(false)
                        setViewingFeedback(null)
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Informações do cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingFeedback.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingFeedback.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data do Feedback</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {new Date(viewingFeedback.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="p-3">
                          <select 
                            value={viewingFeedback.status}
                            onChange={(e) => {
                              updateFeedbackStatus(viewingFeedback.id, e.target.value)
                              setViewingFeedback({...viewingFeedback, status: e.target.value})
                            }}
                            className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                              viewingFeedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              viewingFeedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            <option value="pending">Pendente</option>
                            <option value="reviewed">Revisado</option>
                            <option value="resolved">Resolvido</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Avaliação */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-6 w-6 ${i < viewingFeedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({viewingFeedback.rating}/5 estrelas)
                        </span>
                      </div>
                    </div>

                    {/* Mensagem */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{viewingFeedback.message}</p>
                      </div>
                    </div>

                    {/* Categoria do feedback se existir */}
                    {viewingFeedback.category && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {viewingFeedback.category}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ID do usuário se existir */}
                    {viewingFeedback.userId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID do Usuário</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">{viewingFeedback.userId}</div>
                      </div>
                    )}

                    {/* Pedidos relacionados se existir */}
                    {viewingFeedback.userId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pedidos do Cliente</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {orders
                            .filter(order => order.userId === viewingFeedback.userId)
                            .slice(0, 3)
                            .map((order) => (
                              <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="text-sm font-medium">Pedido #{order.id}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">R$ {order.total?.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">{order.status}</div>
                                </div>
                              </div>
                            ))}
                          {orders.filter(order => order.userId === viewingFeedback.userId).length === 0 && (
                            <div className="text-center text-gray-500 py-2 text-sm">Nenhum pedido encontrado</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t flex justify-end">
                    <button 
                      className="px-4 py-2 rounded-md text-sm border border-gray-300"
                      onClick={() => {
                        setShowFeedbackDetailsModal(false)
                        setViewingFeedback(null)
                      }}
                    >
                      Fechar
                    </button>
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

                {/* Sub-tabs para Camera Requests */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setCameraSubTab('list')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        cameraSubTab === 'list'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Lista de Solicitações
                    </button>
                    <button
                      onClick={() => setCameraSubTab('details')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        cameraSubTab === 'details'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Detalhes & Chat
                    </button>
                  </nav>
                </div>

                {/* Conteúdo das abas */}
                {cameraSubTab === 'list' ? (
                  /* Lista de Solicitações */
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold">Todas as Solicitações</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(cameraRequests || []).map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.name}</div>
                                <div className="text-sm text-gray-500">ID: {request.id}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.phone}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate" title={request.cause}>
                                  {request.cause}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(request.createdAt).toLocaleDateString('pt-BR')}
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
                                <button
                                  onClick={() => {
                                    setSelectedChat(request.id)
                                    setCameraSubTab('details')
                                  }}
                                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Detalhes & Chat */
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
                          requestName={cameraRequests.find(r => r.id === selectedChat)?.cause || "Solicitação de câmera"}
                          requestStatus={cameraRequests.find(r => r.id === selectedChat)?.status || "pending"}
                          onStatusChange={(status: string) => {
                            setCameraRequests(prev => prev.map(req => 
                              req.id === selectedChat ? { ...req, status: status as "completed" | "pending" | "processing" } : req
                            ))
                          }}
                        />
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
                          <p className="text-gray-500">Selecione uma solicitação para ver o chat</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

                {/* Sub-tabs para Returns */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setReturnSubTab('list')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        returnSubTab === 'list'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Lista de Solicitações
                    </button>
                    <button
                      onClick={() => setReturnSubTab('details')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        returnSubTab === 'details'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Detalhes & Chat
                    </button>
                  </nav>
                </div>

                {/* Conteúdo das abas */}
                {returnSubTab === 'list' ? (
                  /* Lista de Solicitações */
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold">Todas as Solicitações</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(returnRequests || []).map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                                <div className="text-sm text-gray-500">ID: {request.id}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.orderId}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                                  {request.reason}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
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
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setSelectedChat(request.id)
                                    setReturnSubTab('details')
                                  }}
                                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Detalhes & Chat */
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
                          requestName={returnRequests.find(r => r.id === selectedChat)?.reason || "Solicitação de devolução"}
                          requestStatus={returnRequests.find(r => r.id === selectedChat)?.status || "pending"}
                          onStatusChange={(status: string) => {
                            setReturnRequests(prev => prev.map(req => 
                              req.id === selectedChat ? { ...req, status: status as "completed" | "pending" | "approved" | "rejected" } : req
                            ))
                          }}
                        />
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm h-96 flex items-center justify-center">
                          <p className="text-gray-500">Selecione uma solicitação para ver o chat</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Produtos */}

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
                                <button 
                                  onClick={() => {
                                    setViewingOrder(order)
                                    setShowOrderDetailsModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Ver detalhes"
                                >
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

            {/* Modal: Detalhes do Pedido */}
            {showOrderDetailsModal && viewingOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Detalhes do Pedido #{viewingOrder.id}</h3>
                    <button 
                      className="text-gray-500 hover:text-gray-700" 
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setViewingOrder(null)
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Informações do cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-medium mb-3">Informações do Cliente</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nome</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {viewingOrder.customerInfo?.name || viewingOrder.userName || 'Não informado'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">E-mail</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {viewingOrder.customerInfo?.email || 'Não informado'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Telefone</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {viewingOrder.customerInfo?.phone || 'Não informado'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-medium mb-3">Informações do Pedido</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <div className="p-2">
                              <select 
                                value={viewingOrder.status}
                                onChange={(e) => {
                                  updateOrderStatus(viewingOrder.id, e.target.value)
                                  setViewingOrder({...viewingOrder, status: e.target.value})
                                }}
                                className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                                  viewingOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  viewingOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  viewingOrder.status === 'preparing' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                  viewingOrder.status === 'delivering' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  viewingOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
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
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Data do Pedido</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {new Date(viewingOrder.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Total</label>
                            <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                              R$ {viewingOrder.total?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Endereço de entrega */}
                    {(viewingOrder.address || viewingOrder.customerInfo?.address) && (
                      <div>
                        <h4 className="text-lg font-medium mb-3">Endereço de Entrega</h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          {(() => {
                            // Verificar se o endereço está na raiz ou em customerInfo.address
                            const address = viewingOrder.address || viewingOrder.customerInfo?.address;
                            
                            if (!address || typeof address === 'string') {
                              return <div className="text-sm text-gray-500">Endereço não disponível</div>;
                            }
                            
                            return (
                              <div className="text-sm">
                                {address.street && address.number ? (
                                  <>
                                    {address.street}, {address.number}
                                    {address.complement && `, ${address.complement}`}
                                    <br />
                                    {address.neighborhood && `${address.neighborhood}, `}
                                    {address.city} - {address.state}
                                    <br />
                                    {address.zipCode && `CEP: ${address.zipCode}`}
                                    {address.reference && (
                                      <>
                                        <br />
                                        <span className="text-gray-600">Referência: {address.reference}</span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-500">Endereço incompleto</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Itens do pedido */}
                    <div>
                      <h4 className="text-lg font-medium mb-3">Itens do Pedido</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {viewingOrder.items.map((item: any, index: number) => {
                              // Verificar se o item tem a estrutura de CartItem (item.product) ou estrutura direta
                              const product = item.product || item; // Fallback para estrutura direta
                              const quantity = item.quantity || 1;
                              const price = product.price || 0;
                              
                              return (
                                <tr key={index}>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center">
                                      {product.image && (
                                        <img 
                                          src={product.image} 
                                          alt={product.name || 'Produto'}
                                          className="h-12 w-12 rounded object-cover mr-3"
                                        />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {product.name || 'Produto não identificado'}
                                        </div>
                                        {product.category && (
                                          <div className="text-xs text-gray-500">{product.category}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    R$ {price.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {quantity}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    R$ {(price * quantity).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Observações */}
                    {viewingOrder.observations && (
                      <div>
                        <h4 className="text-lg font-medium mb-3">Observações</h4>
                        <div className="p-4 bg-gray-50 rounded-lg text-sm">
                          {viewingOrder.observations}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t flex justify-end">
                    <button 
                      className="px-4 py-2 rounded-md text-sm border border-gray-300"
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setViewingOrder(null)
                      }}
                    >
                      Fechar
                    </button>
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
                      onClick={() => {
                        setEditingUser(null)
                        setUserForm({ 
                          name: '', 
                          email: '', 
                          role: 'user', 
                          phone: '',
                          password: '',
                          confirmPassword: '',
                          address: {
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            city: 'Fortaleza',
                            state: 'Ceará',
                            zipCode: ''
                          }
                        })
                        setShowUserModal(true)
                      }}
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
                                  <button 
                                    onClick={() => {
                                      setViewingUser(user)
                                      setShowUserDetailsModal(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Ver detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user)
                                      setUserForm({
                                        name: user.name,
                                        email: user.email,
                                        role: user.role as 'user' | 'manager' | 'admin',
                                        phone: user.phone || '',
                                        password: '',
                                        confirmPassword: '',
                                        address: user.address || {
                                          street: '',
                                          number: '',
                                          complement: '',
                                          neighborhood: '',
                                          city: '',
                                          state: '',
                                          zipCode: ''
                                        }
                                      })
                                      setShowUserModal(true)
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Excluir"
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
                <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                    <button className="text-gray-500 hover:text-gray-700" onClick={() => {
                      setShowUserModal(false)
                      setEditingUser(null)
                    }}>×</button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Informações básicas */}
                    <div>
                      <h4 className="text-lg font-medium mb-4">Informações Básicas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label className="block text-sm text-gray-600 mb-1">Telefone</label>
                          <input 
                            type="tel"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.phone}
                            onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(11) 99999-9999"
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
                    </div>

                    {/* Senha */}
                    {!editingUser && (
                      <div>
                        <h4 className="text-lg font-medium mb-4">Senha</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Senha</label>
                            <input 
                              type="password"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={userForm.password}
                              onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Digite a senha"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Confirmar Senha</label>
                            <input 
                              type="password"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={userForm.confirmPassword}
                              onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirme a senha"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    <div>
                      <h4 className="text-lg font-medium mb-4">Endereço</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">CEP</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.address.zipCode}
                            onChange={(e) => setUserForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, zipCode: e.target.value }
                            }))}
                            placeholder="00000-000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Rua</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.address.street}
                            onChange={(e) => setUserForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, street: e.target.value }
                            }))}
                            placeholder="Nome da rua"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Número</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.address.number}
                            onChange={(e) => setUserForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, number: e.target.value }
                            }))}
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Complemento</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.address.complement}
                            onChange={(e) => setUserForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, complement: e.target.value }
                            }))}
                            placeholder="Apto, Bloco, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Bairro</label>
                          <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={userForm.address.neighborhood}
                            onChange={(e) => setUserForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, neighborhood: e.target.value }
                            }))}
                          >
                            <option value="">Selecione o bairro</option>
                            {bairrosFortaleza.map(bairro => (
                              <option key={bairro} value={bairro}>{bairro}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Cidade</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                            value="Fortaleza"
                            readOnly
                            placeholder="Fortaleza"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Estado</label>
                          <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                            value="Ceará"
                            readOnly
                            placeholder="Ceará"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 rounded-md text-sm border border-gray-300"
                      onClick={() => {
                        setShowUserModal(false)
                        setEditingUser(null)
                      }}
                      disabled={isSubmittingUser}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white disabled:opacity-50"
                      onClick={editingUser ? updateUser : createUser}
                      disabled={isSubmittingUser}
                    >
                      {isSubmittingUser ? 'Salvando...' : editingUser ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Detalhes do Usuário */}
            {showUserDetailsModal && viewingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Detalhes do Usuário</h3>
                    <button 
                      className="text-gray-500 hover:text-gray-700" 
                      onClick={() => {
                        setShowUserDetailsModal(false)
                        setViewingUser(null)
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Informações básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingUser.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingUser.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingUser.phone || 'Não informado'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            viewingUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            viewingUser.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {viewingUser.role === 'admin' ? 'Administrador' :
                             viewingUser.role === 'manager' ? 'Gerente' : 'Cliente'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Cadastro</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {new Date(viewingUser.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID do Usuário</label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">{viewingUser.id}</div>
                      </div>
                    </div>

                    {/* Endereço */}
                    {viewingUser.address && (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-medium mb-4">Endereço</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm">
                            {viewingUser.address.street}, {viewingUser.address.number}
                            {viewingUser.address.complement && `, ${viewingUser.address.complement}`}
                            <br />
                            {viewingUser.address.neighborhood}, {viewingUser.address.city} - {viewingUser.address.state}
                            <br />
                            CEP: {viewingUser.address.zipCode}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estatísticas do usuário */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-medium mb-4">Estatísticas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {orders.filter(order => 
                              order.userId === viewingUser.id || 
                              order.userEmail === viewingUser.email ||
                              order.customerInfo?.email === viewingUser.email
                            ).length}
                          </div>
                          <div className="text-sm text-blue-600">Pedidos realizados</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            R$ {orders
                              .filter(order => 
                                order.userId === viewingUser.id || 
                                order.userEmail === viewingUser.email ||
                                order.customerInfo?.email === viewingUser.email
                              )
                              .reduce((sum, order) => sum + (order.total || 0), 0)
                              .toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">Total gasto</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {feedbacks.filter(feedback => 
                              feedback.userId === viewingUser.id || 
                              feedback.email === viewingUser.email
                            ).length}
                          </div>
                          <div className="text-sm text-yellow-600">Feedbacks enviados</div>
                        </div>
                      </div>
                    </div>

                    {/* Últimos pedidos */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-medium mb-4">Últimos Pedidos</h4>
                      <div className="space-y-2">
                        {orders
                          .filter(order => 
                            order.userId === viewingUser.id || 
                            order.userEmail === viewingUser.email ||
                            order.customerInfo?.email === viewingUser.email
                          )
                          .slice(0, 5)
                          .map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">Pedido #{order.id}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">R$ {order.total?.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">{order.status}</div>
                              </div>
                            </div>
                          ))}
                        {orders.filter(order => 
                          order.userId === viewingUser.id || 
                          order.userEmail === viewingUser.email ||
                          order.customerInfo?.email === viewingUser.email
                        ).length === 0 && (
                          <div className="text-center text-gray-500 py-4">Nenhum pedido encontrado</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 rounded-md text-sm border border-gray-300"
                      onClick={() => {
                        setShowUserDetailsModal(false)
                        setViewingUser(null)
                      }}
                    >
                      Fechar
                    </button>
                    <button 
                      className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white"
                      onClick={() => {
                        setEditingUser(viewingUser)
                        setUserForm({
                          name: viewingUser.name,
                          email: viewingUser.email,
                          role: viewingUser.role as 'user' | 'manager' | 'admin',
                          phone: viewingUser.phone || '',
                          password: '',
                          confirmPassword: '',
                          address: {
                            street: viewingUser.address?.street || '',
                            number: viewingUser.address?.number || '',
                            complement: viewingUser.address?.complement || '',
                            neighborhood: viewingUser.address?.neighborhood || '',
                            city: 'Fortaleza',
                            state: 'Ceará',
                            zipCode: viewingUser.address?.zipCode || ''
                          }
                        })
                        setShowUserDetailsModal(false)
                        setViewingUser(null)
                        setShowUserModal(true)
                      }}
                    >
                      Editar
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
                            if (file) uploadImage(file)
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
                            if (file) uploadImage(file)
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
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                            onLoad={() => {
                              // Imagem carregada com sucesso
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
