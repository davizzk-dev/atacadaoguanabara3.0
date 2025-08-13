'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function DevAuthChecker() {
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Verifica se o dev já está autenticado
    const devAuth = localStorage.getItem('dev_authenticated')
    
    if (devAuth === 'true') {
      setIsDevAuthenticated(true)
    } else {
      // Se não está autenticado e não está na página de desenvolvimento, redireciona
      if (pathname !== '/desenvolvimento') {
        router.push('/desenvolvimento')
        return
      }
    }
    
    setIsLoading(false)
  }, [pathname, router])

  // Se está carregando, não mostra nada
  if (isLoading) {
    return null
  }

  // Se não está autenticado e não está na página de desenvolvimento, redireciona
  if (!isDevAuthenticated && pathname !== '/desenvolvimento') {
    router.push('/desenvolvimento')
    return null
  }

  // Se está autenticado ou está na página de desenvolvimento, permite continuar
  return null
}