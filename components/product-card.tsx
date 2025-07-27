"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart, Minus, Plus, Zap, Check, Star } from "lucide-react"
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
    
    // Adicionar a quantidade selecionada
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

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 flex flex-col items-center justify-between min-h-[24rem] w-full p-4 relative overflow-hidden group hover-lift ${
        isHovered ? 'shadow-lg scale-105 border-blue-200' : 'hover:shadow-md hover:border-blue-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* Badge de desconto */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold animate-pulse">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </Badge>
        </div>
      )}

      {/* Botão de favorito - sempre visível */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group hover-scale-small button-press ${
          favorite 
            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse-glow' 
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500'
        }`}
      >
        <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''} group-hover:animate-bounce`} />
      </button>

      {/* Efeito de overlay no hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 rounded-2xl transition-opacity duration-300 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Imagem do produto */}
      <div className="w-full flex justify-center items-center mb-4 h-32 relative">
        {product.image && typeof product.image === 'string' && (
          <img
            src={product.image}
            alt={product.name}
            className={`h-28 w-auto object-contain rounded-xl bg-white border border-gray-100 shadow transition-all duration-300 hover-scale ${
              isHovered ? 'scale-110 shadow-lg' : ''
            }`}
          />
        )}
      </div>

      {/* Nome e marca */}
      <div className="w-full mb-2">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 truncate group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 font-medium truncate">{product.brand}</p>
      </div>

      {/* Avaliação */}
      <div className="flex items-center w-full mb-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
      </div>

      {/* Preço e unidade */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">R$ {product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              R$ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{product.unit}</span>
      </div>

      {/* Controles de quantidade */}
      <div className="flex flex-col items-center w-full mb-3 relative z-10">
        <div className="flex items-center justify-center w-full mb-2 gap-4">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={selectedQuantity === 1}
            className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-all duration-200 hover-scale-small button-press ${
              selectedQuantity === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold min-w-[2rem] text-center animate-scale-bounce">
            {selectedQuantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center transition-all duration-200 hover-scale-small button-press"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {quantity > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium animate-pulse-glow">
            🛒 {quantity} já no carrinho
          </div>
        )}
      </div>

      {/* Botão Adicionar ao Carrinho */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 mt-auto transition-all duration-300 shadow-md group hover-glow button-press ${
          isAdding
            ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105 hover:animate-glow'
        }`}
      >
        {isAdding ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <ShoppingCart className="w-5 h-5 group-hover:animate-bounce" />
        )}
        {isAdding ? 'Adicionando...' : `Adicionar ${selectedQuantity} ao Carrinho`}
      </button>

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
