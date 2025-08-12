"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, ShoppingCart, Minus, Plus, Share2, Star, Package, Barcode, Hash, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const confettiRef = useRef<HTMLCanvasElement | null>(null)

  const { addItem, items } = useCartStore()
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        console.log('🔍 Buscando produto ID:', productId)
        
        // Buscar produtos reais da API Varejo Fácil (via API route)
        console.log('🌐 Fazendo requisição para /api/products...')
        const response = await fetch(`/api/products`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        console.log('📡 Status da resposta:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('📊 Dados recebidos da API:')
        console.log('   - Tipo de dados:', typeof data)
        console.log('   - É array?', Array.isArray(data))
        console.log('   - Tem products?', !!data.products)
        console.log('   - Total de produtos:', Array.isArray(data.products) ? data.products.length : Array.isArray(data) ? data.length : 'N/A')
        console.log('   - Product ID procurado:', productId, '(tipo:', typeof productId, ')')
        console.log('   - Dados completos:', data)
        
        // A API /api/products retorna array direto de produtos
        if (!Array.isArray(data)) {
          console.error('❌ API não retornou array:', typeof data)
          console.error('   - Dados recebidos:', data)
          throw new Error('API deve retornar array de produtos')
        }
        
        const products: Product[] = data
        console.log('✅ Array de produtos recebido diretamente da API')
        
        if (products.length === 0) {
          console.warn('⚠️ Array de produtos está vazio!')
          console.warn('   - Isso pode indicar que o arquivo products.json não foi carregado corretamente')
          console.warn('   - Ou que há um problema no cache do Next.js')
        }
        
        console.log(`📦 Total de produtos carregados: ${products.length}`)
        
        // Buscar produto pelos dados reais do Varejo Fácil
        console.log('🔍 Iniciando busca do produto...')
        console.log('   - IDs dos primeiros 5 produtos:', products.slice(0, 5).map(p => `${p.id} (${typeof p.id})`))
        
        const foundProduct = products.find((p: Product) => {
          const match1 = p.id.toString() === productId
          const match2 = p.id === productId
          const match3 = String(p.id) === String(productId)
          
          if (match1 || match2 || match3) {
            console.log(`✅ PRODUTO ENCONTRADO! Produto ID ${p.id} combina com busca ${productId}`)
            console.log(`   - Match toString: ${match1}`)
            console.log(`   - Match direto: ${match2}`)
            console.log(`   - Match String(): ${match3}`)
            return true
          }
          return false
        })
        
        console.log('🎯 Resultado da busca:', foundProduct ? 'PRODUTO ENCONTRADO' : 'PRODUTO NÃO ENCONTRADO')
        
        if (foundProduct) {
          console.log('✅ Produto real encontrado:', {
            id: foundProduct.id,
            name: foundProduct.name,
            price: foundProduct.price,
            category: foundProduct.category
          })
          setProduct(foundProduct)
          
          // Buscar produtos relacionados da mesma categoria (dados reais)
          const related = products
            .filter((p: Product) => 
              p.category === foundProduct.category && 
              p.id !== foundProduct.id
            )
            .slice(0, 8)
          setRelatedProducts(related)
          console.log(`📦 Produtos relacionados encontrados: ${related.length}`)
        } else {
          console.log('❌ Produto não encontrado no banco de dados do Varejo Fácil')
          // Lista os primeiros 5 IDs para debug
          const firstFiveIds = products.slice(0, 5).map(p => p.id)
          console.log('🔍 Primeiros 5 IDs no banco:', firstFiveIds)
          
          setProduct(null) // Não criar produtos fake - produto realmente não existe
        }
      } catch (error) {
        console.error('❌ Erro ao buscar produto:', error)
        setProduct(null) // Em caso de erro, não mostrar produto fake
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    // pequena animação de loading
    await new Promise((r) => setTimeout(r, 250))
    for (let i = 0; i < quantity; i++) addItem(product)
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1600)
    // confetti simples
    try {
      const canvas = confettiRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        const w = (canvas.width = window.innerWidth)
        const h = (canvas.height = 180)
        const pieces = Array.from({ length: 60 }, () => ({
          x: Math.random() * w,
          y: Math.random() * 0,
          r: 4 + Math.random() * 6,
          c: `hsl(${Math.random() * 50 + 10},90%,55%)`,
          vy: 2 + Math.random() * 3,
          vx: -1 + Math.random() * 2
        }))
        let frames = 0
        const animate = () => {
          frames++
          ctx.clearRect(0, 0, w, h)
          pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy
            ctx.fillStyle = p.c
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
          })
          if (frames < 40) requestAnimationFrame(animate)
          else ctx.clearRect(0, 0, w, h)
        }
        animate()
      }
    } catch {}
  }

  const handleToggleFavorite = () => {
    if (product) {
    if (isFavorite(product.id)) {
      removeFavorite(product.id)
    } else {
      addFavorite(product.id)
    }
  }
  }

  const cartItem = items.find((item) => item.product.id === productId)
  const cartQuantity = cartItem?.quantity || 0

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Carregando produto do Varejo Fácil...</p>
          </div>
        </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">Este produto não existe no sistema do Varejo Fácil</p>
          <Link href="/catalog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
    {/* Confetti canvas (top overlay) */}
    <canvas ref={confettiRef} className="fixed top-16 left-0 right-0 pointer-events-none z-[70]" style={{ height: 180 }} />
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/catalog">
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              className={`border-2 ${
                isFavorite(product.id)
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'border-gray-300 hover:border-red-300 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="outline" size="icon" className="border-blue-200">
              <Share2 className="w-4 h-4" />
            </Button>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Imagem do produto */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-blue-200">
              <CardContent className="p-8">
                <div className="aspect-square flex items-center justify-center bg-white rounded-lg border-2 border-blue-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do produto */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-xl text-blue-600 font-semibold">{product.brand}</p>
            </div>

            {/* Preço */}
            <div className="flex items-center gap-4">
              {product.price > 0 ? (
                <span className="text-4xl font-bold text-blue-600">
                  R$ {product.price.toFixed(2)}
                </span>
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  Consulte o preço
                </span>
              )}
              
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                  <Badge className="bg-red-500 text-white">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
                por {product.unit}
              </span>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>



            {/* Controles de quantidade e compra */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 p-0 border-blue-200"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button 
                variant="outline" 
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 p-0 border-blue-200"
                  >
                    <Plus className="w-4 h-4" />
              </Button>
            </div>
                {cartQuantity > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {cartQuantity} no carrinho
              </span>
                )}
              </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={product.price === 0 || !product.inStock || isAdding}
                  className={`w-full text-white py-3 text-lg font-semibold disabled:bg-gray-400 ${isAdding ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} relative overflow-hidden`}
                  size="lg"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adicionando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {!product.inStock
                        ? 'Produto fora de estoque'
                        : product.price > 0
                        ? `Adicionar ${quantity} ao carrinho`
                        : 'Preço indisponível'}
                    </span>
                  )}
                </Button>

                {showSuccess && (
                  <div className="fixed top-20 right-4 z-[80] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in-up">
                    ✅ Produto adicionado ao carrinho
                  </div>
                )}
            </div>
              </div>
            </div>

        {/* Detalhes técnicos do Varejo Fácil */}
        <Card className="mb-8 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalhes do Produto - Varejo Fácil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">ID:</span>
                <span className="font-semibold">{product.id}</span>
                </div>
              


              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Categoria:</span>
                <span className="font-semibold">{product.category}</span>
              </div>

              {(product as any).varejoFacilData?.codigoInterno && (product as any).varejoFacilData.codigoInterno.trim() && (
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Código Interno:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.codigoInterno.trim()}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.idExterno && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">ID Externo:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.idExterno}</span>
                </div>
              )}

                            <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Unidade:</span>
                <span className="font-semibold">{product.unit}</span>
              </div>

              {(product as any).varejoFacilData?.ean && (
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Código EAN:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.ean}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.pesoBruto && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Peso Bruto:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.pesoBruto} kg</span>
                </div>
              )}

              {(product as any).varejoFacilData?.pesoLiquido && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Peso Líquido:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.pesoLiquido} kg</span>
              </div>
              )}

              {(product as any).varejoFacilData?.altura && (product as any).varejoFacilData?.largura && (product as any).varejoFacilData?.comprimento && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Dimensões (A x L x C):</span>
                  <span className="font-semibold">
                    {(product as any).varejoFacilData.altura} x {(product as any).varejoFacilData.largura} x {(product as any).varejoFacilData.comprimento} cm
                  </span>
            </div>
              )}

              {(product as any).varejoFacilData?.unidadeDeCompra && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Unidade de Compra:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.unidadeDeCompra}</span>
          </div>
              )}

              {(product as any).varejoFacilData?.unidadeDeTransferencia && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Unidade de Transferência:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.unidadeDeTransferencia}</span>
        </div>
              )}

              {(product as any).varejoFacilData?.secaoId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Seção ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.secaoId}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.marcaId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Marca ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.marcaId}</span>
                  </div>
              )}

              {(product as any).varejoFacilData?.generoId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Gênero ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.generoId}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.ativoNoEcommerce !== undefined && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Ativo E-commerce:</span>
                  <span className={`font-semibold ${(product as any).varejoFacilData.ativoNoEcommerce ? 'text-green-600' : 'text-red-600'}`}>
                    {(product as any).varejoFacilData.ativoNoEcommerce ? 'Sim' : 'Não'}
                  </span>
                  </div>
              )}

              

              {(product as any).varejoFacilData?.dataAlteracao && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Última Alteração:</span>
                  <span className="font-semibold">
                    {new Date((product as any).varejoFacilData.dataAlteracao).toLocaleDateString('pt-BR')}
                  </span>
                        </div>
              )}
                </div>
          </CardContent>
        </Card>

        {/* Produtos relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Produtos Relacionados da Categoria "{product.category}"
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add page-scoped styles
// Using styled-jsx within a fragment is not available here; rely on global Tailwind utilities and minimal keyframes via a style tag in parent layout if needed.
