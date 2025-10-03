"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { 
  ArrowLeft, Heart, ShoppingCart, Minus, Plus, Share2, Package, 
  Hash, Eye, TrendingDown, Search, User, Home, 
  Trash2, X, ChevronDown, ChevronUp, Filter, Grid, List, ZoomIn, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Product } from "@/lib/types"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"
import Image from "next/image"

interface PriceData {
  id: number
  precoVenda1: number
  precoOferta1: number
  priceAtacado: number
  precoOferta2: number
  quantidadeMinimaPreco2: number
  precoVenda3: number
  precoOferta3: number
  quantidadeMinimaPreco3: number
  descontoMaximo: number
  permiteDesconto: boolean
}

export default function ProductPage() {
  const params = useParams()
  const productId = params && typeof params.id === 'string' ? params.id : ''
  const [product, setProduct] = useState<Product | null>(null)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedGrams, setSelectedGrams] = useState(100) // Para produtos de peso
  const [selectedKg, setSelectedKg] = useState(0.1) // Para input em kg
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [selectedPriceOption, setSelectedPriceOption] = useState<'unitario' | 'atacado'>('unitario')
  const [showFloatingCart, setShowFloatingCart] = useState(false)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const confettiRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const { addItem, items, removeItem, clearCart } = useCartStore()
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()

  // Verifica se é produto de peso pela marca
  const isWeightProduct = (product: Product | null) => {
    return product?.brand === "PRODUTOS DE PESO"
  }

  // Função para calcular preço baseado em gramas
  const calculatePriceForGrams = (product: Product, grams: number) => {
    // Assume que o preço do produto é por kg (1000g)
    const pricePerGram = product.price / 1000
    return pricePerGram * grams
  }

  // Função para buscar preços escalonados (igual ao ProductCard)
  const getScaledPrices = (product: Product) => {
    const productData = product as any;
    // Prioriza priceAtacado, depois precoVenda2 dos objetos prices/varejoFacilData
    const precoVenda2 = productData.priceAtacado > 0
      ? productData.priceAtacado
      : productData.prices?.precoVenda2 > 0
        ? productData.prices.precoVenda2
        : productData.varejoFacilData?.precos?.precoVenda2 || 0;
    const quantidadeMinimaPreco2 = productData.prices?.quantidadeMinimaPreco2 > 1
      ? productData.prices.quantidadeMinimaPreco2
      : productData.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
    return { precoVenda2, quantidadeMinimaPreco2 };
  }

  const hasValidScaledPrices = (product: Product) => {
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices(product)
    return precoVenda2 > 0 && quantidadeMinimaPreco2 > 1
  }

  // Função para calcular o preço baseado na quantidade (igual ao ProductCard)
  const calculatePrice = (product: Product, quantity: number) => {
    if (!hasValidScaledPrices(product)) {
      return product.price
    }
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices(product)
    if (precoVenda2 && quantidadeMinimaPreco2 && quantity >= quantidadeMinimaPreco2) {
      return precoVenda2
    } else {
      return product.price
    }
  }

  // Função para sincronizar kg com gramas
  const handleKgChange = (kg: number) => {
    setSelectedKg(kg)
    setSelectedGrams(kg * 1000)
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        
        // Buscar produtos reais da API
        const response = await fetch(`/api/products`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!Array.isArray(data)) {
          throw new Error('API deve retornar array de produtos')
        }
        
        const products: Product[] = data
        
        // Buscar produto
        const foundProduct = products.find((p: Product) => {
          return p.id.toString() === productId || p.id === productId || String(p.id) === String(productId)
        })
        
        if (foundProduct) {
          setProduct(foundProduct)
          
          // Usar o sistema de busca de preços do ProductCard
          if (hasValidScaledPrices(foundProduct)) {
            const scaledPrices = getScaledPrices(foundProduct)
            setPriceData({
              id: 0,
              precoVenda1: foundProduct.price,
              precoOferta1: foundProduct.originalPrice || 0,
              priceAtacado: scaledPrices.precoVenda2,
              precoOferta2: 0,
              quantidadeMinimaPreco2: scaledPrices.quantidadeMinimaPreco2,
              precoVenda3: 0,
              precoOferta3: 0,
              quantidadeMinimaPreco3: 0,
              descontoMaximo: 0,
              permiteDesconto: false
            })
          } else {
            // Fallback: tentar buscar preços da API antiga
            try {
              const pricesResponse = await fetch(`/api/product-prices?q=produtoId==${foundProduct.id}`, {
                cache: 'no-store'
              })
              
              if (pricesResponse.ok) {
                const pricesData = await pricesResponse.json()
                if (pricesData.success && pricesData.data?.items?.length > 0) {
                  const priceInfo = pricesData.data.items[0]
                  if (priceInfo.quantidadeMinimaPreco2 && priceInfo.quantidadeMinimaPreco2 > 1) {
                    setPriceData({
                      ...priceInfo,
                      priceAtacado: priceInfo.precoVenda2
                    })
                  }
                }
              }
            } catch (error) {
              console.log('Erro ao buscar preços escalonados:', error)
            }
          }
          
          // Buscar produtos relacionados da mesma categoria
          const related = products
            .filter((p: Product) => 
              p.category === foundProduct.category && 
              p.id !== foundProduct.id
            )
            .slice(0, 8)
          setRelatedProducts(related)
        } else {
          setProduct(null)
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Calcular preço baseado na quantidade e opção selecionada
  useEffect(() => {
    if (!product) return

    let newPrice = product.price
    
    // Se é produto de peso, calcular por gramas
    if (isWeightProduct(product)) {
      newPrice = calculatePriceForGrams(product, selectedGrams)
    }
    // Usar o sistema de cálculo do ProductCard como prioridade
    else if (hasValidScaledPrices(product)) {
      newPrice = calculatePrice(product, quantity)
    } 
    // Fallback para o sistema antigo se não tiver preços escalonados válidos
    else if (priceData) {
      // Se o usuário selecionou preço unitário, usar sempre preço 1
      if (selectedPriceOption === 'unitario') {
        newPrice = priceData.precoOferta1 !== undefined && priceData.precoOferta1 !== 0
          ? priceData.precoOferta1
          : priceData.precoVenda1 !== undefined && priceData.precoVenda1 !== 0
          ? priceData.precoVenda1
          : product.price
      } 
      // Se o usuário selecionou preço de atacado
      else if (selectedPriceOption === 'atacado') {
        // Verificar se quantidade atinge preço 2 (atacado)
        if (quantity >= priceData.quantidadeMinimaPreco2) {
          newPrice = priceData.precoOferta2 !== undefined && priceData.precoOferta2 !== 0
            ? priceData.precoOferta2
            : priceData.priceAtacado !== undefined && priceData.priceAtacado !== 0
            ? priceData.priceAtacado
            : product.price
        }
        // Se não atingiu quantidade mínima, usar preço unitário
        else {
          newPrice = priceData.precoOferta1 !== undefined && priceData.precoOferta1 !== 0
            ? priceData.precoOferta1
            : priceData.precoVenda1 !== undefined && priceData.precoVenda1 !== 0
            ? priceData.precoVenda1
            : product.price
        }
      }
    }

    setCurrentPrice(newPrice)
  }, [quantity, selectedGrams, priceData, product, selectedPriceOption])

  // Sincronizar kg com gramas
  useEffect(() => {
    setSelectedKg(selectedGrams / 1000)
  }, [selectedGrams])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    await new Promise((r) => setTimeout(r, 250))
    
    if (isWeightProduct(product)) {
      // Para produtos de peso, adicionar com preço calculado por gramas
      const dynamicProduct = { 
        ...product, 
        price: calculatePriceForGrams(product, selectedGrams),
        name: `${product.name} (${selectedGrams}g)`
      }
      addItem(dynamicProduct)
    } else {
      // Para produtos normais
      for (let i = 0; i < quantity; i++) addItem(product)
    }
    
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1600)
    // confetti simples
    try {
      const canvas = confettiRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        const w = (canvas.width = window.innerWidth)
        const h = (canvas.height = 180)
        const pieces = Array.from({ length: 60 }, () => ({
          x: Math.random() * w,
          y: Math.random() * 0,
          r: 4 + Math.random() * 6,
          c: `hsl(${Math.random() * 50 + 10},90%,55%)`,
          vy: 2 + Math.random() * 3,
          vx: -1 + Math.random() * 2
        }))
        let frames = 0
        const animate = () => {
          frames++
          ctx.clearRect(0, 0, w, h)
          pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy
            ctx.fillStyle = p.c
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
          })
          if (frames < 40) requestAnimationFrame(animate)
          else ctx.clearRect(0, 0, w, h)
        }
        animate()
      }
    } catch {}
  }

  const handleToggleFavorite = () => {
    if (product) {
      if (isFavorite(product.id)) {
        removeFavorite(product.id)
      } else {
        addFavorite(product.id)
      }
    }
  }

  const cartItem = items.find((item) => item.product.id === productId)
  const cartQuantity = cartItem?.quantity || 0

  // Verificar se o produto tem preço de atacado disponível usando o sistema do ProductCard
  const hasAtacadoPrice = product && hasValidScaledPrices(product)

  // Calcular total do carrinho
  const cartTotal = items.reduce((total, item) => {
    return total + (item.product.price * item.quantity)
  }, 0)

  // Função para remover item do carrinho
  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId)
  }

  // Função para alternar zoom da imagem
  const toggleImageZoom = () => {
    setImageZoomed(!imageZoomed)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-100">
          <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Atacadão Guanabara" className="w-24 h-24 rounded-xl object-cover" />
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            <p className="text-gray-700 font-semibold">Carregando produto — Atacadão Guanabara</p>
          </div>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Estamos preparando as melhores ofertas para você. Obrigado pela preferência! 🛒✨
          </p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">Este produto não existe no sistema do Varejo Fácil</p>
          <Link href="/catalog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Obter dados de preços escalonados usando o sistema do ProductCard
  const scaledPrices = getScaledPrices(product)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-6">
        {/* Confetti canvas */}
        <canvas ref={confettiRef} className="fixed top-0 left-0 right-0 pointer-events-none z-[70]" style={{ height: 180 }} />
        
        {/* Header simplificado */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/catalog">
            <Button variant="outline" className="bg-white/80 backdrop-blur border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
          
          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleFavorite}
                    className={`bg-white/80 backdrop-blur border-2 transition-all duration-200 ${
                      isFavorite(product.id)
                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                        : 'border-gray-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="bg-white/80 backdrop-blur border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compartilhar produto</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Imagem do produto */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 overflow-hidden">
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl relative group">
                <img
                  ref={imageRef}
                  src={product.image || "/placeholder-product.jpg"}
                  alt={product.name}
                  className={`max-w-full max-h-full object-contain cursor-zoom-in transition-all duration-300 ${
                    imageZoomed ? 'scale-150' : 'scale-100 group-hover:scale-105'
                  }`}
                  onClick={toggleImageZoom}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur hover:bg-white shadow-lg"
                  onClick={toggleImageZoom}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Badges do produto */}
              <div className="flex flex-wrap gap-2 mt-4">
                {product.isOnSale && (
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Em Promoção
                  </Badge>
                )}
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  <Package className="w-3 h-3 mr-1" />
                  {product.category}
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  #{product.id}
                </Badge>
              </div>
            </div>
            
            {imageZoomed && (
              <div 
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-zoom-out"
                onClick={toggleImageZoom}
              >
                <div className="max-w-4xl max-h-full p-8">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Informações do produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Preços Modernos */}
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 shadow-xl border border-orange-100">
              {/* Seletor de tipo de preço */}
              {hasAtacadoPrice && (
                <div className="mb-6">
                  <div className="flex bg-orange-50 rounded-xl p-1.5 mb-4 border border-orange-200">
                    <button
                      onClick={() => setSelectedPriceOption('unitario')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        selectedPriceOption === 'unitario'
                          ? 'bg-white text-orange-600 shadow-md border border-orange-200'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      � Unitário
                    </button>
                    <button
                      onClick={() => setSelectedPriceOption('atacado')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        selectedPriceOption === 'atacado'
                          ? 'bg-white text-green-600 shadow-md border border-green-200'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📦 Atacado
                    </button>
                  </div>
                  
                  {selectedPriceOption === 'atacado' && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-amber-800">
                        <span>💡</span>
                        <span className="font-medium">
                          Preço atacado a partir de {scaledPrices.quantidadeMinimaPreco2} unidades
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preço principal */}
              <div className="flex items-center gap-4 mb-6">
                {currentPrice > 0 ? (
                  <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    R$ {currentPrice.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    Consulte o preço
                  </span>
                )}
                
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                      {Math.round((1 - currentPrice / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Informações de preços escalonados */}
              {hasAtacadoPrice && selectedPriceOption === 'atacado' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">🏭 Preços por Quantidade</h3>
                  
                  <div className="space-y-2">
                    {/* Preço 1 */}
                    <button 
                      onClick={() => setQuantity(1)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
                        quantity < scaledPrices.quantidadeMinimaPreco2
                          ? 'bg-blue-100 border border-blue-300 ring-2 ring-blue-200' 
                          : 'bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-sm text-gray-700 font-medium">
                        1 - {scaledPrices.quantidadeMinimaPreco2 - 1} {isWeightProduct(product) ? 'kg' : 'unidades'}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </button>

                    {/* Preço 2 (Atacado) */}
                    <button 
                      onClick={() => setQuantity(scaledPrices.quantidadeMinimaPreco2)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
                        quantity >= scaledPrices.quantidadeMinimaPreco2
                          ? 'bg-green-100 border border-green-400 ring-2 ring-green-200' 
                          : 'bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm text-gray-700 font-medium">
                        {scaledPrices.quantidadeMinimaPreco2}+ {isWeightProduct(product) ? 'kg' : 'unidades'}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        R$ {scaledPrices.precoVenda2.toFixed(2)}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controles de quantidade e compra */}
            <div className="space-y-6">
              {/* Controle de Quantidade */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-800">
                    {isWeightProduct(product) ? 'Quantidade (gramas):' : 'Quantidade:'}
                  </span>
                </div>
                
                {isWeightProduct(product) ? (
                  // Controles para produtos de peso
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGrams(Math.max(0, selectedGrams - 100))}
                          disabled={selectedGrams <= 0}
                          className="w-10 h-10 p-0 border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <div className="w-16 text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedGrams}</div>
                          <div className="text-xs text-gray-500">gramas</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedGrams(selectedGrams + 100)}
                          className="w-10 h-10 p-0 border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Seletor rápido de gramas */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Seleções rápidas:</div>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 20000, 25000, 30000, 40000, 50000].map((grams) => (
                          <Button
                            key={grams}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGrams(grams)}
                            className={`${
                              selectedGrams === grams 
                                ? 'bg-orange-100 border-orange-400 text-orange-700' 
                                : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                            }`}
                          >
                            {grams >= 1000 ? `${grams/1000}kg` : `${grams}g`}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Input personalizado em kg */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Ou digite:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKgChange(Math.max(0, selectedKg - 1))}
                          disabled={selectedKg <= 0}
                          className="w-8 h-8 p-0 border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={selectedKg}
                          onChange={(e) => {
                            const value = Math.max(0, Math.min(50, Number(e.target.value) || 0))
                            handleKgChange(value)
                          }}
                          className="w-20 text-center text-orange-600 font-bold"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKgChange(selectedKg + 1)}
                          className="w-8 h-8 p-0 border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-sm text-gray-600">kg</span>
                    </div>

                    {/* Mostrar preço por kg */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <div className="text-sm text-orange-700">
                        Preço por kg: <span className="font-bold">R$ {product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Controles originais para produtos normais
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-10 h-10 p-0 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <div className="w-16 text-center">
                          <div className="text-2xl font-bold text-gray-800">{quantity}</div>
                          <div className="text-xs text-gray-500">unidades</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 p-0 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      {/* Botões de quantidade rápida para atacado */}
                      {hasAtacadoPrice && selectedPriceOption === 'atacado' && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(scaledPrices.quantidadeMinimaPreco2)}
                            className={`${quantity === scaledPrices.quantidadeMinimaPreco2 ? 'bg-green-100 border-green-400 text-green-700' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                          >
                            {scaledPrices.quantidadeMinimaPreco2}{isWeightProduct(product) ? 'kg' : ''}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(scaledPrices.quantidadeMinimaPreco2 + 10)}
                            className={`${quantity === scaledPrices.quantidadeMinimaPreco2 + 10 ? 'bg-green-100 border-green-400 text-green-700' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                          >
                            +{scaledPrices.quantidadeMinimaPreco2 + 10}{isWeightProduct(product) ? 'kg' : ''}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(scaledPrices.quantidadeMinimaPreco2 + 20)}
                            className={`${quantity === scaledPrices.quantidadeMinimaPreco2 + 20 ? 'bg-green-100 border-green-400 text-green-700' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                          >
                            +{scaledPrices.quantidadeMinimaPreco2 + 20}{isWeightProduct(product) ? 'kg' : ''}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resumo do preço atual */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Preço unitário:</div>
                      <div className="text-lg font-bold text-blue-600">
                        R$ {currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total:</div>
                      <div className="text-2xl font-bold text-green-600">
                        R$ {(currentPrice * quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {cartQuantity > 0 && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                      🛒 {cartQuantity} {isWeightProduct(product) ? 'kg' : 'unidades'} já no carrinho
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={currentPrice === 0 || !product.inStock || isAdding}
                  className={`text-white py-3 text-lg font-semibold disabled:bg-gray-400 ${isAdding ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} relative overflow-hidden`}
                  size="lg"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adicionando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {!product.inStock
                        ? 'Fora de estoque'
                        : currentPrice > 0
                        ? `Adicionar ${quantity}`
                        : 'Preço indisponível'}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="py-3 text-lg border-blue-300 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Favoritar
                </Button>
              </div>

              {showSuccess && (
                <div className="fixed top-20 right-4 z-[80] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in-up">
                  ✅ Produto adicionado ao carrinho
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Abas de informações */}
        <Card className="mb-8 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'description' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('description')}
              >
                Descrição
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('details')}
              >
                Detalhes
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">ID:</span>
                  <span className="font-semibold">{product.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Categoria:</span>
                  <span className="font-semibold">{product.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Unidade:</span>
                  <span className="font-semibold">{product.unit}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Estoque:</span>
                  <span className="font-semibold">{product.inStock ? 'Disponível' : 'Esgotado'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produtos relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Produtos Relacionados
              </h2>
<Button variant="outline" className="flex items-center gap-2" asChild>
  <Link href="/catalog">
    <span>Ver todos</span>
    <ChevronRight className="w-4 h-4" />
  </Link>
</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}

        {/* Carrinho flutuante moderno */}
        {showFloatingCart && (
          <div className="fixed inset-0 z-50 lg:inset-auto lg:top-20 lg:right-4 lg:bottom-auto">
            {/* Overlay para mobile */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setShowFloatingCart(false)}
            />
            
            {/* Container do carrinho */}
            <div className="absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl border border-gray-200 w-full lg:w-96 max-h-[80vh] lg:max-h-[32rem] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Seu Carrinho</h3>
                    <p className="text-sm text-gray-600">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowFloatingCart(false)}
                  className="hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Lista de itens */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-lg mb-2">Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar suas compras</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="relative">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200" 
                          />
                          <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-blue-500 text-xs">
                            {item.quantity}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600 mb-1">{item.product.category}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-600">
                              R$ {(item.product.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              R$ {item.product.price.toFixed(2)} cada
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full flex-shrink-0"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer com total e ações */}
              {items.length > 0 && (
                <div className="p-4 lg:p-6 border-t border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-green-600">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3" asChild>
                      <Link href="/cart">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Finalizar Compra
                      </Link>
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-300 hover:bg-gray-50"
                        onClick={() => setShowFloatingCart(false)}
                      >
                        Continuar Comprando
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={clearCart}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carrinho flutuante moderno */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button 
            className="rounded-full h-16 w-16 shadow-2xl relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-4 border-white transform hover:scale-110 transition-all duration-300"
            onClick={() => setShowFloatingCart(!showFloatingCart)}
          >
            <ShoppingCart className="w-7 h-7 text-white" />
            {items.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center p-0 bg-red-600 border-2 border-white text-white font-bold animate-bounce">
                {items.reduce((total, item) => total + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}