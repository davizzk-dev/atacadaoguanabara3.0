'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { X, Sparkles, Target, Zap, Package } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import PromotionalBanner from '@/components/promotional-banner'
import { CategoryCarousel } from '@/components/category-carousel'
import { useAuthStore, useCartStore } from '@/lib/store'
import Link from 'next/link'

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleProducts, setVisibleProducts] = useState(50) // Mostrar 50 produtos inicialmente
  const { items, getItemCount, getTotal } = useCartStore()

  // Carregar produtos e categorias da API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar produtos da API
        const productsResponse = await fetch('/api/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData)
        } else {
          console.error('Erro ao carregar produtos:', productsResponse.status)
        }

        // Carregar categorias da API
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        } else {
          console.error('Erro ao carregar categorias:', categoriesResponse.status)
          // Fallback para categorias padrão
          setCategories(['Todos', 'Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Livros', 'Alimentos', 'Bebidas', 'Higiene', 'Limpeza'])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadData()
  }, [])

  // Função para aplicar promoções aos produtos
  const applyPromotionsToProducts = (products: Product[], promotions: any[]) => {
    return products.map(product => {
      // Encontrar promoção que inclui este produto
      const promotion = promotions.find(p => {
        return p.products && p.products.some((pp: any) => 
          pp.id === product.id || pp.id?.toString() === product.id?.toString()
        )
      })
      
      if (promotion) {
        const originalPrice = product.originalPrice || product.price
        let discountedPrice = originalPrice
        
        if (promotion.discountType === 'fixed') {
          discountedPrice = Math.max(0, originalPrice - (promotion.discountValue || promotion.discount || 0))
        } else {
          const discountPercent = (promotion.discountValue || promotion.discount || 0) / 100
          discountedPrice = originalPrice * (1 - discountPercent)
        }
        
        return {
          ...product,
          originalPrice: originalPrice,
          price: Math.round(discountedPrice * 100) / 100,
          discount: promotion.discountValue || promotion.discount || 0,
          discountType: promotion.discountType || 'percentage',
          onPromotion: true,
          promotionId: promotion.id,
          hasActivePromotion: true
        }
      }
      
      return {
        ...product,
        onPromotion: false,
        hasActivePromotion: false
      }
    })
  }

  // Carregar promoções e aplicar aos produtos
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const response = await fetch('/api/admin/promotions?status=active')
        if (response.ok) {
          const promotionsData = await response.json()
          if (promotionsData.success) {
            setPromotions(promotionsData.data || [])
          }
          
          // Aplicar promoções aos produtos
          const activePromotions = promotionsData.data || promotionsData || []
          const productsWithPromotions = applyPromotionsToProducts(products, activePromotions)
          setProducts(productsWithPromotions)
        }
      } catch (error) {
        console.error('Erro ao carregar promoções:', error)
      } finally {
        setLoading(false)
      }
    }

    // Só carregar promoções se já temos produtos
    if (products.length > 0) {
      loadPromotions()
    }
  }, [products])

  
  // Pop-up de cadastro (igual à página inicial)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const { user } = useAuthStore()
  
  useEffect(() => {
    if (user) return // Não mostrar se logado
    if (typeof window !== 'undefined' && localStorage.getItem('hideSignupModal') === '1') return
    const timer = setTimeout(() => setShowSignupModal(true), 10000)
    const onScroll = () => {
      if (window.scrollY > window.innerHeight / 2 && !showSignupModal) {
        setShowSignupModal(true)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [user, showSignupModal])
  
  function closeSignupModal() {
    setShowSignupModal(false)
    if (typeof window !== 'undefined') localStorage.setItem('hideSignupModal', '1')
  }

  // Capturar parâmetros da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      
      if (searchParam) {
        setSearchTerm(searchParam)
      }
    }
  }, [])

  const filteredProducts = products.filter((product: Product) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm === "" || 
           product.name.toLowerCase().includes(searchLower) ||
           (product.brand?.toLowerCase() || '').includes(searchLower) ||
           product.category.toLowerCase().includes(searchLower) ||
           (product.description?.toLowerCase() || '').includes(searchLower) ||
           (product.tags?.join(' ').toLowerCase() || '').includes(searchLower)
    
    // Lógica para categorias especiais
    let matchesCategory = false
    
    if (selectedCategory === "Todos") {
      matchesCategory = true
    } else if (selectedCategory === "Promoções") {
      // Produtos com preço original maior que o preço atual (em promoção)
      matchesCategory = !!(product.originalPrice && product.originalPrice > product.price)
    } else if (selectedCategory === "Mais Vendidos") {
      // Produtos com rating alto (simulando mais vendidos)
      matchesCategory = !!((product as any).rating && (product as any).rating >= 4.5)
    } else if (selectedCategory === "Novidades") {
      // Produtos adicionados recentemente (simulando novidades)
      const productDate = new Date((product as any).createdAt || Date.now())
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      matchesCategory = productDate > thirtyDaysAgo
    } else {
      // Categorias normais
      matchesCategory = product.category === selectedCategory
    }
    
    return matchesSearch && matchesCategory
  })

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("Todos")
    setVisibleProducts(50) // Reset para 50 produtos ao limpar filtros
  }

  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 50) // Carregar mais 50 produtos
  }

  const hasActiveFilters = searchTerm || (selectedCategory !== "Todos" && selectedCategory !== "Promoções" && selectedCategory !== "Mais Vendidos" && selectedCategory !== "Novidades")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 page-transition" style={{ overflow: 'visible' }}>
      <Header />
      <PromotionalBanner />
      
      <div className="container mx-auto px-4 py-8">
        {/* Abas de Navegação */}
        <div className="w-full mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory("Todos")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === "Todos"
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos os Produtos
            </button>
            <button
              onClick={() => setSelectedCategory("Promoções")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === "Promoções"
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔥 Promoções
            </button>
            <button
              onClick={() => setSelectedCategory("Mais Vendidos")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === "Mais Vendidos"
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⭐ Mais Vendidos
            </button>
            <button
              onClick={() => setSelectedCategory("Novidades")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === "Novidades"
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🆕 Novidades
            </button>
          </div>
        </div>

        {/* Carrossel de Categorias - De ponta a ponta */}
        <div className="w-full mb-8 -mx-4">
          <div className="px-4">
            <CategoryCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={(category) => {
                setSelectedCategory(category)
                // Scroll suave para a seção de produtos
                setTimeout(() => {
                  const productsSection = document.getElementById('products-section')
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
            />
          </div>
        </div>

        {/* Seções Especiais - Apenas quando não há filtros ativos */}
        {!searchTerm && selectedCategory === "Todos" && (
          <>
            {/* Seção DESTAQUES */}
            <div className="mb-12 fade-in-up">
              <div className="text-center mb-8">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 mb-4 animate-pulse">
                  <Sparkles className="h-4 w-4 mr-2" />
                  DESTAQUES
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  ⭐ Produtos em Destaque
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Os produtos mais populares e bem avaliados pelos nossos clientes
                </p>
              </div>
              
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products
                  .filter(product => (product as any).rating >= 4.5)
                  .slice(0, 10)
                  .map((product: Product, index: number) => (
                    <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Seção AURORA */}
            <div className="mb-12 fade-in-up">
              <div className="text-center mb-8">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 mb-4 animate-pulse">
                  <Target className="h-4 w-4 mr-2" />
                  AURORA
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🌅 Produtos Aurora
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Produtos da marca Aurora com qualidade garantida
                </p>
              </div>
              
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products
                  .filter(product => product.brand?.toLowerCase().includes('aurora'))
                  .slice(0, 8)
                  .map((product: Product, index: number) => (
                    <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Seção PROMOÇÕES */}
            <div className="mb-12 fade-in-up">
              <div className="text-center mb-8">
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 mb-4 animate-pulse">
                  <Zap className="h-4 w-4 mr-2" />
                  PROMOÇÕES
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  🔥 Ofertas Especiais
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Produtos com descontos imperdíveis para você economizar
                </p>
              </div>
              
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products
                  .filter(product => product.originalPrice && product.originalPrice > product.price)
                  .slice(0, 12)
                  .map((product: Product, index: number) => (
                    <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Header para resultados filtrados */}
        {(searchTerm || selectedCategory !== "Todos") && (
        <div className="text-center mb-8 fade-in-up" id="products-section">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 mb-4 animate-pulse">
            <Sparkles className="h-4 w-4 mr-2" />
            {searchTerm || selectedCategory !== "Todos" ? 'Resultados Filtrados' : 'Catálogo Completo'}
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {searchTerm ? `Busca: "${searchTerm}"` : 
              selectedCategory === "Promoções" ? "🔥 Promoções Especiais" :
              selectedCategory === "Mais Vendidos" ? "⭐ Produtos Mais Vendidos" :
              selectedCategory === "Novidades" ? "🆕 Produtos Novos" :
              selectedCategory !== "Todos" ? selectedCategory : 'Nossos Produtos'}
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            {searchTerm 
              ? `Encontramos ${filteredProducts.length} produtos para "${searchTerm}"`
              : selectedCategory === "Promoções"
              ? `${filteredProducts.length} produtos em promoção com descontos especiais`
              : selectedCategory === "Mais Vendidos"
              ? `${filteredProducts.length} produtos mais vendidos pelos nossos clientes`
              : selectedCategory === "Novidades"
              ? `${filteredProducts.length} produtos novos adicionados recentemente`
              : selectedCategory !== "Todos"
              ? `${filteredProducts.length} produtos em ${selectedCategory}`
              : 'Encontre os melhores produtos para sua casa com preços que cabem no seu bolso'
            }
          </p>
        </div>
        )}



        {/* Seção Todos os Produtos - Apenas quando não há filtros ativos */}
        {!searchTerm && selectedCategory === "Todos" && (
          <div className="mb-12 fade-in-up">
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 mb-4 animate-pulse">
                <Package className="h-4 w-4 mr-2" />
                CATÁLOGO COMPLETO
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                📦 Todos os Nossos Produtos
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Explore nosso catálogo completo com milhares de produtos
              </p>
            </div>
            
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.slice(0, visibleProducts).map((product: Product, index: number) => (
                <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            {/* Botão "Ver mais" para todos os produtos */}
            {visibleProducts < products.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreProducts}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Ver Mais Produtos ({Math.min(50, products.length - visibleProducts)} produtos)
                </Button>
                <p className="text-gray-600 mt-2">
                  Mostrando {visibleProducts} de {products.length} produtos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Products Grid para resultados filtrados */}
        {(searchTerm || selectedCategory !== "Todos") && (
          <>
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.slice(0, visibleProducts).map((product: Product, index: number) => (
                <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            {/* Botão "Ver mais" */}
            {visibleProducts < filteredProducts.length && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreProducts}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Ver Mais Produtos ({Math.min(50, filteredProducts.length - visibleProducts)} produtos)
                </Button>
                <p className="text-gray-600 mt-2">
                  Mostrando {visibleProducts} de {filteredProducts.length} produtos
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state melhorado */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 fade-in-up">
            <div className="text-8xl mb-6 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
              Não encontramos produtos com os filtros selecionados. Tente ajustar sua busca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Limpar Todos os Filtros
              </Button>
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Limpar Busca
              </Button>
              <Button
                onClick={() => setSelectedCategory("Todos")}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Todos os Produtos
              </Button>
              <Button
                onClick={() => setSelectedCategory("Promoções")}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                🔥 Ver Promoções
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center relative animate-fade-in">
            <button onClick={closeSignupModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl">×</button>
            <div className="mb-4">
              <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Logo" className="h-16 w-16 rounded-full mx-auto shadow-lg" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">Crie sua conta e aproveite ofertas exclusivas!</h2>
            <p className="text-gray-600 text-center mb-6">Receba descontos, acompanhe seus pedidos e tenha uma experiência completa no Atacadão Guanabara.</p>
            <Link href="/register" className="w-full">
              <button className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-3 rounded-lg shadow hover:from-orange-500 hover:to-orange-600 transition mb-2">Criar Conta Grátis</button>
            </Link>
            <button onClick={closeSignupModal} className="w-full text-gray-500 hover:text-blue-600 text-sm mt-1">Agora não</button>
          </div>
        </div>
      )}

      <Footer />
      
      {/* Carrinho Flutuante Melhorado */}
      <div className="fixed bottom-8 right-6 md:bottom-10 md:right-8 z-50" style={{ zIndex: 9999 }}>
        <div className="relative group">
            {/* Botão principal do carrinho */}
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full p-4 md:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 relative cursor-pointer"
            onClick={() => window.location.href = '/cart'}
          >
            {/* Ícone do carrinho melhorado */}
            <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            
            {/* Badge com quantidade */}
            {getItemCount() > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce-in border-2 border-white shadow-lg">
                {getItemCount() > 99 ? '99+' : getItemCount()}
              </div>
            )}
          </div>
          
          {/* Aba com informações detalhadas */}
          <div className="absolute bottom-full right-0 mb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 md:px-5 md:py-4 rounded-xl shadow-2xl whitespace-nowrap border border-orange-400 min-w-[200px]">
            {/* Botão X para fechar */}
            <button 
              className="absolute top-2 right-2 text-white hover:text-red-200 transition-colors text-lg font-bold"
              onClick={(e) => {
                e.stopPropagation()
                const tooltip = e.currentTarget.parentElement
                if (tooltip) tooltip.style.display = 'none'
              }}
            >
              ×
            </button>
            
            <div className="text-sm md:text-base font-bold text-center mb-1 pr-6">
              🛒 Seu Carrinho
            </div>
            
            {getItemCount() > 0 ? (
              <>
                <div className="text-xs md:text-sm opacity-90 text-center mb-2">
                  {getItemCount()} {getItemCount() === 1 ? 'item' : 'itens'}
                </div>
                <div className="text-sm md:text-base font-bold text-center text-yellow-200">
                  R$ {getTotal().toFixed(2)}
              </div>
              <div className="text-xs opacity-90 text-center mt-1">
                  Clique para finalizar
                </div>
              </>
            ) : (
              <div className="text-xs opacity-90 text-center">
                Carrinho vazio
              </div>
            )}
            
              {/* Seta da aba */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
            </div>
        </div>
      </div>
    </div>
  )
} 