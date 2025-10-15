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

// Função para calcular dados de promoção do produto (sincronizada com product-card)
function calculateProductPromotionData(product: Product) {
  // Preços originais
  const originalPrice1 = product.price;
  const originalPrice2 = (product as any).priceAtacado || (product as any).prices?.precoVenda2 || (product as any).varejoFacilData?.precos?.precoVenda2 || 0;
  
  // Preços finais (iniciam como originais, depois podem ser sobrescritos pelas ofertas)
  let finalPrice1 = originalPrice1;
  let finalPrice2 = originalPrice2;
  
  let hasOffers = false;
  let bestPrice = originalPrice1;
  let originalPrice = originalPrice1;
  let discountPercent = 0;
  let priceSource = "normal";

  // Verificar se existe oferta1 e sobrescrever price1
  if (product.varejoFacilData?.precos?.precoOferta1 > 0) {
    finalPrice1 = product.varejoFacilData.precos.precoOferta1;
    hasOffers = true;
    
    // Calcular desconto para oferta1
    if (originalPrice1 > finalPrice1) {
      discountPercent = Math.round(((originalPrice1 - finalPrice1) / originalPrice1) * 100);
      bestPrice = finalPrice1;
      originalPrice = originalPrice1;
      priceSource = "oferta1";
    }
  }

  // Verificar se existe oferta2 e sobrescrever price2
  if (product.varejoFacilData?.precos?.precoOferta2 > 0 && originalPrice2 > 0) {
    finalPrice2 = product.varejoFacilData.precos.precoOferta2;
    hasOffers = true;
    
    // Se não temos oferta1, ou se oferta2 tem desconto melhor, usar oferta2 como principal
    const desconto2 = originalPrice2 > finalPrice2 ? Math.round(((originalPrice2 - finalPrice2) / originalPrice2) * 100) : 0;
    
    if (priceSource === "normal" || desconto2 > discountPercent) {
      discountPercent = desconto2;
      bestPrice = finalPrice2;
      originalPrice = originalPrice2;
      priceSource = priceSource === "oferta1" ? "oferta1_e_oferta2" : "oferta2";
    } else if (priceSource === "oferta1") {
      priceSource = "oferta1_e_oferta2";
    }
  }

  // Fallback para compatibilidade com estrutura prices antiga
  if (!hasOffers && product.prices) {
    if (product.prices.offerPrice1 > 0 && product.prices.price1 > 0 && 
        product.prices.offerPrice1 < product.prices.price1) {
      hasOffers = true;
      bestPrice = product.prices.offerPrice1;
      originalPrice = product.prices.price1;
      discountPercent = Math.round(((originalPrice - bestPrice) / originalPrice) * 100);
      priceSource = "prices_oferta1";
    }
    else if (product.prices.offerPrice2 > 0 && product.prices.price2 > 0 && 
             product.prices.offerPrice2 < product.prices.price2) {
      hasOffers = true;
      bestPrice = product.prices.offerPrice2;
      originalPrice = product.prices.price2;
      discountPercent = Math.round(((originalPrice - bestPrice) / originalPrice) * 100);
      priceSource = "prices_oferta2";
    }
  }

  return {
    hasOffers,
    bestPrice,
    originalPrice,
    discountPercent,
    priceSource,
    isPromotion: hasOffers && discountPercent > 0,
    price1: finalPrice1, // Preço 1 (original ou oferta1)
    price2: finalPrice2, // Preço 2 (original ou oferta2)
    originalPrice1, // Preço 1 original para comparação
    originalPrice2  // Preço 2 original para comparação
  };
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

  // Função para calcular preço baseado em gramas (usando dados de promoção)
  const calculatePriceForGrams = (product: Product, grams: number) => {
    const promotionData = calculateProductPromotionData(product);
    // Usar price1 (que pode ter oferta1 aplicada) como base para o cálculo por grama
    const pricePerGram = promotionData.price1 / 1000
    return pricePerGram * grams
  }

  // Função para buscar preços escalonados (usando dados de promoção)
  const getScaledPrices = (product: Product) => {
    const promotionData = calculateProductPromotionData(product);
    const productData = product as any;
    // Usar price2 do promotionData (que já pode ter sido sobrescrito por oferta2)
    const precoVenda2 = promotionData.price2;
    const quantidadeMinimaPreco2 = productData.prices?.quantidadeMinimaPreco2 > 1
      ? productData.prices.quantidadeMinimaPreco2
      : productData.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
    return { precoVenda2, quantidadeMinimaPreco2 };
  }

  const hasValidScaledPrices = (product: Product) => {
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices(product)
    return precoVenda2 > 0 && quantidadeMinimaPreco2 > 1
  }

  // Função para calcular o preço baseado na quantidade (usando dados de promoção)
  const calculatePrice = (product: Product, quantity: number) => {
    const promotionData = calculateProductPromotionData(product);
    
    if (!hasValidScaledPrices(product)) {
      return promotionData.price1 // Usar price1 (que pode ser sobrescrito por oferta1)
    }
    
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices(product)
    
    if (quantity >= quantidadeMinimaPreco2 && precoVenda2 > 0) {
      return promotionData.price2 // Usar price2 (que pode ser sobrescrito por oferta2)
    }
    
    return promotionData.price1 // Usar price1 (que pode ser sobrescrito por oferta1)
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
          
          // Buscar produtos relacionados dos mais vendidos
          try {
            const csvResponse = await fetch('/relatorioABCVenda.csv', {
              cache: 'no-store'
            })
            
            let relacionadosDosCsv: Product[] = []
            
            if (csvResponse.ok) {
              const csvText = await csvResponse.text()
              const lines = csvText.split('\n').slice(1).filter(line => line.trim())
              
              // Função para normalizar texto (mesma do admin)
              const normalize = (str: string) => {
                return str.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
              }
              
              // Buscar produtos do CSV que são da mesma categoria
              for (const line of lines.slice(0, 50)) { // Pegar apenas os 50 primeiros mais vendidos
                const columns = line.split(',')
                if (columns.length >= 2) {
                  const nomeCSV = columns[1]?.replace(/"/g, '').trim()
                  const codigoCSV = columns[0]?.replace(/"/g, '').trim()
                  
                  if (nomeCSV) {
                    // Buscar produto correspondente (APENAS COM ESTOQUE)
                    const produtoEncontrado = products.find(p => {
                      if (p.id === foundProduct.id) return false // Excluir o produto atual
                      if (p.category !== foundProduct.category) return false // Só da mesma categoria
                      if (!p.inStock) return false // APENAS produtos em estoque
                      
                      // Busca por nome normalizado
                      const nomeNormalizadoCSV = normalize(nomeCSV)
                      const nomeProdutoNormalizado = normalize(p.name)
                      
                      if (nomeNormalizadoCSV === nomeProdutoNormalizado) return true
                      
                      // Busca por código (últimos 4 dígitos)
                      if (codigoCSV && codigoCSV.length >= 4) {
                        const ultimosDigitos = codigoCSV.replace(/\D/g, '').slice(-4)
                        if (p.id.endsWith(ultimosDigitos)) return true
                      }
                      
                      return false
                    })
                    
                    if (produtoEncontrado && !relacionadosDosCsv.some(p => p.id === produtoEncontrado.id)) {
                      relacionadosDosCsv.push(produtoEncontrado)
                      if (relacionadosDosCsv.length >= 8) break // Máximo 8 produtos relacionados
                    }
                  }
                }
              }
            }
            
            // Se não encontrou suficientes dos mais vendidos, completar com produtos da mesma categoria (APENAS COM ESTOQUE)
            if (relacionadosDosCsv.length < 8) {
              const produtosRestantes = products
                .filter((p: Product) => 
                  p.category === foundProduct.category && 
                  p.id !== foundProduct.id &&
                  p.inStock && // APENAS produtos em estoque
                  !relacionadosDosCsv.some(r => r.id === p.id)
                )
                .slice(0, 8 - relacionadosDosCsv.length)
              
              relacionadosDosCsv = [...relacionadosDosCsv, ...produtosRestantes]
            }
            
            setRelatedProducts(relacionadosDosCsv)
            console.log(`🎯 Produtos relacionados carregados: ${relacionadosDosCsv.length} produtos dos mais vendidos`)
          } catch (error) {
            console.error('Erro ao carregar produtos relacionados dos mais vendidos:', error)
            // Fallback para produtos da mesma categoria (APENAS COM ESTOQUE)
            const related = products
              .filter((p: Product) => 
                p.category === foundProduct.category && 
                p.id !== foundProduct.id &&
                p.inStock // APENAS produtos em estoque
              )
              .slice(0, 8)
            setRelatedProducts(related)
          }
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

  // Calcular preço baseado na quantidade e opção selecionada (usando dados de promoção)
  useEffect(() => {
    if (!product) return

    let newPrice = product.price
    
    // Se é produto de peso, calcular por gramas (já inclui ofertas)
    if (isWeightProduct(product)) {
      newPrice = calculatePriceForGrams(product, selectedGrams)
    }
    // Usar sempre o sistema atualizado que inclui ofertas
    else {
      newPrice = calculatePrice(product, quantity)
    }

    setCurrentPrice(newPrice)
    console.log(`💰 Preço atual calculado para ${product.name}: R$ ${newPrice.toFixed(2)} (quantidade: ${quantity})`);
  }, [quantity, selectedGrams, product])

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
      // Para produtos normais, usar preço calculado (incluindo ofertas)
      const dynamicProduct = { 
        ...product, 
        price: calculatePrice(product, quantity)
      }
      for (let i = 0; i < quantity; i++) addItem(dynamicProduct)
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
                {(() => {
                  const promotionData = calculateProductPromotionData(product);
                  const displayPrice = isWeightProduct(product) 
                    ? calculatePriceForGrams(product, selectedGrams)
                    : calculatePrice(product, quantity);
                  
                  return displayPrice > 0 ? (
                    <>
                      <span className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${
                        promotionData.isPromotion ? 'from-red-600 to-pink-600' : 'from-orange-600 to-red-600'
                      } bg-clip-text text-transparent`}>
                        R$ {displayPrice.toFixed(2)}
                      </span>
                      
                      {/* Preço original riscado se há oferta */}
                      {promotionData.isPromotion && (
                        <>
                          <span className="text-xl text-gray-400 line-through">
                            R$ {promotionData.originalPrice.toFixed(2)}
                          </span>
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
                            {promotionData.discountPercent}% OFF
                          </Badge>
                        </>
                      )}
                      
                      {/* Badge de promoção se há oferta */}
                      {promotionData.isPromotion && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          🔥 OFERTA
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-500">
                      Consulte o preço
                    </span>
                  );
                })()}
              </div>

              {/* Informações de preços escalonados */}
              {hasAtacadoPrice && selectedPriceOption === 'atacado' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">🏭 Preços por Quantidade</h3>
                  
                  <div className="space-y-2">
                    {/* Preço 1 */}
                    {(() => {
                      const promotionData = calculateProductPromotionData(product);
                      return (
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600">
                              R$ {promotionData.price1.toFixed(2)}
                            </span>
                            {promotionData.price1 < promotionData.originalPrice1 && (
                              <span className="text-xs line-through text-gray-400">
                                R$ {promotionData.originalPrice1.toFixed(2)}
                              </span>
                            )}
                            {promotionData.price1 < promotionData.originalPrice1 && (
                              <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                                -{Math.round(((promotionData.originalPrice1 - promotionData.price1) / promotionData.originalPrice1) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })()}

                    {/* Preço 2 (Atacado) */}
                    {(() => {
                      const promotionData = calculateProductPromotionData(product);
                      return (
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-600">
                              R$ {promotionData.price2.toFixed(2)}
                            </span>
                            {promotionData.price2 < promotionData.originalPrice2 && (
                              <span className="text-xs line-through text-gray-400">
                                R$ {promotionData.originalPrice2.toFixed(2)}
                              </span>
                            )}
                            {promotionData.price2 < promotionData.originalPrice2 && (
                              <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                                -{Math.round(((promotionData.originalPrice2 - promotionData.price2) / promotionData.originalPrice2) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })()}
                    
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
                  // Controles simplificados para produtos de peso
                  <div className="space-y-4">
                    {/* Controles principais */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGrams(Math.max(100, selectedGrams - 100))}
                          disabled={selectedGrams <= 100}
                          className="w-8 h-8 p-0 border-orange-300 hover:border-orange-400 hover:bg-orange-100"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-20 text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {selectedGrams >= 1000 
                              ? `${(selectedGrams / 1000).toFixed(selectedGrams % 1000 === 0 ? 0 : 1)}kg`
                              : `${selectedGrams}g`
                            }
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedGrams(selectedGrams + 100)}
                          className="w-8 h-8 p-0 border-orange-300 hover:border-orange-400 hover:bg-orange-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Botões de quantidade comum */}
                    <div className="grid grid-cols-4 gap-2">
                      {[200, 500, 1000, 2000].map((grams) => (
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

                    {/* Input personalizado simplificado */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600">Personalizado:</span>
                      <Input
                        type="number"
                        min="100"
                        max="50000"
                        step="100"
                        value={selectedGrams}
                        onChange={(e) => {
                          const value = Math.max(100, Math.min(50000, Number(e.target.value) || 100))
                          setSelectedGrams(value)
                        }}
                        className="w-24 text-center text-orange-600 font-bold"
                        placeholder="gramas"
                      />
                      <span className="text-sm text-gray-600">gramas</span>
                    </div>

                    {/* Info do preço */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      {(() => {
                        const promotionData = calculateProductPromotionData(product);
                        return (
                          <div className="text-sm text-orange-700">
                            <div>Preço/kg: <span className="font-bold">R$ {promotionData.price1.toFixed(2)}</span></div>
                            {promotionData.price1 < promotionData.originalPrice1 && (
                              <div className="text-xs text-green-600 font-bold">
                                {Math.round(((promotionData.originalPrice1 - promotionData.price1) / promotionData.originalPrice1) * 100)}% OFF
                              </div>
                            )}
                          </div>
                        );
                      })()}
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