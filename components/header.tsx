'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Heart, User, Home, Package, MessageSquare, Camera, FileText, HelpCircle, Settings, LogOut, Info, Search, RefreshCw } from 'lucide-react'
import { useCartStore, useFavoritesStore, useAuthStore } from '@/lib/store'

export default function Header() {
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
        if (order && order.status === 'delivered') {
          // marcar como entregue e limpar id salvo
          setLastOrderDelivered(true)
          setLastOrderId(null)
          try { localStorage.removeItem('lastOrderId') } catch {}
        }
      } catch (e) {
        console.warn('Falha ao checar status do pedido:', e)
      }
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
      // Redirecionar para o catálogo com a busca
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
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
          const products = await response.json()
          setSearchResults(products.slice(0, 8)) // Limitar a 8 resultados
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
    <header className="bg-orange-500 shadow-sm border-b border-gray-200 sticky top-0 z-50 min-h-[64px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <img
            src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg"
              alt="Atacadão Guanabara"
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold hidden sm:block">
              <span className="text-white">Atacadão</span> <span className="text-blue-900">Guanabara</span>
            </span>
          </Link>

          {/* Barra de Pesquisa Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="🔍 Pesquisar produtos, marcas ou categorias..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length > 2 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full px-4 py-3 pl-12 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-md transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              
              {/* Resultados da busca desktop */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                      🔍 RESULTADOS PARA: "{searchQuery.toUpperCase()}"
                    </div>
                    <div className="space-y-3">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full text-left hover:bg-orange-50 rounded-lg p-3 transition-colors border border-transparent hover:border-orange-200"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</div>
                              <div className="text-sm text-orange-600 font-semibold">R$ {product.price.toFixed(2)}</div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="text-xs text-gray-500 line-through">R$ {product.originalPrice.toFixed(2)}</div>
                              )}
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                            <div className="text-xs text-gray-400 text-right">
                              {product.stock > 0 ? (
                                <span className="text-green-600">✓ Em estoque</span>
                              ) : (
                                <span className="text-red-600">✗ Fora de estoque</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`}
                        className="w-full text-center text-orange-600 hover:text-orange-700 font-medium text-sm py-2 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        Ver todos os resultados ({searchResults.length}+)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>



          {/* Desktop Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/favorites" className="relative p-2 text-gray-700 hover:text-red-600 transition-all duration-300 hover:scale-110 hidden md:block group">
              <Heart className="w-6 h-6 group-hover:animate-bounce" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-110 hidden md:block group">
              <ShoppingCart className="w-6 h-6 group-hover:animate-bounce" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in">
                  {cartItemCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 hidden sm:block">Olá, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/login" className="text-white hover:text-orange-200 transition-colors font-medium text-sm sm:text-base">
                  Entrar
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base">
                  Criar Conta
                </Link>
              </div>
            )}

            {/* Menu hamburguer para todas as telas */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2 text-gray-700 hover:text-orange-600 transition-all duration-300 hover:scale-110 mobile-tap-highlight group"
          >
              {isMenuOpen ? (
                <X className="w-6 h-6 group-hover:animate-bounce" />
              ) : (
                <Menu className="w-6 h-6 group-hover:animate-bounce" />
              )}
              
              {/* Indicador de notificações no menu */}
              {(cartItemCount > 0 || favoritesCount > 0) && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center animate-pulse-glow">
                  {cartItemCount + favoritesCount > 9 ? '9+' : cartItemCount + favoritesCount}
                </span>
              )}
          </button>
          </div>
        </div>
      </div>

      {/* Search Bar Mobile - Linha separada */}
      <div className="md:hidden border-t border-orange-400 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Pesquisar produtos ou marcas..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length > 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            
            {/* Resultados da busca mobile */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">PRODUTOS PARA: {searchQuery.toUpperCase()}</div>
                  <div className="space-y-3">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</div>
                            <div className="text-sm text-orange-600 font-semibold">R$ {product.price.toFixed(2)}</div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-xs text-gray-500 line-through">R$ {product.originalPrice.toFixed(2)}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Menu hamburguer para todas as telas */}
        {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            {/* Header do menu */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu de Navegação</h2>
          <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
                <X className="w-5 h-5" />
          </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* User Info */}
                {user && (
                  <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
          </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  {lastOrderId && !lastOrderDelivered && (
                    <Link 
                      href={`/order-status/${lastOrderId}`} 
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <RefreshCw className="w-5 h-5 text-orange-600 group-hover:animate-bounce" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Acompanhar Pedido</span>
                        <p className="text-xs text-gray-500">Pedido #{lastOrderId}</p>
                      </div>
                    </Link>
                  )}
                  <Link 
                    href="/" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Home className="w-5 h-5 text-blue-600 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Início</span>
                      <p className="text-xs text-gray-500">Página principal</p>
                    </div>
                  </Link>

                  <Link 
                    href="/catalog" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Package className="w-5 h-5 text-green-600 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Produtos</span>
                      <p className="text-xs text-gray-500">Ver todos os produtos</p>
                    </div>
                </Link>

                  <Link 
                    href="/cart" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group relative hover-scale-small"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <ShoppingCart className="w-5 h-5 text-blue-600 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Carrinho</span>
                      <p className="text-xs text-gray-500">Seus produtos selecionados</p>
                    </div>
                  {cartItemCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                  <Link 
                    href="/favorites" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group relative hover-scale-small"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <Heart className="w-5 h-5 text-red-600 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Favoritos</span>
                      <p className="text-xs text-gray-500">Produtos salvos</p>
                    </div>
                    {favoritesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/orders" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-5 h-5 text-purple-600 group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Meus Pedidos</span>
                      <p className="text-xs text-gray-500">Histórico de pedidos</p>
                    </div>
                    {pendingOrders > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
                        {pendingOrders}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/feedback" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <MessageSquare className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Feedback</span>
                      <p className="text-xs text-gray-500">Envie sua opinião</p>
                    </div>
                  </Link>

                  <Link 
                    href="/camera-request/form" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Solicitar Câmera</span>
                      <p className="text-xs text-gray-500">Perdeu algo? Solicite</p>
                    </div>
                    {pendingCameraRequests > 0 && (
                      <span className="bg-indigo-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
                        {pendingCameraRequests}
                      </span>
                    )}
                  </Link>

                  {/* Minhas solicitações de câmera (acesso ao chat) */}
                  <Link 
                    href="/camera-request/minhas" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Minhas Solicitações de Câmera</span>
                      <p className="text-xs text-gray-500">Ver e conversar com o suporte</p>
                    </div>
                  </Link>

                  <Link 
                    href="/faq" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <HelpCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Ajuda</span>
                      <p className="text-xs text-gray-500">Perguntas frequentes</p>
                    </div>
                  </Link>

                  <Link 
                    href="/returns" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Trocas e Devoluções</span>
                      <p className="text-xs text-gray-500">Solicitar troca ou devolução</p>
                    </div>
                    {pendingReturns > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in">
                        {pendingReturns}
                      </span>
                    )}
                  </Link>

                  {/* Minhas trocas/devoluções (acesso ao chat) */}
                  <Link 
                    href="/returns/minhas" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Minhas Trocas/Devoluções</span>
                      <p className="text-xs text-gray-500">Acompanhar e conversar</p>
                    </div>
                  </Link>

                  <Link 
                    href="/about" 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Info className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Sobre Nós</span>
                      <p className="text-xs text-gray-500">Conheça nossa história</p>
                    </div>
                </Link>

                  {/* Botão ADMIN - só aparece para admin logado */}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-orange-400 to-blue-400 shadow-lg hover:from-orange-500 hover:to-blue-500 transition-colors mobile-tap-highlight group border-2 border-orange-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors shadow">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-white drop-shadow">Painel Administrativo</span>
                        <p className="text-xs text-orange-100">Acesso restrito</p>
                      </div>
                    </Link>
                  )}
          </div>

                {/* Auth Section */}
                <div className="border-t border-gray-200 pt-6">
                {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-colors mobile-tap-highlight"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sair da Conta</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors mobile-tap-highlight"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>Entrar</span>
                      </Link>
                      <Link
                        href="/register"
                        className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors mobile-tap-highlight"
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
          </div>
        )}


    </header>
  )
} 