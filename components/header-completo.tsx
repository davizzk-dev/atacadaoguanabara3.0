'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Heart, User, Home, Package, MessageSquare, Camera, FileText, HelpCircle, Settings, LogOut, Info, Search, RefreshCw, Gift, Star, Sun, Moon } from 'lucide-react'
import { useCartStore, useFavoritesStore, useAuthStore } from '@/lib/store'

export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [lastOrderDelivered, setLastOrderDelivered] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingReturns, setPendingReturns] = useState(0)
  const [pendingCameraRequests, setPendingCameraRequests] = useState(0)
  const { getItemCount } = useCartStore()
  const { favorites } = useFavoritesStore()
  const { user, logout } = useAuthStore()
  
  const cartItemCount = getItemCount()
  const favoritesCount = favorites.length

  // Verificar pendências se o usuário estiver logado
  useEffect(() => {
    if (user?.email) {
      checkPendingItems()
    }
  }, [user])

  // Ler último pedido salvo localmente (qualquer usuário)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastOrderId')
      if (saved) setLastOrderId(saved)
    } catch {}
  }, [])

  // Verificar status do último pedido salvo e esconder o botão quando entregue
  useEffect(() => {
    const checkLastOrderStatus = async () => {
      if (!lastOrderId) return
      try {
        const res = await fetch(`/api/orders/${lastOrderId}`)
        if (!res.ok) return
        const data = await res.json()
        const order = data?.order || data
        setLastOrderDelivered(order?.status === 'delivered')
        // Limpar se entregue há mais de 7 dias
        if (order?.status === 'delivered' && order?.updatedAt) {
          const deliveredDate = new Date(order.updatedAt)
          const daysPassed = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysPassed > 7) {
            localStorage.removeItem('lastOrderId')
            setLastOrderId(null)
          }
        }
      } catch {}
    }
    checkLastOrderStatus()
  }, [lastOrderId])

  const checkPendingItems = async () => {
    try {
      // Verificar pedidos pendentes
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        if (ordersData.success && ordersData.orders) {
          const userOrders = ordersData.orders.filter((order: any) => 
            order.customerInfo?.email === user?.email && 
            ['pending', 'confirmed', 'preparing', 'delivering'].includes(order.status)
          )
          setPendingOrders(userOrders.length)
        }
      }

      // Verificar solicitações de troca/devolução pendentes
      const returnsResponse = await fetch('/api/return-requests', {
        headers: user?.email ? { 'x-user-email': user.email, 'x-user-id': user.id } as any : undefined
      })
      if (returnsResponse.ok) {
        const returnsData = await returnsResponse.json()
        if (returnsData.success && returnsData.data) {
          // Contar todas as solicitações pendentes (para mostrar no badge)
          const pendingReturns = returnsData.data.filter((returnReq: any) => 
            returnReq.status === 'pending'
          )
          setPendingReturns(pendingReturns.length)
        }
      }

      // Verificar solicitações de câmera pendentes
      const cameraResponse = await fetch('/api/camera-requests', {
        headers: user?.email ? { 'x-user-email': user.email, 'x-user-id': user.id } as any : undefined
      })
      if (cameraResponse.ok) {
        const cameraData = await cameraResponse.json()
        if (cameraData.success && cameraData.data) {
          const pendingCameras = cameraData.data.filter((camera: any) => 
            camera.status === 'pending' && 
            (camera.userId === user?.id || camera.userEmail === user?.email)
          )
          setPendingCameraRequests(pendingCameras.length)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pendências:', error)
    }
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Usar o mesmo filtro avançado do suggestion box
      fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}`)
        .then(res => res.ok ? res.json() : [])
        .then((products: any[]) => {
          const q = searchQuery.trim().toLowerCase()
          const filtered = products.filter(product =>
            product.name.toLowerCase().includes(q) ||
            (product.brand && product.brand.toLowerCase().includes(q)) ||
            (product.category && product.category.toLowerCase().includes(q))
          )
          filtered.sort((a, b) => {
            const aName = a.name.toLowerCase(), bName = b.name.toLowerCase()
            if (aName.startsWith(q) && !bName.startsWith(q)) return -1
            if (!aName.startsWith(q) && bName.startsWith(q)) return 1
            if (aName.includes(q) && !bName.includes(q)) return -1
            if (!aName.includes(q) && bName.includes(q)) return 1
            return 0
          })
          // Redirecionar para o catálogo passando os ids dos resultados filtrados
          const ids = filtered.slice(0, 8).map(p => p.id).join(',')
          window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}&ids=${ids}`
        })
    }
  }

  // Busca em tempo real
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim().length > 1) {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`)
        if (response.ok) {
          let products = await response.json()
          // Busca avançada: priorizar correspondência exata/inicial, incluir marca/categoria
          products = products.filter((product: any) => {
            const q = query.trim().toLowerCase()
            return (
              product.name.toLowerCase().includes(q) ||
              (product.brand && product.brand.toLowerCase().includes(q)) ||
              (product.category && product.category.toLowerCase().includes(q))
            )
          })
          // Ordenar por relevância: nome começa com query > inclui query > marca/categoria
          products.sort((a: any, b: any) => {
            const q = query.trim().toLowerCase()
            const aName = a.name.toLowerCase(), bName = b.name.toLowerCase()
            if (aName.startsWith(q) && !bName.startsWith(q)) return -1
            if (!aName.startsWith(q) && bName.startsWith(q)) return 1
            if (aName.includes(q) && !bName.includes(q)) return -1
            if (!aName.includes(q) && bName.includes(q)) return 1
            return 0
          })
          setSearchResults(products.slice(0, 8)) // Limitar a 8 resultados relevantes
          setShowSearchResults(true)
        }
      } catch (error) {
        console.error('Erro na busca:', error)
      }
    } else {
      setShowSearchResults(false)
      setSearchResults([])
    }
  }

  const handleProductClick = (productId: string) => {
    window.location.href = `/product/${productId}`
    setShowSearchResults(false)
    setSearchQuery('')
  }

  return (
    <header className="bg-transparent backdrop-blur-lg shadow-sm sticky top-0 z-50 min-h-[64px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="https://i.ibb.co/99sx76P2/guanabara-1.png"
              alt="Guanabara"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-xl xl:max-w-2xl mx-2 lg:mx-4 relative">
            <form onSubmit={handleSearch} className="w-full relative flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchResults(false)
                      setSearchResults([])
                    }}
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border mt-1 max-h-96 overflow-y-auto z-50">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 text-left"
                  >
                    <img
                      src={product.image || '/placeholder.png'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                      <p className="text-sm text-blue-600 font-medium">
                        R$ {product.price?.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <Link
              href="/favorites"
              className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <Heart className="h-6 w-6" />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {favoritesCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Olá, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                  setSearchResults([])
                }}
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Mobile Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 bg-white rounded-lg shadow-lg border mt-1 max-h-96 overflow-y-auto z-50">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 text-left"
                >
                  <img
                    src={product.image || '/placeholder.png'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      R$ {product.price?.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {lastOrderId && !lastOrderDelivered && (
                    <Link
                      href={`/order-status/${lastOrderId}`}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Acompanhar Pedido</span>
                        <p className="text-xs text-gray-500">Pedido #{lastOrderId}</p>
                      </div>
                    </Link>
                  )}
                  
                  <Link
                    href="/"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Início</span>
                      <p className="text-xs text-gray-500">Página principal</p>
                    </div>
                  </Link>

                  <Link
                    href="/catalog"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Produtos</span>
                      <p className="text-xs text-gray-500">Ver todos os produtos</p>
                    </div>
                  </Link>

                  <Link
                    href="/cart"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Carrinho</span>
                      <p className="text-xs text-gray-500">Seus produtos selecionados</p>
                    </div>
                    {cartItemCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/favorites"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Favoritos</span>
                      <p className="text-xs text-gray-500">Produtos salvos</p>
                    </div>
                    {favoritesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/orders"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Meus Pedidos</span>
                      <p className="text-xs text-gray-500">Histórico de pedidos</p>
                    </div>
                    {pendingOrders > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {pendingOrders}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/feedback"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Feedback</span>
                      <p className="text-xs text-gray-500">Envie sua opinião</p>
                    </div>
                  </Link>

                  <Link
                    href="/camera-request/form"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Solicitar Câmera</span>
                      <p className="text-xs text-gray-500">Perdeu algo? Solicite</p>
                    </div>
                    {pendingCameraRequests > 0 && (
                      <span className="bg-indigo-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {pendingCameraRequests}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/camera-request/minhas"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Minhas Solicitações de Câmera</span>
                      <p className="text-xs text-gray-500">Ver e conversar com o suporte</p>
                    </div>
                  </Link>

                  <Link
                    href="/faq"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Ajuda</span>
                      <p className="text-xs text-gray-500">Perguntas frequentes</p>
                    </div>
                  </Link>

                  <Link
                    href="/returns"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Trocas e Devoluções</span>
                      <p className="text-xs text-gray-500">Solicitar troca ou devolução</p>
                    </div>
                    {pendingReturns > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {pendingReturns}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/returns/minhas"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Minhas Trocas/Devoluções</span>
                      <p className="text-xs text-gray-500">Acompanhar e conversar</p>
                    </div>
                  </Link>

                  <Link
                    href="/about"
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Info className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Sobre Nós</span>
                      <p className="text-xs text-gray-500">Conheça nossa história</p>
                    </div>
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-orange-400 to-blue-400 shadow-lg hover:from-orange-500 hover:to-blue-500 transition-colors border-2 border-orange-500 mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-white drop-shadow">Painel Administrativo</span>
                        <p className="text-xs text-orange-100">Acesso restrito</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 p-4">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair da Conta</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Entrar</span>
                    </Link>
                    <Link
                      href="/register"
                      className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Criar Conta</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
