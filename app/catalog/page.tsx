'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Grid3X3, List, SlidersHorizontal, Sparkles, Target, Zap } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'
import { products as productsData } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products] = useState<Product[]>(productsData)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 100])
  const [sortBy, setSortBy] = useState('name')

  const categories = ["all", ...Array.from(new Set(products.map((p: Product) => p.category)))]

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
    return matchesSearch && matchesCategory && matchesPrice
  })

  // Ordenar produtos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return b.rating - a.rating
      case 'name':
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setPriceRange([0, 100])
    setSortBy('name')
  }

  const hasActiveFilters = searchTerm || selectedCategory !== "all" || priceRange[0] > 0 || priceRange[1] < 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 page-transition">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Melhorado */}
        <div className="text-center mb-8 fade-in-up">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 mb-4 animate-pulse">
            <Sparkles className="h-4 w-4 mr-2" />
            Catálogo Completo
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Nossos Produtos
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Encontre os melhores produtos para sua casa com preços que cabem no seu bolso
          </p>
        </div>

        {/* Search and Filter Melhorado */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 slide-in-right">
          {/* Barra de Busca Principal */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="🔍 Buscar produtos, marcas ou categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 hover:border-orange-300 bg-white/50 backdrop-blur-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filtros e Controles */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Filtros Rápidos */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "default" : "outline"}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros Avançados
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="price-low">Menor Preço</option>
                <option value="price-high">Maior Preço</option>
                <option value="rating">Melhor Avaliação</option>
              </select>

              <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 transition-all ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 transition-all ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contador de Resultados */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                <Target className="w-3 h-3 mr-1" />
                {sortedProducts.length} produtos encontrados
              </Badge>
              
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 slide-in-down">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Filtro de Categoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all bg-white"
                  >
                    {categories.map((category: string) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'Todas as categorias' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Preço */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Faixa de Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all bg-white"
                    />
                    <span className="text-gray-400 self-center">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Tags de Categoria Rápida */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categorias Rápidas</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.filter(cat => cat !== 'all').map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedCategory === category
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
            : 'grid-cols-1'
        }`}>
          {sortedProducts.map((product: Product, index: number) => (
            <div key={product.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Empty state melhorado */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16 fade-in-up">
            <div className="text-8xl mb-6 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
              Não encontramos produtos com os filtros selecionados. Tente ajustar sua busca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Limpar Todos os Filtros
              </Button>
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Search className="w-4 h-4 mr-2" />
                Nova Busca
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
} 