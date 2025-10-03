"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart, Minus, Plus, Zap, Check, Eye } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { useCartStore, useFavoritesStore } from "@/lib/store"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCartStore()
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [lastAddTime, setLastAddTime] = useState<number>(0)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedGrams, setSelectedGrams] = useState(100) // Para produtos de peso
  const [selectedKg, setSelectedKg] = useState(0.1) // Para input em kg

  // Verifica se é produto de peso pelo ID (produtos que têm brand "PRODUTOS DE PESO")
  const isWeightProduct = product.brand === "PRODUTOS DE PESO"

  const cartItem = items.find((item) => item.product.id === product.id)
  const quantity = cartItem?.quantity || 0
  const favorite = isFavorite(product.id)

  // Sincronizar selectedQuantity com a quantidade no carrinho
  useEffect(() => {
    if (cartItem && cartItem.quantity > 0) {
      setSelectedQuantity(cartItem.quantity)
    }
  }, [cartItem?.quantity])

  // Sincronizar kg com gramas
  useEffect(() => {
    setSelectedKg(selectedGrams / 1000)
  }, [selectedGrams])

  // Sincronizar gramas com kg
  const handleKgChange = (kg: number) => {
    setSelectedKg(kg)
    setSelectedGrams(kg * 1000)
  }

  // Timer para mostrar pop-up do carrinho
  useEffect(() => {
    if (lastAddTime > 0) {
      const timer = setTimeout(() => {
        setShowCartPopup(true)
      }, 30000) // 30 segundos

      return () => clearTimeout(timer)
    }
  }, [lastAddTime])

  const handleAddToCart = async () => {
    setIsAdding(true)
    setLastAddTime(Date.now()) // Reset timer
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    if (isWeightProduct) {
      // Para produtos de peso, adiciona com o preço calculado por gramas
      const dynamicProduct = { 
        ...product, 
        price: calculatePriceForGrams(selectedGrams),
        name: `${product.name} (${selectedGrams}g)`
      }
      addItem(dynamicProduct)
    } else {
      // Adiciona ao carrinho já com o preço dinâmico calculado
      const dynamicProduct = { ...product, price: calculatePrice() }
      for (let i = 0; i < selectedQuantity; i++) {
        addItem(dynamicProduct)
      }
    }
    
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleAddAtacadoToCart = async () => {
    const { quantidadeMinimaPreco2 } = getScaledPrices()
    
    setIsAdding(true)
    setLastAddTime(Date.now())
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    // Calcula a nova quantidade total
    const currentQuantity = cartItem?.quantity || 0
    const newTotalQuantity = currentQuantity + quantidadeMinimaPreco2
    
    // Atualiza a quantidade selecionada para refletir o total
    setSelectedQuantity(newTotalQuantity)
    
    // Se o produto já está no carrinho, atualiza diretamente a quantidade
    if (cartItem) {
      const dynamicProduct = { ...product, price: getScaledPrices().precoVenda2 }
      updateQuantity(product.id, newTotalQuantity)
    } else {
      // Se não está no carrinho, adiciona normalmente
      const atacadoProduct = { ...product, price: getScaledPrices().precoVenda2 }
      for (let i = 0; i < quantidadeMinimaPreco2; i++) {
        addItem(atacadoProduct)
      }
    }
    
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleToggleFavorite = () => {
    if (favorite) {
      removeFavorite(product.id)
    } else {
      addFavorite(product.id)
    }
  }

  const handleIncrement = () => {
    if (isWeightProduct) {
      setSelectedGrams(prev => prev + 100) // Incrementa 100g por vez
    } else {
      setSelectedQuantity(prev => {
        const newQuantity = prev + 1
        // Atualiza o preço do produto no carrinho se já estiver lá
        if (cartItem) {
          const dynamicProduct = { ...product, price: calculatePrice() }
          updateQuantity(product.id, newQuantity)
          // Opcional: pode atualizar o produto no store se necessário
        }
        return newQuantity
      })
    }
  }

  const handleDecrement = () => {
    if (isWeightProduct) {
      setSelectedGrams(prev => Math.max(0, prev - 100)) // Mínimo 0g, decrementa 100g
    } else if (selectedQuantity > 1) {
      setSelectedQuantity(prev => {
        const newQuantity = prev - 1
        if (cartItem) {
          const dynamicProduct = { ...product, price: calculatePrice() }
          updateQuantity(product.id, newQuantity)
        }
        return newQuantity
      })
    }
  }

  // Função para verificar se o produto tem preços escalonados válidos
  const getScaledPrices = () => {
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
    // Removido price3 e minQuantityPrice3
    return { precoVenda2, quantidadeMinimaPreco2 };
  }

  const hasValidScaledPrices = () => {
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
    return precoVenda2 > 0 && quantidadeMinimaPreco2 > 1
  }

  // Função para calcular o preço baseado na quantidade ou gramas
  const calculatePrice = () => {
    if (isWeightProduct) {
      return calculatePriceForGrams(selectedGrams)
    }
    
    if (!hasValidScaledPrices()) {
      return product.price
    }
    
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
    
    if (selectedQuantity >= quantidadeMinimaPreco2 && precoVenda2 > 0) {
      return precoVenda2
    }
    
    return product.price
  }

  // Função para calcular preço baseado em gramas
  const calculatePriceForGrams = (grams: number) => {
    // Assume que o preço do produto é por kg (1000g)
    const pricePerGram = product.price / 1000
    return pricePerGram * grams
  }

  const currentPrice = calculatePrice()

  return (
    <div 
      className={`bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 flex flex-col h-full w-full relative overflow-hidden group ${
        isHovered ? 'shadow-xl scale-[1.02] border-orange-300' : 'hover:shadow-lg hover:border-gray-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Faixa de "Fora de Estoque" se não tiver estoque */}
      {!product.inStock && (
        <div className="absolute inset-0 z-20 bg-black/50 rounded-xl flex items-center justify-center">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transform -rotate-12">
            FORA DE ESTOQUE
          </div>
        </div>
      )}

      {/* Badge de desconto */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute top-1 left-1 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-1 rounded-md">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </Badge>
        </div>
      )}

      {/* Botão de favorito */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-1 right-1 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          favorite 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
        }`}
      >
        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${favorite ? 'fill-current' : ''}`} />
      </button>

      {/* Imagem do produto */}
      <div className="w-full flex justify-center items-center p-1 sm:p-2 md:p-3 h-24 sm:h-32 md:h-36 lg:h-40">
        {((product as any).promotionImage || product.image) && typeof ((product as any).promotionImage || product.image) === 'string' && (
          <img
            src={(product as any).promotionImage || product.image}
            alt={product.name}
            className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
              isHovered ? 'scale-105' : ''
            }`}
            onError={(e) => {
              // Fallback para imagem original se a imagem da promoção falhar
              if ((product as any).promotionImage && product.image) {
                (e.target as HTMLImageElement).src = product.image
              }
            }}
          />
        )}
      </div>

      {/* Conteúdo do card */}
      <div className="p-1 sm:p-2 md:p-3 flex flex-col flex-1">
        {/* Nome do produto */}
        <h3 className="font-semibold text-gray-900 text-[10px] sm:text-xs md:text-sm leading-tight mb-1 line-clamp-2 min-h-[1.5rem] flex-shrink-0">
          {product.name}
        </h3>

        {/* Seção de preços */}
        <div className="mb-1 sm:mb-2 flex-shrink-0">
          <div className="text-center">
            {/* Preço atual */}
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm sm:text-base md:text-lg font-bold text-orange-600">
                {isWeightProduct 
                  ? `R$ ${calculatePriceForGrams(selectedGrams).toFixed(2)}`
                  : `R$ ${currentPrice.toFixed(2)}`
                }
              </span>
              {!isWeightProduct && hasValidScaledPrices() && currentPrice < product.price && (
                <span className="text-sm line-through text-gray-400">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Unidade */}
            {isWeightProduct ? (
              <div className="text-xs text-gray-500 mb-2">
                R$ {product.price.toFixed(2)}/kg - {selectedGrams}g selecionadas
              </div>
            ) : product.unit ? (
              <div className="text-xs text-gray-500 mb-2">{product.unit}</div>
            ) : null}
            
            {/* Preços escalonados com destaque */}
            {hasValidScaledPrices() && (() => {
              const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
              const economia = (product.price - precoVenda2) * quantidadeMinimaPreco2
              const percentualEconomia = ((product.price - precoVenda2) / product.price * 100)
              
              return (
                <div className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  {selectedQuantity >= quantidadeMinimaPreco2 ? (
                    <div className="text-green-700">
                      <div className="font-bold text-green-600 mb-1">🎉 Preço atacado ativo!</div>
                      <div>Economizando R$ {economia.toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="text-green-700 space-y-1">
                      <div className="font-bold">💰 Oferta Atacado</div>
                      <div>
                        <span className="font-semibold">
                          {quantidadeMinimaPreco2}+ {isWeightProduct ? 'kg' : 'unid'}:
                        </span>
                        <span className="ml-1 font-bold text-green-600">R$ {precoVenda2.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] bg-green-100 rounded px-1.5 py-0.5 inline-block">
                        Economize R$ {economia.toFixed(2)} ({percentualEconomia.toFixed(0)}%)
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Controles de quantidade */}
        <div className="flex items-center justify-center mb-4 gap-3 flex-shrink-0">
          {isWeightProduct ? (
            // Controles para produtos de peso (gramas)
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="text-xs text-gray-600 font-medium">Escolha a quantidade:</div>
              <div className="flex items-center gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={selectedGrams === 0}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    selectedGrams === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 border-gray-300'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <select
                  value={selectedGrams}
                  onChange={(e) => setSelectedGrams(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm font-bold text-orange-600 bg-white min-w-[80px] text-center"
                >
                  <option value={0}>0g</option>
                  <option value={100}>100g</option>
                  <option value={200}>200g</option>
                  <option value={300}>300g</option>
                  <option value={400}>400g</option>
                  <option value={500}>500g</option>
                  <option value={1000}>1kg</option>
                  <option value={2000}>2kg</option>
                  <option value={3000}>3kg</option>
                  <option value={4000}>4kg</option>
                  <option value={5000}>5kg</option>
                  <option value={6000}>6kg</option>
                  <option value={7000}>7kg</option>
                  <option value={8000}>8kg</option>
                  <option value={9000}>9kg</option>
                  <option value={10000}>10kg</option>
                  <option value={11000}>11kg</option>
                  <option value={12000}>12kg</option>
                  <option value={13000}>13kg</option>
                  <option value={14000}>14kg</option>
                  <option value={15000}>15kg</option>
                  <option value={20000}>20kg</option>
                  <option value={25000}>25kg</option>
                  <option value={30000}>30kg</option>
                  <option value={40000}>40kg</option>
                  <option value={50000}>50kg</option>
                </select>
                
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 flex items-center justify-center transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Input personalizado para quantidades específicas em kg */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Ou digite:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleKgChange(Math.max(0, selectedKg - 1))}
                    disabled={selectedKg <= 0}
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${
                      selectedKg <= 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                        : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 border-gray-300'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={selectedKg}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(50, Number(e.target.value) || 0))
                      handleKgChange(value)
                    }}
                    className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-orange-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleKgChange(selectedKg + 1)}
                    className="w-6 h-6 rounded border border-gray-300 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 flex items-center justify-center transition-all duration-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-gray-500">kg</span>
              </div>
            </div>
          ) : (
            // Controles originais para produtos normais
            <>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={selectedQuantity === 1}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  selectedQuantity === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 border-gray-300'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold min-w-[2rem] text-center text-orange-600">
                {selectedQuantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 flex items-center justify-center transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Botões de ação */}
        <div className="space-y-2 mt-auto">
          <a
            href={`/product/${product.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors duration-200"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </a>
          
          {/* Botão de atacado (só aparece se tiver preços escalonados) */}
          {hasValidScaledPrices() && (() => {
            const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
            const economia = (product.price - precoVenda2) * quantidadeMinimaPreco2
            return (
              <button
                onClick={handleAddAtacadoToCart}
                disabled={isAdding || !product.inStock}
                className={`w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                  !product.inStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAdding
                      ? 'bg-green-300 text-green-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transform hover:scale-[1.01]'
                }`}
              >
                {!product.inStock ? (
                  <>
                    <Zap className="w-3 h-3" />
                    Indisponível
                  </>
                ) : isAdding ? (
                  <>
                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Atacado: {quantidadeMinimaPreco2}{isWeightProduct ? 'kg' : 'x'} por R$ {(precoVenda2 * quantidadeMinimaPreco2).toFixed(2)}
                  </>
                )}
              </button>
            )
          })()}
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !product.inStock}
            className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              !product.inStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isAdding
                  ? 'bg-orange-300 text-orange-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
            }`}
          >
            {!product.inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                Indisponível
              </>
            ) : isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Adicionar {selectedQuantity > 1 ? `${selectedQuantity} unid.` : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback visual de sucesso */}
      {showSuccess && (
        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center z-30">
          <div className="bg-white rounded-full p-3 shadow-lg">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        </div>
      )}
    </div>
  )
}
