'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCategoryImage } from '@/lib/category-images'

interface CategoryCarouselProps {
  categories: string[]
  selectedCategory: string
  onCategorySelect: (category: string) => void
}

export function CategoryCarousel({ categories, selectedCategory, onCategorySelect }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout>()
  const cardWidth = 160 + 24 // largura do card (160px) + gap (24px)
  const itemsPerView = 6 // número de itens visíveis por vez

  // Criar array infinito duplicando as categorias
  const infiniteCategories = [...categories, ...categories, ...categories, ...categories, ...categories]

  // Filtrar para remover a categoria "SERVIÇOS"
  const filteredCategories = infiniteCategories.filter(cat => cat !== "SERVIÇOS")

  // Auto-play do carrossel infinito
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        const scrollPosition = nextIndex * cardWidth
        
        if (carouselRef.current) {
          carouselRef.current.scrollTo({ 
            left: scrollPosition, 
            behavior: 'smooth' 
          })
        }
        
        // Reset para o início quando chegar muito longe
        if (nextIndex >= categories.length * 2) {
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.scrollTo({ 
                left: 0, 
                behavior: 'auto' 
              })
            }
            setCurrentIndex(0)
          }, 500)
          return 0
        }
        
        return nextIndex
      })
    }, 3000) // Muda a cada 3 segundos

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [categories.length, cardWidth])

  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = undefined
    }
  }

  const resumeAutoPlay = () => {
    // Evitar múltiplos timers
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        const scrollPosition = nextIndex * cardWidth
        
        if (carouselRef.current) {
          carouselRef.current.scrollTo({ 
            left: scrollPosition, 
            behavior: 'smooth' 
          })
        }
        
        // Reset para o início quando chegar muito longe
        if (nextIndex >= categories.length * 2) {
          setTimeout(() => {
            if (carouselRef.current) {
              carouselRef.current.scrollTo({ 
                left: 0, 
                behavior: 'auto' 
              })
            }
            setCurrentIndex(0)
          }, 500)
          return 0
        }
        
        return nextIndex
      })
    }, 3000)
  }

  const scrollLeft = () => {
    pauseAutoPlay()
    const newIndex = Math.max(0, currentIndex - 1)
    setCurrentIndex(newIndex)
    
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ 
        left: newIndex * cardWidth, 
        behavior: 'smooth' 
      })
    }
    
    // Retoma o auto-play após 3 segundos (mesma velocidade)
    setTimeout(resumeAutoPlay, 3000)
  }

  const scrollRight = () => {
    pauseAutoPlay()
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ 
        left: newIndex * cardWidth, 
        behavior: 'smooth' 
      })
    }
    
    // Reset para o início quando chegar muito longe
    if (newIndex >= categories.length * 2) {
      setTimeout(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollTo({ 
            left: 0, 
            behavior: 'auto' 
          })
        }
        setCurrentIndex(0)
      }, 500)
    }
    
    // Retoma o auto-play após 3 segundos (mesma velocidade)
    setTimeout(resumeAutoPlay, 3000)
  }

  // Função para calcular o número total de páginas (sempre 8 para mostrar todas as categorias)
  const totalPages = 8

  return (
    <div className="relative mb-8 w-full">
      {/* Carrossel */}
      <div className="relative group w-full overflow-hidden">
        {/* Botão esquerdo */}
        <Button
          onClick={scrollLeft}
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-0 rounded-full w-10 h-10 opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Botão direito */}
        <Button
          onClick={scrollRight}
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-0 rounded-full w-10 h-10 opacity-100 transition-opacity"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Container do carrossel */}
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 py-4 w-full"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory'
          }}
        >
          {filteredCategories.map((category, index) => {
            const isSelected = selectedCategory === category
            const imageUrl = getCategoryImage(category)
            return (
              <div
                key={`${category}-${index}`}
                onClick={() => {
                  pauseAutoPlay()
                  // Redireciona para a URL da categoria e recarrega a página
                  window.location.href = `/catalog?category=${encodeURIComponent(category)}`
                }}
                className={`flex-shrink-0 cursor-pointer transition-all duration-300 transform hover:scale-105 scroll-snap-align-start ${
                  isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                }`}
                style={{ minWidth: cardWidth, maxWidth: cardWidth }}
              >
                <div className="relative w-40 h-40 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover object-center category-carousel-image"
                    loading="lazy"
                    style={{ aspectRatio: '1/1' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Indicadores de paginação - sempre 8 pontos para mostrar todas as categorias */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: 8 }, (_, i) => {
          // Calcular qual página real este ponto representa (loop infinito)
          const actualPage = i % totalPages
          const isActive = actualPage === (currentIndex % totalPages)
          
          return (
            <button
              key={i}
              onClick={() => {
                pauseAutoPlay()
                if (carouselRef.current) {
                  const targetIndex = actualPage
                  setCurrentIndex(targetIndex)
                  carouselRef.current.scrollTo({ left: targetIndex * cardWidth, behavior: 'smooth' })
                }
                setTimeout(resumeAutoPlay, 3000) // Retoma o auto-play após 3 segundos
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                isActive ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}