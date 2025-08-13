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

  const cartItem = items.find((item) => item.product.id === product.id)
  const quantity = cartItem?.quantity || 0
  const favorite = isFavorite(product.id)

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
    
    // Animação de loading
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    // Adicionar usando o produto original (sem modificar o preço)
    // O cálculo dinâmico será feito no store e no carrinho
    for (let i = 0; i < selectedQuantity; i++) {
      addItem(product)
    }
    
    setIsAdding(false)
    setShowSuccess(true)
    
    // Mostrar sucesso por mais tempo
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
    console.log('Botão + clicado!')
    setSelectedQuantity(prev => prev + 1)
  }

  const handleDecrement = () => {
    console.log('Botão - clicado!')
    if (selectedQuantity > 1) {
      setSelectedQuantity(prev => prev - 1)
    }
  }

  // Função para verificar se o produto tem preços escalonados válidos
  const hasValidScaledPrices = () => {
    const productData = product as any
    return (
      productData.prices?.price2 && 
      productData.prices.price2 > 0 && 
      productData.prices.minQuantityPrice2 && 
      productData.prices.minQuantityPrice2 > 0
    )
  }

  // Função para calcular o preço baseado na quantidade
  const calculatePrice = () => {
    if (!hasValidScaledPrices()) {
      return product.price
    }

    const productData = product as any
    const { price2, price3, minQuantityPrice2, minQuantityPrice3 } = productData.prices

    if (price3 && minQuantityPrice3 && selectedQuantity >= minQuantityPrice3) {
      return price3
    } else if (price2 && minQuantityPrice2 && selectedQuantity >= minQuantityPrice2) {
      return price2
    } else {
      return product.price
    }
  }

  const currentPrice = calculatePrice()

  return (
    <div 
      className={`bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 rounded-2xl shadow-lg border-2 border-blue-100 transition-all duration-500 flex flex-col h-auto min-h-[32rem] w-full max-w-xs mx-auto p-4 relative overflow-hidden group hover-lift ${
        isHovered ? 'shadow-2xl scale-105 border-blue-300 shadow-blue-200/50' : 'hover:shadow-xl hover:border-blue-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* Faixa de "Fora de Estoque" se não tiver estoque */}
      {!product.inStock && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
          
          {/* Faixa diagonal principal */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl">
            <div className="absolute top-[45%] left-[-25%] w-[150%] h-12 bg-red-600 transform rotate-[-45deg] flex items-center justify-center shadow-2xl border-2 border-red-400">
              <div className="text-white font-black text-xs tracking-[0.2em] drop-shadow-lg">
                <span className="text-orange-300">ATACADÃO</span> <span className="text-blue-300">GUANABARA</span>
              </div>
            </div>
            {/* Sombra da faixa */}
            <div className="absolute top-[45%] left-[-25%] w-[150%] h-12 bg-red-800/50 transform rotate-[-45deg] translate-y-1 blur-sm"></div>
          </div>
          
          {/* Badge "Fora de Estoque" */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-red-400 z-30">
            FORA DE ESTOQUE
          </div>
        </div>
      )}

      {/* Badge de desconto */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold animate-pulse shadow-lg border-2 border-white">
            🔥 {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </Badge>
        </div>
      )}

      {/* Botão de favorito - sempre visível */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl group hover-scale-small button-press ${
          favorite 
            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 animate-pulse-glow border-2 border-white' 
            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500 border-2 border-gray-200'
        }`}
      >
        <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''} group-hover:animate-bounce`} />
      </button>

      {/* Efeito de overlay no hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/15 rounded-3xl transition-opacity duration-500 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Imagem do produto */}
      <div className="w-full flex justify-center items-center mb-3 h-48 relative">
        {((product as any).promotionImage || product.image) && typeof ((product as any).promotionImage || product.image) === 'string' && (
          <img
            src={(product as any).promotionImage || product.image}
            alt={product.name}
            className={`h-44 w-auto object-contain rounded-lg bg-white border border-blue-100 shadow-sm transition-all duration-300 ${
              isHovered ? 'scale-105 border-blue-300' : ''
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

      {/* Nome e marca */}
      <div className="w-full mb-3 flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-600 font-medium truncate bg-blue-50 px-2 py-1 rounded-full inline-block">{product.brand}</p>
      </div>

      {/* Preço */}
      <div className="w-full mb-3">
        <div className="text-center">
          {/* Preço atual */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-blue-600">
              R$ {currentPrice.toFixed(2)}
            </span>
            {hasValidScaledPrices() && currentPrice < product.price && (
              <span className="text-xs line-through text-gray-400">
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Unidade */}
          <div className="text-xs text-gray-500 mt-1">{product.unit}</div>
          
          {/* Preços escalonados - sempre visível de forma compacta */}
          {hasValidScaledPrices() && (
            <div className="mt-2 space-y-1">
              {/* Preço atual com destaque */}
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block">
                <span className="font-medium">
                  💰 {selectedQuantity >= (product as any).prices.minQuantityPrice2 ? 'Preço especial ativo!' : `${(product as any).prices.minQuantityPrice2 - selectedQuantity} mais = R$ ${(product as any).prices.price2.toFixed(2)}`}
                </span>
              </div>
              
              {/* Lista compacta de preços */}
              <div className="text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span>1-{(product as any).prices.minQuantityPrice2 - 1} unid:</span>
                  <span className={selectedQuantity < (product as any).prices.minQuantityPrice2 ? 'font-medium text-blue-600' : ''}>
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>{(product as any).prices.minQuantityPrice2}+ unid:</span>
                  <span className={
                    selectedQuantity >= (product as any).prices.minQuantityPrice2 && 
                    (!((product as any).prices.price3) || selectedQuantity < (product as any).prices.minQuantityPrice3)
                      ? 'font-medium text-green-600' 
                      : 'text-gray-500'
                  }>
                    R$ {(product as any).prices.price2.toFixed(2)}
                  </span>
                </div>
                
                {/* Preço 3 (se existir) */}
                {(product as any).prices.price3 && (product as any).prices.minQuantityPrice3 && (
                  <div className="flex justify-between items-center">
                    <span>{(product as any).prices.minQuantityPrice3}+ unid:</span>
                    <span className={
                      selectedQuantity >= (product as any).prices.minQuantityPrice3 
                        ? 'font-medium text-green-600' 
                        : 'text-gray-500'
                    }>
                      R$ {(product as any).prices.price3.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles de quantidade */}
      <div className="flex items-center justify-center w-full mb-3 gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={selectedQuantity === 1}
          className={`w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center transition-all duration-200 ${
            selectedQuantity === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300'
          }`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-lg font-bold min-w-[2rem] text-center text-blue-600">
          {selectedQuantity}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-7 h-7 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center transition-all duration-200"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Botões de ação */}
      <div className="w-full space-y-2 mt-auto">
        <a
          href={`/product/${product.id}`}
          className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          Ver Detalhes
        </a>
        
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !product.inStock}
          className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            !product.inStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isAdding
                ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {!product.inStock ? (
            <>
              <ShoppingCart className="w-4 h-4" />
              Indisponível
            </>
          ) : isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Adicionar {selectedQuantity}
            </>
          )}
        </button>
      </div>

      {/* Feedback visual de sucesso */}
      {showSuccess && (
        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-full p-4 shadow-lg animate-success">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow-lg animate-slide-up">
            <p className="text-sm font-semibold text-green-700 text-center">
              ✅ Adicionado ao carrinho!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
