"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFavoritesStore } from "@/lib/store"
import { Heart, ShoppingCart, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Carregar produtos da API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])
  
  const favoriteProducts = products.filter(product => favorites.includes(product.id))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando favoritos...</span>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="text-6xl mb-4">💔</div>
              <CardTitle className="text-2xl">Nenhum favorito ainda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Você ainda não adicionou nenhum produto aos seus favoritos.
              </p>
              <Link href="/">
                <Button className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Explorar Produtos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Favoritos</h1>
          <p className="text-gray-600">
            {favoriteProducts.length} produto{favoriteProducts.length !== 1 ? 's' : ''} favorito{favoriteProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
} 
