'use client'

import { useState, useEffect } from 'react'
import { BuildNotification } from './build-notification'

export default function BuildNotificationWrapper() {
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Verificar se há uma nova versão ou se é primeira visita
    const checkForUpdates = () => {
      const lastNotificationTime = localStorage.getItem('last-build-notification')
      const currentTime = Date.now()
      const oneHour = 60 * 60 * 1000 // 1 hora

      // Se nunca mostrou ou se passou mais de 1 hora, mostrar novamente
      if (!lastNotificationTime || (currentTime - parseInt(lastNotificationTime)) > oneHour) {
        setShowNotification(true)
        localStorage.setItem('last-build-notification', currentTime.toString())
      }
    }

    // Aguardar um pouco antes de verificar para evitar flash
    const timer = setTimeout(checkForUpdates, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleHide = () => {
    setShowNotification(false)
    localStorage.setItem('last-build-notification', Date.now().toString())
  }

  return (
    <BuildNotification
      visible={showNotification}
      onHide={handleHide}
    />
  )
}
