'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Gift, Timer, Percent, DollarSign, ShoppingCart } from 'lucide-react'

interface Promotion {
  id: string
  name: string
  title: string
  description: string
  type: string
  discountType: string
  discountValue: number
  discount: number
  image: string
  banner: string
  startDate: string
  endDate: string
  isActive: boolean
  products: any[]
}

export function PromotionsSection() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/promotions?status=active')
      const data = await response.json()
      
      if (data.success) {
        setPromotions(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar promoções:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (promo: Promotion) => {
    const now = new Date()
    const start = new Date(promo.startDate)
    const end = new Date(promo.endDate)
    return promo.isActive && now >= start && now <= end
  }

  const formatDiscount = (promo: Promotion) => {
    const value = promo.discountValue || promo.discount || 0
    if (promo.discountType === 'fixed') {
      return `R$ ${value.toFixed(2)}`
    } else {
      return `${value}%`
    }
  }

  const getTimeLeft = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expirada'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const activePromotions = promotions.filter(isActive)

  if (loading || activePromotions.length === 0) {
    return null
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4">
            <Gift className="h-4 w-4 mr-2" />
            Ofertas Especiais
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 Promoções Ativas
          </h2>
          <p className="text-gray-600 text-lg">
            Aproveite nossas ofertas imperdíveis por tempo limitado!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {activePromotions.map((promo) => (
            <Card 
              key={promo.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-orange-200 hover:border-orange-300"
            >
              {promo.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={promo.image}
                    alt={promo.title || promo.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 text-white">
                      <Timer className="h-3 w-3 mr-1" />
                      {getTimeLeft(promo.endDate)}
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                    {promo.title || promo.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                    {promo.discountType === 'fixed' ? (
                      <DollarSign className="h-3 w-3" />
                    ) : (
                      <Percent className="h-3 w-3" />
                    )}
                    {formatDiscount(promo)} OFF
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {promo.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {promo.products && promo.products.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {promo.products.length} produto(s)
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => window.location.href = `/catalog?promotion=${promo.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Ver Produtos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={() => window.location.href = '/catalog?filter=promotions'}
          >
            Ver Todas as Promoções
            <Gift className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}
