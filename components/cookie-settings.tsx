'use client'

import { useState } from 'react'
import { X, Settings, Shield, BarChart3, Megaphone } from 'lucide-react'

interface CookieSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function CookieSettings({ isOpen, onClose }: CookieSettingsProps) {
  const [settings, setSettings] = useState({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: localStorage.getItem('cookie_analytics') === 'true',
    marketing: localStorage.getItem('cookie_marketing') === 'true'
  })

  const handleSave = () => {
    localStorage.setItem('cookie_analytics', settings.analytics.toString())
    localStorage.setItem('cookie_marketing', settings.marketing.toString())
    localStorage.setItem('cookie_settings_saved', 'true')
    onClose()
  }

  const handleAcceptAll = () => {
    const newSettings = {
      necessary: true,
      analytics: true,
      marketing: true
    }
    setSettings(newSettings)
    localStorage.setItem('cookie_analytics', 'true')
    localStorage.setItem('cookie_marketing', 'true')
    localStorage.setItem('cookie_settings_saved', 'true')
    onClose()
  }

  const handleRejectAll = () => {
    const newSettings = {
      necessary: true,
      analytics: false,
      marketing: false
    }
    setSettings(newSettings)
    localStorage.setItem('cookie_analytics', 'false')
    localStorage.setItem('cookie_marketing', 'false')
    localStorage.setItem('cookie_settings_saved', 'true')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Configurações de Cookies</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Gerencie suas preferências de cookies para personalizar sua experiência em nosso site.
          </p>

          {/* Necessary Cookies */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-bold text-gray-900">Cookies Necessários</h3>
                  <p className="text-sm text-gray-600">
                    Essenciais para o funcionamento básico do site
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.necessary}
                  disabled
                  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-500">Sempre ativo</span>
              </div>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-bold text-gray-900">Cookies de Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Nos ajudam a entender como você usa nosso site
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.analytics}
                  onChange={(e) => setSettings(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Megaphone className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-bold text-gray-900">Cookies de Marketing</h3>
                  <p className="text-sm text-gray-600">
                    Usados para mostrar anúncios relevantes
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.marketing}
                  onChange={(e) => setSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-blue-900 mb-2">Sobre os Cookies</h4>
            <p className="text-sm text-blue-800">
              Os cookies nos ajudam a melhorar sua experiência. Os cookies necessários são sempre ativos 
              para garantir o funcionamento básico do site. Você pode gerenciar suas preferências a qualquer momento.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleRejectAll}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Rejeitar Todos
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Salvar Preferências
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Aceitar Todos
          </button>
        </div>
      </div>
    </div>
  )
} 