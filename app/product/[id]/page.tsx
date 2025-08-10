"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { products } from "@/lib/data"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import { Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Check, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const product = products.find((p) => p.id === productId)
  const { addItem } = useCartStore()
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const relatedProducts = products.filter((p) => p.category === product?.category && p.id !== productId).slice(0, 4)

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-600 mb-2">Produto não encontrado</h1>
          <p className="text-gray-500">O produto que você está procurando não existe</p>
        </div>
        <Footer />
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    
    // Mostrar animação
    setShowAddAnimation(true)
    setShowNotification(true)
    
    // Esconder animação após 2 segundos
    setTimeout(() => {
      setShowAddAnimation(false)
    }, 2000)
    
    // Esconder notificação após 3 segundos
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id)
    } else {
      addFavorite(product.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Notificação flutuante */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">Produto adicionado ao carrinho!</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Botão Voltar ao Catálogo */}
        <div className="mb-6">
          <Link href="/catalog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
            </Button>
          </Link>
        </div>

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-8">
          <span>Início</span> / <span>{product.category}</span> /{" "}
          <span className="text-primary font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail images would go here */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <button
                  key={i}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={`${product.name} ${i + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-lg text-gray-600">
                  Marca: <span className="font-semibold">{product.brand}</span>
                </p>
              )}
            </div>



            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">R$ {product.originalPrice.toFixed(2)}</span>
                )}
                {product.originalPrice > product.price && <Badge className="bg-red-500 text-white">-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</Badge>}
              </div>
              {product.unit && <p className="text-gray-600">por {product.unit}</p>}
            </div>

            {/* Ver mais button */}
            <div>
              <Button 
                variant="outline" 
                className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 font-medium"
                onClick={() => {
                  // Scroll para as abas
                  document.querySelector('[data-value="description"]')?.scrollIntoView({ behavior: 'smooth' })
                  // Ativar a aba de descrição
                  const descriptionTab = document.querySelector('[data-value="description"]') as HTMLElement
                  if (descriptionTab) {
                    descriptionTab.click()
                  }
                }}
              >
                Ver mais
              </Button>
            </div>

            {/* Status de disponibilidade */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium text-green-600">
                Sem estoque - Adicione quantos quiser
              </span>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium">Quantidade:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 bg-secondary hover:bg-secondary/90 text-white font-bold py-4 text-lg relative overflow-hidden transition-all duration-300 ${
                    showAddAnimation ? 'animate-pulse-glow' : ''
                  }`}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                  
                  {/* Animação de confirmação */}
                  {showAddAnimation && (
                    <div className="absolute inset-0 bg-green-500 flex items-center justify-center animate-slide-in">
                      <div className="flex items-center space-x-2 text-white">
                        <Check className="w-6 h-6 animate-bounce" />
                        <span className="font-bold">Adicionado!</span>
                      </div>
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className={`px-6 py-4 ${isFavorite(product.id) ? "text-red-600 border-red-600" : ""}`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                </Button>

                <Button variant="outline" className="px-6 py-4 bg-transparent">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Entrega Rápida</p>
                  <p className="text-xs text-gray-600">Em até 2 horas</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Compra Segura</p>
                  <p className="text-xs text-gray-600">100% protegida</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Troca Fácil</p>
                  <p className="text-xs text-gray-600">7 dias para trocar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-16">
          <CardContent className="p-0">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description" data-value="description">Descrição</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="shipping">Entrega</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Descrição do Produto</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Informações do Produto</h3>
                  <div>
                    <h4 className="font-semibold mb-2">Especificações</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>
                        <strong>Marca:</strong> {product.brand}
                      </li>
                      <li>
                        <strong>Categoria:</strong> {product.category}
                      </li>
                      <li>
                        <strong>Unidade:</strong> {product.unit}
                      </li>
                      <li>
                        <strong>Código:</strong> {product.id}
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="p-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Informações de Entrega</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Truck className="h-6 w-6 text-secondary" />
                          <h4 className="font-semibold">Entrega Expressa</h4>
                        </div>
                        <p className="text-gray-600 mb-2">Em até 2 horas</p>
                        <p className="text-sm text-gray-500">Disponível para pedidos acima de R$ 50</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Shield className="h-6 w-6 text-green-600" />
                          <h4 className="font-semibold">Entrega Segura</h4>
                        </div>
                        <p className="text-gray-600 mb-2">Produto protegido</p>
                        <p className="text-sm text-gray-500">Embalagem especial para preservar a qualidade</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
