"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, Heart, User, Home, Package, MessageSquare, Camera, FileText, HelpCircle, Settings, LogOut, Info, Search, RefreshCw, Gift, Star, Sun, Moon } from "lucide-react";
import { useCartStore, useFavoritesStore, useAuthStore } from "@/lib/store";

export default function Header(): JSX.Element {
  // Next.js navigation
  const router = (typeof window !== 'undefined' && require('next/navigation').useRouter) ? require('next/navigation').useRouter() : null;

  // Função de busca
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (router) {
        router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
        setShowSearchResults(false);
      }
    }
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingCameraRequests, setPendingCameraRequests] = useState(0);
  const { getItemCount } = useCartStore();
  const { favorites } = useFavoritesStore();
  const { user, logout } = useAuthStore();
  // Quantidade de itens no carrinho
  const cartItemCount = typeof getItemCount === 'function' ? getItemCount() : 0;
  // Quantidade de favoritos
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0;
  // Função de logout
  function handleLogout() {
    if (typeof logout === 'function') logout();
  }

  // Apenas lógica, funções e hooks aqui

  // Função para buscar produtos
  let searchTimeout: any = null;
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(!!value);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (value.length > 1) {
      searchTimeout = setTimeout(() => {
        fetch(`/api/products?search=${encodeURIComponent(value)}`)
          .then(res => res.json())
          .then(data => {
            const arr = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
            // Filtrar sugestões exatas ou que começam com o termo
            const normalized = value.trim().toLowerCase();
            const filtered = arr.filter((produto: any) => {
              const name = (produto.name || '').toLowerCase();
              // Só mostra se o nome começa com o termo ou contém o termo completo como palavra
              return name.startsWith(normalized) || name.split(' ').includes(normalized);
            });
            setSearchResults(filtered.slice(0, 6));
          });
      }, 300);
    } else {
      setSearchResults([]);
    }
  }

  function handleProductClick(id: string) {
    setShowSearchResults(false);
    setIsMenuOpen(false);
    // Adicione navegação para o produto se necessário
  }

  function checkPendingItems() {
    setPendingOrders(0);
    setPendingCameraRequests(0);
  }

  useEffect(() => {
    if (user?.email) {
      checkPendingItems();
    }
  }, [user]);

  // O JSX do header está dentro do return abaixo

                return (
                <header className="w-full bg-white shadow-lg sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                      <Link href="/" className="flex items-center justify-center">
                        <img src="https://i.ibb.co/TBGDxS4M/guanabara-1.png" alt="Logo" className="h-12 w-56 object-contain" />
                      </Link>
                      <form onSubmit={handleSearch} className="hidden lg:flex flex-1 mx-4 relative" style={{maxWidth:'400px'}}>
                        <div className="w-full relative">
                          <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full px-4 py-2 pl-10 pr-10 border-2 border-blue-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 bg-white shadow transition-all duration-300 text-gray-900 font-semibold"
                          />
                          <Search className="absolute left-2 top-2 h-5 w-5 text-blue-500" />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery("");
                                setShowSearchResults(false);
                                setSearchResults([]);
                              }}
                              className="absolute right-2 top-2 h-5 w-5 text-pink-500 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-12 bg-white rounded-xl shadow-xl border border-blue-200 mt-2 max-h-64 overflow-y-auto z-50 flex flex-col" style={{minWidth:'220px', maxWidth:'100%', width:'100%'}}>
                              {searchResults.map((produto: any) => (
                                <button
                                  key={produto.id}
                                  onClick={() => {
                                    if (router) {
                                      router.push(`/product/${produto.id}`);
                                      setShowSearchResults(false);
                                    }
                                  }}
                                  className="w-full flex items-center px-3 py-3 sm:px-4 sm:py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-left transition-all duration-200 focus:bg-blue-100 active:bg-blue-200"
                                  style={{fontSize:'1rem', minHeight:'48px', gap:'0.75rem'}}
                                >
                                  <img 
                                    src={produto.image || '/placeholder.png'} 
                                    alt={produto.name} 
                                    className="object-cover rounded-lg mr-3 shadow-sm" 
                                    style={{width:'60px',height:'60px',minWidth:'60px',minHeight:'60px',maxWidth:'60px',maxHeight:'60px',objectFit:'cover',display:'block',boxSizing:'border-box',margin:'0'}} 
                                  />
                                  <div className="flex-1 min-w-0 pl-2">
                                    <p className="font-semibold text-gray-900 text-base truncate">{produto.name}</p>
                                    <p className="text-sm text-gray-500 font-medium truncate">{produto.brand}</p>
                                    <p className="text-sm text-blue-600 font-bold">R$ {produto.price?.toFixed(2).replace('.', ',')}</p>
                                  </div>
                                </button>
                              ))}
                              <button
                                className="w-full py-3 text-center text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 border-t border-blue-100 rounded-b-xl text-base sm:text-lg"
                                style={{cursor:'pointer'}}
                                onClick={() => {
                                  if (router && searchQuery.trim()) {
                                    router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
                                    setShowSearchResults(false);
                                    setTimeout(() => {
                                      window.location.reload();
                                      setTimeout(() => {
                                        const el = document.getElementById('products-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 700);
                                    }, 300);
                                  }
                                }}
                              >
                                Ver mais resultados
                              </button>
                            </div>
                          )}
                        </div>
                      </form>
                      <div className="hidden lg:flex items-center space-x-3">
                        <Link href="/cart" className="relative p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-full hover:bg-blue-50">
                          <div className="relative">
                            <ShoppingCart className="h-7 w-7 drop-shadow-sm" />
                            {cartItemCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-bounce">
                                {cartItemCount}
                              </span>
                            )}
                          </div>
                        </Link>
                        <Link href="/favorites" className="relative p-3 text-gray-700 hover:text-red-600 transition-all duration-300 rounded-full hover:bg-red-50">
                          <Heart className="h-6 w-6" />
                          {favoritesCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                              {favoritesCount}
                            </span>
                          )}
                        </Link>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-full hover:bg-blue-50">
                          <Menu className="h-6 w-6" />
                        </button>
                        {user ? (
                          <div className="flex items-center space-x-3 ml-2">
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-800 block">Olá, {user.name}</span>
                              <span className="text-xs text-gray-500">Bem-vindo de volta!</span>
                            </div>
                            <button onClick={handleLogout} className="p-3 text-gray-700 hover:text-red-600 transition-all duration-300 rounded-full hover:bg-red-50">
                              <LogOut className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 ml-2">
                            <Link href="/login" className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300">
                              <User className="h-4 w-4" />
                              <span>Entrar</span>
                            </Link>
                            <Link href="/register" className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                              <User className="h-4 w-4" />
                              <span>Criar Conta</span>
                            </Link>
                          </div>
                        )}
                      </div>
                      <button className="lg:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                      </button>
                    </div>
                    <div className="lg:hidden pb-4 px-4">
                      <form onSubmit={handleSearch} className="relative">
                        <input
                          type="text"
                          placeholder="Buscar produtos..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="w-full px-4 py-3 pl-12 pr-12 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300"
                        />
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setShowSearchResults(false);
                              setSearchResults([]);
                            }}
                            className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </form>
                      {showSearchResults && searchResults.length > 0 && (
                        <div
                          className="absolute left-4 right-4 bg-white rounded-xl shadow-2xl border-2 border-gray-100 mt-2 z-50 backdrop-blur-lg"
                          style={{
                            maxHeight: '260px',
                            minWidth: '0',
                            width: '100%',
                            overflowY: 'auto',
                            boxSizing: 'border-box',
                          }}
                        >
                          {searchResults.map((produto: any) => (
                            <button
                              key={produto.id}
                              onClick={() => {
                                if (router) {
                                  router.push(`/product/${produto.id}`);
                                  setShowSearchResults(false);
                                }
                              }}
                              className="w-full flex items-center px-2 py-2 sm:px-4 sm:py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b border-gray-100 last:border-b-0 text-left transition-all duration-300"
                              style={{ minHeight: '44px', gap: '0.5rem' }}
                            >
                              <img
                                src={produto.image || '/placeholder.png'}
                                alt={produto.name}
                                className="object-cover rounded-lg shadow-sm"
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  minWidth: '60px',
                                  minHeight: '60px',
                                  maxWidth: '60px',
                                  maxHeight: '60px',
                                  objectFit: 'cover',
                                  display: 'block',
                                  boxSizing: 'border-box',
                                  margin: '0',
                                }}
                              />
                              <div className="flex-1 min-w-0 pl-2">
                                <p className="font-semibold text-gray-900 text-sm truncate" style={{ fontSize: '0.95rem' }}>{produto.name}</p>
                                <p className="text-xs text-gray-500 font-medium truncate">{produto.brand}</p>
                                <p className="text-xs text-blue-600 font-bold">R$ {produto.price?.toFixed(2).replace('.', ',')}</p>
                              </div>
                            </button>
                          ))}
                          <button
                            className="w-full py-3 text-center text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 border-t border-blue-100 rounded-b-xl text-base sm:text-lg"
                            style={{cursor:'pointer'}}
                            onClick={() => {
                              if (router && searchQuery.trim()) {
                                router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
                                setShowSearchResults(false);
                                window.onload = () => {
                                  setTimeout(() => {
                                    const el = document.getElementById('products-section');
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }, 400);
                                };
                              }
                            }}
                          >
                            Ver mais resultados
                          </button>
                        </div>
                      )}
                    </div>
                    {isMenuOpen && (
                      <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsMenuOpen(false)}>
                        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col h-full">
                            <div className="p-4 bg-blue-600 text-white">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold">Menu</h2>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-blue-700 rounded-full transition-colors">
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                              <div className="p-4 space-y-2 flex flex-col">
                                <Link href="/" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-1" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Home className="w-5 h-5 text-blue-600" /></div>
                                  <div><span className="font-medium text-gray-900">Início</span><p className="text-xs text-gray-500">Página principal</p></div>
                                </Link>
                                <Link href="/catalog" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-2" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-green-600" /></div>
                                  <div><span className="font-medium text-gray-900">Produtos</span><p className="text-xs text-gray-500">Ver catálogo</p></div>
                                </Link>
                                <Link href="/cart" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-3" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center relative">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                    {cartItemCount > 0 && (
                                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-bounce">
                                        {cartItemCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Carrinho</span><p className="text-xs text-gray-500">Seus produtos</p></div>
                                </Link>
                                <Link href="/favorites" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-4" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Heart className="w-5 h-5 text-red-600" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Favoritos</span><p className="text-xs text-gray-500">Produtos salvos</p></div>
                                  {favoritesCount > 0 && (<span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">{favoritesCount}</span>)}
                                </Link>
                                <Link href="/returns" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors order-5" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><RefreshCw className="w-5 h-5 text-yellow-600" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Trocas e Devoluções</span><p className="text-xs text-gray-500">Solicite trocas ou devoluções</p></div>
                                </Link>
                                <Link href="/returns/minhas" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors order-6" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center"><RefreshCw className="w-5 h-5 text-yellow-700" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Minhas Solicitações de Troca/Devolução</span><p className="text-xs text-gray-500">Acompanhe suas solicitações</p></div>
                                </Link>
                                <Link href="/camera-request" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors order-7" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Camera className="w-5 h-5 text-indigo-600" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Solicitar Câmera</span><p className="text-xs text-gray-500">Perdeu algo?</p></div>
                                </Link>
                                <Link href="/camera-request/minhas" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors order-8" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-indigo-200 rounded-lg flex items-center justify-center"><Camera className="w-5 h-5 text-indigo-700" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Minhas Solicitações de Câmera</span><p className="text-xs text-gray-500">Acompanhe suas solicitações</p></div>
                                </Link>
                                <Link href="/orders" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-colors order-9" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Histórico de Pedidos</span><p className="text-xs text-gray-500">Veja seus pedidos</p></div>
                                </Link>
                                <Link href="/feedback" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors order-10" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5 text-yellow-600" /></div>
                                  <div className="flex-1"><span className="font-medium text-gray-900">Feedback</span><p className="text-xs text-gray-500">Envie sua opinião</p></div>
                                </Link>
                                <Link href="/about" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-11" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Info className="w-5 h-5 text-orange-600" /></div>
                                  <div><span className="font-medium text-gray-900">Sobre Nós</span><p className="text-xs text-gray-500">Nossa história</p></div>
                                </Link>
                                <Link href="/faq" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors order-12" onClick={() => setIsMenuOpen(false)}>
                                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center"><HelpCircle className="w-5 h-5 text-teal-600" /></div>
                                  <div><span className="font-medium text-gray-900">Ajuda</span><p className="text-xs text-gray-500">FAQ</p></div>
                                </Link>
                                {/* Removido duplicação de links extras */}
                                
                                
                                
                                {user?.role === "admin" && (
                                  <Link href="/admin" className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" onClick={() => setIsMenuOpen(false)}>
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Settings className="w-5 h-5 text-white" /></div>
                                    <div><span className="font-bold text-white">Admin</span><p className="text-xs text-orange-100">Painel</p></div>
                                  </Link>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              {user ? (
                                <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                  <LogOut className="w-5 h-5" />
                                  <span className="font-semibold">Sair da Conta</span>
                                </button>
                              ) : (
                                <div className="space-y-3">
                                  <Link href="/login" className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setIsMenuOpen(false)}>
                                    <User className="w-5 h-5" />
                                    <span className="font-semibold">Entrar</span>
                                  </Link>
                                  <Link href="/register" className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setIsMenuOpen(false)}>
                                    <User className="w-5 h-5" />
                                    <span className="font-semibold">Criar Conta</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </header>
                );
              }
