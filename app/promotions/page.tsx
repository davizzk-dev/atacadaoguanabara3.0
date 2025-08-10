'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Promotion {
  id: string
  productId: string
  productName: string
  originalPrice: number
  newPrice: number
  discount: number
  image?: string
  isActive: boolean
  createdAt: string
  validUntil?: string
  description?: string
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPromotions = () => {
      try {
        // Carregar do localStorage
        const localPromotions = JSON.parse(localStorage.getItem('productPromotions') || '[]')
        setPromotions(localPromotions)
      } catch (error) {
        console.error('Erro ao carregar promoções:', error)
        setPromotions([])
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [])

  const isActive = (promotion: Promotion) => {
    if (!promotion.isActive) return false
    if (!promotion.validUntil) return true
    return new Date(promotion.validUntil) > new Date()
  }

  const formatDiscount = (discount: number) => {
    return `${discount}%`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando promoções...</p>
        </div>
      </div>
    )
  }

  const activePromotions = promotions.filter(isActive)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Promoções Especiais
          </h1>
          <p className="text-xl text-gray-600">
            Aproveite nossas ofertas exclusivas com descontos imperdíveis!
          </p>
        </div>

        {activePromotions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhuma promoção ativa no momento
            </h3>
            <p className="text-gray-500">
              Volte em breve para conferir nossas próximas ofertas!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePromotions.map((promotion) => (
              <div
                key={promotion.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {promotion.image && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={promotion.image}
                      alt={promotion.productName}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {promotion.productName}
                  </h3>
                  
                  {promotion.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {promotion.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(promotion.newPrice)}
                      </span>
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(promotion.originalPrice)}
                      </span>
                    </div>
                    <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                      -{formatDiscount(promotion.discount)}
                    </span>
                  </div>
                  
                  {promotion.validUntil && (
                    <div className="text-sm text-gray-500">
                      Válido até: {formatDate(promotion.validUntil)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
