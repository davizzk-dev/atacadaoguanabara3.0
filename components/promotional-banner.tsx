'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  subtitle: string
  image: string
  color: string
  href: string
}

const banners: Banner[] = [
  {
    id: 'ype-75',
    title: 'YPE PROMOÇÃO 75 ANOS',
    subtitle: '4 MILIONÁRIOS 1 MILIONÁRIO POR MÊS',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop',
    color: 'bg-blue-500',
    href: '/catalog?category=limpeza'
  },
  {
    id: 'monange-60',
    title: 'PROMOÇÃO MONANGE FAZ 60 ANOS',
    subtitle: 'Produtos de higiene pessoal com desconto especial',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    color: 'bg-pink-500',
    href: '/catalog?category=higiene'
  },
  {
    id: 'parceiroes',
    title: 'PARCEIRÕES DO PARCEIRÃO',
    subtitle: 'Ofertas especiais para empreendedores',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    color: 'bg-orange-500',
    href: '/catalog?category=ofertas'
  }
]

export default function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 5000) // 5 segundos

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    )
    setIsAutoPlaying(false)
  }

  const startAutoPlay = () => {
    setIsAutoPlaying(true)
  }

  const stopAutoPlay = () => {
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative bg-white w-full">
      <div className="w-full">
        <div className="relative overflow-hidden shadow-lg">
                     {/* Banner atual */}
           <div className="relative h-32 md:h-40 lg:h-48">
            <img
              src={banners[currentIndex].image}
              alt={banners[currentIndex].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Conteúdo do banner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                  {banners[currentIndex].title}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl mb-6 drop-shadow-lg">
                  {banners[currentIndex].subtitle}
                </p>
                <Link href={banners[currentIndex].href}>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
                    VEJA AS OFERTAS
                  </button>
                </Link>
              </div>
            </div>

            {/* Botões de navegação */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
              onMouseEnter={stopAutoPlay}
              onMouseLeave={startAutoPlay}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
              onMouseEnter={stopAutoPlay}
              onMouseLeave={startAutoPlay}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setIsAutoPlaying(false)
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 