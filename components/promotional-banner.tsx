'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const banners = [
  {
    id: 'frios-94',
    image: '/images/vem se deliciar com o atacadao.png',
    href: '/catalog?category=FRIOS%20Á%20GRANEL%20E%20PACOTES'
  },
  {
    id: 'confeitaria-90',
    image: '/images/vem se deliciar com o atacadao (1).png',
    href: '/catalog?category=CONFEITARIA%20E%20OUTROS'
  },
  {
    id: 'forno',
    image: '/images/vem se deliciar com o atacadao (2).png',
    href: '/catalog?category=PANIFICAÇÃO'
  }
]

export default function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Função para avançar com animação
  const nextSlide = useCallback(() => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    setIsAutoPlaying(false)
    
    // Reset do estado de transição após a animação
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  // Função para retroceder com animação
  const prevSlide = useCallback(() => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    )
    setIsAutoPlaying(false)
    
    // Reset do estado de transição após a animação
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000) // 5 segundos

    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  const startAutoPlay = () => {
    setIsAutoPlaying(true)
  }

  const stopAutoPlay = () => {
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <div 
        className="relative w-full h-[45vw] min-h-[200px] max-h-[500px] md:h-[35vw] md:min-h-[250px] md:max-h-[400px] sm:h-[50vw] sm:min-h-[180px] sm:max-h-[300px] xs:h-[55vw] xs:min-h-[150px] xs:max-h-[250px]"
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
      >
        {/* Container dos slides com animação */}
        <div 
          className="flex w-full h-full transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {banners.map((banner, index) => (
            <div 
              key={banner.id}
              className="flex-shrink-0 w-full h-full relative"
            >
              {/* Imagem do banner */}
              <img
                src={banner.image}
                alt="Banner promocional"
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              
              {/* Botão Ver Ofertas posicionado no canto inferior direito */}
              <div className="absolute bottom-4 right-4 md:bottom-3 md:right-3 sm:bottom-2 sm:right-2">
                <button 
                  onClick={() => window.location.href = banner.href}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg md:px-4 md:py-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  Ver Ofertas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botões de navegação */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg md:p-1.5 sm:left-1 sm:p-1"
          aria-label="Banner anterior"
        >
          <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg md:p-1.5 sm:right-1 sm:p-1"
          aria-label="Próximo banner"
        >
          <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:bottom-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 sm:w-2 sm:h-2 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Ir para o banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}