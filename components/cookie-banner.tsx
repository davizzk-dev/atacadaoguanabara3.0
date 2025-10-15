'use client'

import { useState, useEffect } from 'react'
import { X, Settings } from 'lucide-react'
import CookieSettings from './cookie-settings'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true')
    localStorage.setItem('cookie_analytics', 'true')
    localStorage.setItem('cookie_marketing', 'true')
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'true')
    localStorage.setItem('cookie_analytics', 'false')
    localStorage.setItem('cookie_marketing', 'false')
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    setIsVisible(false)
    setShowSettings(false)
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                🍪 Usamos cookies para melhorar sua experiência
              </h3>
              <p className="text-gray-600 text-sm">
                Utilizamos cookies para personalizar conteúdo, fornecer recursos de mídia social 
                e analisar nosso tráfego. Também compartilhamos informações sobre seu uso do 
                nosso site com nossos parceiros de mídia social, publicidade e análise.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Rejeitar
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Aceitar Todos
              </button>
            </div>
          </div>
        </div>
      </div>

      <CookieSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSaveAndClose={handleSavePreferences}
      />
    </>
  )
} 