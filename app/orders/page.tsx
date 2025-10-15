"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOrderStore, useCartStore, useAuthStore } from "@/lib/store"
import { ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle, ShoppingCart, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

export default function OrdersPage() {
  const { orders, addOrder } = useOrderStore()
  const { addItem } = useCartStore()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [ordersData, setOrdersData] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  // Garantir hidratação correta
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carregar pedidos da API
  useEffect(() => {
    if (!mounted) return
    
    const loadOrders = async () => {
      try {

        
        // Se não há usuário logado, não carregar pedidos
        if (!user) {
          console.log('❌ Nenhum usuário logado')
          setOrdersData([])
          setIsLoading(false)
          return
        }



        // Fazer requisição com o ID do usuário logado
        let url = `/api/orders?userId=${user.id}`
        
        // Se for usuário guest, adicionar email para filtro mais preciso
        if ((user.id === 'guest' || user.id.startsWith('guest_')) && user.email) {
          url += `&userEmail=${encodeURIComponent(user.email)}`
        }
        
        // Se tem email mas não é guest, também adicionar email para filtro
        if (user.email && !user.id.startsWith('guest')) {
          url += `&userEmail=${encodeURIComponent(user.email)}`
        }
        

        
        const response = await fetch(url)
        console.log('📡 Status da resposta:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📦 Pedidos recebidos:', data)
          console.log('📋 Tipo dos dados:', typeof data)
          console.log('📋 É array?', Array.isArray(data))
          
          // A API retorna { success: true, orders: [...] }
          const ordersArray = Array.isArray(data) ? data : (data.orders || [])
          console.log('📋 Array de pedidos:', ordersArray.length)
          
          setOrdersData(ordersArray)
          
          // Adicionar pedidos ao store local se não existirem
          ordersArray.forEach((order: any) => {
            const existingOrder = orders.find(o => o.id === order.id)
            if (!existingOrder) {
              addOrder(order)
            }
          })
        } else {
          console.error('❌ Erro na resposta:', response.status)
          setOrdersData([])
        }
      } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [mounted, user])

  // Se não está montado ainda, mostrar loading
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Função para retornar produtos do pedido ao carrinho
  const handleReturnToCart = (order: any) => {
    try {
      order.items.forEach((item: any) => {
        // Criar objeto produto para adicionar ao carrinho
        const product = {
          id: item.productId || item.product?.id,
          name: item.product?.name || item.name || 'Produto sem nome',
          price: item.product?.price || item.price || 0,
          image: item.product?.image || item.image || '/placeholder.svg',
          category: item.product?.category || item.category || 'Geral',
          description: item.product?.description || item.description || '',
          stock: 10,
          rating: 4.5,
          reviews: 0,
          brand: item.brand || '',
          unit: item.unit || 'un'
        }
        
        // Adicionar a quantidade do item ao carrinho
        for (let i = 0; i < item.quantity; i++) {
          addItem(product)
        }
      })
      
      toast({
        title: 'Produtos adicionados ao carrinho!',
        description: `${order.items.length} produto(s) do pedido #${order.id} foram adicionados ao carrinho.`,
      })
    } catch (error) {
      console.error('Erro ao retornar produtos ao carrinho:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar os produtos ao carrinho.',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      confirmed: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
      preparing: { label: "Preparando", variant: "outline" as const, icon: Package },
      delivering: { label: "Entregando", variant: "outline" as const, icon: Truck },
      delivered: { label: "Entregue", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Se não há usuário logado, mostrar mensagem para fazer login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="text-6xl mb-4">🔐</div>
              <CardTitle className="text-2xl">Faça login para ver seus pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Você precisa estar logado para visualizar seu histórico de pedidos.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Fazer Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando seus pedidos...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (ordersData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="text-6xl mb-4">📦</div>
              <CardTitle className="text-2xl">Nenhum pedido ainda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Você ainda não fez nenhum pedido. Que tal começar agora?
              </p>
              <Link href="/">
                <Button className="w-full">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Fazer Primeiro Pedido
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">
            {ordersData.length} pedido{ordersData.length !== 1 ? 's' : ''} encontrado{ordersData.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-6">
          {ordersData.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                                         <CardTitle className="text-xl">Pedido #{order.id || 'N/A'}</CardTitle>
                     <p className="text-gray-600">
                       Realizado em {new Date(order.createdAt || Date.now()).toLocaleDateString("pt-BR")} às{" "}
                       {new Date(order.createdAt || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                     </p>
                  </div>
                                     <div className="text-right">
                     {getStatusBadge(order.status || 'pending')}
                                         <p className="text-lg font-bold text-primary mt-2">
                       R$ {(order.total || 0).toFixed(2)}
                     </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                                     {/* Order Items */}
                   <div className="space-y-3">
                     {(order.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                                 <div className="relative w-16 h-16">
                           <Image
                             src={item.product?.image || item.image || "/placeholder.svg"}
                             alt={item.product?.name || item.name || 'Produto'}
                             fill
                             className="object-cover rounded-md"
                           />
                         </div>
                         <div className="flex-1">
                           <h4 className="font-semibold">
                             {item.product?.name || item.name || 'Produto sem nome'}
                           </h4>
                                                     <p className="text-sm text-gray-600">
                             Quantidade: {item.quantity || 0} x R$ {(item.product?.price || item.price || 0).toFixed(2)}
                           </p>
                        </div>
                                                 <div className="text-right">
                           <p className="font-semibold">
                             R$ {((item.quantity || 0) * (item.product?.price || item.price || 0)).toFixed(2)}
                           </p>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                         <div>
                       <h4 className="font-semibold mb-2">Informações de Entrega</h4>
                       <p className="text-sm text-gray-600">{order.customerInfo?.name || order.userName || 'Cliente'}</p>
                       <p className="text-sm text-gray-600">
                         {order.customerInfo?.address?.street ? 
                           `${order.customerInfo.address.street}, ${order.customerInfo.address.number} - ${order.customerInfo.address.neighborhood}` 
                           : 'Jardim Guanabara'}
                       </p>
                       <p className="text-sm text-gray-600">
                         {order.customerInfo?.address?.city || 'Fortaleza'} - {order.customerInfo?.address?.zipCode || 'CEP'}
                       </p>
                     </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Link href={`/order-status/${order.id}`}>
                        <Button variant="outline" className="w-full md:w-auto">
                          Acompanhar Pedido
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => handleReturnToCart(order)}
                        variant="outline" 
                        className="w-full md:w-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Retornar ao Carrinho
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
      <Toaster />
    </div>
  )
} 
