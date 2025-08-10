"use client"

export const dynamic = 'force-dynamic'

import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFavoritesStore } from "@/lib/store"
import { products } from "@/lib/data"
import { Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore()
  
  const favoriteProducts = products.filter(product => favorites.includes(product.id))

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
