"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { ResponsiveOrderTracking } from "@/components/responsive-order-tracking"
import { useOrderStore } from "@/lib/store"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Order } from "@/lib/types"

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.id as string
  const { orders } = useOrderStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadOrder = async () => {
    setIsLoading(true)
    // Simular busca do pedido
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const foundOrder = orders.find((o) => o.id === orderId)
    setOrder(foundOrder || null)
    setIsLoading(false)
  }

  const refreshOrder = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadOrder()
  }, [orderId, orders])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Carregando informações do pedido...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-4xl sm:text-6xl mb-4">📦</div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">Pedido não encontrado</h1>
            <p className="text-gray-500 text-sm sm:text-base mb-6">Verifique o número do pedido e tente novamente</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar às Compras</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </Link>

          <Button variant="outline" size="sm" onClick={refreshOrder} disabled={isRefreshing} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar Status</span>
            <span className="sm:hidden">Atualizar</span>
          </Button>
        </div>

        {/* Order Tracking */}
        <div className="max-w-6xl mx-auto">
          <ResponsiveOrderTracking order={order} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
