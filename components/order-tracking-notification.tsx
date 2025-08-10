'use client'

import { useState, useEffect } from 'react'
import { Package, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OrderTrackingNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar se há informação de pedido salva
    const trackingInfo = localStorage.getItem('orderTrackingLeft')
    if (trackingInfo) {
      try {
        const info = JSON.parse(trackingInfo)
        const timeDiff = Date.now() - info.timestamp
        
        // Mostrar notificação se passou menos de 1 hora
        if (timeDiff < 60 * 60 * 1000) {
          setOrderId(info.orderId)
          setShowNotification(true)
        } else {
          // Limpar informação antiga
          localStorage.removeItem('orderTrackingLeft')
        }
      } catch (error) {
        console.error('Erro ao processar informação de tracking:', error)
        localStorage.removeItem('orderTrackingLeft')
      }
    }

    // Detectar quando a página se torna visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const trackingInfo = localStorage.getItem('orderTrackingLeft')
        if (trackingInfo) {
          try {
            const info = JSON.parse(trackingInfo)
            const timeDiff = Date.now() - info.timestamp
            
            if (timeDiff < 60 * 60 * 1000) {
              setOrderId(info.orderId)
              setShowNotification(true)
            }
          } catch (error) {
            console.error('Erro ao processar informação de tracking:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleTrackOrder = () => {
    if (orderId) {
      router.push(`/order-status/${orderId}`)
      setShowNotification(false)
    }
  }

  const handleDismiss = () => {
    setShowNotification(false)
    localStorage.removeItem('orderTrackingLeft')
  }

  if (!showNotification || !orderId) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-orange-200 p-4 max-w-sm z-50 animate-slide-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Package className="h-6 w-6 text-orange-500 mt-1" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Acompanhe seu Pedido</h3>
          <p className="text-xs text-gray-600 mt-1">
            Clique para ver o status atual do seu pedido
          </p>
          <button
            onClick={handleTrackOrder}
            className="w-full mt-2 bg-orange-500 text-white text-xs py-2 px-3 rounded hover:bg-orange-600 transition-colors"
          >
            Ver Status
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
} 