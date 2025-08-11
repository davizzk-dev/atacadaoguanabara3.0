'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Clock, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  createdAt: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string | {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipCode?: string
      reference?: string
    }
  }
}

const statusConfig = {
  pending: {
    title: 'Pedido Recebido',
    description: 'Seu pedido foi recebido e está sendo processado',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    title: 'Pedido Confirmado',
    description: 'Seu pedido foi confirmado e está sendo preparado',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  preparing: {
    title: 'Preparando Pedido',
    description: 'Seus produtos estão sendo separados e embalados',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  delivering: {
    title: 'Pedido em Rota',
    description: 'Seu pedido está a caminho da sua casa',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  delivered: {
    title: 'Pedido Entregue',
    description: 'Seu pedido foi entregue com sucesso!',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    title: 'Pedido Cancelado',
    description: 'Seu pedido foi cancelado',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

export default function OrderStatusPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showReturnNotification, setShowReturnNotification] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
             if (response.ok) {
         const orderData = await response.json()
         console.log('📋 Dados do pedido recebidos:', orderData)
         setOrder(orderData)
        
        // Mostrar popup de agradecimento apenas se o pedido foi entregue
        if (orderData.status === 'delivered') {
          setShowThankYou(true)
        }
      } else {
        setError('Pedido não encontrado')
      }
    } catch (error) {
      setError('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (status: 'delivered' | 'cancelled') => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      
      if (response.ok) {
        // Atualizar o pedido localmente
        setOrder(prev => prev ? { ...prev, status } : null)
        
        if (status === 'delivered') {
          setShowThankYou(true)
          // Mostrar mensagem de sucesso mais amigável
          setTimeout(() => {
            alert('🎉 Pedido entregue com sucesso! Obrigado pela preferência!')
          }, 500)
        } else {
          // Mostrar notificação de sucesso para outros status
          alert(`Status atualizado para: ${status === 'cancelled' ? 'Pedido cancelado' : 'Pedido em rota'}`)
        }
      } else {
        alert('Erro ao atualizar status do pedido')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrder()
      
      // Atualizar a cada 10 segundos
      const interval = setInterval(fetchOrder, 10000)
      
      return () => clearInterval(interval)
    }
  }, [orderId])

  // Detectar quando o usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (order && order.status !== 'delivered') {
        // Salvar informação de que o usuário saiu da página
        localStorage.setItem('orderTrackingLeft', JSON.stringify({
          orderId,
          timestamp: Date.now()
        }))
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && order && order.status !== 'delivered') {
        setShowReturnNotification(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Verificar se o usuário saiu da página anteriormente
    const trackingInfo = localStorage.getItem('orderTrackingLeft')
    if (trackingInfo) {
      const info = JSON.parse(trackingInfo)
      if (info.orderId === orderId) {
        setShowReturnNotification(true)
        localStorage.removeItem('orderTrackingLeft')
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [orderId, order])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando status do pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">{error || 'Pedido não encontrado'}</p>
        </div>
      </div>
    )
  }

  const currentStatus = statusConfig[order.status]
  const StatusIcon = currentStatus.icon

  return (
    <div className="min-h-screen bg-gray-50">
             {/* Header */}
       <div className="bg-white shadow-sm border-b">
         <div className="max-w-4xl mx-auto px-4 py-6">
           <div className="flex items-center justify-between">
             <div>
               <h1 className="text-2xl font-bold text-gray-900">Acompanhe seu Pedido</h1>
               <p className="text-gray-600">Pedido #{order.id}</p>
             </div>
             <div className="flex items-center space-x-4">
               <div className="text-right">
                 <p className="text-sm text-gray-500">Total do Pedido</p>
                 <p className="text-xl font-bold text-gray-900">R$ {(order.total || 0).toFixed(2)}</p>
               </div>
               
               {/* Botões de ação */}
               {order.status !== 'delivered' && order.status !== 'cancelled' && (
                 <div className="flex space-x-2">
                   {order.status === 'delivering' && (
                     <button
                       onClick={() => {
                         if (confirm('Confirmar que o pedido foi entregue com sucesso?')) {
                           updateOrderStatus('delivered')
                         }
                       }}
                       disabled={isUpdating}
                       className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                     >
                       {isUpdating ? 'Atualizando...' : '✅ Confirmar Entrega'}
                     </button>
                   )}
                   <button
                     onClick={() => {
                       if (confirm('Tem certeza que deseja cancelar este pedido?')) {
                         updateOrderStatus('cancelled')
                       }
                     }}
                     disabled={isUpdating}
                     className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                   >
                     {isUpdating ? 'Atualizando...' : '❌ Cancelar Pedido'}
                   </button>
                 </div>
               )}
               
               {/* Botão voltar para catálogo */}
               <button
                 onClick={() => window.location.href = '/catalog'}
                 className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
               >
                 🛒 Voltar ao Catálogo
               </button>
             </div>
           </div>
         </div>
       </div>

      {/* Status Card */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`rounded-lg border-2 ${currentStatus.borderColor} ${currentStatus.bgColor} p-8 mb-8`}>
                     <div className="flex items-center mb-6">
             <StatusIcon className={`h-12 w-12 ${currentStatus.color} mr-4`} />
             <div>
               <h2 className="text-2xl font-bold text-gray-900">{currentStatus.title}</h2>
               <p className="text-gray-600">{currentStatus.description}</p>
               {order.status === 'delivering' && (
                 <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                   <p className="text-sm text-blue-800">
                     <strong>💡 Dica:</strong> Quando o entregador chegar, clique em "Confirmar Entrega" para finalizar o pedido.
                   </p>
                 </div>
               )}
             </div>
           </div>
          
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <h3 className="font-semibold text-gray-900 mb-2">👤 Informações do Cliente</h3>
               <div className="space-y-2 text-sm">
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📝 Nome:</span>
                   <span className="font-medium text-gray-900">{order.customerInfo?.name || 'Não informado'}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📧 Email:</span>
                   <span className="font-medium text-gray-900">{order.customerInfo?.email || 'Não informado'}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📞 Telefone:</span>
                   <span className="font-medium text-gray-900">{order.customerInfo?.phone || 'Não informado'}</span>
                 </div>
                 <div className="flex items-start space-x-2">
                   <span className="text-gray-500 mt-1">📍 Endereço:</span>
                   <span className="font-medium text-gray-900">
                     {order.customerInfo?.address ? (typeof order.customerInfo.address === 'string' ? order.customerInfo.address : formatAddress(order.customerInfo.address)) : 'Não informado'}
                   </span>
                 </div>
               </div>
             </div>
            
                         <div>
               <h3 className="font-semibold text-gray-900 mb-2">📋 Detalhes do Pedido</h3>
               <div className="space-y-2 text-sm">
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📅 Data:</span>
                   <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📊 Status:</span>
                   <span className="font-medium text-gray-900">{currentStatus.title}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">📦 Itens:</span>
                   <span className="font-medium text-gray-900">{order.items?.length || 0} produto(s)</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500">💰 Total:</span>
                   <span className="font-medium text-gray-900">R$ {(order.total || 0).toFixed(2)}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Timeline do Pedido</h3>
          
          <div className="space-y-6">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon
              const isCompleted = getStatusOrder(order.status) >= getStatusOrder(status)
              const isCurrent = order.status === status
              
              return (
                <div key={status} className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? config.bgColor : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isCompleted ? config.color : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {config.title}
                    </div>
                    <div className={`text-sm ${
                      isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {config.description}
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Atual
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

                 {/* Items List */}
         <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Itens do Pedido</h3>
           <div className="space-y-3">
             {order.items?.map((item, index) => (
               <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                 <div className="flex-1">
                   <p className="font-medium text-gray-900">
                     {item.product?.name || item.name || 'Produto não informado'}
                   </p>
                   <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                     <span>📊 Qtd: {item.quantity || 0}</span>
                     <span>💰 Preço: R$ {(item.product?.price || item.price || 0).toFixed(2)}</span>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-gray-900">
                     R$ {((item.product?.price || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                   </p>
                 </div>
               </div>
             )) || (
               <p className="text-gray-500 text-center py-4">Nenhum item encontrado</p>
             )}
           </div>
         </div>
      </div>

             {/* Thank You Modal */}
       {showThankYou && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
             <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-900 mb-4">Obrigado!</h2>
             <p className="text-gray-600 mb-6">
               Seu pedido foi entregue com sucesso. Agradecemos pela preferência!
             </p>
             <div className="flex flex-col space-y-3">
               <button
                 onClick={() => setShowThankYou(false)}
                 className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
               >
                 Fechar
               </button>
               <button
                 onClick={() => {
                   setShowThankYou(false)
                   window.location.href = '/catalog'
                 }}
                 className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
               >
                 🛒 Voltar ao Catálogo
               </button>
             </div>
           </div>
         </div>
       )}

      {/* Return Notification */}
      {showReturnNotification && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-orange-200 p-4 max-w-sm z-50 animate-bounce">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Acompanhe seu Pedido</h3>
              <p className="text-xs text-gray-600">Clique para ver o status atual</p>
            </div>
            <button
              onClick={() => setShowReturnNotification(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <button
            onClick={() => {
              setShowReturnNotification(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="w-full mt-2 bg-orange-500 text-white text-xs py-2 px-3 rounded hover:bg-orange-600 transition-colors"
          >
            Ver Status
          </button>
        </div>
      )}
    </div>
  )
}

function getStatusOrder(status: string): number {
  const order = {
    pending: 1,
    confirmed: 2,
    preparing: 3,
    delivering: 4,
    delivered: 5,
    cancelled: 0
  }
  return order[status as keyof typeof order] || 0
}

function formatAddress(address: any): string {
  if (typeof address === 'string') {
    return address
  }
  
  if (typeof address === 'object' && address !== null) {
    const parts = []
    
    if (address.street) parts.push(address.street)
    if (address.number) parts.push(address.number)
    if (address.complement) parts.push(address.complement)
    if (address.neighborhood) parts.push(address.neighborhood)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    
    return parts.join(', ')
  }
  
  return 'Endereço não informado'
} 