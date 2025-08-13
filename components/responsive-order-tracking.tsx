"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, Package, Truck, MapPin, Phone, Star, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Order } from "@/lib/types"

interface ResponsiveOrderTrackingProps {
  order: Order
}

export function ResponsiveOrderTracking({ order }: ResponsiveOrderTrackingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const steps = [
    {
      id: "pending",
      title: "Pedido Recebido",
      shortTitle: "Recebido",
      description: "Seu pedido foi recebido e está sendo processado",
      shortDesc: "Processando...",
      icon: Clock,
      color: "bg-blue-500",
      time: "Agora mesmo",
      duration: 2,
    },
    {
      id: "confirmed",
      title: "Pedido Confirmado",
      shortTitle: "Confirmado",
      description: "Pagamento aprovado e pedido confirmado",
      shortDesc: "Pagamento OK",
      icon: CheckCircle,
      color: "bg-green-500",
      time: "2 min atrás",
      duration: 5,
    },
    {
      id: "preparing",
      title: "Preparando Pedido",
      shortTitle: "Preparando",
      description: "Nosso time está separando seus produtos",
      shortDesc: "Separando itens",
      icon: Package,
      color: "bg-orange-500",
      time: "7 min atrás",
      duration: 15,
    },
    {
      id: "delivering",
      title: "Saiu para Entrega",
      shortTitle: "A caminho",
      description: "Seu pedido está a caminho!",
      shortDesc: "Em trânsito",
      icon: Truck,
      color: "bg-secondary",
      time: "22 min atrás",
      duration: 30,
    },
    {
      id: "delivered",
      title: "Entregue",
      shortTitle: "Entregue",
      description: "Pedido entregue com sucesso",
      shortDesc: "Finalizado",
      icon: CheckCircle,
      color: "bg-green-600",
      time: "Estimado: 15 min",
      duration: 0,
    },
  ]

  useEffect(() => {
    const statusIndex = steps.findIndex((step) => step.id === order.status)
    setCurrentStep(statusIndex)

    // Simular progresso em tempo real
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [order.status])

  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="block sm:hidden">
        <Card className="bg-gradient-to-r from-primary to-primary-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold">Pedido #{order.id}</h1>
                <p className="text-primary-100 text-sm">{order.createdAt.toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">{currentStepData?.shortTitle}</Badge>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
            <p className="text-primary-100 text-xs mt-2">{Math.round(progress)}% concluído</p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block">
        <Card className="bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl lg:text-3xl">Pedido #{order.id}</CardTitle>
                <p className="text-primary-100 mt-1">
                  Realizado em {order.createdAt.toLocaleDateString("pt-BR")} às{" "}
                  {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
                  {currentStepData?.title}
                </Badge>
                <p className="text-primary-100 text-sm mt-2">
                  Total: <span className="font-bold text-white">R$ {order.total.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-100">Progresso do pedido</span>
                <span className="text-white font-medium">{Math.round(progress)}% concluído</span>
              </div>
              <Progress value={progress} className="h-3 bg-white/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status Card - Mobile Optimized */}
      <Card className="border-2 border-secondary/20 bg-gradient-to-r from-secondary/5 to-secondary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`${currentStepData?.color} p-3 rounded-full animate-pulse`}>
              {currentStepData && <currentStepData.icon className="h-6 w-6 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg sm:text-xl text-secondary mb-1">{currentStepData?.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-3">{currentStepData?.description}</p>

              {order.status === "delivering" && (
                <div className="bg-secondary/10 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-white text-xs">JS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">João Silva - Entregador</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" />
                        <span>(85) 98514-7067</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-secondary text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>A 5 min do seu endereço</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline - Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Acompanhe seu Pedido</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Timeline */}
          <div className="block sm:hidden space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? `${step.color} border-transparent text-white`
                          : isCurrent
                            ? "bg-secondary border-secondary text-white animate-pulse"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold text-sm ${isCurrent ? "text-secondary" : isCompleted ? "text-green-600" : "text-gray-500"}`}
                    >
                      {step.shortTitle}
                    </h4>
                    <p className="text-gray-600 text-xs">{step.shortDesc}</p>
                    <p className="text-gray-500 text-xs">{step.time}</p>
                  </div>
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
              )
            })}
          </div>

          {/* Desktop Timeline */}
          <div className="hidden sm:block space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div
                    className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? `${step.color} border-transparent text-white`
                          : isCurrent
                            ? "bg-secondary border-secondary text-white animate-pulse"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <h3
                        className={`font-semibold text-lg ${isCurrent ? "text-secondary" : isCompleted ? "text-green-600" : "text-gray-500"}`}
                      >
                        {step.title}
                      </h3>
                      <span className="text-sm text-gray-500">{step.time}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{step.description}</p>

                    {isCurrent && order.status === "delivering" && (
                      <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-3 text-secondary mb-2">
                              <Avatar>
                                <AvatarFallback className="bg-secondary text-white">JS</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">João Silva</p>
                                <p className="text-sm">Entregador</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-secondary">
                              <Phone className="h-4 w-4" />
                              <span>(85) 98514-7067</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 text-secondary mb-2">
                              <MapPin className="h-4 w-4" />
                              <span>Localização atual</span>
                            </div>
                            <p className="text-sm text-gray-600">A 5 minutos do seu endereço</p>
                            <p className="text-sm font-medium text-secondary">Tempo estimado: 10-15 min</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Informações de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Endereço</h4>
              <p className="text-gray-600 text-sm sm:text-base">
                {order.customerInfo.address?.street ? 
                  `${order.customerInfo.address.street}, ${order.customerInfo.address.number} - ${order.customerInfo.address.neighborhood}` 
                  : 'Jardim Guanabara'}
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                {order.customerInfo.address?.city || order.customerInfo.city || 'Fortaleza'} - {order.customerInfo.address?.zipCode || order.customerInfo.zipCode || 'CEP'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Contato</h4>
              <p className="text-gray-600 text-sm sm:text-base">{order.customerInfo.name}</p>
              <p className="text-gray-600 text-sm sm:text-base">{order.customerInfo.phone}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Tempo Estimado</h4>
              <p className="text-secondary font-semibold text-sm sm:text-base">
                {order.estimatedDelivery
                  ? `Entrega prevista para ${order.estimatedDelivery.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Em até 2 horas"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items - Responsive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base truncate">{item.product.name}</h4>
                    <p className="text-gray-600 text-xs sm:text-sm">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm sm:text-base">
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary">R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Button variant="outline" className="w-full py-3 bg-transparent">
          <Phone className="h-4 w-4 mr-2" />
          Entrar em Contato
        </Button>
        <Button variant="outline" className="w-full py-3 bg-transparent">
          <Star className="h-4 w-4 mr-2" />
          Avaliar Pedido
        </Button>
      </div>

      {/* Real-time Updates */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-semibold text-green-800 text-sm sm:text-base">Atualizações em tempo real</p>
              <p className="text-green-600 text-xs sm:text-sm">
                Última atualização: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
