"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { LoadingCard } from "@/components/loading-spinner"
import { AnimatedCounter } from "@/components/animated-counter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { products as productsData } from "@/lib/data"
import { useUIStore } from "@/lib/store"
import { Truck, Shield, Clock, Star, Zap, Gift, ChevronRight, Sparkles, Target, Award, Heart, ShoppingCart, Eye, Minus, Plus } from "lucide-react"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store'
import { ProductCard } from '@/components/product-card'

export default function HomePage() {
  // Verificar se é a primeira visita
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisitedBefore = localStorage.getItem('hasVisitedBefore')
      if (!hasVisitedBefore) {
        // Primeira visita - redirecionar para catálogo
        localStorage.setItem('hasVisitedBefore', 'true')
        window.location.href = '/catalog'
      }
      // Se já visitou antes, não redirecionar - permitir acesso à página inicial
    }
  }, [])

  const { searchQuery } = useUIStore()
  const { addItem } = useCartStore() // Corrigido
  const { addFavorite, removeFavorite, favorites } = useFavoritesStore() // Corrigido
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [addedProductId, setAddedProductId] = useState<string | null>(null) // Para feedback visual
  const [quantityMap, setQuantityMap] = useState<{ [id: string]: number }>({}) // Para quantidade
  const [modalProduct, setModalProduct] = useState<any | null>(null) // Para modal do olhinho
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [lastAddTime, setLastAddTime] = useState<number>(0)
  const [productPromotions, setProductPromotions] = useState<Array<{
    id: string
    productId: string
    productName: string
    originalPrice: number
    newPrice: number
    discount: number
    image: string
    isActive: boolean
    createdAt: string
    validUntil?: string
  }>>([])

  // Timer para mostrar pop-up do carrinho
  useEffect(() => {
    if (lastAddTime > 0) {
      const timer = setTimeout(() => {
        setShowCartPopup(true)
      }, 30000) // 30 segundos

      return () => clearTimeout(timer)
    }
  }, [lastAddTime])

  // Pop-up de cadastro
  const [showSignupModal, setShowSignupModal] = useState(false)
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

  // Função para aplicar promoções aos produtos
  const applyPromotionsToProducts = (products: any[], promotions: any[]) => {
    return products.map(product => {
      const promotion = promotions.find(p => p.productId === product.id && p.isActive)
      if (promotion) {
        // Se há uma promoção ativa, ela tem prioridade sobre o originalPrice predefinido
        return {
          ...product,
          price: promotion.newPrice,
          originalPrice: promotion.originalPrice, // Usa o originalPrice da promoção
          discount: promotion.discount,
          promotionImage: promotion.image,
          hasActivePromotion: true // Marca que tem promoção ativa
        }
      }
      return product
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar promoções
        const promotionsResponse = await fetch('/api/admin/product-promotions')
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json()
          setProductPromotions(promotionsData)
          
          // Aplicar promoções aos produtos
          const productsWithPromotions = applyPromotionsToProducts(productsData, promotionsData)
          setProducts(productsWithPromotions)
          
          // Produtos em destaque (primeiros 8 com promoções aplicadas)
          setFeaturedProducts(productsWithPromotions.slice(0, 8))
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        // Fallback para dados originais
        setProducts(productsData)
        setFeaturedProducts(productsData.slice(0, 8))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Carregar produtos e promoções da API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar produtos
        console.log('Carregando produtos da API...')
        const productsResponse = await fetch('/api/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          console.log('Produtos carregados do backend:', productsData)
          setProducts(productsData)
          setFeaturedProducts(productsData.slice(0, 15))
          console.log('Produtos carregados:', productsData.length)
        } else {
          console.error('Erro ao carregar produtos:', productsResponse.status)
          // Usar dados locais como fallback
          console.log('Usando produtos estáticos como fallback')
          setProducts(productsData)
          setFeaturedProducts(productsData.slice(0, 15))
        }

        // Carregar promoções
        console.log('Carregando promoções da API...')
        const promotionsResponse = await fetch('/api/admin/product-promotions')
        console.log('Status da resposta das promoções:', promotionsResponse.status)
        
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json()
          console.log('Promoções carregadas do backend:', promotionsData)
          setProductPromotions(promotionsData)
          console.log('Promoções carregadas:', promotionsData)
          console.log('Promoções ativas:', promotionsData.filter((p: any) => p.isActive).length)
        } else {
          console.error('Erro na resposta da API de promoções:', promotionsResponse.status)
          // Usar dados locais como fallback
          setProductPromotions([])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        // Usar dados locais como fallback
        console.log('Erro geral - usando produtos estáticos como fallback')
        setProducts(productsData)
        setFeaturedProducts(productsData.slice(0, 15))
        setProductPromotions([])
      }
    }

    loadData()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  }).slice(0, 15) // Mostrar apenas 15 produtos na página inicial

  const onSaleProducts = products.filter((p) => p.originalPrice > p.price).slice(0, 5)
  const topRatedProducts = products.filter((p) => p.rating >= 4.5).slice(0, 5)

  const handleAddToCart = (product: any) => {
    const quantity = quantityMap[product.id] || 1
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setLastAddTime(Date.now()) // Reset timer
    toast({
      title: 'Produto adicionado!',
      description: `${product.name} (${quantity}x) foi adicionado ao carrinho.`,
    })
    setAddedProductId(product.id)
    setTimeout(() => setAddedProductId(null), 1200)
  }

  const handleToggleFavorite = (product: any) => {
    const isFav = favorites.includes(product.id)
    if (isFav) {
      removeFavorite(product.id)
    } else {
      addFavorite(product.id)
    }
  }

  const isFavorite = (productId: string) => {
    return favorites.includes(productId)
  }

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantityMap((prev) => ({ ...prev, [productId]: Math.max(1, value) }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Toaster />
      <Header />
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-secondary/20"></div>

        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <Badge className="bg-secondary/20 text-secondary-100 border-secondary/30 animate-pulse-glow">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ofertas Imperdíveis
                </Badge>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Atacadão{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary-400 animate-float">
                    Guanabara
                  </span>
                </h1>

                <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed">
                  Os melhores produtos com preços que cabem no seu bolso.
                  <span className="text-secondary font-semibold"> Preço baixo</span> e
                  <span className="text-secondary font-semibold"> qualidade!</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/catalog">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 group hover-scale button-press"
                  >
                    <Gift className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                    Ver Ofertas
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link href="/catalog">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white hover:text-blue-600 font-bold py-4 px-8 rounded-xl backdrop-blur-sm transition-all duration-300 bg-transparent hover-scale button-press"
                  >
                    <Truck className="h-5 w-5 mr-2" />
                    Fazer Pedido
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter value={1000} suffix="+" />
                  </div>
                  <p className="text-gray-300 text-sm">Clientes Felizes</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter value={5000} suffix="+" />
                  </div>
                  <p className="text-gray-300 text-sm">Produtos</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    <AnimatedCounter value={4.3} decimals={1} />
                  </div>
                  <p className="text-gray-300 text-sm">Avaliação</p>
                </div>
              </div>
            </div>

            {/* Imagem da Loja */}
            <div className="hidden lg:block animate-fade-in">
              <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-orange-200 transform hover:scale-105 transition-transform duration-300">
                <img
                  src="https://i.ibb.co/1Gxgmvk5/entrada.png"
                  alt="Entrada do Atacadão Guanabara"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-white text-center">
                    <div className="text-lg font-bold mb-1">ATACADÃO GUANABARA</div>
                    <div className="text-xs text-white/80">📍 R. Antônio Arruda, 1170</div>
                    <div className="text-xs text-white/80">Vila Velha - Fortaleza/CE</div>
                    <div className="text-xs text-white/80 mt-1">Desde 2020 - Seu parceiro de confiança</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 left-20 w-24 h-24 bg-secondary/30 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>

      {/* Promotions Banner */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-r from-secondary to-secondary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 animate-fade-in">
            <Zap className="h-8 w-8 animate-pulse" />
            <div className="text-center">
              <h2 className="text-2xl font-bold">Super Ofertas da Semana!</h2>
              <p className="text-secondary-100">Até 40% OFF em produtos selecionados</p>
            </div>
            <Zap className="h-8 w-8 animate-pulse" />
          </div>
        </div>
      </section>



                  {/* Product Promotions */}
      {productPromotions.filter(p => p.isActive).length > 0 && (
        <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 mb-4">
                <Zap className="h-4 w-4 mr-2" />
                Promoções Especiais ({productPromotions.filter(p => p.isActive).length})
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ofertas Imperdíveis
              </h2>
              <p className="text-gray-600 text-lg">
                Produtos selecionados com desconto especial para empreendedores e clientes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {productPromotions
                .filter(promotion => promotion.isActive)
                .map((promotion, index) => {
                  // Tentar encontrar o produto por ID - comparar como strings primeiro
                  let product = products.find(p => p.id.toString() === promotion.productId.toString())
                  
                  // Se não encontrar, tentar como números
                  if (!product) {
                    const promotionProductId = typeof promotion.productId === 'string' ? parseInt(promotion.productId) : promotion.productId
                    product = products.find(p => p.id === promotionProductId)
                  }
                  
                  console.log('Promoção ID:', promotion.productId, 'Produto encontrado:', !!product, 'Nome do produto:', product?.name, 'ID do produto:', product?.id)
                  
                  if (!product) {
                    console.warn('Produto não encontrado para promoção:', promotion)
                    console.log('Produtos disponíveis:', products.map(p => ({ id: p.id, name: p.name })))
                    return null
                  }
                  
                  return (
                    <div key={promotion.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <ProductCard 
                        product={{
                          ...product,
                          price: promotion.newPrice,
                          originalPrice: promotion.originalPrice,
                          image: promotion.image || product.image
                        }} 
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
              <Target className="h-4 w-4 mr-2" />
              Produtos em Destaque
            </Badge>
            <h2 className="text-4xl font-bold text-primary mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-gray-600 text-lg">
              Encontramos <span className="font-bold text-secondary">{filteredProducts.length}</span> produtos para você
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(10)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">Tente buscar por outro termo ou categoria</p>
            </div>
          )}

          {/* Botão Ver Todos */}
          <div className="text-center mt-8">
            <Link href="/catalog">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover-scale button-press">
                Ver Todos os Produtos
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Sections */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 space-y-16">
          {/* On Sale Products */}
          {onSaleProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-500 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-primary">Ofertas Relâmpago</h2>
                    <p className="text-gray-600">Aproveite enquanto durar!</p>
                  </div>
                </div>
                <Link href="/catalog">
                  <Button variant="outline" className="hover:bg-orange-50 hover:text-orange-600 bg-transparent hover-scale button-press">
                    Ver Todas
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {onSaleProducts.map((product, index) => (
                  <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Rated Products */}
          {topRatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-500 p-3 rounded-full">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-primary">Mais Bem Avaliados</h2>
                    <p className="text-gray-600">Produtos com as melhores notas</p>
                  </div>
                </div>
                <Link href="/catalog">
                  <Button variant="outline" className="hover:bg-yellow-50 hover:text-yellow-600 bg-transparent hover-scale button-press">
                    Ver Todos
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {topRatedProducts.map((product, index) => (
                  <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white"></section>

      {/* Footer */}
      <Footer />

      {/* Pop-up do Carrinho */}
      {showCartPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Produtos no Carrinho!</h3>
              <p className="text-gray-600 mb-6">
                Você adicionou produtos ao carrinho. Que tal finalizar sua compra?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCartPopup(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continuar Comprando
                </button>
                <a
                  href="/cart"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-center"
                >
                  Ver Carrinho
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalProduct && (
        <Dialog open={!!modalProduct} onOpenChange={open => !open && setModalProduct(null)}>
          <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-3xl shadow-2xl border-0">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 p-0">
              {/* Imagem do produto */}
              <div className="relative flex justify-center items-center h-64 sm:h-80 bg-white rounded-b-3xl shadow-lg overflow-hidden">
                {modalProduct.image && (
                  <img 
                    src={modalProduct.image} 
                    alt={modalProduct.name} 
                    className="w-auto h-56 sm:h-72 object-contain drop-shadow-xl rounded-2xl border-4 border-white bg-white"
                  />
                )}
                {/* Badge de desconto */}
              {modalProduct.originalPrice && modalProduct.originalPrice > modalProduct.price && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg animate-pulse">
                    {Math.round(((modalProduct.originalPrice - modalProduct.price) / modalProduct.originalPrice) * 100)}% OFF
                  </div>
                )}
                {/* Botão fechar */}
                <DialogClose asChild>
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors shadow-lg text-2xl font-bold">
                    ×
                  </button>
                </DialogClose>
              </div>

              {/* Conteúdo */}
              <div className="p-8 pt-6 bg-white rounded-b-3xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-2xl font-extrabold text-blue-900 mb-1 leading-tight">{modalProduct.name}</h2>
                    <p className="text-sm text-gray-500 font-medium mb-1">{modalProduct.brand}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(modalProduct)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-2 border-orange-100 ${
                      isFavorite(modalProduct.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite(modalProduct.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Avaliação */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(modalProduct.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({modalProduct.reviews} avaliações)</span>
                </div>

                {/* Preço e unidade */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-extrabold text-orange-600">R$ {modalProduct.price.toFixed(2)}</span>
                  {modalProduct.originalPrice && modalProduct.originalPrice > modalProduct.price && (
                    <span className="text-lg text-gray-400 line-through">
                      R$ {modalProduct.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold ml-auto">{modalProduct.unit}</span>
                </div>

                {/* Ver mais button */}
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 font-medium"
                    onClick={() => {
                      // Fechar modal
                      setModalProduct(null)
                      // Navegar para a página do produto
                      window.location.href = `/product/${modalProduct.id}`
                    }}
                  >
                    Ver mais
                  </Button>
                </div>

                {/* Controles de quantidade */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-4 bg-gray-50 rounded-lg px-4 py-2 shadow-inner">
                    <button 
                      onClick={() => handleQuantityChange(modalProduct.id, (quantityMap[modalProduct.id] || 1) - 1)} 
                      className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-bold min-w-[2.5rem] text-center">{quantityMap[modalProduct.id] || 1}</span>
                    <button 
                      onClick={() => handleQuantityChange(modalProduct.id, (quantityMap[modalProduct.id] || 1) + 1)} 
                      className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
              </div>
              </div>

                {/* Botão adicionar ao carrinho */}
                <button
                  onClick={() => handleAddToCart(modalProduct)}
                  className="w-full py-4 rounded-2xl font-extrabold text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
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
          </div>
        </a>
      </div>
    </div>
  )
}
