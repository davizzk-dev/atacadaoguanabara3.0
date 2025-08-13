'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface BuildNotificationProps {
  visible: boolean
  onHide: () => void
}

export function BuildNotification({ visible, onHide }: BuildNotificationProps) {
  const [currentVersion, setCurrentVersion] = useState('0.0.0')

  useEffect(() => {
    // Carregar versão atual do localStorage
    const savedVersion = localStorage.getItem('app-version')
    const newVersion = '0.0.1' // Versão inicial
    
    if (!savedVersion || savedVersion !== newVersion) {
      // Nova versão detectada
      setCurrentVersion(newVersion)
      localStorage.setItem('app-version', newVersion)
    }
  }, [])

  if (!visible) return null

  const updates = [
    '🔧 Correção do sistema de preços escalonados no carrinho',
    '🔍 Melhorias no sistema de pesquisa de produtos',
    '📱 Ajustes na interface de usuário e responsividade',
    '⚡ Otimizações de performance geral',
    '🛒 Melhoria na experiência do carrinho de compras'
  ]

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-xl border-2 border-green-400 max-w-sm">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-200 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Build v{currentVersion}</h3>
              <button
                onClick={onHide}
                className="text-green-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-green-100 text-sm mb-3 font-medium">
              ✅ Build concluído com sucesso!
            </p>
            <div className="space-y-1">
              <p className="text-green-100 font-semibold text-xs mb-1">🆕 Atualizações:</p>
              {updates.map((update, index) => (
                <p key={index} className="text-green-100 text-xs leading-relaxed">
                  {update}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
