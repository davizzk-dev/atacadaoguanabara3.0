"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart, Minus, Plus, Zap, Check, Eye, Percent, Tag, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { useCartStore, useFavoritesStore } from "@/lib/store"

interface ProductCardProps {
  product: Product
}

// Função para calcular dados de promoção do produto
function calculateProductPromotionData(product: Product) {
  // Preços originais
  const originalPrice1 = product.price;
  const originalPrice2 = (product as any).priceAtacado || (product as any).prices?.price2 || (product as any).varejoFacilData?.precos?.precoVenda2 || 0;
  
  // Preços finais (iniciam como originais, depois podem ser sobrescritos pelas ofertas)
  let finalPrice1 = originalPrice1;
  let finalPrice2 = originalPrice2;
  
  let hasOffers = false;
  let bestPrice = originalPrice1;
  let originalPrice = originalPrice1;
  let discountPercent = 0;
  let priceSource = "normal";

  // Verificar se existe oferta1 válida (menor que preço original) e sobrescrever price1
  if (product.varejoFacilData?.precos?.precoOferta1 > 0 && originalPrice1 > 0 && 
      product.varejoFacilData.precos.precoOferta1 < originalPrice1) {
    finalPrice1 = product.varejoFacilData.precos.precoOferta1;
    hasOffers = true;
    
    // Calcular desconto para oferta1
    discountPercent = Math.round(((originalPrice1 - finalPrice1) / originalPrice1) * 100);
    bestPrice = finalPrice1;
    originalPrice = originalPrice1;
    priceSource = "oferta1";
  }

  // Verificar se existe oferta2 válida (menor que preço original) e sobrescrever price2
  if (product.varejoFacilData?.precos?.precoOferta2 > 0 && originalPrice2 > 0 &&
      product.varejoFacilData.precos.precoOferta2 < originalPrice2) {
    console.log(`🎯 OFERTA2 VÁLIDA DETECTADA para ${product.name}: ${originalPrice2} → ${product.varejoFacilData.precos.precoOferta2}`);
    finalPrice2 = product.varejoFacilData.precos.precoOferta2;
    hasOffers = true;
    
    // Calcular desconto para oferta2
    const desconto2 = Math.round(((originalPrice2 - finalPrice2) / originalPrice2) * 100);
    
    // Se não temos oferta1, ou se oferta2 tem desconto melhor, usar oferta2 como principal
    if (priceSource === "normal" || desconto2 > discountPercent) {
      discountPercent = desconto2;
      bestPrice = finalPrice2;
      originalPrice = originalPrice2;
      priceSource = priceSource === "oferta1" ? "oferta1_e_oferta2" : "oferta2";
    } else if (priceSource === "oferta1") {
      priceSource = "oferta1_e_oferta2";
    }
  } else if (product.varejoFacilData?.precos?.precoOferta2 > 0 && originalPrice2 > 0) {
    console.log(`❌ OFERTA2 INVÁLIDA para ${product.name}: oferta ${product.varejoFacilData.precos.precoOferta2} >= original ${originalPrice2}`);
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

  // Função para calcular se o produto está disponível
  const isProductAvailable = () => {
    // Se não sincroniza com Varejo Fácil, sempre disponível (estoque infinito)
    if ((product as any).syncWithVarejoFacil === false) {
      return true
    }
    
    // Senão, usa a lógica normal de estoque do Varejo Fácil
    return product.inStock
  }

  // Verifica se é produto de peso pelo ID (produtos que têm brand "PRODUTOS DE PESO")
  const isWeightProduct = product.brand === "PRODUTOS DE PESO"
  
  // Verifica se é produto vendido por peça com peso variável
  const isWeightPieceProduct = product.brand === "PRODUTOS DE PESO PEÇA"
  
  // Verifica se é bacon em manta (ID 19) - vendido em peças de 4.5kg
  const isBaconManta = product.id === "19"
  
  // Apenas produtos "PRODUTOS DE PESO" usam controles de peso (gramas)
  // Produtos "PRODUTOS DE PESO PEÇA" usam controles normais (unidades)
  const hasWeightControls = isWeightProduct
  
  // Calcular dados de promoção
  const promotionData = calculateProductPromotionData(product)

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
    console.log('🛒 handleAddToCart iniciado')
    console.log('📦 Produto:', product.name, 'ID:', product.id)
    console.log('⚖️ hasWeightControls:', hasWeightControls)
    console.log('📏 selectedGrams:', selectedGrams)
    console.log('🏷️ Brand:', product.brand)
    
    setIsAdding(true)
    setLastAddTime(Date.now()) // Reset timer
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    if (hasWeightControls) {
      // Para produtos de peso, adiciona com informações completas de gramatura
      const calculatedPrice = calculatePriceForGrams(selectedGrams)
      console.log('💰 Preço calculado para', selectedGrams, 'g:', calculatedPrice)
      
      const dynamicProduct = { 
        ...product, 
        price: calculatedPrice,
        name: `${product.name} (${selectedGrams >= 1000 
          ? `${(selectedGrams / 1000).toFixed(selectedGrams % 1000 === 0 ? 0 : 1)}kg`
          : `${selectedGrams}g`
        })`,
        weightInGrams: selectedGrams,
        isWeightProduct: true,
        unit: selectedGrams >= 1000 
          ? `${(selectedGrams / 1000).toFixed(selectedGrams % 1000 === 0 ? 0 : 1)}kg`
          : `${selectedGrams}g`
      }
      
      console.log('🎯 Produto dinâmico a ser adicionado:', dynamicProduct)
      addItem(dynamicProduct)
      console.log('✅ addItem chamado para produto de peso')
    } else {
      console.log('📊 Produto normal - selectedQuantity:', selectedQuantity)
      // Adiciona ao carrinho já com o preço dinâmico calculado
      const dynamicProduct = { ...product, price: calculatePrice() }
      for (let i = 0; i < selectedQuantity; i++) {
        addItem(dynamicProduct)
      }
      console.log('✅ addItem chamado para produto normal')
    }
    
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
    console.log('🏁 handleAddToCart finalizado')
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

  const handleIncrement = async () => {
    if (hasWeightControls) {
      if (isBaconManta) {
        // Para bacon em manta, incrementa por peças de 4,5kg
        setSelectedGrams(prev => prev + 4500)
      } else {
        // Para outros produtos de peso, incrementa 100g
        setSelectedGrams(prev => prev + 100)
      }
    } else {
      // Para produtos normais, incrementa e adiciona ao carrinho automaticamente (SEM ANIMAÇÃO)
      const newQuantity = selectedQuantity + 1
      setSelectedQuantity(newQuantity)
      
      // Adiciona ao carrinho diretamente sem delay ou animação
      const dynamicProduct = { ...product, price: calculatePrice() }
      addItem(dynamicProduct)
    }
  }

  const handleDecrement = () => {
    if (hasWeightControls) {
      if (isBaconManta) {
        // Para bacon em manta, decrementa por peças de 4,5kg (mínimo 1 peça)
        setSelectedGrams(prev => Math.max(4500, prev - 4500))
      } else {
        // Para outros produtos de peso, mínimo 100g, decrementa 100g
        setSelectedGrams(prev => Math.max(100, prev - 100))
      }
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
    // Usar price2 do promotionData (que já pode ter sido sobrescrito por oferta2)
    const precoVenda2 = promotionData.price2;
    const quantidadeMinimaPreco2 = productData.prices?.quantidadeMinimaPreco2 > 1
      ? productData.prices.quantidadeMinimaPreco2
      : productData.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
    return { precoVenda2, quantidadeMinimaPreco2 };
  }

  const hasValidScaledPrices = () => {
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
    return precoVenda2 > 0 && quantidadeMinimaPreco2 > 1
  }

  // Função para calcular o preço baseado na quantidade ou gramas
  const calculatePrice = () => {
    if (hasWeightControls) {
      return calculatePriceForGrams(selectedGrams)
    }
    
    if (!hasValidScaledPrices()) {
      return promotionData.price1 // Usar price1 (que pode ser sobrescrito por oferta1)
    }
    
    const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
    
    if (selectedQuantity >= quantidadeMinimaPreco2 && precoVenda2 > 0) {
      return promotionData.price2 // Usar price2 (que pode ser sobrescrito por oferta2)
    }
    
    return promotionData.price1 // Usar price1 (que pode ser sobrescrito por oferta1)
  }

  // Função para calcular preço baseado em gramas
  const calculatePriceForGrams = (grams: number) => {
    // Usar price1 (que pode ter oferta1 aplicada) como base para o cálculo por grama
    const pricePerGram = promotionData.price1 / 1000
    const finalPrice = pricePerGram * grams
    
    console.log('💱 calculatePriceForGrams:', {
      grams,
      'promotionData.price1': promotionData.price1,
      pricePerGram,
      finalPrice
    })
    
    return finalPrice
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
      {!isProductAvailable() && (
        <div className="absolute inset-0 z-20 bg-black/50 rounded-xl flex items-center justify-center">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transform -rotate-12">
            FORA DE ESTOQUE
          </div>
        </div>
      )}

      {/* Badge de promoção */}
      {promotionData.isPromotion && (
        <div className="absolute top-1 left-1 z-10 flex gap-1">
          {/* Badge principal de desconto */}
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg">
            {promotionData.discountPercent}% OFF
          </Badge>
          
          {/* Ícone de promoção */}
          <div className="bg-yellow-400 text-yellow-800 rounded-full p-1 shadow-lg animate-pulse">
            <Tag className="w-3 h-3" />
          </div>
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
            {/* Preço atual com informações de promoção */}
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className={`text-sm sm:text-base md:text-lg font-bold ${promotionData.isPromotion ? 'text-red-600' : 'text-orange-600'}`}>
                {hasWeightControls 
                  ? `R$ ${calculatePriceForGrams(selectedGrams).toFixed(2)}`
                  : `R$ ${currentPrice.toFixed(2)}`
                }
              </span>
              
              {/* Preço original riscado se há oferta1 */}
              {promotionData.price1 < promotionData.originalPrice1 && (
                <span className="text-xs sm:text-sm line-through text-gray-400">
                  R$ {promotionData.originalPrice1.toFixed(2)}
                </span>
              )}
              
              {/* Preço riscado para preços escalonados quando há oferta2 */}
              {(!hasWeightControls || isWeightPieceProduct) && hasValidScaledPrices() && promotionData.price2 < promotionData.originalPrice2 && selectedQuantity >= getScaledPrices().quantidadeMinimaPreco2 && (
                <span className="text-sm line-through text-gray-400">
                  R$ {promotionData.originalPrice2.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Indicador de economia para promoções */}
            {(promotionData.price1 < promotionData.originalPrice1 || 
              (hasValidScaledPrices() && promotionData.price2 < promotionData.originalPrice2 && selectedQuantity >= getScaledPrices().quantidadeMinimaPreco2)) && (
              <div className="flex items-center justify-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  {selectedQuantity >= getScaledPrices().quantidadeMinimaPreco2 && hasValidScaledPrices() && promotionData.price2 < promotionData.originalPrice2
                    ? `Economize R$ ${(promotionData.originalPrice2 - promotionData.price2).toFixed(2)} (${Math.round(((promotionData.originalPrice2 - promotionData.price2) / promotionData.originalPrice2) * 100)}% OFF)`
                    : `Economize R$ ${(promotionData.originalPrice1 - promotionData.price1).toFixed(2)} (${Math.round(((promotionData.originalPrice1 - promotionData.price1) / promotionData.originalPrice1) * 100)}% OFF)`
                  }
                </span>
              </div>
            )}
            
            {/* Unidade */}
            {hasWeightControls ? (
              <div className="text-xs text-gray-500 mb-2">
                R$ {promotionData.price1.toFixed(2)}/kg - {selectedGrams}g selecionadas
                {promotionData.price1 < promotionData.originalPrice1 && (
                  <span className="ml-1 line-through text-gray-400">
                    (era R$ {promotionData.originalPrice1.toFixed(2)}/kg)
                  </span>
                )}
              </div>
            ) : product.unit ? (
              <div className="text-xs text-gray-500 mb-2">{product.unit}</div>
            ) : null}
            
            {/* Aviso para produtos vendidos por peça com peso variável */}
            {isWeightPieceProduct && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2 mx-2">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-yellow-800 mb-1">
                      Produto por Peça
                    </div>
                    <div className="text-xs text-yellow-700 leading-relaxed">
                      Preço pode variar conforme o peso da peça. Valor final será calculado na pesagem.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Aviso especial para bacon em manta */}
            {isBaconManta && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 mx-2">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-800 mb-1">
                      Bacon em Manta - Peças de 4,5kg
                    </div>
                    <div className="text-xs text-blue-700 leading-relaxed">
                      Vendido em peças inteiras de aproximadamente 4,5kg cada. Peso pode variar ligeiramente.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Preços escalonados com destaque */}
            {hasValidScaledPrices() && (() => {
              const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
              
              // DEBUG: Log para verificar valores
              console.log(`💰 PREÇOS ATACADO para ${product.name}:`, {
                precoVenda2,
                originalPrice2: promotionData.originalPrice2,
                price2: promotionData.price2,
                quantidadeMinimaPreco2
              });
              
              // Calcular economia corretamente:
              // Se há oferta2, comparar precoVenda2 (que é oferta2) com originalPrice2
              // Se não há oferta2, comparar precoVenda2 com price1 (preço unitário)
              let precoComparacao = promotionData.originalPrice1; // Fallback para preço unitário
              let percentualEconomia = 0;
              
              if (promotionData.originalPrice2 > 0) {
                // Se existe preço atacado original, comparar com ele
                precoComparacao = promotionData.originalPrice2;
                if (precoVenda2 < precoComparacao) {
                  percentualEconomia = ((precoComparacao - precoVenda2) / precoComparacao * 100);
                }
              } else if (precoVenda2 < promotionData.price1) {
                // Se não existe preço atacado original, comparar com preço unitário
                precoComparacao = promotionData.price1;
                percentualEconomia = ((precoComparacao - precoVenda2) / precoComparacao * 100);
              }
              
              const economia = (precoComparacao - precoVenda2) * quantidadeMinimaPreco2
              
              console.log(`💯 CÁLCULO DESCONTO ATACADO:`, {
                precoComparacao,
                precoVenda2,
                percentualEconomia: percentualEconomia.toFixed(1),
                economia: economia.toFixed(2)
              });
              
              return (
                <div className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  {selectedQuantity >= quantidadeMinimaPreco2 ? (
                    <div className="text-green-700">
                      <div className="font-bold text-green-600 mb-1">🎉 Preço atacado ativo!</div>
                      {economia > 0 && (
                        <div>
                          Economizando R$ {economia.toFixed(2)} ({percentualEconomia.toFixed(0)}%)
                        </div>
                      )}
                      {promotionData.price2 < promotionData.originalPrice2 && (
                        <div className="text-xs text-orange-600 mt-1">
                          ⚡ Com oferta aplicada!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-green-700 space-y-1">
                      <div className="font-bold">💰 Oferta Atacado</div>
                      <div>
                        <span className="font-semibold">
                          {quantidadeMinimaPreco2}+ {(hasWeightControls && !isWeightPieceProduct) ? 'kg' : 'unid'}:
                        </span>
                        <span className="ml-1 font-bold text-green-600">R$ {precoVenda2.toFixed(2)}</span>
                        {promotionData.price2 < promotionData.originalPrice2 && (
                          <span className="ml-1 text-xs line-through text-gray-400">
                            R$ {promotionData.originalPrice2.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {economia > 0 && (
                        <div className="text-[10px] bg-green-100 rounded px-1.5 py-0.5 inline-block">
                          Economize R$ {economia.toFixed(2)} ({percentualEconomia.toFixed(0)}%)
                          {promotionData.price2 < promotionData.originalPrice2 && " com oferta2"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Controles de quantidade */}
        <div className="flex items-center justify-center mb-4 gap-3 flex-shrink-0">
          {hasWeightControls ? (
            // Controles para produtos de peso (gramas) - Design limpo
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Display da quantidade atual */}
              <div className="bg-orange-50 rounded-lg px-3 py-2 text-center border border-orange-200">
                <div className="text-lg font-bold text-orange-600">
                  {selectedGrams >= 1000 
                    ? `${(selectedGrams / 1000).toFixed(selectedGrams % 1000 === 0 ? 0 : 1)}kg`
                    : `${selectedGrams}g`
                  }
                </div>
                <div className="text-xs text-orange-500">Quantidade</div>
              </div>
              
              {/* Botões principais de incremento */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isBaconManta ? selectedGrams <= 4500 : selectedGrams <= 100}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-200 ${
                    (isBaconManta ? selectedGrams <= 4500 : selectedGrams <= 100)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white text-orange-600 hover:bg-orange-50 hover:border-orange-400 border-orange-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-full border-2 border-orange-300 bg-white text-orange-600 hover:bg-orange-50 hover:border-orange-400 flex items-center justify-center font-bold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Botões rápidos para quantidades comuns */}
              <div className="flex flex-wrap gap-1 justify-center max-w-full">
                {[100, 200, 500, 1000, 2000, 5000].map((grams) => (
                  <button
                    key={grams}
                    type="button"
                    onClick={() => setSelectedGrams(grams)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      selectedGrams === grams 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                    }`}
                  >
                    {grams >= 1000 ? `${grams/1000}kg` : `${grams}g`}
                  </button>
                ))}
              </div>
              
              {/* Input manual compacto */}
              <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-gray-500">Custom:</span>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="100"
                  value={selectedGrams}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(50000, Number(e.target.value) || 0))
                    setSelectedGrams(value)
                  }}
                  className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-orange-600 font-medium text-xs"
                  placeholder="0"
                />
                <span className="text-gray-500">g</span>
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
          
          {/* Botão Adicionar ao Carrinho - APENAS para produtos de peso */}
          {hasWeightControls && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !isProductAvailable()}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                !isProductAvailable()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isAdding
                    ? 'bg-orange-300 text-orange-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:scale-[1.01]'
              }`}
            >
              {!isProductAvailable() ? (
                <>
                  <X className="w-4 h-4" />
                  Fora de Estoque
                </>
              ) : isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar {selectedGrams >= 1000 
                    ? `${(selectedGrams / 1000).toFixed(selectedGrams % 1000 === 0 ? 0 : 1)}kg`
                    : `${selectedGrams}g`
                  } - R$ {calculatePriceForGrams(selectedGrams).toFixed(2)}
                </>
              )}
            </button>
          )}
          
          {/* Botão de atacado (só aparece se tiver preços escalonados) */}
          {hasValidScaledPrices() && (() => {
            const { precoVenda2, quantidadeMinimaPreco2 } = getScaledPrices()
            const economia = (product.price - precoVenda2) * quantidadeMinimaPreco2
            return (
              <button
                onClick={handleAddAtacadoToCart}
                disabled={isAdding || !isProductAvailable()}
                className={`w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                  !isProductAvailable()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAdding
                      ? 'bg-green-300 text-green-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transform hover:scale-[1.01]'
                }`}
              >
                {!isProductAvailable() ? (
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
                    Atacado: {quantidadeMinimaPreco2}{(hasWeightControls && !isWeightPieceProduct) ? 'kg' : 'x'} por R$ {(precoVenda2 * quantidadeMinimaPreco2).toFixed(2)}
                  </>
                )}
              </button>
            )
          })()}
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
