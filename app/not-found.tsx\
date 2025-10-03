'use client'

import { useEffect, useState } from 'react'

export default function NotFound() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          console.error('Erro ao carregar vídeo:', e)
        }}
      >
        <source src="/videos/404-bg.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
