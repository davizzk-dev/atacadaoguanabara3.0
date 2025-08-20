'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Heart, User, Home, Package, MessageSquare, Camera, FileText, HelpCircle, Settings, LogOut, Info, Search, RefreshCw, Gift, Star, Sun, Moon } from 'lucide-react'
import { useCartStore, useFavoritesStore, useAuthStore } from '@/lib/store'
import type React from 'react'

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
          {/* Logo Única Imagem */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="https://i.ibb.co/99sx76P2/guanabara-1.png"
              alt="Guanabara"
              className="h-12 w-auto"
            />
          </Link>

          {/* Barra de Pesquisa Desktop - Apenas para PC grande */}
          <div className="hidden lg:flex flex-1 max-w-xl xl:max-w-2xl mx-2 lg:mx-4 relative">
            <form onSubmit={handleSearch} className="w-full relative flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="🔍 Buscar produtos, marcas, categorias..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="w-full px-4 py-2.5 md:py-3 pl-10 pr-12 text-base md:text-base bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 placeholder-gray-400 font-medium"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Search className="w-4 h-4" />
                </button>
                {searchQuery.trim().length > 0 && (
                  <button type="button" title="Limpar Pesquisa" className="absolute right-10 top-1/2 transform -translate-y-1/2 p-2 bg-transparent hover:bg-red-50 rounded-full" onClick={() => setSearchQuery("")}>
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
              
              {/* Resultados da busca - Largura adequada para tablets */}
              {/* Resultados da busca - Mobile optimized */}
              {/* Resultados da busca - Desktop enhanced */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                  <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                    <div className="text-lg font-bold text-gray-800 flex items-center">
                      <Search className="w-5 h-5 mr-3 text-orange-600" />
                      Resultados para "{searchQuery}"
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-80 search-scrollbar search-scrollable">
                    {searchResults.map((product: any) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 p-6 md:p-8 transition-all duration-200 border-b border-gray-100 last:border-b-0 flex items-center space-x-6 group"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border-2 border-gray-200 group-hover:border-orange-300 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-lg md:text-xl line-clamp-2 mb-3 group-hover:text-orange-800 transition-colors">{product.name}</div>
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="text-orange-600 font-bold text-xl md:text-2xl">R$ {product.price.toFixed(2)}</span>
                            {product.stock > 0 ? (
                              <span className="text-green-700 text-base bg-green-100 px-4 py-2 rounded-full font-medium border border-green-200">✓ Disponível</span>
                            ) : (
                              <span className="text-red-700 text-base bg-red-100 px-4 py-2 rounded-full font-medium border border-red-200">✗ Indisponível</span>
                            )}
                          </div>
                          {product.category && (
                            <div className="text-base text-gray-600 mt-2 bg-gray-100 px-3 py-1.5 rounded-full inline-block">{product.category}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200">
                    <button
                      onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`}
                      className="w-full text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      🔍 Ver todos os resultados ({searchResults.length}+)
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>



          {/* Desktop Actions - Agora incluindo tablets */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botão de modo escuro/claro funcional */}
            <button
              type="button"
              title="Alternar modo escuro/claro"
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const html = document.documentElement;
                  const isDark = html.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    html.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  } else {
                    html.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  }
                }
              }}
            >
              <span id="theme-icon">
                {/* Ícone muda conforme tema, renderizado via JS para evitar SSR issues */}
              </span>
            </button>
            <script dangerouslySetInnerHTML={{
              __html: `
                function updateThemeIcon() {
                  var icon = document.getElementById('theme-icon');
                  if (!icon) return;
                  if (document.documentElement.classList.contains('dark')) {
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
                  } else {
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>';
                  }
                }
                updateThemeIcon();
                window.addEventListener('DOMContentLoaded', updateThemeIcon);
                window.addEventListener('storage', updateThemeIcon);
                window.addEventListener('click', function(e) {
                  if (e.target.closest('[title="Alternar modo escuro/claro"]')) {
                    setTimeout(updateThemeIcon, 100);
                  }
                });
              `
            }} />
                        <Link href="/favorites" className="relative p-1 sm:p-2 text-gray-700 hover:text-orange-600 transition-all duration-300 hover:scale-105 hidden sm:block group">
                          <Heart className="w-5 sm:w-6 h-5 sm:h-6 group-hover:animate-bounce" />
                          {favoritesCount > 0 && (
                            <span className="absolute -top-1 sm:-top-1 -right-1 sm:-right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center animate-bounce-in">
                              {favoritesCount}
                            </span>
                          )}
                        </Link>
                        <Link href="/cart" className="relative p-1 sm:p-2 text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 hidden sm:block group">
                          <ShoppingCart className="w-5 sm:w-6 h-5 sm:h-6 group-hover:animate-bounce" />
                          {cartItemCount > 0 && (
                            <span className="absolute -top-1 sm:-top-1 -right-1 sm:-right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center animate-bounce-in">
                              {cartItemCount}
                            </span>
                          )}
                        </Link>
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-sm sm:text-base text-gray-700 hidden sm:block max-w-32 sm:max-w-none truncate font-medium">Olá, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors p-2"
                >
                  <LogOut className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <Link href="/login" className="text-black hover:text-orange-200 transition-colors font-medium text-sm sm:text-base lg:text-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2">
                  Entrar
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base lg:text-lg">
                  Criar Conta
                </Link>
              </div>
            )}

            {/* Menu hamburguer para todas as telas */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-3 text-gray-700 hover:text-orange-600 transition-all duration-300 hover:scale-110 mobile-tap-highlight group"
          >
              {isMenuOpen ? (
                <X className="w-7 h-7 group-hover:animate-bounce" />
              ) : (
                <Menu className="w-7 h-7 group-hover:animate-bounce" />
              )}
              
              {/* Indicador de notificações no menu */}
              {(cartItemCount > 0 || favoritesCount > 0) && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-sm font-bold rounded-full min-w-[18px] h-5 flex items-center justify-center animate-pulse-glow">
                  {cartItemCount + favoritesCount > 9 ? '9+' : cartItemCount + favoritesCount}
                </span>
              )}
          </button>
          </div>
        </div>
      </div>

      {/* Search Bar Tablets - Barra separada para tablets */}
  <div className="hidden sm:block lg:hidden border-t-2 border-[#0052cc] bg-gradient-to-r from-[#0052cc] to-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input      
                type="text"
                placeholder="🔍 Buscar produtos, marcas..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full px-5 py-4 pl-12 pr-5 text-base bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-300 focus:border-orange-500 placeholder-gray-400 font-medium shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            
            {/* Resultados da busca tablets - Design Bonito e Scrollável */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                  <div className="text-sm font-bold text-gray-800 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-orange-600" />
                    Resultados para "{searchQuery}"
                  </div>
                </div>
                <div className="overflow-y-auto max-h-80 search-scrollbar search-scrollable">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 p-5 transition-all duration-200 border-b border-gray-100 last:border-b-0 flex items-center space-x-5 group"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-orange-300 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-lg line-clamp-2 mb-3 group-hover:text-orange-800 transition-colors">{product.name}</div>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <span className="text-orange-600 font-bold text-xl">R$ {product.price.toFixed(2)}</span>
                          {product.stock > 0 ? (
                            <span className="text-green-700 text-base bg-green-100 px-3 py-1.5 rounded-full font-medium border border-green-200">✓ Disponível</span>
                          ) : (
                            <span className="text-red-700 text-base bg-red-100 px-3 py-1.5 rounded-full font-medium border border-red-200">✗ Indisponível</span>
                          )}
                        </div>
                        {product.category && (
                          <div className="text-base text-gray-600 mt-2 bg-gray-100 px-3 py-1.5 rounded-full inline-block">{product.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`}
                    className="w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    🔍 Ver todos os resultados ({searchResults.length}+)
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Search Bar Mobile - Design Bonito */}
  <div className="sm:hidden border-t-2 border-[#0052cc] bg-gradient-to-r from-[#0052cc] to-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar produtos, marcas..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full px-5 py-4 pl-12 pr-5 text-base bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-orange-300 focus:border-orange-500 placeholder-gray-400 font-medium shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            
            {/* Resultados da busca mobile - Design Bonito e Largura Adequada */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                  <div className="text-sm font-bold text-gray-800 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-orange-600" />
                    Resultados para "{searchQuery}"
                  </div>
                </div>
                <div className="overflow-y-auto max-h-80 search-scrollbar search-scrollable">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 p-5 transition-all duration-200 border-b border-gray-100 last:border-b-0 flex items-center space-x-5 group"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-orange-300 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-lg line-clamp-2 mb-3 group-hover:text-orange-800 transition-colors">{product.name}</div>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <span className="text-orange-600 font-bold text-xl">R$ {product.price.toFixed(2)}</span>
                          {product.stock > 0 ? (
                            <span className="text-green-700 text-base bg-green-100 px-3 py-1.5 rounded-full font-medium border border-green-200">✓ Disponível</span>
                          ) : (
                            <span className="text-red-700 text-base bg-red-100 px-3 py-1.5 rounded-full font-medium border border-red-200">✗ Indisponível</span>
                          )}
                        </div>
                        {product.category && (
                          <div className="text-base text-gray-600 mt-2 bg-gray-100 px-3 py-1.5 rounded-full inline-block">{product.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`}
                    className="w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    🔍 Ver todos os resultados ({searchResults.length}+)
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Menu hamburguer para todas as telas */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-screen w-80 bg-white shadow-xl overflow-hidden">
            {/* Header do menu */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Menu de Navegação</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="h-full overflow-y-auto bg-white pb-24">
              <div className="p-4">
                {/* User Info */}
                {user && (
                  <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-4 border border-orange-200 mb-4">
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

                {/* Navigation Links - Todos os links em uma lista */}
                  {lastOrderId && !lastOrderDelivered && (
                    <Link 
                      href={`/order-status/${lastOrderId}`} 
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group relative hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group relative hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group hover-scale-small mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mobile-tap-highlight group mb-2"
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