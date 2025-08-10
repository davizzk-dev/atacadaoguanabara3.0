'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { X, Sparkles, Target, Zap } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'
import { products as productsData, categories } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import PromotionalBanner from '@/components/promotional-banner'
import { CategoryCarousel } from '@/components/category-carousel'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [products, setProducts] = useState<Product[]>(productsData)
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Função para aplicar promoções aos produtos
  const applyPromotionsToProducts = (products: Product[], promotions: any[]) => {
    console.log('🔍 Aplicando promoções aos produtos...')
    console.log('📦 Total de produtos:', products.length)
    console.log('🎯 Promoções ativas:', promotions.length)
    console.log('📋 Promoções:', promotions)
    
    return products.map(product => {
      console.log(`🔍 Verificando produto: ${product.name} (ID: ${product.id})`)
      
      const promotion = promotions.find(p => {
        console.log(`🔍 Comparando: promoção.productId (${typeof p.productId}) "${p.productId}" === produto.id (${typeof product.id}) "${product.id}"`)
        return p.productId === product.id && p.isActive
      })
      if (promotion) {
        console.log(`✅ Promoção encontrada para ${product.name}:`, promotion)
        console.log(`💰 Preço original: ${product.price} → Novo preço: ${promotion.newPrice}`)
        
        // Se há uma promoção ativa, ela tem prioridade sobre o originalPrice predefinido
        return {
          ...product,
          price: promotion.newPrice,
          originalPrice: promotion.originalPrice, // Usa o originalPrice da promoção
          discount: promotion.discount,
          promotionImage: promotion.image,
          hasActivePromotion: true // Marca que tem promoção ativa
        }
      } else {
        console.log(`❌ Nenhuma promoção para ${product.name} (ID: ${product.id})`)
      }
      return product
    })
  }

  // Carregar promoções e aplicar aos produtos
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const response = await fetch('/api/admin/product-promotions')
        if (response.ok) {
          const promotionsData = await response.json()
          setPromotions(promotionsData)
          
          // Aplicar promoções aos produtos
          const productsWithPromotions = applyPromotionsToProducts(productsData, promotionsData)
          setProducts(productsWithPromotions)
        }
      } catch (error) {
        console.error('Erro ao carregar promoções:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [])

  
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

        {/* Header Melhorado */}
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



        {/* Products Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredProducts.map((product: Product, index: number) => (
            <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

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
      
      {/* Carrinho Flutuante */}
      <div className="fixed bottom-8 right-6 md:bottom-10 md:right-8 z-50" style={{ zIndex: 9999 }}>
        <a href="/cart">
          <div className="relative group cursor-pointer">
            {/* Botão principal do carrinho */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            
            {/* Aba com texto */}
            <div className="absolute bottom-full right-0 mb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-xl whitespace-nowrap border border-orange-400">
              <div className="text-sm md:text-base font-bold text-center">
                Carrinho
              </div>
              <div className="text-xs opacity-90 text-center mt-1">
                Clique para ver
              </div>
              {/* Seta da aba */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
            </div>
          </div>´-hju b
        </a>
      </div>
    </div>
  )
} 