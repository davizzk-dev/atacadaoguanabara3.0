'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await fetch('/api/analytics/visitors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            page: pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          })
        })
        
        // Only try to parse JSON if response is ok and has content
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          await response.json()
        }
      } catch (error) {
        console.error('Erro ao registrar visita:', error)
      }
    }

    // Registrar visita após um pequeno delay para evitar múltiplas requisições
    const timeoutId = setTimeout(trackVisit, 1000)

    return () => clearTimeout(timeoutId)
  }, [pathname])

  return null // Componente invisível
} 