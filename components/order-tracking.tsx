"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, Package, Truck, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Order } from "@/lib/types"

interface OrderTrackingProps {
  order: Order
}

export function OrderTracking({ order }: OrderTrackingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      id: "pending",
      title: "Pedido Recebido",
      description: "Seu pedido foi recebido e está sendo processado",
      icon: Clock,
      time: "Agora mesmo",
    },
    {
      id: "confirmed",
      title: "Pedido Confirmado",
      description: "Pagamento aprovado e pedido confirmado",
      icon: CheckCircle,
      time: "5 min atrás",
    },
    {
      id: "preparing",
      title: "Preparando Pedido",
      description: "Nosso time está separando seus produtos",
      icon: Package,
      time: "15 min atrás",
    },
    {
      id: "delivering",
      title: "Saiu para Entrega",
      description: "Seu pedido está a caminho!",
      icon: Truck,
      time: "30 min atrás",
    },
    {
      id: "delivered",
      title: "Entregue",
      description: "Pedido entregue com sucesso",
      icon: CheckCircle,
      time: "Estimado: 45 min",
    },
  ]

  useEffect(() => {
    const statusIndex = steps.findIndex((step) => step.id === order.status)
    setCurrentStep(statusIndex)
  }, [order.status])

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Pedido #{order.id}</CardTitle>
              <p className="text-gray-600">
                Realizado em {order.createdAt.toLocaleDateString("pt-BR")} às{" "}
                {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-lg px-4 py-2">
              {order.status === "pending" && "Pendente"}
              {order.status === "confirmed" && "Confirmado"}
              {order.status === "preparing" && "Preparando"}
              {order.status === "delivering" && "Entregando"}
              {order.status === "delivered" && "Entregue"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progresso do pedido</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Acompanhe seu Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-secondary border-secondary text-white animate-pulse"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                    }
                  `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-semibold ${isCurrent ? "text-secondary" : isCompleted ? "text-green-600" : "text-gray-500"}`}
                      >
                        {step.title}
                      </h3>
                      <span className="text-sm text-gray-500">{step.time}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{step.description}</p>

                    {isCurrent && order.status === "delivering" && (
                      <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                        <div className="flex items-center space-x-2 text-secondary">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Entregador: João Silva</span>
                        </div>
                        <div className="flex items-center space-x-2 text-secondary mt-1">
                          <Phone className="h-4 w-4" />
                          <span>(85) 98514-7067</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Tempo estimado: 15-25 minutos</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900">Endereço</h4>
            <p className="text-gray-600">
              {order.customerInfo.address}, {order.customerInfo.city} - {order.customerInfo.zipCode}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Contato</h4>
            <p className="text-gray-600">{order.customerInfo.name}</p>
            <p className="text-gray-600">{order.customerInfo.phone}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Tempo Estimado</h4>
            <p className="text-secondary font-semibold">
              {order.estimatedDelivery
                ? `Entrega prevista para ${order.estimatedDelivery.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : "Em até 2 horas"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <p className="text-gray-600">Quantidade: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button variant="outline" className="flex-1 bg-transparent">
          Entrar em Contato
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent">
          Avaliar Pedido
        </Button>
      </div>
    </div>
  )
}
